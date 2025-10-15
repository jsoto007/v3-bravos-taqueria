import os
import uuid
import functools
from io import BytesIO
from flask_cors import CORS
from flask_migrate import Migrate
from sqlalchemy import func, and_
from sqlalchemy.orm import joinedload
from flask_restful import Api, Resource
from werkzeug.utils import secure_filename
from services.auth_service import password_login
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from flask import jsonify, request, make_response, render_template, session, send_from_directory, url_for, g, send_file
# -------- Stripe -------- #


from config import db, app


from sqlalchemy.pool import QueuePool

# -------- Stripe -------- #

import stripe

from datetime import timezone, datetime, timedelta

# --- Optional Excel support (install openpyxl) ---
try:
    from openpyxl import Workbook  # type: ignore
    OPENPYXL_AVAILABLE = True
except ImportError:  # pragma: no cover
    OPENPYXL_AVAILABLE = False

# ---------- Stripe ---------- #
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# SQLAlchemy production-ready engine options
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 280,  # recycle connections every 280 seconds
    'pool_size': 10,       # adjust based on expected concurrent requests
    'max_overflow': 20     # allows extra temporary connections
}
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)



CORS(app)

# -------- Caching policy (static vs API vs HTML) -------- #
# Long-cache for fingerprinted static assets, disable caching for API and HTML shell.
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 31536000  # 1 year for send_file defaults

