import os
import uuid
from flask import Flask, jsonify, request, make_response, render_template, session, send_from_directory, url_for
from flask_migrate import Migrate
from flask_restful import Api, Resource
from flask_cors import CORS
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename

from config import db, bcrypt, app
from models import User, CarInventory, CarPhoto, MasterCarRecord, UserInventory, AccountGroup

# SQLAlchemy pre-ping setting
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_pre_ping': True}

# CORS
CORS(app)

# Upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Migrations
migrate = Migrate(app, db)

@app.errorhandler(404)
def not_found(e):
    return render_template("index.html")

api = Api(app)

# ---- Manual Serializers ---- #

def serialize_user(user):
    return {
        "id": user.id,
        "email": user.email,
        "admin": user.admin,
        "is_owner_admin": user.is_owner_admin,
        "account_group_id": user.account_group_id,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }

def serialize_user_inventory(inv):
    return {
        "id": inv.id,
        "user_id": inv.user_id,
        "account_group_id": inv.account_group_id,
        "submitted": inv.submitted,
        "reviewed": inv.reviewed,
        "created_at": inv.created_at.isoformat() if inv.created_at else None,
    }

def serialize_car_inventory(car):
    return {
        "id": car.id,
        "location": car.location,
        "vin_number": car.vin_number,
        "year": car.year,
        "make": car.make,
        "user_id": car.user_id,
        "user_inventory_id": car.user_inventory_id,
        "account_group_id": car.account_group_id,
        "created_at": car.created_at.isoformat() if car.created_at else None,
        "updated_at": car.updated_at.isoformat() if car.updated_at else None,
    }

def serialize_master_car_record(rec):
    return {
        "id": rec.id,
        "vin_number": rec.vin_number,
        "location": rec.location,
        "year": rec.year,
        "make": rec.make,
        "model": rec.model,
        "trim": rec.trim,
        "body_style": rec.body_style,
        "color": rec.color,
        "interior_color": rec.interior_color,
        "transmission": rec.transmission,
        "drivetrain": rec.drivetrain,
        "engine": rec.engine,
        "fuel_type": rec.fuel_type,
        "date_acquired": rec.date_acquired.isoformat() if rec.date_acquired else None,
        "date_sold": rec.date_sold.isoformat() if rec.date_sold else None,
        "mileage": rec.mileage,
        "purchase_price": rec.purchase_price,
        "selling_price": rec.selling_price,
        "is_sold": rec.is_sold,
        "sold_price": rec.sold_price,
        "created_at": rec.created_at.isoformat() if rec.created_at else None,
        "updated_at": rec.updated_at.isoformat() if rec.updated_at else None,
    }

def serialize_car_photo(photo):
    return {
        "id": photo.id,
        "url": photo.url,
        "car_inventory_id": photo.car_inventory_id,
        "master_car_record_id": photo.master_car_record_id,
    }

def serialize_account_group(group):
    return {
        "id": group.id,
        "group_key": group.group_key,
        "is_active": group.is_active,
        "paid_until": group.paid_until.isoformat() if group.paid_until else None,
        "created_at": group.created_at.isoformat() if group.created_at else None,
    }

# -------- Resources -------- #

class AccountGroups(Resource):
    def post(self):
        data = request.get_json()
        group = AccountGroup(group_key=data['group_key'])
        db.session.add(group)
        db.session.commit()
        return make_response(serialize_account_group(group), 201)

    def get(self):
        groups = AccountGroup.query.all()
        return make_response(jsonify([serialize_account_group(g) for g in groups]), 200)

class Signup(Resource):
    def post(self):
        json = request.get_json()
        try:
            user = User(
                email=json['username'],
                admin=json.get('admin', False),
                is_owner_admin=json.get('is_owner_admin', False),
                account_group_id=json['account_group_id']
            )
            user.password_hash = json['password']
            db.session.add(user)
            db.session.commit()
            return serialize_user(user), 201
        except IntegrityError:
            db.session.rollback()
            return {"error": "Username already exists."}, 422
        except KeyError as e:
            return {"error": f"Missing field: {str(e)}"}, 400

class CheckSession(Resource):
    def get(self):
        if session.get('user_id'):
            user = User.query.filter(User.id == session['user_id']).first()
            return user.to_dict(), 200
        return {"error": "Please log in"}, 401

