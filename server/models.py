from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin

from sqlalchemy.orm import validates
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, backref

from sqlalchemy import CheckConstraint, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB

from config import db, bcrypt

import re
from decimal import Decimal
from datetime import datetime, timedelta, timezone, date


# Max length for user-entered notes
NOTE_MAX_LEN = 1000

# --- Login throttle configuration ---
AUTH_THROTTLE_MAX_ATTEMPTS = 5
AUTH_THROTTLE_WINDOW_SECS = 15 * 60  # 15 minutes
AUTH_THROTTLE_LOCKOUT_SECS = 30 * 60  # 30 minutes

# --- Safe coercion helpers (handle strings from form/json payloads) ---

def _coerce_int(value, field_name):
    """Return int(value) or None for empty, raise ValueError on bad types."""
    if value is None:
        return None
    if isinstance(value, str):
        if value.strip() == "":
            return None
        try:
            return int(value.strip())
        except ValueError:
            raise ValueError(f"{field_name} must be an integer")
    if isinstance(value, bool):
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

# -------------------------------------
# User & Auth
# -------------------------------------
class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    serialize_rules = (
        '-_password_hash',
        '-addresses.user',
        '-carts.user',
        '-orders.user',
        '-auth_throttles.user',
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(254), unique=True, nullable=False, index=True)
    _password_hash = db.Column(db.String, nullable=False)

    first_name = db.Column(db.String(120), nullable=True)
    last_name = db.Column(db.String(120), nullable=True)

    # Roles kept here as booleans per request
    admin = db.Column(db.Boolean, default=False)
    is_owner_admin = db.Column(db.Boolean, default=False)

    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)
    deactivated_at = db.Column(db.DateTime(timezone=True), nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=db.func.now())
    last_login_at = db.Column(db.DateTime(timezone=True), nullable=True, index=True)

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
        self.is_active = False
        self.deactivated_at = when or datetime.now(timezone.utc)

    def activate(self):
        self.is_active = True
        self.deactivated_at = None

    def mark_last_login(self, when=None):
        if hasattr(self, 'last_login_at'):
            self.last_login_at = when or datetime.now(timezone.utc)

    def is_locked_out(self, email=None, ip_address=None):
        now = datetime.now(timezone.utc)
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


class Address(db.Model, SerializerMixin):
    __tablename__ = 'addresses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    line1 = db.Column(db.String(255), nullable=False)
    line2 = db.Column(db.String(255))
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    country = db.Column(db.String(2), default='US', nullable=False)
    is_default = db.Column(db.Boolean, default=False)

    user = relationship('User', backref=backref('addresses', cascade='all, delete-orphan'))

# -------------------------------------
# Auth Throttle
# -------------------------------------
class AuthThrottle(db.Model, SerializerMixin):
    __tablename__ = 'auth_throttles'

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    email = db.Column(db.String(254), nullable=True, index=True)

    ip_address = db.Column(db.String(64), nullable=True, index=True)
    device_id = db.Column(db.String(64), nullable=True, index=True)

    attempts = db.Column(db.Integer, nullable=False, default=0)
    window_started_at = db.Column(db.DateTime(timezone=True), nullable=True)
    last_attempt_at = db.Column(db.DateTime(timezone=True), nullable=True)

    locked_until = db.Column(db.DateTime(timezone=True), nullable=True, index=True)

    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=db.func.now())

    user = relationship('User', backref=backref('auth_throttles', cascade='all, delete-orphan'))

    __table_args__ = (
        Index('ix_auth_throttle_lookup', 'user_id', 'email', 'ip_address', 'device_id'),
    )

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
        now = now or datetime.now(timezone.utc)
        if self.locked_until and self.locked_until > now:
            self.last_attempt_at = now
            return True, self.attempts, self.locked_until
        if success:
            self.attempts = 0
            self.window_started_at = None
            self.locked_until = None
            self.last_attempt_at = now
            return False, self.attempts, None
        if not self._within_window(now):
            self.window_started_at = now
            self.attempts = 1
        else:
            self.attempts = (self.attempts or 0) + 1
        self.last_attempt_at = now
        if self.attempts >= AUTH_THROTTLE_MAX_ATTEMPTS:
            self.locked_until = now + timedelta(seconds=AUTH_THROTTLE_LOCKOUT_SECS)
            self.window_started_at = None
        else:
            self.locked_until = None
        return bool(self.locked_until and self.locked_until > now), self.attempts, self.locked_until

