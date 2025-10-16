
import os
import uuid
import functools
from io import BytesIO
from datetime import timezone, datetime, timedelta, date
from decimal import Decimal

from flask import jsonify, request, make_response, render_template, session, send_file
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restful import Api, Resource
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import func


from config import db, app

# Ensure a SECRET_KEY exists for session signing (required to use Flask sessions)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', app.config.get('SECRET_KEY') or 'dev-secret-change-me')
# Sensible defaults for cookies
app.config.setdefault('SESSION_COOKIE_SAMESITE', 'Lax')
# If you are on HTTPS in production, set this env var to true
if os.environ.get('SESSION_COOKIE_SECURE', 'false').lower() in ('1', 'true', 'yes'):  
    app.config['SESSION_COOKIE_SECURE'] = True

# Models
from models import (
    NOTE_MAX_LEN,
    User,
    Address,
    AuthThrottle,
    Category,
    MenuItem,
    ModifierGroup,
    ModifierOption,
    MenuItemModifierGroup,
    Cart,
    CartItem,
    CartItemModifier,
    Order,
    OrderItem,
    OrderItemModifier,
    Payment,
    Receipt,
    OrderDelivery,
    Unit,
    UnitConversion,
    Supplier,
    InventoryItem,
    InventoryBatch,
    StockMovement,
    Recipe,
    RecipeComponent,
)

# ---------- App config ---------- #
CORS(app)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 31536000  # 1 year for send_file defaults

# SQLAlchemy engine options (production-friendly defaults)
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 280,
    'pool_size': 10,
    'max_overflow': 20,
}

# Migrations
migrate = Migrate(app, db)

