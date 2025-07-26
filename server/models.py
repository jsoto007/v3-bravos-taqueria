from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin

from sqlalchemy.orm import validates
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, backref

from config import db, bcrypt

# --------------------
# AccountGroup model
# --------------------
class AccountGroup(db.Model, SerializerMixin):
    __tablename__ = 'account_groups'

    serialize_rules = (
        '-users.account_group',
        '-user_inventories.account_group',
        '-car_inventories.account_group',
    )

    id = db.Column(db.Integer, primary_key=True)
    group_key = db.Column(db.String, unique=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    paid_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relationships
    users = relationship('User', backref='account_group', cascade='all, delete-orphan')


# --------------------
# User model
# --------------------
class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    serialize_rules = (
        '-account_group.users',
        '-user_inventories.user',
        '-car_inventories.user',
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    _password_hash = db.Column(db.String, nullable=False)

    admin = db.Column(db.Boolean, default=False)
    is_owner_admin = db.Column(db.Boolean, default=False)
    account_group_id = db.Column(db.Integer, db.ForeignKey('account_groups.id'), nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    @validates("email")
    def validate_email(self, key, email):
        if not email:
            raise ValueError("email must not be empty")
        return email

    @hybrid_property
    def password_hash(self):
        raise Exception("Password hashes may not be viewed")

    @password_hash.setter
    def password_hash(self, password):
        password_hash = bcrypt.generate_password_hash(password.encode('utf-8'))
        self._password_hash = password_hash.decode('utf-8')

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password.encode('utf-8'))

    def __repr__(self):
        return f'User {self.email}, ID: {self.id}'


# --------------------
# UserInventory model
# --------------------
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
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = relationship('User', backref=backref('user_inventories', cascade='all, delete-orphan'))
    account_group = relationship('AccountGroup', backref=backref('user_inventories', cascade='all, delete-orphan'))


# --------------------
# CarInventory model
# --------------------
class CarInventory(db.Model, SerializerMixin):
    __tablename__ = 'car_inventories'

    serialize_rules = (
        '-user.car_inventories',
        '-user_inventory.car_inventories',
        '-account_group.car_inventories',
        '-photos.car_inventory',
    )

    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String, nullable=False)
    vin_number = db.Column(db.String, unique=False, nullable=False)
    year = db.Column(db.Integer, nullable=True)
    make = db.Column(db.String, nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_inventory_id = db.Column(db.Integer, db.ForeignKey('user_inventories.id'), nullable=True)
    account_group_id = db.Column(db.Integer, db.ForeignKey('account_groups.id'), nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    user = relationship('User', backref=backref('car_inventories'))
    user_inventory = relationship('UserInventory', backref=backref('car_inventories', cascade='all, delete-orphan'))
    account_group = relationship('AccountGroup', backref=backref('car_inventories', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            "id": self.id,
            "location": self.location,
            "vin_number": self.vin_number,
            "year": self.year,
            "make": self.make,
            "user_id": self.user_id,
            "user_inventory_id": self.user_inventory_id,
            "account_group_id": self.account_group_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<CarInventory VIN: {self.vin_number}>'


# --------------------
# CarPhoto model
# --------------------
class CarPhoto(db.Model, SerializerMixin):
    __tablename__ = 'car_photos'

    serialize_rules = (
        '-car_inventory.photos',
        '-master_car_record.photos',
    )

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String, nullable=False)

    car_inventory_id = db.Column(db.Integer, db.ForeignKey('car_inventories.id'), nullable=True)
    master_car_record_id = db.Column(db.Integer, db.ForeignKey('master_car_records.id'), nullable=True)

    car_inventory = relationship('CarInventory', backref=backref('photos', cascade='all, delete-orphan'))
    master_car_record = relationship('MasterCarRecord', backref=backref('photos', cascade='all, delete-orphan'))


# --------------------
# MasterCarRecord model
# --------------------
class MasterCarRecord(db.Model, SerializerMixin):
    __tablename__ = 'master_car_records'

    id = db.Column(db.Integer, primary_key=True)
    vin_number = db.Column(db.String, unique=True, nullable=False)
    location = db.Column(db.String, nullable=True)
    year = db.Column(db.Integer, nullable=True)
    make = db.Column(db.String, nullable=True)
    model = db.Column(db.String, nullable=True)
    trim = db.Column(db.String, nullable=True)
    body_style = db.Column(db.String, nullable=True)
    color = db.Column(db.String, nullable=True)
    interior_color = db.Column(db.String, nullable=True)
    transmission = db.Column(db.String, nullable=True)
    drivetrain = db.Column(db.String, nullable=True)
    engine = db.Column(db.String, nullable=True)
    fuel_type = db.Column(db.String, nullable=True)
    date_acquired = db.Column(db.DateTime, nullable=True)
    date_sold = db.Column(db.DateTime, nullable=True)
    mileage = db.Column(db.Float, nullable=True)
    purchase_price = db.Column(db.Float, nullable=True)
    selling_price = db.Column(db.Float, nullable=True)
    is_sold = db.Column(db.Boolean, default=False)
    sold_price = db.Column(db.Float, nullable=True)

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())