@app.after_request
def add_cache_headers(resp):
    # Normalize path
    p = (request.path or "").lower()

    # 1) APIs: never cache in the browser
    if p.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-store"
        return resp

    # 2) HTML shell (including SPA fallback via the 404->index.html render):
    # detect by mimetype rather than path so it also hits /dashboard, etc.
    if (resp.mimetype or "").startswith("text/html"):
        resp.headers["Cache-Control"] = "no-cache, max-age=0, must-revalidate"
        return resp

    # 3) Static assets: cache for a year (hashed filenames are safe to cache immutably)
    if p.endswith((".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".woff2", ".ttf")):
        resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return resp

    return resp


# --------- Custom Decorators --------- #
def require_login(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return {"error": "Unauthorized"}, 401
        user = User.query.get(user_id)
        if not user:
            return {"error": "User not found"}, 404
        # Attach user to flask.g for convenience
        g.user = user
        return fn(*args, **kwargs)
    return wrapper

def require_admin(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return {"error": "Unauthorized"}, 401
        user = User.query.get(user_id)
        if not user or not getattr(user, 'admin', False):
            return {"error": "Forbidden: Admins only"}, 403
        g.user = user
        return fn(*args, **kwargs)
    return wrapper

def require_owner_admin(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return {"error": "Unauthorized"}, 401
        user = User.query.get(user_id)
        if not user or not (user.admin and user.is_owner_admin):
            return {"error": "Forbidden: Only owner admins can perform this action"}, 403
        g.user = user
        return fn(*args, **kwargs)
    return wrapper


# Upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Migrations
migrate = Migrate(app, db)


# --------- Global Error Handlers --------- #
@app.errorhandler(ValueError)
def handle_value_error(err):
    return jsonify({"error": str(err)}), 400

@app.errorhandler(IntegrityError)
def handle_integrity_error(err):
    db.session.rollback()
    # Avoid leaking raw SQL in production; include minimal detail
    return jsonify({"error": "database constraint violation"}), 409

@app.errorhandler(SQLAlchemyError)
def handle_sqla_error(err):
    db.session.rollback()
    return jsonify({"error": "database error"}), 400

@app.errorhandler(404)
def not_found(e):
    return render_template("index.html")

api = Api(app)

# ---- Manual Serializers ---- #

def serialize_designated_location(dl):
    return {
        "id": dl.id,
        "name": dl.name,
        "latitude": dl.latitude,
        "longitude": dl.longitude,
        "account_group_id": dl.account_group_id,
        "created_at": dl.created_at.isoformat() if getattr(dl, "created_at", None) else None,
    }

def serialize_user(user):
    return {
        "id": user.id,
        "email": user.email,
        "admin": user.admin,
        "is_owner_admin": user.is_owner_admin,
        "account_group_id": user.account_group_id,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "last_login_at": getattr(user, "last_login_at", None).isoformat() if getattr(user, "last_login_at", None) else None,
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


def serialize_car_note(note):
    return {
        "id": note.id,
        "car_inventory_id": note.car_inventory_id,
        "content": note.content,
        "created_at": note.created_at.isoformat() if note.created_at else None,
    }




class AccountGroups(Resource):
    @require_owner_admin
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
            group_id = json.get('account_group_id')
            group_key = json.get('group_key')
            is_owner_admin = json.get('is_owner_admin', False)

            group = None

            # If group ID is provided, check it exists
            if group_id:
                group = AccountGroup.query.get(group_id)
                if not group:
                    return {"error": "Account group does not exist"}, 400

            # If no group ID, and user is owner admin, handle group creation
            elif is_owner_admin:
                # If group_key not provided, generate one from uuid
                if not group_key:
                    group_key = self._generate_unique_group_key()

                group = AccountGroup.query.filter_by(group_key=group_key).first()
                if not group:
                    group = AccountGroup(group_key=group_key)
                    db.session.add(group)
                    db.session.commit()

            if not group:
                return {"error": "You must provide a valid account_group_id or group_key"}, 400

            user = User(
                email=json['username'],
                admin=json.get('admin', True),
                is_owner_admin=is_owner_admin,
                account_group_id=group.id
            )
            user.password_hash = json['password']
            db.session.add(user)
            db.session.commit()

            session['user_id'] = user.id 
    
            return serialize_user(user), 201

        except IntegrityError:
            db.session.rollback()
            return {"error": "Username already exists."}, 422
        except KeyError as e:
            return {"error": f"Missing field: {str(e)}"}, 400

    def _generate_unique_group_key(self, length=15, max_attempts=10):
        for _ in range(max_attempts):
            # Use first `length` characters of a UUIDv4 (removing hyphens)
            candidate = str(uuid.uuid4()).replace('-', '')[:length].upper()
            if not AccountGroup.query.filter_by(group_key=candidate).first():
                return candidate
        raise Exception("Failed to generate unique group_key after several attempts.")
    


class AdminCreateUser(Resource):
    @require_owner_admin
    def post(self):
        admin = g.user
        data = request.get_json()

        # Validate required fields
        required_fields = ['email', 'password']
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing required field: {field}"}, 400

        try:
            new_user = User(
                email=data['email'],
                admin=data.get('admin', False),
                is_owner_admin=False,
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                account_group_id=admin.account_group_id
            )
            new_user.password_hash = data['password'] 

            db.session.add(new_user)
            db.session.commit()

            return serialize_user(new_user), 201 
        except IntegrityError:
            db.session.rollback()
            return {"error": "Email already exists."}, 422
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
        


class CheckSession(Resource):
    @require_login
    def get(self):
        user = g.user
        return serialize_user(user), 200

class Login(Resource):
    def post(self):
        data = request.get_json() or {}
        email = (data.get('username') or '').strip().lower()
        password = data.get('password') or ''

        # Use the shared auth service (handles cooldown/throttle + last_login)
        ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        device_id = request.cookies.get('device_id')  # optional signal

        user, thr, err = password_login(email, password, ip=ip, device_id=device_id)

        if err:
            status = 429 if thr.is_locked else 401
            body = {"error": err}
            if thr.locked_until:
                try:
                    body["locked_until"] = thr.locked_until.isoformat()
                except Exception:
                    pass
            return body, status

        # Success: establish session
        session['user_id'] = user.id
        session.permanent = True
        return serialize_user(user), 200

class Logout(Resource):
    @require_login
    def delete(self):
        session['user_id'] = None
        return {}, 204

class DesignatedLocations(Resource):
    @require_login
    def get(self):
        user = g.user
        if not user.account_group_id:
            return {"error": "Forbidden: User not in an account group"}, 403
        locations = DesignatedLocation.query.filter_by(account_group_id=user.account_group_id).all()
        return [serialize_designated_location(dl) for dl in locations], 200

    @require_owner_admin
    def post(self):
        user = g.user
        data = request.get_json()
        name = data.get("name")
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        if not name or latitude is None or longitude is None:
            return {"error": "Missing required fields"}, 400
        new_dl = DesignatedLocation(
            name=name,
            latitude=latitude,
            longitude=longitude,
            account_group_id=user.account_group_id
        )
        db.session.add(new_dl)
        db.session.commit()
        return serialize_designated_location(new_dl), 201

    @require_owner_admin
    def patch(self, id):
        user = g.user
        dl = DesignatedLocation.query.filter_by(id=id, account_group_id=user.account_group_id).first()
        if not dl:
            return {"error": "Designated location not found"}, 404
        data = request.get_json()
        if "name" in data:
            dl.name = data["name"]
        if "latitude" in data:
            dl.latitude = data["latitude"]
        if "longitude" in data:
            dl.longitude = data["longitude"]
        db.session.commit()
        return serialize_designated_location(dl), 200

    @require_owner_admin
    def delete(self, id):
        user = g.user
        dl = DesignatedLocation.query.filter_by(id=id, account_group_id=user.account_group_id).first()
        if not dl:
            return {"error": "Designated location not found"}, 404
        db.session.delete(dl)
        db.session.commit()
        return '', 204
    

class CarNotes(Resource):
    @require_admin
    def get(self, car_id):
        # Return all notes for a given car_id
        notes = CarNote.query.filter_by(car_inventory_id=car_id).all()
        return [serialize_car_note(n) for n in notes], 200

    @require_admin
    def post(self, car_id):
        data = request.get_json() or {}
        content = (data.get('content') or '').strip()
        if not content:
            return {"error": "Missing content"}, 400
        if len(content) > NOTE_MAX_LEN:
            return {"error": f"content is too long (max {NOTE_MAX_LEN} chars)"}, 400
        try:
            note = CarNote(car_inventory_id=car_id, content=content)
            db.session.add(note)
            db.session.commit()
            return serialize_car_note(note), 201
        except (ValueError, IntegrityError) as e:
            db.session.rollback()
            return {"error": str(e) if isinstance(e, ValueError) else "database constraint violation"}, 400 if isinstance(e, ValueError) else 409

    @require_admin
    def patch(self, id):
        note = CarNote.query.get(id)
        if not note:
            return {"error": "CarNote not found"}, 404
        data = request.get_json() or {}
        if 'content' in data:
            new_content = (data.get('content') or '').strip()
            if not new_content:
                return {"error": "content must not be empty"}, 400
            if len(new_content) > NOTE_MAX_LEN:
                return {"error": f"content is too long (max {NOTE_MAX_LEN} chars)"}, 400
            note.content = new_content
        try:
            db.session.commit()
            return serialize_car_note(note), 200
        except (ValueError, IntegrityError) as e:
            db.session.rollback()
            return {"error": str(e) if isinstance(e, ValueError) else "database constraint violation"}, 400 if isinstance(e, ValueError) else 409

    @require_admin
    def delete(self, id):
        note = CarNote.query.get(id)
        if not note:
            return {"error": "CarNote not found"}, 404
        db.session.delete(note)
        db.session.commit()
        return '', 204
    
    
class CarInventories(Resource):
    @require_login
    def get(self, id=None):
        user = g.user
        cars = CarInventory.query.filter_by(account_group_id=user.account_group_id).all()
        return make_response(jsonify([serialize_car_inventory(car) for car in cars]), 200)

    @require_login
    def post(self):
        user = g.user
        account_group_id = user.account_group_id
        if not account_group_id:
            return {"error": "No account group associated with user"}, 403

        data = request.get_json()
        # Only require location, vin_number, year, make
        required_fields = ['location', 'vin_number', 'year', 'make']
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing required field: {field}"}, 400

        try:
            new_car = CarInventory(
                location=data['location'],
                longitude=data.get('longitude'),
                latitude=data.get('latitude'),
                vin_number=data['vin_number'],
                year=data.get('year'),
                color=data.get('color'),
                body=data.get('body'),
                make=data.get('make'),
                user_id=user.id,
                account_group_id=account_group_id
            )

            # --- Assigned location check ---
            if new_car.latitude is not None and new_car.longitude is not None:
                from math import radians, cos, sin, asin, sqrt

                def haversine(lat1, lon1, lat2, lon2):
                    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
                    dlon = lon2 - lon1
                    dlat = lat2 - lat1
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    c = 2 * asin(sqrt(a))
                    miles = 3956 * c
                    return miles

                designated_locations = DesignatedLocation.query.filter_by(account_group_id=account_group_id).all()
                for dl in designated_locations:
                    if dl.latitude is not None and dl.longitude is not None:
                        distance = haversine(new_car.latitude, new_car.longitude, dl.latitude, dl.longitude)
                        if distance <= 0.15:
                            new_car.designated_location_id = dl.id
                            break

            db.session.add(new_car)
            db.session.commit()
            return make_response(serialize_car_inventory(new_car), 201)
        except (ValueError, IntegrityError) as e:
            db.session.rollback()
            return {"error": str(e) if isinstance(e, ValueError) else "database constraint violation"}, 400 if isinstance(e, ValueError) else 409

    @require_login
    def delete(self, id):
        user = g.user
        car = CarInventory.query.filter_by(id=id, account_group_id=user.account_group_id).first()
        if not car:
            return {"error": "Car not found"}, 404

        vin_number = car.vin_number

        # Find all cars with the same VIN in this account group
        cars_to_delete = CarInventory.query.filter_by(vin_number=vin_number, account_group_id=user.account_group_id).all()

        for c in cars_to_delete:
            db.session.delete(c)

        db.session.commit()

        return '', 204

class ExportLastScans(Resource):

    @require_owner_admin
    def get(self):
        owner = g.user

        # Build a subquery to get latest created_at per VIN within the same account group
        subq = (
            db.session.query(
                CarInventory.vin_number.label('vin'),
                func.max(CarInventory.created_at).label('max_created')
            )
            .filter(CarInventory.account_group_id == owner.account_group_id)
            .group_by(CarInventory.vin_number)
            .subquery()
        )

        # Join back to CarInventory to fetch the full rows for those latest scans
        rows = (
            db.session.query(CarInventory)
            .options(
                joinedload(CarInventory.user),
                joinedload(CarInventory.designated_location)
            )
            .join(subq, and_(
                CarInventory.vin_number == subq.c.vin,
                CarInventory.created_at == subq.c.max_created
            ))
            .filter(CarInventory.account_group_id == owner.account_group_id)
            .order_by(CarInventory.created_at.desc())
            .all()
        )

        # Prepare tabular data (VIN, Designated Location, Location, Date, Scanned By)
        def _fmt_dt(dt):
            if not dt:
                return ''
            try:
                # Ensure timezone-aware in UTC
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                dt_utc = dt.astimezone(timezone.utc)
                # Example: Oct 13, 2025 04:05 PM UTC
                return dt_utc.strftime('%b %d, %Y %I:%M %p UTC')
            except Exception:
                # Fallback to ISO if anything unexpected happens
                return dt.isoformat() if hasattr(dt, 'isoformat') else str(dt)

        def _full_name(u):
            if not u:
                return ''
            first = (getattr(u, 'first_name', '') or '').strip()
            last = (getattr(u, 'last_name', '') or '').strip()
            name = (first + ' ' + last).strip()
            return name or (getattr(u, 'email', '') or '')

        data = [
            (
                r.vin_number or '',
                (getattr(r, 'designated_location', None).name if getattr(r, 'designated_location', None) else ''),
                r.location or '',
                _fmt_dt(getattr(r, 'created_at', None)),
                _full_name(getattr(r, 'user', None))
            )
            for r in rows
        ]

        # Prefer a real Excel file when possible. Fallback to CSV only if openpyxl isn't available.
        if OPENPYXL_AVAILABLE:
            wb = Workbook()
            ws = wb.active
            ws.title = "Last Scans"
            ws.append(["VIN", "Designated Location", "Location", "Date", "Scanned By"])
            for vin, dloc, loc, dt, scanned_by in data:
                ws.append([vin, dloc, loc, dt, scanned_by])

            bio = BytesIO()
            wb.save(bio)
            bio.seek(0)
            filename = f"last_scans_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.xlsx"
            return send_file(
                bio,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=filename,
                conditional=False,  # send full body to avoid proxy range issues
            )
        else:
            # CSV fallback
            import csv
            import io as _io

            # Write CSV to a text buffer first, then encode once into bytes.
            text_buf = _io.StringIO()
            writer = csv.writer(text_buf)
            writer.writerow(["VIN", "Designated Location", "Location", "Date", "Scanned By"])
            for row in data:
                writer.writerow(row)
            csv_bytes = text_buf.getvalue().encode('utf-8')

            bio = BytesIO(csv_bytes)
            bio.seek(0)
            filename = f"last_scans_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
            resp = send_file(
                bio,
                mimetype='text/csv; charset=utf-8',
                as_attachment=True,
                download_name=filename,
            )
            # Helpful signal for debugging why Excel wasn't produced
            resp.headers['X-Export-Format'] = 'csv'
            resp.headers['X-Openpyxl-Available'] = '0'
            return resp
class UserInventories(Resource):
    @require_login
    def post(self):
        user = g.user
        data = request.get_json()
        # Only allow creating inventories for current user/account_group
        new_inventory = UserInventory(
            user_id=user.id,
            account_group_id=user.account_group_id,
            submitted=data.get('submitted', False),
            reviewed=data.get('reviewed', False)
        )
        db.session.add(new_inventory)
        db.session.commit()
        return make_response(serialize_user_inventory(new_inventory), 201)

    @require_login
    def patch(self, id):
        user = g.user
        inventory = UserInventory.query.filter_by(id=id, user_id=user.id, account_group_id=user.account_group_id).first()
        if not inventory:
            return {"error": "Inventory not found"}, 404

        inventory.submitted = True
        db.session.commit()
        return make_response(serialize_user_inventory(inventory), 200)

class UserInventoryHistory(Resource):
    @require_login
    def get(self, user_id):
        user = g.user
        # Only allow access to inventories for users in the same account group
        inventories = UserInventory.query.filter_by(user_id=user_id, account_group_id=user.account_group_id).order_by(UserInventory.created_at.desc()).limit(12).all()
        return make_response(jsonify([serialize_user_inventory(inv) for inv in inventories]), 200)

class CarPhotos(Resource):
    @require_login
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
    @require_login
    def get(self):
        records = MasterCarRecord.query.order_by(MasterCarRecord.created_at.desc()).all()
        return make_response(jsonify([serialize_master_car_record(rec) for rec in records]), 200)

    @require_login
    def post(self):
        data = request.get_json()
        try:
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
        except (ValueError, IntegrityError) as e:
            db.session.rollback()
            return {"error": str(e) if isinstance(e, ValueError) else "database constraint violation"}, 400 if isinstance(e, ValueError) else 409

class MasterCarRecordById(Resource):
    @require_login
    def get(self, id):
        record = MasterCarRecord.query.filter_by(id=id).first()
        if not record:
            return {"error": "Record not found"}, 404
        return make_response(serialize_master_car_record(record), 200)

    @require_login
    def patch(self, id):
        record = MasterCarRecord.query.filter_by(id=id).first()
        if not record:
            return {"error": "Record not found"}, 404

        data = request.get_json() or {}
        try:
            for attr, value in data.items():
                setattr(record, attr, value)
            db.session.commit()
            return make_response(serialize_master_car_record(record), 200)
        except (ValueError, IntegrityError) as e:
            db.session.rollback()
            return {"error": str(e) if isinstance(e, ValueError) else "database constraint violation"}, 400 if isinstance(e, ValueError) else 409

    @require_login
    def delete(self, id):
        record = MasterCarRecord.query.filter_by(id=id).first()
        if not record:
            return {"error": "Record not found"}, 404

        db.session.delete(record)
        db.session.commit()
        return make_response('', 204)

class AdminUserInventoryCheck(Resource):
    @require_admin
    def get(self, user_inventory_id):
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
    @require_login
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

    @require_login
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
    @require_login
    def get(self):
        user = g.user
        account_group_id = user.account_group_id
        if not account_group_id:
            return {"error": "No account group associated with user"}, 403

        car_inventories = (
            db.session.query(CarInventory)
            .options(joinedload(CarInventory.user))
            .filter(CarInventory.account_group_id == account_group_id)
            .all()
        )

        vin_map = {}

        for car in car_inventories:
            vin = car.vin_number
            if vin not in vin_map:
                vin_map[vin] = {
                    "id": car.id,
                    "vin": vin,
                    "year": car.year,
                    "make": car.make,
                    "created_at": car.created_at,
                    "history": []
                }
                
            designated_location_name = None
            if hasattr(car, "designated_location") and car.designated_location is not None:
                designated_location_name = car.designated_location.name

            vin_map[vin]["history"].append({
                "user": car.user.email if car.user else None,
                "firstname": car.user.first_name if car.user else None,
                "lastname": car.user.last_name if car.user else None,
                "location": car.location,
                "latitude": car.latitude,
                "longitude": car.longitude,
                "designated_location_id": car.designated_location_id,
                "created_at": car.created_at.isoformat() if car.created_at else None,
                "designated_location": designated_location_name
            })

        result = [{
            "vin": vin_data["vin"],
            "id": vin_data["id"],
            "year": vin_data.get("year"),
            "make": vin_data.get("make"),
            "history": vin_data["history"],
            "created_at": vin_data["created_at"],
        } for vin_data in vin_map.values()]
        return make_response(jsonify(result), 200)
    


class CarById(Resource):
    @require_login
    def get(self, id):
        user = g.user
        if not user.account_group_id:
            return {"error": "Forbidden: User not in an account group"}, 403

        car = (
            CarInventory.query.options(joinedload(CarInventory.user), joinedload(CarInventory.designated_location))
            .filter_by(id=id, account_group_id=user.account_group_id)
            .first()
        )
        if not car:
            return {"error": "Car not found"}, 404

        # Prepare designated_location name for car_info
        designated_location_name = car.designated_location.name if getattr(car, "designated_location", None) else None

        car_info = {
            "id": car.id,
            "vin_number": car.vin_number,
            "year": car.year,
            "make": car.make,
            "designated_location": designated_location_name
        }

        # Scan history: all CarInventory records with the same vin_number in the same account group
        scan_history = []
        scan_cars = (
            CarInventory.query.options(joinedload(CarInventory.user), joinedload(CarInventory.designated_location))
            .filter_by(vin_number=car.vin_number, account_group_id=user.account_group_id)
            .order_by(CarInventory.created_at.asc())
            .all()
        )
        for scan in scan_cars:
            scan_designated_location_name = scan.designated_location.name if getattr(scan, "designated_location", None) else None
            scan_history.append({
                "id": scan.id,
                "user": scan.user.email if scan.user else None,
                "first_name": scan.user.first_name if scan.user else None,
                "last_name": scan.user.last_name if scan.user else None,
                "location": scan.location,
                "latitude": scan.latitude,
                "longitude": scan.longitude,
                "created_at": scan.created_at.isoformat() if scan.created_at else None,
                "designated_location": scan_designated_location_name
            })

        # All notes for this car (by car.id)
        notes = [serialize_car_note(n) for n in car.notes]

        response = {
            "car": car_info,
            "scan_history": scan_history,
            "notes": notes,
        }
        return response, 200
    

# -------- GroupUsers and GroupUserActivation -------- #
class GroupUsers(Resource):

    @require_admin
    def get(self, id=None):
        user = g.user
        q = User.query.filter_by(account_group_id=user.account_group_id)
        if id is not None:
            u = q.filter_by(id=id).first()
            if not u:
                return {"error": "User not found"}, 404
            return serialize_user(u), 200
        users = q.order_by(User.created_at.desc()).all()
        return [serialize_user(u) for u in users], 200

    @require_owner_admin
    def delete(self, id):
        owner = g.user
        u = User.query.filter_by(id=id, account_group_id=owner.account_group_id).first()
        if not u:
            return {"error": "User not found"}, 404
        # Prevent deleting self
        if u.id == owner.id:
            return {"error": "Owner admin cannot delete themselves"}, 400
        try:
            db.session.delete(u)
            db.session.commit()
            return '', 204
        except Exception:
            db.session.rollback()
            return {"error": "Unable to delete user"}, 400


class GroupUserActivation(Resource):

    @require_owner_admin
    def post(self, id, action):

        owner = g.user
        u = User.query.filter_by(id=id, account_group_id=owner.account_group_id).first()
        if not u:
            return {"error": "User not found"}, 404
        # Prevent self-activation/deactivation via this endpoint
        if u.id == owner.id:
            return {"error": "Owner admin cannot change their own activation via this endpoint"}, 400

        try:
            if action == 'activate':
                u.activate()
            elif action == 'deactivate':
                u.deactivate()
            else:
                return {"error": "Invalid action. Use 'activate' or 'deactivate'."}, 400
            db.session.commit()
            return serialize_user(u), 200
        except ValueError as e:
            db.session.rollback()
            return {"error": str(e)}, 400
        except Exception:
            db.session.rollback()
            return {"error": "Unable to update activation state"}, 400


# -------- Stripe -------- #
class StripeWebhook(Resource):
    def post(self):
        payload = request.data
        sig_header = request.headers.get('stripe-signature')
        endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError:
            return {"error": "Invalid payload"}, 400
        except stripe.error.SignatureVerificationError:
            return {"error": "Invalid signature"}, 400

        event_type = event['type']
        data = event['data']['object']
        customer_id = data.get('customer')
        subscription_id = data.get('id')

        group = None
        if customer_id:
            group = AccountGroup.query.filter_by(stripe_customer_id=customer_id).first()

        if event_type in ['customer.subscription.created', 'customer.subscription.updated']:
            if group:
                status = data.get('status')
                current_period_end = data.get('current_period_end')
                group.is_active = (status == 'active')
                group.paid_until = datetime.fromtimestamp(current_period_end, tz=timezone.utc)
                group.stripe_subscription_id = subscription_id
                db.session.commit()
        elif event_type == 'customer.subscription.deleted':
            if group:
                group.is_active = False
                db.session.commit()

        # ✅ Always return 200 to acknowledge receipt, even for unhandled events
        return {"status": "received"}, 200
    



# -------- Routes -------- #
api.add_resource(AccountGroups, '/api/account_groups', endpoint='account_groups')
api.add_resource(Signup, '/api/signup', endpoint='signup')
api.add_resource(CheckSession, '/api/check_session', endpoint='check_session')
api.add_resource(Login, '/api/login', endpoint='login')
api.add_resource(Logout, '/api/logout', endpoint='logout')
api.add_resource(AdminCreateUser, '/api/admin/create_user', endpoint='admin_create_user')

api.add_resource(CarInventories, '/api/cars', endpoint='cars')
api.add_resource(CarInventories, '/api/cars_inventory/<int:id>', endpoint='car_by_id_delete')

api.add_resource(MasterCarRecords, '/api/master_inventory', endpoint='master_inventory')
api.add_resource(MasterCarRecordById, '/api/master_inventory/<int:id>', endpoint='master_inventory_by_id')
api.add_resource(UserInventories, '/api/user_inventories', endpoint='user_inventories')
api.add_resource(UserInventories, '/api/user_inventories/<int:id>', endpoint='user_inventory_submit')
api.add_resource(UserInventoryHistory, '/api/user_inventories/history/<int:user_id>', endpoint='user_inventory_history')
api.add_resource(AdminUserInventoryCheck, '/api/admin/user_inventory_check/<int:user_inventory_id>', endpoint='admin_user_inventory_check')
api.add_resource(VinHistory, '/api/vin_history', endpoint='vin_history')
api.add_resource(CarById, '/api/cars/<int:id>', endpoint='car_by_id')

api.add_resource(UploadPhoto, '/api/upload_photo', endpoint='upload_photo')
api.add_resource(UploadPhoto, '/api/upload_photo/<int:id>', endpoint='upload_photo_by_id')
api.add_resource(CarPhotos, '/api/car_photos', endpoint='car_photos')


api.add_resource(ExportLastScans, '/api/export/last_scans.xlsx', endpoint='export_last_scans')
api.add_resource(StripeWebhook, '/api/webhook/stripe', endpoint='stripe_webhook')


api.add_resource(
    GroupUsers,
    '/api/group/users',  # GET
    '/api/group/users/<int:id>',  # GET by id, DELETE by id
    endpoint='group_users'
)
api.add_resource(
    GroupUserActivation,
    '/api/group/users/<int:id>/<string:action>',  # POST with action in {activate,deactivate}
    endpoint='group_user_activation'
)

# -------- DesignatedLocations Endpoints -------- #
api.add_resource(
    DesignatedLocations,
    '/api/designated_locations',  # GET, POST
    '/api/designated_locations/<int:id>',  # PATCH, DELETE
    endpoint='designated_locations'
)


api.add_resource(CarNotes,
                 '/api/car_notes/<int:car_id>',  # GET, POST
                 '/api/car_notes/note/<int:id>',  # PATCH, DELETE
                 endpoint='car_notes')



@app.route('/static/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/protected-resource')
def protected_resource():
    user_id = session.get("user_id")
    if not user_id:
        return {"error": "Unauthorized"}, 401

    user = User.query.filter_by(id=user_id).first()
    if not user or not user.account_group or not user.account_group.is_active:
        return {"error": "Subscription inactive"}, 403

    return {"message": "Access granted"}


# Ensure sessions are properly removed after each request
@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5555)))

