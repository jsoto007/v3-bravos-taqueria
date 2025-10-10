from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin

from sqlalchemy.orm import validates
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, backref

from sqlalchemy import CheckConstraint, Index

from config import db, bcrypt


import re

from datetime import datetime, timedelta


# Max length for user-entered notes
NOTE_MAX_LEN = 1000

# --- Login throttle configuration ---
# Maximum failed attempts allowed within the rolling window before cooldown
AUTH_THROTTLE_MAX_ATTEMPTS = 5
# Size of the rolling window (seconds) to count attempts
AUTH_THROTTLE_WINDOW_SECS = 15 * 60  # 15 minutes
# Lockout / cooldown duration after exceeding max attempts
AUTH_THROTTLE_LOCKOUT_SECS = 30 * 60  # 30 minutes

# --- Safe coercion helpers (handle strings from form/json payloads) ---

def _coerce_int(value, field_name):
    """Return int(value) or None for empty, raise ValueError on bad types."""
    if value is None:
        return None
    if isinstance(value, str):
        if value.strip() == "":
            return None
        # allow strings like "2024\n" or " 2024 "
        try:
            return int(value.strip())
        except ValueError:
            raise ValueError(f"{field_name} must be an integer")
    if isinstance(value, bool):
        # prevent True/False being treated as 1/0
        raise ValueError(f"{field_name} must be an integer")
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be an integer")


def _coerce_float(value, field_name):
    """Return float(value) or None for empty, raise ValueError on bad types."""
    if value is None:
        return None
    if isinstance(value, str):
        if value.strip() == "":
            return None
        try:
            return float(value.strip())
        except ValueError:
            raise ValueError(f"{field_name} must be a number")
    if isinstance(value, bool):
        raise ValueError(f"{field_name} must be a number")
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a number")


# Association model for owner_dealers
class OwnerDealer(db.Model, SerializerMixin):
    __tablename__ = 'owner_dealers'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    account_group_id = db.Column(db.Integer, db.ForeignKey('account_groups.id'), primary_key=True)

    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    user = relationship('User', backref=backref('owner_dealer_links', cascade='all, delete-orphan'))
    account_group = relationship('AccountGroup', backref=backref('owner_dealer_links', cascade='all, delete-orphan'))