# -------------------------------------
# Menu & Modifiers
# -------------------------------------
class Category(db.Model, SerializerMixin):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

class MenuItem(db.Model, SerializerMixin):
    __tablename__ = 'menu_items'
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    name = db.Column(db.String(160), nullable=False, index=True)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10,2), nullable=False)
    tax_class = db.Column(db.String(32), default='food')
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    image_url = db.Column(db.String(500))
    category = relationship('Category', backref=backref('menu_items', cascade='all, delete-orphan'))

    @validates('name')
    def validate_name(self, key, value):
        if not value:
            raise ValueError('name must not be empty')
        cleaned = value.strip()
        if len(cleaned) > 160:
            raise ValueError('name is too long (max 160 chars)')
        return cleaned

class ModifierGroup(db.Model, SerializerMixin):
    __tablename__ = 'modifier_groups'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    min_choices = db.Column(db.Integer, default=0)
    max_choices = db.Column(db.Integer)
    required = db.Column(db.Boolean, default=False)

class ModifierOption(db.Model, SerializerMixin):
    __tablename__ = 'modifier_options'
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('modifier_groups.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    price_delta = db.Column(db.Numeric(10,2), default=Decimal('0.00'), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    group = relationship('ModifierGroup', backref=backref('options', cascade='all, delete-orphan'))

class MenuItemModifierGroup(db.Model, SerializerMixin):
    __tablename__ = 'menu_item_modifier_groups'
    id = db.Column(db.Integer, primary_key=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False)
    modifier_group_id = db.Column(db.Integer, db.ForeignKey('modifier_groups.id'), nullable=False)
    __table_args__ = (UniqueConstraint('menu_item_id','modifier_group_id', name='uq_item_group'),)
    menu_item = relationship('MenuItem', backref=backref('modifier_groups', cascade='all, delete-orphan'))
    group = relationship('ModifierGroup')

# -------------------------------------
# Cart & Checkout
# -------------------------------------
class Cart(db.Model, SerializerMixin):
    __tablename__ = 'carts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # nullable for guests
    session_id = db.Column(db.String(64), index=True)
    currency = db.Column(db.String(3), default='USD', nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=db.func.now())
    closed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    user = relationship('User', backref=backref('carts', cascade='all, delete-orphan'))

class CartItem(db.Model, SerializerMixin):
    __tablename__ = 'cart_items'
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False)
    qty = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Numeric(10,2), nullable=False)
    notes = db.Column(db.String(300))
    cart = relationship('Cart', backref=backref('items', cascade='all, delete-orphan'))
    menu_item = relationship('MenuItem')

class CartItemModifier(db.Model, SerializerMixin):
    __tablename__ = 'cart_item_modifiers'
    id = db.Column(db.Integer, primary_key=True)
    cart_item_id = db.Column(db.Integer, db.ForeignKey('cart_items.id'), nullable=False)
    modifier_option_id = db.Column(db.Integer, db.ForeignKey('modifier_options.id'), nullable=False)
    price_delta = db.Column(db.Numeric(10,2), nullable=False, default=Decimal('0.00'))
    cart_item = relationship('CartItem', backref=backref('modifiers', cascade='all, delete-orphan'))
    option = relationship('ModifierOption')

