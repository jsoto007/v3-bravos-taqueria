from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin

from sqlalchemy.orm import validates
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, backref


from config import db, bcrypt


class Bird(db.Model, SerializerMixin):
    __tablename__ = 'birds'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    species = db.Column(db.String)
    image = db.Column(db.String)

    def __repr__(self):
        return f'<Bird {self.name} | Species: {self.species}>'

        

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    _password_hash = db.Column(db.String, nullable=False)
    admin = db.Column(db.Boolean, default=False)
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
        password_hash = bcrypt.generate_password_hash(
            password.encode('utf-8'))
        self._password_hash = password_hash.decode('utf-8')

    def authenticate(self, password):
        return bcrypt.check_password_hash(
            self._password_hash, password.encode('utf-8'))
    
    def __repr__(self):
        return f'User {self.email}, ID: {self.id}'




# UserInventory model
class UserInventory(db.Model, SerializerMixin):
    __tablename__ = 'user_inventories'

    serialize_rules = (
        '-user.user_inventories',               # block user loop
        '-car_inventories.user_inventory',      # block car → inventory loop
        '-car_inventories.user',                # block car → user loop
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    submitted = db.Column(db.Boolean, default=False)
    reviewed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = relationship('User', backref=backref('user_inventories', cascade='all, delete-orphan'))


# CarInventory model with user_inventory_id
class CarInventory(db.Model, SerializerMixin):
    __tablename__ = 'car_inventories'

    serialize_rules = (
        '-user',                # avoid looping through the user
        '-user_inventory',      # avoid looping back to the parent inventory
        '-photos.car_inventory' # just in case you access car photos later
    )

    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String, nullable=False)
    vin_number = db.Column(db.String, unique=True, nullable=False)
  
    year = db.Column(db.Integer, nullable=True)
    make = db.Column(db.String, nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = relationship('User', backref=backref('car_inventories'))

    # New field for user inventory
    user_inventory_id = db.Column(db.Integer, db.ForeignKey('user_inventories.id'), nullable=True)
    user_inventory = relationship('UserInventory', backref=backref('car_inventories', cascade='all, delete-orphan'))

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "location": self.location,
            "vin_number": self.vin_number,
            "year": self.year,
            "make": self.make,
            "user_id": self.user_id,
            "user_inventory_id": self.user_inventory_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<CarInventory VIN: {self.vin_number}>'



class CarPhoto(db.Model, SerializerMixin):
    __tablename__ = 'car_photos'

    serialize_rules = ('-car_inventory',)

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String, nullable=False)
    car_inventory_id = db.Column(db.Integer, db.ForeignKey('car_inventories.id'), nullable=False)

    car_inventory = relationship('CarInventory', backref=backref('photos', cascade='all, delete-orphan'))



class MasterCarRecord(db.Model, SerializerMixin):
    __tablename__ = 'master_car_records'

    id = db.Column(db.Integer, primary_key=True)
    vin_number = db.Column(db.String, unique=True, nullable=False)
    location = db.Column(db.String, nullable=True)
    year = db.Column(db.Integer, nullable=True)
    make = db.Column(db.String, nullable=True)
    purchase_price = db.Column(db.Float, nullable=True)
    selling_price = db.Column(db.Float, nullable=True)
    is_sold = db.Column(db.Boolean, default=False)
    sold_price = db.Column(db.Float, nullable=True)

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())