# -------- Caching policy for API/HTML/Static -------- #
@app.after_request
def add_cache_headers(resp):
    p = (request.path or "").lower()
    if p.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-store"
        return resp
    if (resp.mimetype or "").startswith("text/html"):
        resp.headers["Cache-Control"] = "no-cache, max-age=0, must-revalidate"
        return resp
    if p.endswith((".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".woff2", ".ttf")):
        resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return resp
    return resp

# --------- Auth helpers --------- #

def require_login(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return {"error": "Unauthorized"}, 401
        user = User.query.get(user_id)
        if not user:
            return {"error": "User not found"}, 404
        request.user = user  # attach for convenience
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
        request.user = user
        return fn(*args, **kwargs)
    return wrapper

# --------- Error Handlers --------- #
@app.errorhandler(ValueError)
def handle_value_error(err):
    return jsonify({"error": str(err)}), 400

@app.errorhandler(IntegrityError)
def handle_integrity_error(err):
    db.session.rollback()
    return jsonify({"error": "database constraint violation"}), 409

@app.errorhandler(SQLAlchemyError)
def handle_sqla_error(err):
    db.session.rollback()
    return jsonify({"error": "database error"}), 400

@app.errorhandler(404)
def not_found(e):
    return render_template("index.html")

api = Api(app)

# --------- Serializers (minimal) --------- #

def s_user(u: User):
    return {
        "id": u.id,
        "email": u.email,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "admin": u.admin,
        "is_owner_admin": u.is_owner_admin,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "updated_at": u.updated_at.isoformat() if u.updated_at else None,
        "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
    }

def s_modifier_option(o: ModifierOption):
    return {
        "id": o.id,
        "name": o.name,
        "price_delta": str(o.price_delta),
        "is_active": o.is_active,
    }

def s_modifier_group(g: ModifierGroup):
    return {
        "id": g.id,
        "name": g.name,
        "min_choices": g.min_choices,
        "max_choices": g.max_choices,
        "required": g.required,
        "options": [s_modifier_option(o) for o in g.options if o.is_active],
    }

def s_menu_item(m: MenuItem):
    return {
        "id": m.id,
        "name": m.name,
        "description": m.description,
        "price": str(m.price),
        "tax_class": m.tax_class,
        "image_url": m.image_url,
        "is_active": m.is_active,
        "modifier_groups": [s_modifier_group(link.group) for link in m.modifier_groups],
    }

def s_category(c: Category):
    return {
        "id": c.id,
        "name": c.name,
        "sort_order": c.sort_order,
        "is_active": c.is_active,
        "items": [s_menu_item(i) for i in c.menu_items if i.is_active],
    }

# ------------- Auth endpoints ------------- #
class Signup(Resource):
    def post(self):
        data = request.get_json() or {}
        try:
            email = (data.get('email') or '').strip().lower()
            password = data.get('password') or ''
            first = (data.get('first_name') or None)
            last = (data.get('last_name') or None)
            if not email or not password:
                return {"error": "email and password are required"}, 400
            user = User(email=email, first_name=first, last_name=last)
            user.password_hash = password
            db.session.add(user)
            db.session.commit()
            session['user_id'] = user.id
            session.permanent = True
            return s_user(user), 201
        except IntegrityError:
            db.session.rollback()
            return {"error": "Email already exists."}, 422

class Login(Resource):
    def post(self):
        data = request.get_json() or {}
        email = (data.get('email') or data.get('username') or '').strip().lower()
        password = data.get('password') or ''
        if not email or not password:
            return {"error": "email and password are required"}, 400
        user = User.query.filter_by(email=email).first()
        if not user or not user.authenticate(password):
            return {"error": "invalid credentials"}, 401
        user.mark_last_login()
        db.session.commit()
        session['user_id'] = user.id
        session.permanent = True
        return s_user(user), 200

class Logout(Resource):
    @require_login
    def delete(self):
        session['user_id'] = None
        return {}, 204

class CheckSession(Resource):
    @require_login
    def get(self):
        return s_user(request.user), 200

# ------------- Public menu endpoints ------------- #
class Categories(Resource):
    def get(self):
        cats = Category.query.filter_by(is_active=True).order_by(Category.sort_order, Category.id).all()
        return [s_category(c) for c in cats], 200

class Menu(Resource):
    def get(self):
        # Same as categories, but flattened list of items
        items = (
            db.session.query(MenuItem)
            .join(Category, MenuItem.category_id == Category.id)
            .filter(MenuItem.is_active == True, Category.is_active == True)
            .order_by(Category.sort_order, MenuItem.name)
            .all()
        )
        return [s_menu_item(m) for m in items], 200

# ------------- Cart endpoints ------------- #

def _calc_item_unit_price(menu_item_id: int, modifier_option_ids):
    item = MenuItem.query.get(menu_item_id)
    if not item or not item.is_active:
        raise ValueError("invalid menu item")
    price = Decimal(item.price)
    if modifier_option_ids:
        opts = ModifierOption.query.filter(ModifierOption.id.in_(modifier_option_ids)).all()
        for o in opts:
            price += Decimal(o.price_delta)
    return price

class Carts(Resource):
    def post(self):
        # create a cart (guest or logged-in)
        payload = request.get_json() or {}
        session_id = payload.get('session_id') or str(uuid.uuid4())
        user_id = session.get('user_id')
        cart = Cart(user_id=user_id, session_id=session_id, currency='USD')
        db.session.add(cart)
        db.session.commit()
        return {"id": cart.id, "session_id": cart.session_id, "currency": cart.currency}, 201

class CartById(Resource):
    def get(self, cart_id):
        cart = Cart.query.get(cart_id)
        if not cart:
            return {"error": "Cart not found"}, 404
        return {
            "id": cart.id,
            "user_id": cart.user_id,
            "session_id": cart.session_id,
            "currency": cart.currency,
            "items": [
                {
                    "id": ci.id,
                    "menu_item_id": ci.menu_item_id,
                    "name": ci.menu_item.name if ci.menu_item else None,
                    "qty": ci.qty,
                    "unit_price": str(ci.unit_price),
                    "notes": ci.notes,
                    "modifiers": [
                        {"id": m.id, "option_id": m.modifier_option_id, "price_delta": str(m.price_delta)}
                        for m in ci.modifiers
                    ]
                }
                for ci in cart.items
            ]
        }, 200

class CartItems(Resource):
    def post(self, cart_id):
        cart = Cart.query.get(cart_id)
        if not cart:
            return {"error": "Cart not found"}, 404
        data = request.get_json() or {}
        menu_item_id = data.get('menu_item_id')
        qty = max(1, int(data.get('qty') or 1))
        notes = (data.get('notes') or None)
        modifier_option_ids = data.get('modifier_option_ids') or []
        unit_price = _calc_item_unit_price(menu_item_id, modifier_option_ids)
        ci = CartItem(cart_id=cart.id, menu_item_id=menu_item_id, qty=qty, unit_price=unit_price, notes=notes)
        db.session.add(ci)
        db.session.flush()
        for oid in modifier_option_ids:
            opt = ModifierOption.query.get(oid)
            if opt:
                db.session.add(CartItemModifier(cart_item_id=ci.id, modifier_option_id=opt.id, price_delta=opt.price_delta))
        db.session.commit()
        return {"id": ci.id}, 201

class CartItemById(Resource):
    def patch(self, cart_id, item_id):
        ci = CartItem.query.filter_by(id=item_id, cart_id=cart_id).first()
        if not ci:
            return {"error": "Cart item not found"}, 404
        data = request.get_json() or {}
        if 'qty' in data:
            q = int(data['qty'])
            if q < 1:
                return {"error": "qty must be >= 1"}, 400
            ci.qty = q
        if 'notes' in data:
            notes = (data.get('notes') or '').strip()
            if len(notes) > 300:
                return {"error": "notes too long"}, 400
            ci.notes = notes or None
        db.session.commit()
        return {"id": ci.id, "qty": ci.qty, "notes": ci.notes}, 200

    def delete(self, cart_id, item_id):
        ci = CartItem.query.filter_by(id=item_id, cart_id=cart_id).first()
        if not ci:
            return {"error": "Cart item not found"}, 404
        db.session.delete(ci)
        db.session.commit()
        return '', 204

# ------------- Checkout / Orders ------------- #
class Checkout(Resource):
    def post(self, cart_id):
        cart = Cart.query.get(cart_id)
        if not cart or not cart.items:
            return {"error": "Cart is empty or not found"}, 400
        # Totals
        subtotal = Decimal('0.00')
        for ci in cart.items:
            line_price = Decimal(ci.unit_price) * ci.qty
            # modifiers are already in unit_price per our calc; if you prefer separate, add them here
            subtotal += line_price
        tax_total = (subtotal * Decimal('0.08')).quantize(Decimal('0.01'))  # simple 8% example
        delivery_fee = Decimal('0.00')
        tip = Decimal(str(request.get_json().get('tip', '0') if request.get_json() else '0')) or Decimal('0.00')
        grand_total = (subtotal + tax_total + delivery_fee + tip).quantize(Decimal('0.01'))

        order = Order(
            user_id=session.get('user_id'),
            status='paid',
            channel='web',
            fulfillment=request.get_json().get('fulfillment', 'pickup') if request.get_json() else 'pickup',
            subtotal=subtotal,
            tax_total=tax_total,
            discount_total=Decimal('0.00'),
            delivery_fee=delivery_fee,
            tip=tip,
            grand_total=grand_total,
            currency='USD',
        )
        db.session.add(order)
        db.session.flush()

        for ci in cart.items:
            oi = OrderItem(
                order_id=order.id,
                menu_item_name=ci.menu_item.name if ci.menu_item else 'Item',
                qty=ci.qty,
                unit_price=ci.unit_price,
                line_total=(Decimal(ci.unit_price) * ci.qty).quantize(Decimal('0.01')),
                notes=ci.notes,
            )
            db.session.add(oi)
            db.session.flush()
            for m in ci.modifiers:
                db.session.add(OrderItemModifier(order_item_id=oi.id, name=m.option.name if m.option else 'Modifier', price_delta=m.price_delta))

        # Example payment record (mock)
        pay = Payment(order_id=order.id, provider='test', reference=f'TEST-{uuid.uuid4().hex[:8]}', amount=order.grand_total, currency='USD', status='captured')
        db.session.add(pay)

        # Optional receipt snapshot
        rec = Receipt(order_id=order.id, data={
            "subtotal": str(subtotal),
            "tax_total": str(tax_total),
            "tip": str(tip),
            "grand_total": str(grand_total),
        })
        db.session.add(rec)

        # Clear cart after checkout (or you can leave it)
        for ci in list(cart.items):
            db.session.delete(ci)
        db.session.commit()

        return {"order_id": order.id, "grand_total": str(order.grand_total)}, 201

class Orders(Resource):
    @require_login
    def get(self):
        orders = Order.query.filter_by(user_id=request.user.id).order_by(Order.placed_at.desc()).all()
        return [
            {
                "id": o.id,
                "status": o.status,
                "fulfillment": o.fulfillment,
                "grand_total": str(o.grand_total),
                "placed_at": o.placed_at.isoformat() if o.placed_at else None,
            }
            for o in orders
        ], 200

class OrderById(Resource):
    @require_login
    def get(self, order_id):
        o = Order.query.filter_by(id=order_id, user_id=request.user.id).first()
        if not o:
            return {"error": "Order not found"}, 404
        return {
            "id": o.id,
            "status": o.status,
            "fulfillment": o.fulfillment,
            "subtotal": str(o.subtotal),
            "tax_total": str(o.tax_total),
            "discount_total": str(o.discount_total),
            "delivery_fee": str(o.delivery_fee),
            "tip": str(o.tip),
            "grand_total": str(o.grand_total),
            "items": [
                {
                    "name": i.menu_item_name,
                    "qty": i.qty,
                    "unit_price": str(i.unit_price),
                    "line_total": str(i.line_total),
                    "modifiers": [
                        {"name": m.name, "price_delta": str(m.price_delta)} for m in i.modifiers
                    ],
                }
                for i in o.items
            ],
            "payments": [
                {"provider": p.provider, "reference": p.reference, "amount": str(p.amount), "status": p.status}
                for p in o.payments
            ],
        }, 200

# ------------- Admin: Inventory receiving + food cost ------------- #
class AdminInventoryItems(Resource):
    @require_admin
    def post(self):
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        sku = (data.get('sku') or None)
        base_unit_code = (data.get('base_unit') or 'lb').strip().lower()
        if not name:
            return {"error": "name is required"}, 400
        unit = Unit.query.filter(func.lower(Unit.code) == base_unit_code).first()
        if not unit:
            return {"error": "base unit not found"}, 400
        # Idempotent create-by-name
        existing = InventoryItem.query.filter(func.lower(InventoryItem.name) == name.lower()).first()
        if existing:
            return {"id": existing.id, "name": existing.name, "base_unit": existing.base_unit.code, "existing": True}, 200
        try:
            item = InventoryItem(name=name, sku=sku, base_unit=unit)
            db.session.add(item)
            db.session.commit()
            return {"id": item.id, "name": item.name, "base_unit": unit.code, "existing": False}, 201
        except IntegrityError:
            db.session.rollback()
            return {"error": "inventory item with this name or sku already exists"}, 409

class AdminInventoryBatches(Resource):
    @require_admin
    def post(self):
        data = request.get_json() or {}
        raw_item_id = data.get('inventory_item_id')
        # Coerce to int safely and reject 'null'/'None' strings
        try:
            if raw_item_id in (None, '', 'null', 'None'):
                return {"error": "inventory_item_id is required"}, 400
            item_id = int(raw_item_id)
        except (TypeError, ValueError):
            return {"error": "inventory_item_id must be an integer"}, 400

        supplier_name = (data.get('supplier') or 'Default Supplier').strip()
        try:
            qty = Decimal(str(data.get('qty', '0')))
            unit_cost = Decimal(str(data.get('unit_cost', '0')))
        except Exception:
            return {"error": "qty and unit_cost must be numeric"}, 400
        expiration = data.get('expiration_date')

        if qty <= 0 or unit_cost < 0:
            return {"error": "invalid batch parameters"}, 400

        item = InventoryItem.query.get(item_id)
        if not item:
            return {"error": "inventory item not found"}, 404

        supplier = Supplier.query.filter_by(name=supplier_name).first()
        if not supplier:
            supplier = Supplier(name=supplier_name)
            db.session.add(supplier)
            db.session.flush()

        exp = None
        if expiration:
            try:
                exp = datetime.fromisoformat(expiration).date()
            except Exception:
                return {"error": "expiration_date must be YYYY-MM-DD"}, 400

        try:
            batch = InventoryBatch(
                inventory_item_id=item.id,
                supplier_id=supplier.id,
                qty=float(qty),
                unit_cost=unit_cost,
                expiration_date=exp
            )
            db.session.add(batch)
            db.session.commit()
            return {"id": batch.id}, 201
        except IntegrityError:
            db.session.rollback()
            return {"error": "constraint violation while creating batch"}, 409
        except SQLAlchemyError:
            db.session.rollback()
            return {"error": "database error while creating batch"}, 400

class AdminFoodCost(Resource):
    @require_admin
    def get(self, menu_item_id):
        # Compute food cost = sum(component.qty * latest_unit_cost)
        recipe = Recipe.query.filter_by(menu_item_id=menu_item_id).first()
        if not recipe:
            return {"error": "Recipe not found"}, 404
        total = Decimal('0.00')
        breakdown = []
        for comp in recipe.components:
            # latest batch unit_cost for this inventory item (fallback 0)
            last_batch = (
                InventoryBatch.query
                .filter_by(inventory_item_id=comp.inventory_item_id)
                .order_by(InventoryBatch.received_at.desc())
                .first()
            )
            unit_cost = Decimal(str(last_batch.unit_cost)) if last_batch and last_batch.unit_cost is not None else Decimal('0.00')
            extended = (Decimal(str(comp.qty)) * unit_cost).quantize(Decimal('0.0001'))
            total += extended
            breakdown.append({
                'ingredient': comp.inventory_item.name,
                'qty': comp.qty,
                'unit_cost': str(unit_cost),
                'extended': str(extended)
            })
        return {"menu_item_id": menu_item_id, "food_cost": str(total.quantize(Decimal('0.01'))), "breakdown": breakdown}, 200

# --------- Routes --------- #
api.add_resource(Signup, '/api/signup')
api.add_resource(Login, '/api/login')
api.add_resource(Logout, '/api/logout')
api.add_resource(CheckSession, '/api/check_session')

api.add_resource(Categories, '/api/categories')
api.add_resource(Menu, '/api/menu')

api.add_resource(Carts, '/api/carts')
api.add_resource(CartById, '/api/carts/<int:cart_id>')
api.add_resource(CartItems, '/api/carts/<int:cart_id>/items')
api.add_resource(CartItemById, '/api/carts/<int:cart_id>/items/<int:item_id>')
api.add_resource(Checkout, '/api/carts/<int:cart_id>/checkout')

api.add_resource(Orders, '/api/orders')
api.add_resource(OrderById, '/api/orders/<int:order_id>')

api.add_resource(AdminInventoryItems, '/api/admin/inventory/items')
api.add_resource(AdminInventoryBatches, '/api/admin/inventory/batches')
api.add_resource(AdminFoodCost, '/api/admin/food_cost/<int:menu_item_id>')

# Ensure sessions are properly removed after each request
@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5555)))