class Order(db.Model, SerializerMixin):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(32), default='pending', index=True)
    channel = db.Column(db.String(16), default='web')
    fulfillment = db.Column(db.String(16), nullable=False)  # pickup | delivery
    subtotal = db.Column(db.Numeric(10,2), nullable=False, default=0)
    tax_total = db.Column(db.Numeric(10,2), nullable=False, default=0)
    discount_total = db.Column(db.Numeric(10,2), nullable=False, default=0)
    delivery_fee = db.Column(db.Numeric(10,2), nullable=False, default=0)
    tip = db.Column(db.Numeric(10,2), nullable=False, default=0)
    grand_total = db.Column(db.Numeric(10,2), nullable=False, default=0)
    stripe_payment_intent_id = db.Column(db.String(120), index=True, unique=True)
    currency = db.Column(db.String(3), default='USD', nullable=False)
    customer_name = db.Column(db.String(160))
    customer_email = db.Column(db.String(254))
    customer_phone = db.Column(db.String(40))
    assigned_staff = db.Column(db.String(160))
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), onupdate=db.func.now())
    placed_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    user = relationship('User', backref=backref('orders', cascade='all, delete-orphan'))

    __table_args__ = (
        CheckConstraint('subtotal >= 0', name='ck_order_subtotal_nonneg'),
        CheckConstraint('tax_total >= 0', name='ck_order_tax_nonneg'),
        CheckConstraint('discount_total >= 0', name='ck_order_discount_nonneg'),
        CheckConstraint('delivery_fee >= 0', name='ck_order_delivery_fee_nonneg'),
        CheckConstraint('tip >= 0', name='ck_order_tip_nonneg'),
        CheckConstraint('grand_total >= 0', name='ck_order_grand_total_nonneg'),
    )

class OrderItem(db.Model, SerializerMixin):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    menu_item_name = db.Column(db.String(160), nullable=False)
    qty = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Numeric(10,2), nullable=False)
    line_total = db.Column(db.Numeric(10,2), nullable=False)
    notes = db.Column(db.String(300))
    order = relationship('Order', backref=backref('items', cascade='all, delete-orphan'))

class OrderItemModifier(db.Model, SerializerMixin):
    __tablename__ = 'order_item_modifiers'
    id = db.Column(db.Integer, primary_key=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_items.id'), nullable=False)
    name = db.Column(db.String(160), nullable=False)
    price_delta = db.Column(db.Numeric(10,2), nullable=False)
    order_item = relationship('OrderItem', backref=backref('modifiers', cascade='all, delete-orphan'))

class Payment(db.Model, SerializerMixin):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    provider = db.Column(db.String(32))  # stripe, cash, square, etc.
    reference = db.Column(db.String(120), index=True)
    amount = db.Column(db.Numeric(10,2), nullable=False)
    currency = db.Column(db.String(3), default='USD', nullable=False)
    status = db.Column(db.String(32), default='authorized')
    processed_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    raw_response = db.Column(JSONB)
    __table_args__ = (
        UniqueConstraint('provider','reference', name='uq_payment_provider_reference'),
        CheckConstraint('amount >= 0', name='ck_payment_amount_nonneg'),
    )
    order = relationship('Order', backref=backref('payments', cascade='all, delete-orphan'))

class Receipt(db.Model, SerializerMixin):
    __tablename__ = 'receipts'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), unique=True, nullable=False)
    pdf_url = db.Column(db.String(500))
    data = db.Column(JSONB)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    order = relationship('Order', backref=backref('receipt', uselist=False, cascade='all, delete-orphan'))

class OrderDelivery(db.Model, SerializerMixin):
    __tablename__ = 'order_deliveries'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), unique=True, nullable=False)
    recipient_name = db.Column(db.String(120))
    phone = db.Column(db.String(40))
    address_snapshot = db.Column(JSONB)  # store at time of checkout
    eta = db.Column(db.DateTime(timezone=True))
    fee = db.Column(db.Numeric(10,2), default=0)
    order = relationship('Order', backref=backref('delivery', uselist=False, cascade='all, delete-orphan'))

# -------------------------------------
# Inventory & Food Cost
# -------------------------------------
class Unit(db.Model, SerializerMixin):
    __tablename__ = 'units'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(16), unique=True, nullable=False)  # g, kg, oz, lb, ea
    name = db.Column(db.String(64), nullable=False)

class UnitConversion(db.Model, SerializerMixin):
    __tablename__ = 'unit_conversions'
    id = db.Column(db.Integer, primary_key=True)
    from_unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    to_unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    factor = db.Column(db.Float, nullable=False)  # multiply to convert from->to
    __table_args__ = (UniqueConstraint('from_unit_id','to_unit_id', name='uq_unit_pair'),)

class Supplier(db.Model, SerializerMixin):
    __tablename__ = 'suppliers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), unique=True, nullable=False)
    contact = db.Column(db.String(160))
    phone = db.Column(db.String(40))
    email = db.Column(db.String(160))