class Login(Resource):
    def post(self):
        email = request.get_json()['username']
        password = request.get_json()['password']

        user = User.query.filter(User.email == email).first()
        if user and user.authenticate(password):
            session['user_id'] = user.id
            return serialize_user(user), 200
        return {'error': "401 Unauthorized"}, 401

class Logout(Resource):
    def delete(self):
        session['user_id'] = None
        return {}, 204

class CarInventories(Resource):
    def get(self):
        cars = CarInventory.query.all()
        return make_response(jsonify([serialize_car_inventory(car) for car in cars]), 200)

    def post(self):
        data = request.get_json()
        user_inventory_id = data.get('user_inventory_id')
        account_group_id = data.get('account_group_id')

        if not user_inventory_id or not account_group_id:
            return {"error": "User inventory ID and account group ID are required"}, 400

        inventory = UserInventory.query.filter_by(id=user_inventory_id).first()
        if not inventory:
            return {"error": "User inventory not found"}, 404
        if inventory.submitted:
            return {"error": "Inventory has been submitted and cannot be modified"}, 403

        new_car = CarInventory(
            location=data['location'],
            vin_number=data['vin_number'],
            year=data.get('year'),
            make=data.get('make'),
            user_id=data['user_id'],
            user_inventory_id=user_inventory_id,
            account_group_id=account_group_id
        )
        db.session.add(new_car)
        db.session.commit()
        return make_response(serialize_car_inventory(new_car), 201)

class UserInventories(Resource):
    def post(self):
        data = request.get_json()
        user_id = data.get('user_id')
        account_group_id = data.get('account_group_id')

        if not user_id or not account_group_id:
            return {"error": "User ID and account group ID are required"}, 400

        new_inventory = UserInventory(
            user_id=user_id,
            account_group_id=account_group_id,
            submitted=data.get('submitted', False),
            reviewed=data.get('reviewed', False)
        )
        db.session.add(new_inventory)
        db.session.commit()
        return make_response(serialize_user_inventory(new_inventory), 201)

    def patch(self, id):
        inventory = UserInventory.query.filter_by(id=id).first()
        if not inventory:
            return {"error": "Inventory not found"}, 404

        inventory.submitted = True
        db.session.commit()
        return make_response(serialize_user_inventory(inventory), 200)

class UserInventoryHistory(Resource):
    def get(self, user_id):
        inventories = UserInventory.query.filter_by(user_id=user_id).order_by(UserInventory.created_at.desc()).limit(12).all()
        return make_response(jsonify([serialize_user_inventory(inv) for inv in inventories]), 200)

class CarPhotos(Resource):
    def post(self):
        data = request.get_json()
        new_photo = CarPhoto(
            url=data['url'],
            car_inventory_id=data.get('car_inventory_id'),
            master_car_record_id=data.get('master_car_record_id')
        )
        db.session.add(new_photo)
        db.session.commit()
        return make_response(serialize_car_photo(new_photo), 201)

class MasterCarRecords(Resource):
    def get(self):
        records = MasterCarRecord.query.order_by(MasterCarRecord.created_at.desc()).all()
        return make_response(jsonify([serialize_master_car_record(rec) for rec in records]), 200)

    def post(self):
        data = request.get_json()
        new_record = MasterCarRecord(
            vin_number=data['vin_number'],
            location=data.get('location'),
            year=data.get('year'),
            make=data.get('make'),
            purchase_price=data.get('purchase_price'),
            selling_price=data.get('selling_price'),
            sold_price=data.get('sold_price'),
            is_sold=data.get('is_sold', False)
        )
        db.session.add(new_record)
        db.session.commit()
        return make_response(serialize_master_car_record(new_record), 201)

class MasterCarRecordById(Resource):
    def get(self, id):
        record = MasterCarRecord.query.filter_by(id=id).first()
        if not record:
            return {"error": "Record not found"}, 404
        return make_response(serialize_master_car_record(record), 200)

    def patch(self, id):
        record = MasterCarRecord.query.filter_by(id=id).first()
        if not record:
            return {"error": "Record not found"}, 404

        data = request.get_json()
        for attr, value in data.items():
            setattr(record, attr, value)

        db.session.commit()
        return make_response(serialize_master_car_record(record), 200)

    def delete(self, id):
        record = MasterCarRecord.query.filter_by(id=id).first()
        if not record:
            return {"error": "Record not found"}, 404

        db.session.delete(record)
        db.session.commit()
        return make_response('', 204)