class AccountGroup(db.Model, SerializerMixin):
    __tablename__ = 'account_groups'

    serialize_rules = (
        '-users.account_group',
        '-user_inventories.account_group',
        '-car_inventories.account_group',
    )

    id = db.Column(db.Integer, primary_key=True)
    group_key = db.Column(db.String(120), unique=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    paid_until = db.Column(db.DateTime(timezone=True), nullable=True)

    stripe_customer_id = db.Column(db.String(255), unique=True, index=True)
    stripe_subscription_id = db.Column(db.String(255), unique=True, index=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    users = relationship('User', backref='account_group', cascade='all, delete-orphan')

    @validates("group_key")
    def validate_group_key(self, key, value):
        if not value:
            raise ValueError("group_key must not be empty")
        cleaned = value.strip()
        if len(cleaned) > 120:
            raise ValueError("group_key is too long")
        return cleaned


class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    serialize_rules = (
        '-account_group.users',
        '-user_inventories.user',
        '-car_inventories.user',
        '-_password_hash',
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(254), unique=True, nullable=False)
    _password_hash = db.Column(db.String, nullable=False)

    first_name = db.Column(db.String(120), unique=False, nullable=True)
    last_name = db.Column(db.String(120), unique=False, nullable=True)

    admin = db.Column(db.Boolean, default=False)
    is_owner_admin = db.Column(db.Boolean, default=False)

    is_active = db.Column(db.Boolean, nullable=True, default=True, index=True)
    deactivated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    account_group_id = db.Column(db.Integer, db.ForeignKey('account_groups.id'), nullable=False)

    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=db.func.now())
    __table_args__ = (
        Index('ix_users_account_group', 'account_group_id'),
        Index('ix_users_is_active', 'is_active'),
    )

    owned_account_groups = relationship(
        'AccountGroup',
        secondary='owner_dealers',
        backref='owner_admins'
    )

    @validates("email")
    def validate_email(self, key, email):
        if not email:
            raise ValueError("email must not be empty")
        normalized = email.strip().lower()
        email_regex = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
        if not re.match(email_regex, normalized):
            raise ValueError("invalid email format")
        return normalized

    @validates("first_name", "last_name")
    def validate_names(self, key, value):
        if value is None:
            return None
        cleaned = value.strip()
        if len(cleaned) > 120:
            raise ValueError(f"{key} is too long (max 120 chars)")
        return cleaned

    @hybrid_property
    def password_hash(self):
        raise Exception("Password hashes may not be viewed")

    @password_hash.setter
    def password_hash(self, password):
        password_hash = bcrypt.generate_password_hash(password.encode('utf-8'))
        self._password_hash = password_hash.decode('utf-8')

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password.encode('utf-8'))

    def deactivate(self, when=None):
        """Mark the user as inactive and timestamp when this happened."""
        self.is_active = False
        # If a datetime is provided use it, otherwise use current UTC time
        self.deactivated_at = when or datetime.utcnow()

    def activate(self):
        """Reactivate the user and clear the deactivation timestamp."""
        self.is_active = True
        self.deactivated_at = None

    def mark_last_login(self, when=None):
      """Optional helper to update last login timestamp."""
      if hasattr(self, 'last_login_at'):
          self.last_login_at = when or datetime.utcnow()

    def is_locked_out(self, email=None, ip_address=None):
        """Check if user/email is currently under login cooldown."""
        now = datetime.utcnow()
        # Prefer user_id lookup when available
        q = AuthThrottle.query
        if self.id:
            q = q.filter_by(user_id=self.id)
        elif email:
            q = q.filter_by(email=email.strip().lower())
        if ip_address:
            q = q.filter_by(ip_address=ip_address)
        record = q.order_by(AuthThrottle.id.desc()).first()
        return bool(record and record.locked_until and record.locked_until > now)

    def __repr__(self):
        return f'User {self.email}, ID: {self.id}'


# -------------------------------------
# Auth Throttle Model
# -------------------------------------
class AuthThrottle(db.Model, SerializerMixin):
    """
    Tracks authentication attempts per user/email/device/IP to enforce a cooldown
    after too many failed attempts in a short time window.
    """
    __tablename__ = 'auth_throttles'

    id = db.Column(db.Integer, primary_key=True)

    # When user_id isn't known yet (login by email), store normalized email
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    email = db.Column(db.String(254), nullable=True, index=True)

    # Optional signals for finer-grained throttling
    ip_address = db.Column(db.String(64), nullable=True, index=True)
    device_id = db.Column(db.String(64), nullable=True, index=True)

    # Rolling window
    attempts = db.Column(db.Integer, nullable=False, default=0)
    window_started_at = db.Column(db.DateTime(timezone=True), nullable=True)
    last_attempt_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Cooldown
    locked_until = db.Column(db.DateTime(timezone=True), nullable=True, index=True)

    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=db.func.now())

    user = relationship('User', backref=backref('auth_throttles', cascade='all, delete-orphan'))

    __table_args__ = (
        Index('ix_auth_throttle_lookup', 'user_id', 'email', 'ip_address', 'device_id'),
    )

    # ---------------- Convenience API ---------------- #
    @staticmethod
    def _normalize_email(email):
        return email.strip().lower() if isinstance(email, str) else None

    @classmethod
    def get_or_create(cls, user=None, email=None, ip_address=None, device_id=None):
        norm_email = cls._normalize_email(email)
        q = cls.query
        if user and user.id:
            q = q.filter_by(user_id=user.id)
        elif norm_email:
            q = q.filter_by(email=norm_email)
        if ip_address:
            q = q.filter_by(ip_address=ip_address)
        if device_id:
            q = q.filter_by(device_id=device_id)
        rec = q.order_by(cls.id.desc()).first()
        if rec:
            return rec
        rec = cls(
            user_id=(user.id if user and user.id else None),
            email=norm_email,
            ip_address=ip_address,
            device_id=device_id,
            attempts=0,
            window_started_at=None,
            last_attempt_at=None,
            locked_until=None,
        )
        db.session.add(rec)
        return rec

    def _within_window(self, now):
        if not self.window_started_at:
            return False
        delta = (now - self.window_started_at).total_seconds()
        return delta <= AUTH_THROTTLE_WINDOW_SECS

    def register_attempt(self, success: bool, now=None):
        """
        Call this on every login attempt (before final response):
        - If success: reset counts and clear lockout.
        - If failure: increment and lock if threshold exceeded within window.
        Returns a tuple (is_locked: bool, attempts: int, locked_until: datetime|None).
        """
        now = now or datetime.utcnow()

        # Respect active lockout
        if self.locked_until and self.locked_until > now:
            self.last_attempt_at = now
            return True, self.attempts, self.locked_until

        if success:
            self.attempts = 0
            self.window_started_at = None
            self.locked_until = None
            self.last_attempt_at = now
            return False, self.attempts, None

        # Failure path
        if not self._within_window(now):
            # start a new window
            self.window_started_at = now
            self.attempts = 1
        else:
            self.attempts = (self.attempts or 0) + 1

        self.last_attempt_at = now

        if self.attempts >= AUTH_THROTTLE_MAX_ATTEMPTS:
            self.locked_until = now + timedelta(seconds=AUTH_THROTTLE_LOCKOUT_SECS)
            # reset window so next period starts fresh after lockout
            self.window_started_at = None
        else:
            self.locked_until = None

        return bool(self.locked_until and self.locked_until > now), self.attempts, self.locked_until