class InventoryItem(db.Model, SerializerMixin):
    __tablename__ = 'inventory_items'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False, unique=True)
    sku = db.Column(db.String(64), unique=True)
    base_unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    par_level = db.Column(db.Float, default=0)
    allergens = db.Column(db.String(160))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    base_unit = relationship('Unit')

class InventoryBatch(db.Model, SerializerMixin):
    __tablename__ = 'inventory_batches'
    id = db.Column(db.Integer, primary_key=True)
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    qty = db.Column(db.Float, nullable=False)
    unit_cost = db.Column(db.Numeric(10,4), nullable=False)  # per base unit
    expiration_date = db.Column(db.Date)
    received_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    lot_code = db.Column(db.String(64))

    inventory_item = relationship('InventoryItem', backref=backref('batches', cascade='all, delete-orphan'))
    supplier = relationship('Supplier')

    __table_args__ = (
        Index('ix_batches_item_exp', 'inventory_item_id', 'expiration_date'),
        CheckConstraint('qty >= 0', name='ck_batch_qty_nonneg'),
        CheckConstraint('unit_cost >= 0', name='ck_batch_unit_cost_nonneg'),
    )

class StockMovement(db.Model, SerializerMixin):
    __tablename__ = 'stock_movements'
    id = db.Column(db.Integer, primary_key=True)
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=False)
    qty_change = db.Column(db.Float, nullable=False)  # +in, -out
    reason = db.Column(db.String(32), nullable=False) # purchase, recipe, waste, adjust
    reference_type = db.Column(db.String(32))         # order_id, batch_id, etc.
    reference_id = db.Column(db.Integer)
    occurred_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    inventory_item = relationship('InventoryItem')

    __table_args__ = (
        Index('ix_stock_item_time', 'inventory_item_id', 'occurred_at'),
    )


class InventoryAuditSession(db.Model, SerializerMixin):
    __tablename__ = 'inventory_audit_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    note = db.Column(db.String(NOTE_MAX_LEN))
    started_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    user = relationship('User', backref=backref('inventory_audit_sessions', cascade='all, delete-orphan'))


class InventoryAuditItem(db.Model, SerializerMixin):
    __tablename__ = 'inventory_audit_items'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('inventory_audit_sessions.id'), nullable=False, index=True)
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=False)
    previous_qty = db.Column(db.Float, nullable=False)
    new_qty = db.Column(db.Float, nullable=False)
    count_unit_code = db.Column(db.String(16))
    expiration_date = db.Column(db.Date)
    note = db.Column(db.String(NOTE_MAX_LEN))
    recorded_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    session = relationship('InventoryAuditSession', backref=backref('items', cascade='all, delete-orphan'))
    inventory_item = relationship('InventoryItem')

class Recipe(db.Model, SerializerMixin):
    __tablename__ = 'recipes'
    id = db.Column(db.Integer, primary_key=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), unique=True, nullable=False)
    yield_qty = db.Column(db.Float, default=1)
    notes = db.Column(db.Text)
    menu_item = relationship('MenuItem', backref=backref('recipe', uselist=False, cascade='all, delete-orphan'))

class RecipeComponent(db.Model, SerializerMixin):
    __tablename__ = 'recipe_components'
    id = db.Column(db.Integer, primary_key=True)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=False)
    qty = db.Column(db.Float, nullable=False)         # in inventory_item.base_unit
    waste_pct = db.Column(db.Float, default=0)        # 0..100

    recipe = relationship('Recipe', backref=backref('components', cascade='all, delete-orphan'))
    inventory_item = relationship('InventoryItem')

    __table_args__ = (
        UniqueConstraint('recipe_id','inventory_item_id', name='uq_recipe_item'),
        CheckConstraint('qty >= 0', name='ck_recipe_qty_nonneg'),
        CheckConstraint('waste_pct >= 0 AND waste_pct <= 100', name='ck_recipe_waste_pct'),
    )


class AdminSetting(db.Model, SerializerMixin):
    __tablename__ = 'admin_settings'
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(60), unique=True, nullable=False, index=True)
    value = db.Column(JSONB, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), onupdate=db.func.now())