class AdminUserInventoryCheck(Resource):
    def get(self, user_inventory_id):
        user_id = session.get('user_id')
        if not user_id:
            return {"error": "Unauthorized"}, 401

        user = User.query.filter_by(id=user_id).first()
        if not user or not getattr(user, 'admin', False):
            return {"error": "Forbidden: Admins only"}, 403

        user_inventory = UserInventory.query.filter_by(id=user_inventory_id).first()
        if not user_inventory:
            return {"error": "User inventory not found"}, 404

        cars = MasterCarRecord.query.filter(
            MasterCarRecord.created_at <= user_inventory.created_at
        ).all()

        return make_response(jsonify({
            "user_inventory": serialize_user_inventory(user_inventory),
            "matching_cars": [serialize_master_car_record(car) for car in cars]
        }), 200)

class UploadPhoto(Resource):
    def post(self):
        if 'photo' not in request.files:
            return {"error": "No file part"}, 400
        file = request.files['photo']

        master_car_record_id = request.form.get("master_car_record_id")
        if not master_car_record_id:
            return {"error": "Missing master_car_record_id"}, 400

        if file.filename == '':
            return {"error": "No selected file"}, 400

        if file and allowed_file(file.filename):
            filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            record = MasterCarRecord.query.get(int(master_car_record_id))
            if not record:
                return {"error": "MasterCarRecord not found"}, 404

            photo = CarPhoto(
                url=f"/static/uploads/{filename}",
                master_car_record_id=master_car_record_id
            )
            db.session.add(photo)
            db.session.commit()

            return {"message": "Photo uploaded", "url": url_for('serve_uploaded_file', filename=filename, _external=True)}, 201

        return {"error": "File type not allowed. Allowed types: png, jpg, jpeg, gif"}, 400

    def delete(self, id):
        record = CarPhoto.query.filter_by(id=id).first()
        if not record:
            return {"error": "Record not found"}, 404

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(record.url))
        if os.path.exists(filepath):
            os.remove(filepath)
        db.session.delete(record)
        db.session.commit()
        return make_response("", 204)

class VinHistory(Resource):
    def get(self):
        car_inventories = db.session.query(CarInventory).options(joinedload(CarInventory.user)).all()
        vin_map = {}

        for car in car_inventories:
            vin = car.vin_number
            if vin not in vin_map:
                vin_map[vin] = {
                    "vin": vin,
                    "history": []
                }

            vin_map[vin]["history"].append({
                "user": car.user.email if car.user else None,
                "location": car.location,
                "created_at": car.created_at.isoformat() if car.created_at else None
            })

        result = [{"vin": vin_data["vin"], "history": vin_data["history"]} for vin_data in vin_map.values()]
        return make_response(jsonify(result), 200)

# -------- Routes -------- #
api.add_resource(AccountGroups, '/api/account_groups', endpoint='account_groups')
api.add_resource(Signup, '/api/signup', endpoint='signup')
api.add_resource(CheckSession, '/api/check_session', endpoint='check_session')
api.add_resource(Login, '/api/login', endpoint='login')
api.add_resource(Logout, '/api/logout', endpoint='logout')
api.add_resource(CarInventories, '/api/cars', endpoint='cars')
api.add_resource(CarPhotos, '/api/car_photos', endpoint='car_photos')
api.add_resource(MasterCarRecords, '/api/master_inventory', endpoint='master_inventory')
api.add_resource(MasterCarRecordById, '/api/master_inventory/<int:id>', endpoint='master_inventory_by_id')
api.add_resource(UserInventories, '/api/user_inventories', endpoint='user_inventories')
api.add_resource(UserInventories, '/api/user_inventories/<int:id>', endpoint='user_inventory_submit')
api.add_resource(UserInventoryHistory, '/api/user_inventories/history/<int:user_id>', endpoint='user_inventory_history')
api.add_resource(AdminUserInventoryCheck, '/api/admin/user_inventory_check/<int:user_inventory_id>', endpoint='admin_user_inventory_check')
api.add_resource(UploadPhoto, '/api/upload_photo', endpoint='upload_photo')
api.add_resource(UploadPhoto, '/api/upload_photo/<int:id>', endpoint='upload_photo_by_id')
api.add_resource(VinHistory, '/api/vin_history', endpoint='vin_history')

@app.route('/static/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5555)))