class UserInventory(db.Model, SerializerMixin):
    __tablename__ = 'user_inventories'

    serialize_rules = (
        '-user.user_inventories',
        '-user.account_group',
        '-account_group.user_inventories',
        '-car_inventories.user_inventory',
        '-car_inventories.user',
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    account_group_id = db.Column(db.Integer, db.ForeignKey('account_groups.id'), nullable=False)

    submitted = db.Column(db.Boolean, default=False)
    reviewed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    user = relationship('User', backref=backref('user_inventories', cascade='all, delete-orphan'))
    account_group = relationship('AccountGroup', backref=backref('user_inventories', cascade='all, delete-orphan'))


class DesignatedLocation(db.Model, SerializerMixin):
    __tablename__ = 'designated_locations'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    account_group_id = db.Column(db.Integer, db.ForeignKey('account_groups.id'), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    __table_args__ = (
        CheckConstraint('latitude BETWEEN -90 AND 90', name='ck_designated_loc_lat_range'),
        CheckConstraint('longitude BETWEEN -180 AND 180', name='ck_designated_loc_lng_range'),
        Index('ix_designated_location_group', 'account_group_id'),
    )

    account_group = relationship('AccountGroup', backref=backref('designated_locations', cascade='all, delete-orphan'))

    @validates("latitude")
    def validate_latitude(self, key, lat):
        num = _coerce_float(lat, "latitude")
        if num is None:
            raise ValueError("latitude is required")
        if num < -90 or num > 90:
            raise ValueError("latitude must be between -90 and 90")
        return num

    @validates("longitude")
    def validate_longitude(self, key, lng):
        num = _coerce_float(lng, "longitude")
        if num is None:
            raise ValueError("longitude is required")
        if num < -180 or num > 180:
            raise ValueError("longitude must be between -180 and 180")
        return num

    @validates("name")
    def validate_name(self, key, value):
        if not value:
            raise ValueError("name must not be empty")
        cleaned = value.strip()
        if len(cleaned) > 120:
            raise ValueError("name is too long (max 120 chars)")
        return cleaned


class CarInventory(db.Model, SerializerMixin):
    __tablename__ = 'car_inventories'

    serialize_rules = (
        '-user.car_inventories',
        '-user_inventory.car_inventories',
        '-account_group.car_inventories',
        '-photos.car_inventory',
        '-notes.car_inventory',
    )

    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(255), nullable=False)
    vin_number = db.Column(db.String(17), unique=False, nullable=False, index=True)
    year = db.Column(db.Integer, nullable=True)
    make = db.Column(db.String(255), nullable=True)
    color = db.Column(db.String(255), nullable=True)
    body = db.Column(db.String(255), nullable=True)

    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_inventory_id = db.Column(db.Integer, db.ForeignKey('user_inventories.id'), nullable=True)
    account_group_id = db.Column(db.Integer, db.ForeignKey('account_groups.id'), nullable=False)
    designated_location_id = db.Column(db.Integer, db.ForeignKey('designated_locations.id'), nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=db.func.now())
    __table_args__ = (
        CheckConstraint('(latitude IS NULL) OR (latitude BETWEEN -90 AND 90)', name='ck_car_inv_lat_range'),
        CheckConstraint('(longitude IS NULL) OR (longitude BETWEEN -180 AND 180)', name='ck_car_inv_lng_range'),
        Index('ix_car_inv_group_vin', 'account_group_id', 'vin_number'),
        Index('ix_car_inv_group_created', 'account_group_id', 'created_at'),
    )

    user = relationship('User', backref=backref('car_inventories'))
    user_inventory = relationship('UserInventory', backref=backref('car_inventories', cascade='all, delete-orphan'))
    account_group = relationship('AccountGroup', backref=backref('car_inventories', cascade='all, delete-orphan'))
    designated_location = relationship('DesignatedLocation', backref=backref('car_inventories'))
    notes = relationship('CarNote', backref='car_inventory', cascade='all, delete-orphan')

    @validates("vin_number")
    def validate_vin(self, key, vin):
        if vin is None:
            raise ValueError("vin_number must not be empty")
        cleaned = str(vin).strip().upper()
        vin_regex = r"^[A-HJ-NPR-Z0-9]{17}$"
        if not cleaned or not re.match(vin_regex, cleaned):
            raise ValueError("vin_number must be 17 chars and may not contain I, O, or Q")
        return cleaned

    @validates("year")
    def validate_year(self, key, year):
        y = _coerce_int(year, "year")
        if y is None:
            return None
        current_plus_one = datetime.utcnow().year + 1
        if y < 1886 or y > current_plus_one:
            raise ValueError(f"year must be between 1886 and {current_plus_one}")
        return y

    @validates("latitude")
    def validate_latitude(self, key, lat):
        num = _coerce_float(lat, "latitude")
        if num is None:
            return None
        if num < -90 or num > 90:
            raise ValueError("latitude must be between -90 and 90")
        return num

    @validates("longitude")
    def validate_longitude(self, key, lng):
        num = _coerce_float(lng, "longitude")
        if num is None:
            return None
        if num < -180 or num > 180:
            raise ValueError("longitude must be between -180 and 180")
        return num

    @validates("location", "make", "color", "body")
    def normalize_strings(self, key, value):
        if value is None:
            return None
        cleaned = value.strip()
        if len(cleaned) > 255:
            raise ValueError(f"{key} is too long (max 255 chars)")
        return cleaned

    def to_dict(self):
        designated_location_dict = None
        if self.designated_location:
            designated_location_dict = {
                "id": self.designated_location.id,
                "name": self.designated_location.name,
                "latitude": self.designated_location.latitude,
                "longitude": self.designated_location.longitude,
            }
        return {
            "id": self.id,
            "location": self.location if not designated_location_dict else None,
            "vin_number": self.vin_number,
            "year": self.year,
            "make": self.make,
            "user_id": self.user_id,
            "user_inventory_id": self.user_inventory_id,
            "account_group_id": self.account_group_id,
            "designated_location_id": self.designated_location_id,
            "designated_location": designated_location_dict,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<CarInventory VIN: {self.vin_number}>'


class CarNote(db.Model, SerializerMixin):
    __tablename__ = 'car_notes'

    serialize_rules = (
        '-car_inventory.notes',
    )

    id = db.Column(db.Integer, primary_key=True)
    car_inventory_id = db.Column(db.Integer, db.ForeignKey('car_inventories.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    __table_args__ = (
        CheckConstraint('length(content) <= 1000', name='ck_note_max_len'),
    )

    @validates("content")
    def validate_content(self, key, value):
        if not value:
            raise ValueError("content must not be empty")
        cleaned = value.strip()
        if len(cleaned) == 0:
            raise ValueError("content must not be empty")
        if len(cleaned) > NOTE_MAX_LEN:
            raise ValueError(f"content is too long (max {NOTE_MAX_LEN} chars)")
        return cleaned


class CarPhoto(db.Model, SerializerMixin):
    __tablename__ = 'car_photos'

    serialize_rules = (
        '-car_inventory.photos',
        '-master_car_record.photos',
    )

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(2048), nullable=False)

    car_inventory_id = db.Column(db.Integer, db.ForeignKey('car_inventories.id'), nullable=True)
    master_car_record_id = db.Column(db.Integer, db.ForeignKey('master_car_records.id'), nullable=True)

    __table_args__ = (
        CheckConstraint(
            '(car_inventory_id IS NOT NULL) != (master_car_record_id IS NOT NULL)',
            name='ck_photo_exactly_one_parent'
        ),
    )

    car_inventory = relationship('CarInventory', backref=backref('photos', cascade='all, delete-orphan'))
    master_car_record = relationship('MasterCarRecord', backref=backref('photos', cascade='all, delete-orphan'))

    @validates("url")
    def validate_url(self, key, value):
        if not value:
            raise ValueError("url must not be empty")
        cleaned = value.strip()
        if len(cleaned) > 2048:
            raise ValueError("url is too long (max 2048 chars)")
        if not (cleaned.startswith("http://") or cleaned.startswith("https://")):
            raise ValueError("url must start with http:// or https://")
        return cleaned


class MasterCarRecord(db.Model, SerializerMixin):
    __tablename__ = 'master_car_records'

    id = db.Column(db.Integer, primary_key=True)
    vin_number = db.Column(db.String(17), unique=True, nullable=False)
    location = db.Column(db.String(255), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    make = db.Column(db.String(255), nullable=True)
    model = db.Column(db.String(255), nullable=True)
    trim = db.Column(db.String(255), nullable=True)
    body_style = db.Column(db.String(255), nullable=True)
    color = db.Column(db.String(255), nullable=True)
    interior_color = db.Column(db.String(255), nullable=True)
    transmission = db.Column(db.String(255), nullable=True)
    drivetrain = db.Column(db.String(255), nullable=True)
    engine = db.Column(db.String(255), nullable=True)
    fuel_type = db.Column(db.String(255), nullable=True)
    date_acquired = db.Column(db.DateTime(timezone=True), nullable=True)
    date_sold = db.Column(db.DateTime(timezone=True), nullable=True)
    mileage = db.Column(db.Float, nullable=True)
    purchase_price = db.Column(db.Float, nullable=True)
    selling_price = db.Column(db.Float, nullable=True)
    is_sold = db.Column(db.Boolean, default=False)
    sold_price = db.Column(db.Float, nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=db.func.now())

    @validates("year")
    def validate_year(self, key, year):
        y = _coerce_int(year, "year")
        if y is None:
            return None
        current_plus_one = datetime.utcnow().year + 1
        if y < 1886 or y > current_plus_one:
            raise ValueError(f"year must be between 1886 and {current_plus_one}")
        return y

    @validates("mileage", "purchase_price", "selling_price", "sold_price")
    def validate_non_negative(self, key, value):
        num = _coerce_float(value, key)
        if num is None:
            return None
        if num < 0:
            raise ValueError(f"{key} must be non-negative")
        return num

    @validates("vin_number", "location", "make", "model", "trim", "body_style", "color", "interior_color", "transmission", "drivetrain", "engine", "fuel_type")
    def normalize_strings(self, key, value):
        if value is None:
            return None
        cleaned = str(value).strip()
        if key == "vin_number":
            cleaned = cleaned.upper()
            vin_regex = r"^[A-HJ-NPR-Z0-9]{17}$"
            if not re.match(vin_regex, cleaned):
                raise ValueError("vin_number must be 17 chars and may not contain I, O, or Q")
        if len(cleaned) > 255:
            raise ValueError(f"{key} is too long (max 255 chars)")
        return cleaned
