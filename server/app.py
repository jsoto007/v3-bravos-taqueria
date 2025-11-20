
import os
import uuid
import functools
from collections import deque
from io import BytesIO
from datetime import timezone, datetime, timedelta, date
from decimal import Decimal

from flask import jsonify, request, make_response, render_template, session, send_file
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restful import Api, Resource
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import func, or_, inspect, text
from sqlalchemy.orm import joinedload


from config import db, app

# --- Stripe integration ---
import stripe
from services.checkout import money_to_cents

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_CURRENCY = os.environ.get('STRIPE_CURRENCY', 'usd').lower()
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
try:
    TAX_RATE = Decimal(os.environ.get('TAX_RATE', '0.0'))
except Exception:
    TAX_RATE = Decimal('0.0')

# Flask 3.x no longer exposes `app.env`. Derive "production" safely.
IS_PROD = (
    (os.environ.get('ENV') or os.environ.get('FLASK_ENV') or '').lower() == 'production'
    or (not getattr(app, 'debug', False) and not getattr(app, 'testing', False))
)
if IS_PROD and not STRIPE_WEBHOOK_SECRET:
    raise RuntimeError("STRIPE_WEBHOOK_SECRET must be set in production.")

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
    InventoryAuditSession,
    InventoryAuditItem,
    Recipe,
    RecipeComponent,
    AdminSetting,
)

# Lightweight safety check to keep feature tables/columns in sync when migrations haven't been applied yet
_SCHEMA_BOOTSTRAPPED = False


def _ensure_admin_schema():
    """
    Make sure newer admin tables/columns exist so requests don't fail with SQL errors
    if a migration hasn't been run yet.
    """
    global _SCHEMA_BOOTSTRAPPED
    if _SCHEMA_BOOTSTRAPPED:
        return

    with db.engine.begin() as conn:
        # Create tables introduced in recent migrations when missing
        AdminSetting.__table__.create(bind=conn, checkfirst=True)
        InventoryAuditSession.__table__.create(bind=conn, checkfirst=True)
        InventoryAuditItem.__table__.create(bind=conn, checkfirst=True)

        inspector = inspect(conn)

        # Bring the audit items table up to date if the extra column or index is missing
        audit_cols = {col["name"] for col in inspector.get_columns("inventory_audit_items")}
        if "count_unit_code" not in audit_cols:
            conn.execute(text("ALTER TABLE inventory_audit_items ADD COLUMN IF NOT EXISTS count_unit_code VARCHAR(16)"))
        audit_indexes = {idx["name"] for idx in inspector.get_indexes("inventory_audit_items")}
        if "ix_inventory_audit_items_session_id" not in audit_indexes:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_inventory_audit_items_session_id ON inventory_audit_items (session_id)"))

        # Ensure orders table includes newer optional fields used by the admin dashboard
        order_cols = {col["name"] for col in inspector.get_columns("orders")}
        order_additions = [
            ("customer_name", "VARCHAR(160)"),
            ("customer_email", "VARCHAR(254)"),
            ("customer_phone", "VARCHAR(40)"),
            ("assigned_staff", "VARCHAR(160)"),
            ("created_at", "TIMESTAMPTZ DEFAULT NOW()"),
            ("updated_at", "TIMESTAMPTZ DEFAULT NOW()"),
        ]
        for col_name, ddl in order_additions:
            if col_name not in order_cols:
                conn.execute(text(f"ALTER TABLE orders ADD COLUMN IF NOT EXISTS {col_name} {ddl}"))

    _SCHEMA_BOOTSTRAPPED = True

# ---------- App config ---------- #
_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]
if not _cors_origins:
    _cors_origins = ["*"]
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": _cors_origins}})
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
    resp.headers.setdefault("Vary", "Origin")
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
        user = db.session.get(User, user_id)
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
        user = db.session.get(User, user_id)
        if not user or not getattr(user, 'admin', False):
            return {"error": "Forbidden: Admins only"}, 403
        request.user = user
        # Ensure admin-facing tables/columns exist before serving the request
        _ensure_admin_schema()
        return fn(*args, **kwargs)
    return wrapper

# --------- Session helpers --------- #

_GUEST_CART_SESSION_KEY = 'guest_cart_tokens'
_GUEST_ORDER_SESSION_KEY = 'guest_order_ids'


def _get_session_token_list(key):
    tokens = session.get(key) or []
    if not isinstance(tokens, list):
        tokens = []
    # keep only strings to avoid surprises when serializing
    return [str(t) for t in tokens if isinstance(t, (str, int))]


def _remember_session_token(key, token):
    if not token:
        return
    tokens = _get_session_token_list(key)
    token = str(token)
    if token not in tokens:
        tokens.append(token)
        session[key] = tokens
        session.modified = True


def _cart_access_granted(cart, provided_session_id=None):
    if not cart:
        return False
    user_id = session.get('user_id')
    if cart.user_id and user_id and cart.user_id == user_id:
        return True
    session_tokens = set(_get_session_token_list(_GUEST_CART_SESSION_KEY))
    if cart.session_id and cart.session_id in session_tokens:
        return True
    if provided_session_id and cart.session_id == provided_session_id:
        _remember_session_token(_GUEST_CART_SESSION_KEY, cart.session_id)
        return True
    return False


def _ensure_cart_access(cart, provided_session_id=None):
    if not _cart_access_granted(cart, provided_session_id):
        return {"error": "Cart not found"}, 404
    return None


def _order_access_granted(order):
    if not order:
        return False
    user_id = session.get('user_id')
    if order.user_id and user_id and order.user_id == user_id:
        return True
    guest_order_ids = set(_get_session_token_list(_GUEST_ORDER_SESSION_KEY))
    if str(order.id) in guest_order_ids:
        return True
    return False


def _ensure_order_access(order):
    if not _order_access_granted(order):
        return {"error": "Order not found"}, 404
    return None


def _require_int(value, field_name, *, minimum=None):
    if value in (None, '', 'null', 'None'):
        raise ValueError(f"{field_name} is required")
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be an integer")
    if minimum is not None and parsed < minimum:
        raise ValueError(f"{field_name} must be >= {minimum}")
    return parsed


def _require_non_negative_int(value, field_name):
    parsed = _require_int(value, field_name)
    if parsed < 0:
        raise ValueError(f"{field_name} must be >= 0")
    return parsed


CART_NOTE_MAX_LEN = min(NOTE_MAX_LEN, 300)
MAX_TIP_CENTS = 5000 * 100

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
    p = (request.path or "").lower()
    if p.startswith("/api/"):
        return jsonify({"error": "not found"}), 404
    return render_template("index.html"), 200

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
    active_groups = []
    for link in m.modifier_groups:
        group = getattr(link, "group", None)
        if not group:
            continue
        if getattr(group, "is_active", True):
            active_groups.append(group)
    return {
        "id": m.id,
        "name": m.name,
        "description": m.description,
        "price": str(m.price),
        "tax_class": m.tax_class,
        "image_url": m.image_url,
        "is_active": m.is_active,
        "modifier_groups": [s_modifier_group(g) for g in active_groups],
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
        session.clear()
        session.modified = True
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
    item = db.session.get(MenuItem, menu_item_id)
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
        _remember_session_token(_GUEST_CART_SESSION_KEY, cart.session_id)
        return {"id": cart.id, "session_id": cart.session_id, "currency": cart.currency}, 201

class CartById(Resource):
    def get(self, cart_id):
        cart = db.session.get(Cart, cart_id)
        session_token = request.args.get('session_id')
        err = _ensure_cart_access(cart, session_token)
        if err:
            return err
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
        data = request.get_json() or {}
        cart = db.session.get(Cart, cart_id)
        err = _ensure_cart_access(cart, data.get('session_id'))
        if err:
            return err
        menu_item_id = _require_int(data.get('menu_item_id'), 'menu_item_id', minimum=1)
        qty_raw = data.get('qty', 1)
        try:
            qty = int(qty_raw)
        except (TypeError, ValueError):
            raise ValueError("qty must be an integer")
        if qty < 1:
            raise ValueError("qty must be >= 1")
        raw_notes = data.get('notes')
        notes = (raw_notes or '')
        if not isinstance(raw_notes, str):
            notes = str(raw_notes or '')
        notes = notes.strip()
        if notes and len(notes) > CART_NOTE_MAX_LEN:
            return {"error": f"notes too long (max {CART_NOTE_MAX_LEN} chars)"}, 400
        notes = notes or None
        raw_modifier_option_ids = data.get('modifier_option_ids') or []
        if raw_modifier_option_ids and not isinstance(raw_modifier_option_ids, (list, tuple)):
            raise ValueError("modifier_option_ids must be a list of integers")
        modifier_option_ids = [
            _require_int(oid, 'modifier_option_id', minimum=1) for oid in raw_modifier_option_ids
        ]
        unit_price = _calc_item_unit_price(menu_item_id, modifier_option_ids)
        ci = CartItem(cart_id=cart.id, menu_item_id=menu_item_id, qty=qty, unit_price=unit_price, notes=notes)
        db.session.add(ci)
        db.session.flush()
        for opt_id in modifier_option_ids:
            opt = db.session.get(ModifierOption, opt_id)
            if opt:
                db.session.add(CartItemModifier(cart_item_id=ci.id, modifier_option_id=opt.id, price_delta=opt.price_delta))
        db.session.commit()
        return {"id": ci.id}, 201

class CartItemById(Resource):
    def patch(self, cart_id, item_id):
        data = request.get_json() or {}
        cart = db.session.get(Cart, cart_id)
        err = _ensure_cart_access(cart, data.get('session_id'))
        if err:
            return err
        ci = db.session.get(CartItem, item_id)
        if not ci or ci.cart_id != cart_id:
            return {"error": "Cart item not found"}, 404
        if 'qty' in data:
            try:
                q = int(data['qty'])
            except (TypeError, ValueError):
                raise ValueError("qty must be an integer")
            if q < 1:
                raise ValueError("qty must be >= 1")
            ci.qty = q
        if 'notes' in data:
            raw_notes = data.get('notes')
            notes = str(raw_notes or '').strip()
            if len(notes) > CART_NOTE_MAX_LEN:
                return {"error": f"notes too long (max {CART_NOTE_MAX_LEN} chars)"}, 400
            ci.notes = notes or None
        db.session.commit()
        return {"id": ci.id, "qty": ci.qty, "notes": ci.notes}, 200

    def delete(self, cart_id, item_id):
        payload = request.get_json(silent=True) or {}
        session_token = payload.get('session_id') or request.args.get('session_id')
        cart = db.session.get(Cart, cart_id)
        err = _ensure_cart_access(cart, session_token)
        if err:
            return err
        ci = db.session.get(CartItem, item_id)
        if not ci or ci.cart_id != cart_id:
            return {"error": "Cart item not found"}, 404
        db.session.delete(ci)
        db.session.commit()
        return '', 204


# ------------- Checkout / Orders ------------- #
class CheckoutPrepare(Resource):
    def post(self):
        data = request.get_json() or {}
        cart_id = _require_int(data.get('cart_id'), 'cart_id', minimum=1)
        tip_cents = _require_non_negative_int(data.get('tip_cents', 0), 'tip_cents')
        fulfillment = (data.get('fulfillment') or 'pickup').strip().lower()

        cart = db.session.get(Cart, cart_id)
        if not cart or not cart.items:
            return {"error": "Cart is empty or not found"}, 400
        err = _ensure_cart_access(cart, data.get('session_id'))
        if err:
            return err

        # Authoritative totals from cart snapshot (unit_price already includes modifiers in this app)
        subtotal = Decimal('0.00')
        for ci in cart.items:
            subtotal += (Decimal(ci.unit_price) * int(ci.qty))
        tax_total = (subtotal * TAX_RATE).quantize(Decimal('0.01'))
        delivery_fee = Decimal('0.00')
        discount_total = Decimal('0.00')
        tip = (Decimal(tip_cents) / Decimal(100)).quantize(Decimal('0.01'))
        grand_total = (subtotal + tax_total + delivery_fee + tip - discount_total).quantize(Decimal('0.01'))
        amount_cents = money_to_cents(grand_total)

        # Create pending order and snapshot items
        order = Order(
            user_id=session.get('user_id'),
            status='pending',
            channel='web',
            fulfillment=fulfillment,
            subtotal=subtotal,
            tax_total=tax_total,
            discount_total=discount_total,
            delivery_fee=delivery_fee,
            tip=tip,
            grand_total=grand_total,
            currency=STRIPE_CURRENCY.upper(),
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

        # Create Stripe PaymentIntent
        metadata = {
            'order_id': str(order.id),
            'cart_id': str(cart.id),
            'user_id': str(cart.user_id or ''),
        }
        idempotency_key = f"order-{order.id}-v1"
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=STRIPE_CURRENCY,
                automatic_payment_methods={"enabled": True},
                metadata=metadata,
                idempotency_key=idempotency_key,
            )
        except stripe.error.StripeError as exc:
            db.session.rollback()
            return {"error": exc.user_message or "Unable to create payment intent"}, 400

        order.stripe_payment_intent_id = intent.id

        payment = Payment(
            order_id=order.id,
            provider='stripe',
            reference=intent.id,
            amount=grand_total,
            currency=STRIPE_CURRENCY.upper(),
            status='pending',
            raw_response=intent
        )
        db.session.add(payment)
        db.session.commit()
        _remember_session_token(_GUEST_ORDER_SESSION_KEY, str(order.id))

        return {
            'order_id': order.id,
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id,
            'amount_cents': amount_cents,
            'currency': STRIPE_CURRENCY,
        }, 201

class CheckoutUpdateTip(Resource):
    def post(self):
        data = request.get_json() or {}
        order_id = _require_int(data.get('order_id'), 'order_id', minimum=1)
        tip_cents = _require_non_negative_int(data.get('tip_cents', 0), 'tip_cents')
        if tip_cents > MAX_TIP_CENTS:
            return {"error": "tip too large"}, 400
        order = db.session.get(Order, order_id)
        err = _ensure_order_access(order)
        if err:
            return err
        if order.status != 'pending':
            return {"error": "Invalid order"}, 400

        tip = (Decimal(tip_cents) / Decimal(100)).quantize(Decimal('0.01'))
        new_grand = (Decimal(order.subtotal) + Decimal(order.tax_total) + Decimal(order.delivery_fee) + tip - Decimal(order.discount_total)).quantize(Decimal('0.01'))
        new_amount_cents = money_to_cents(new_grand)

        if not order.stripe_payment_intent_id:
            return {"error": "Payment intent not found for order"}, 400

        try:
            current_intent = stripe.PaymentIntent.retrieve(order.stripe_payment_intent_id)
        except stripe.error.StripeError as exc:
            return {"error": exc.user_message or "Unable to retrieve payment intent"}, 400
        if current_intent.status in ('succeeded', 'canceled'):
            return {"error": "payment already finalized"}, 400
        try:
            updated_intent = stripe.PaymentIntent.modify(order.stripe_payment_intent_id, amount=new_amount_cents)
        except stripe.error.StripeError as exc:
            return {"error": exc.user_message or "Unable to update payment intent"}, 400

        # Update order + payment row
        order.tip = tip
        order.grand_total = new_grand
        payment = Payment.query.filter_by(order_id=order.id, provider='stripe', reference=order.stripe_payment_intent_id).first()
        if payment:
            payment.amount = new_grand
            payment.raw_response = updated_intent
        db.session.commit()

        return {"ok": True, "amount_cents": new_amount_cents}, 200

class StripeWebhook(Resource):
    def post(self):
        if not STRIPE_WEBHOOK_SECRET:
            return {"error": "Webhook secret not configured"}, 400
        payload = request.data
        sig_header = request.headers.get('Stripe-Signature', '')
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except stripe.error.SignatureVerificationError:
            return {"error": "Invalid signature"}, 400

        etype = event.get('type')
        obj = event.get('data', {}).get('object', {})

        if etype == 'payment_intent.succeeded':
            pi_id = obj.get('id')
            payment = Payment.query.filter_by(provider='stripe', reference=pi_id).first()
            if payment:
                order = db.session.get(Order, payment.order_id)
                if order and order.status != 'paid':
                    order.status = 'paid'
                    order.placed_at = datetime.now(timezone.utc)
                    payment.status = 'captured'
                    payment.raw_response = obj
                    cart_id = obj.get('metadata', {}).get('cart_id')
                    try:
                        cart_ref = int(cart_id)
                    except (TypeError, ValueError):
                        cart_ref = None
                    if cart_ref:
                        cart_obj = db.session.get(Cart, cart_ref)
                        if cart_obj and not cart_obj.closed_at:
                            cart_obj.closed_at = datetime.now(timezone.utc)
                    db.session.commit()
            return {"received": True}, 200

        if etype in ('payment_intent.payment_failed', 'payment_intent.canceled'):
            pi_id = obj.get('id')
            payment = Payment.query.filter_by(provider='stripe', reference=pi_id).first()
            if payment:
                order = db.session.get(Order, payment.order_id)
                if order and order.status == 'pending':
                    order.status = 'failed'
                payment.status = 'failed'
                payment.raw_response = obj
                db.session.commit()
            return {"received": True}, 200

        return {"received": True}, 200

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

# ---------- Admin helpers & admin orders ---------- #
ORDER_ADMIN_STATUSES = {"pending", "in_progress", "ready_for_pickup", "picked_up", "delivered", "paid", "failed", "cancelled"}
ORDER_ADMIN_DEFAULT_STATUS = "in_progress"
ORDER_ADMIN_MAX_LIMIT = 200

def _payment_status_for_order(order):
    statuses = [(p.status or "").lower() for p in getattr(order, "payments", []) if getattr(p, "status", None)]
    if any(s in {"captured", "paid", "completed"} for s in statuses):
        return "paid"
    if any(s in {"pending", "authorized"} for s in statuses):
        return "pending"
    if any(s in {"failed", "canceled", "cancelled"} for s in statuses):
        return "failed"
    if statuses:
        return statuses[-1]
    return "unpaid"

def _order_items_summary(order, limit=3):
    items = getattr(order, "items", []) or []
    lines = [f"{itm.qty}× {itm.menu_item_name}" for itm in items[:limit]]
    if len(items) > limit:
        lines.append("…")
    return ", ".join(lines) if lines else "—"

def _serialize_order_summary(order):
    delivery = getattr(order, "delivery", None)
    customer_name = order.customer_name or (delivery.recipient_name if delivery else None) or "Guest"
    customer_phone = order.customer_phone or (delivery.phone if delivery else None)
    return {
        "id": order.id,
        "status": order.status,
        "assigned_staff": order.assigned_staff,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "payment_status": _payment_status_for_order(order),
        "fulfillment": order.fulfillment,
        "channel": order.channel,
        "currency": order.currency,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "placed_at": order.placed_at.isoformat() if order.placed_at else None,
        "grand_total": str(order.grand_total),
        "items_summary": _order_items_summary(order),
        "items_count": len(getattr(order, "items", []) or []),
    }

def _serialize_order_detail(order):
    payload = _serialize_order_summary(order)
    delivery = getattr(order, "delivery", None)
    payload.update({
        "customer_email": order.customer_email,
        "subtotal": str(order.subtotal),
        "tax_total": str(order.tax_total),
        "delivery_fee": str(order.delivery_fee),
        "discount_total": str(order.discount_total),
        "tip": str(order.tip),
        "items": [
            {
                "id": itm.id,
                "name": itm.menu_item_name,
                "qty": itm.qty,
                "unit_price": str(itm.unit_price),
                "line_total": str(itm.line_total),
                "notes": itm.notes,
                "modifiers": [
                    {"name": mod.name, "price_delta": str(mod.price_delta)}
                    for mod in getattr(itm, "modifiers", [])
                ],
            }
            for itm in getattr(order, "items", []) or []
        ],
        "payments": [
            {
                "provider": p.provider,
                "reference": p.reference,
                "amount": str(p.amount),
                "currency": p.currency,
                "status": p.status,
                "processed_at": p.processed_at.isoformat() if p.processed_at else None,
            }
            for p in getattr(order, "payments", []) or []
        ],
        "delivery": {
            "recipient_name": delivery.recipient_name,
            "phone": delivery.phone,
            "eta": delivery.eta.isoformat() if delivery and delivery.eta else None,
            "address": delivery.address_snapshot,
        } if delivery else None,
    })
    return payload

def _coerce_money(value, field_name, default=Decimal('0.00'), minimum=None):
    if value in (None, '', 'null', 'None'):
        if default is not None:
            return default
        raise ValueError(f"{field_name} is required")
    try:
        parsed = Decimal(str(value))
    except Exception:
        raise ValueError(f"{field_name} must be a number")
    if minimum is not None and parsed < minimum:
        raise ValueError(f"{field_name} must be >= {minimum}")
    return parsed

class AdminOrders(Resource):
    @require_admin
    def get(self):
        params = request.args
        status_filter = (params.get('status') or '').strip().lower()
        search = (params.get('search') or '').strip()
        limit = 100
        if params.get('limit'):
            try:
                limit = min(ORDER_ADMIN_MAX_LIMIT, max(1, int(params.get('limit'))))
            except ValueError:
                limit = 100
        query = (
            Order.query
            .options(
                joinedload(Order.items).joinedload(OrderItem.modifiers),
                joinedload(Order.payments),
                joinedload(Order.delivery),
            )
            .order_by(Order.placed_at.desc())
        )
        if status_filter:
            query = query.filter(func.lower(Order.status) == status_filter)
        if search:
            like = f"%{search.lower()}%"
            conditions = [
                func.lower(func.coalesce(Order.customer_name, "")).like(like),
                func.lower(func.coalesce(Order.customer_phone, "")).like(like),
                Order.delivery.has(func.lower(func.coalesce(OrderDelivery.recipient_name, "")).like(like)),
            ]
            if search.isdigit():
                try:
                    order_id = int(search)
                    conditions.append(Order.id == order_id)
                except ValueError:
                    pass
            query = query.filter(or_(*conditions))
        orders = query.limit(limit).all()
        return {
            "orders": [_serialize_order_summary(o) for o in orders],
            "meta": {
                "count": len(orders),
                "limit": limit,
                "status": status_filter or "all",
            },
        }, 200

    @require_admin
    def post(self):
        payload = request.get_json() or {}
        items_payload = payload.get('items') or []
        if not isinstance(items_payload, list) or not items_payload:
            return {"error": "items are required"}, 400
        try:
            status = (payload.get('status') or ORDER_ADMIN_DEFAULT_STATUS).strip().lower() or ORDER_ADMIN_DEFAULT_STATUS
            fulfillment = (payload.get('fulfillment') or 'pickup').strip().lower() or 'pickup'
            channel = (payload.get('channel') or 'admin').strip().lower() or 'admin'
            customer_name = (payload.get('customer_name') or '').strip() or None
            customer_email = (payload.get('customer_email') or '').strip() or None
            customer_phone = (payload.get('customer_phone') or '').strip() or None
            assigned_staff = (payload.get('assigned_staff') or '').strip() or None
            currency = (payload.get('currency') or STRIPE_CURRENCY.upper()).upper()
            delivery_fee = _coerce_money(payload.get('delivery_fee', '0'), 'delivery_fee', default=Decimal('0.00'), minimum=Decimal('0.00'))
            tip = _coerce_money(payload.get('tip', '0'), 'tip', default=Decimal('0.00'), minimum=Decimal('0.00'))
            discount_total = _coerce_money(payload.get('discount_total', '0'), 'discount_total', default=Decimal('0.00'), minimum=Decimal('0.00'))
        except ValueError as err:
            return {"error": str(err)}, 400
        subtotal = Decimal('0.00')
        normalized_items = []
        for item in items_payload:
            name = (item.get('name') or item.get('menu_item_name') or '').strip()
            if not name:
                name = "Item"
            try:
                qty = _require_int(item.get('qty'), 'qty', minimum=1)
            except ValueError as err:
                return {"error": str(err)}, 400
            try:
                unit_price = _coerce_money(item.get('unit_price'), 'unit_price', minimum=Decimal('0.00'))
            except ValueError as err:
                return {"error": str(err)}, 400
            line_total = (unit_price * qty).quantize(Decimal('0.01'))
            subtotal += line_total
            normalized_items.append({
                "name": name,
                "qty": qty,
                "unit_price": unit_price,
                "line_total": line_total,
                "notes": (item.get('notes') or '').strip() or None,
                "modifiers": item.get('modifiers') or [],
            })
        if not normalized_items:
            return {"error": "items are required"}, 400
        tax_total = (subtotal * TAX_RATE).quantize(Decimal('0.01'))
        grand_total = (subtotal + tax_total + delivery_fee + tip - discount_total).quantize(Decimal('0.01'))
        if grand_total < 0:
            return {"error": "grand total cannot be negative"}, 400
        order = Order(
            user_id=request.user.id,
            status=status,
            fulfillment=fulfillment,
            channel=channel,
            subtotal=subtotal,
            tax_total=tax_total,
            discount_total=discount_total,
            delivery_fee=delivery_fee,
            tip=tip,
            grand_total=grand_total,
            currency=currency,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            assigned_staff=assigned_staff,
            placed_at=datetime.now(timezone.utc),
        )
        db.session.add(order)
        db.session.flush()
        try:
            for item in normalized_items:
                oi = OrderItem(
                    order_id=order.id,
                    menu_item_name=item["name"],
                    qty=item["qty"],
                    unit_price=item["unit_price"],
                    line_total=item["line_total"],
                    notes=item["notes"],
                )
                db.session.add(oi)
                db.session.flush()
                for mod in item["modifiers"] or []:
                    mod_name = (mod.get('name') or '').strip() or 'Modifier'
                    try:
                        price_delta = Decimal(str(mod.get('price_delta', '0')))
                    except Exception:
                        price_delta = Decimal('0.00')
                    db.session.add(OrderItemModifier(order_item_id=oi.id, name=mod_name, price_delta=price_delta))
            payment_status = (payload.get('payment_status') or 'pending').strip().lower() or 'pending'
            payment_provider = (payload.get('payment_provider') or 'manual').strip() or 'manual'
            payment_reference = payload.get('payment_reference') or f"admin-{order.id}-{uuid.uuid4().hex[:6]}"
            payment = Payment(
                order_id=order.id,
                provider=payment_provider,
                reference=payment_reference,
                amount=order.grand_total,
                currency=currency,
                status=payment_status,
            )
            db.session.add(payment)
            db.session.commit()
            return _serialize_order_detail(order), 201
        except IntegrityError:
            db.session.rollback()
            return {"error": "database constraint violation"}, 409
        except SQLAlchemyError:
            db.session.rollback()
            return {"error": "database error"}, 400


class AdminOrderDetail(Resource):
    @require_admin
    def get(self, order_id):
        order = (
            Order.query
            .options(
                joinedload(Order.items).joinedload(OrderItem.modifiers),
                joinedload(Order.payments),
                joinedload(Order.delivery),
            )
            .filter_by(id=order_id)
            .first()
        )
        if not order:
            return {"error": "Order not found"}, 404
        return _serialize_order_detail(order), 200

    @require_admin
    def patch(self, order_id):
        order = db.session.get(Order, order_id)
        if not order:
            return {"error": "Order not found"}, 404
        data = request.get_json() or {}
        if 'status' in data:
            status = (data.get('status') or '').strip().lower()
            if status:
                order.status = status
        if 'fulfillment' in data:
            fulfillment = (data.get('fulfillment') or '').strip().lower()
            if fulfillment:
                order.fulfillment = fulfillment
        if 'assigned_staff' in data:
            order.assigned_staff = (data.get('assigned_staff') or '').strip() or None
        if 'customer_name' in data:
            order.customer_name = (data.get('customer_name') or '').strip() or None
        if 'customer_email' in data:
            order.customer_email = (data.get('customer_email') or '').strip() or None
        if 'customer_phone' in data:
            order.customer_phone = (data.get('customer_phone') or '').strip() or None
        money_changed = False
        for field in ('delivery_fee', 'tip', 'discount_total'):
            if field in data:
                try:
                    money = _coerce_money(data[field], field, default=getattr(order, field), minimum=Decimal('0.00'))
                except ValueError as err:
                    return {"error": str(err)}, 400
                setattr(order, field, money.quantize(Decimal('0.01')))
                money_changed = True
        if money_changed:
            order.grand_total = (order.subtotal + order.tax_total + order.delivery_fee + order.tip - order.discount_total).quantize(Decimal('0.01'))
            if order.payments:
                order.payments[0].amount = order.grand_total
        payment_status = (data.get('payment_status') or '').strip()
        if payment_status and order.payments:
            order.payments[0].status = payment_status
        db.session.commit()
        return _serialize_order_detail(order), 200

    @require_admin
    def delete(self, order_id):
        order = db.session.get(Order, order_id)
        if not order:
            return {"error": "Order not found"}, 404
        db.session.delete(order)
        db.session.commit()
        return '', 204
# ------------- Admin: Inventory, Food Cost & Settings ------------- #
INVENTORY_EXPIRATION_ALERT_DAYS = 7
INVENTORY_ALERT_DISPLAY = 5
PERIOD_PRESETS = {
    "day": 1,
    "week": 7,
    "month": 30,
}
STATUS_PAYMENT_OK = {"captured", "paid", "authorized", "completed"}


def _parse_decimal_value(value, field_name, minimum=None):
    if value in (None, "", "null", "None"):
        raise ValueError(f"{field_name} is required")
    try:
        parsed = Decimal(str(value))
    except Exception:
        raise ValueError(f"{field_name} must be a number")
    if minimum is not None and parsed < minimum:
        raise ValueError(f"{field_name} must be >= {minimum}")
    return parsed


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date()
    except Exception:
        raise ValueError("expiration_date must be YYYY-MM-DD")


def _get_unit_by_code(code):
    if not code:
        return None
    return Unit.query.filter(func.lower(Unit.code) == code.strip().lower()).first()


def _build_conversion_graph():
    graph = {}
    for conv in UnitConversion.query.all():
        factor = Decimal(str(conv.factor))
        if factor == 0:
            continue
        graph.setdefault(conv.from_unit_id, []).append((conv.to_unit_id, factor))
        graph.setdefault(conv.to_unit_id, []).append((conv.from_unit_id, Decimal("1") / factor))
    return graph


def _find_conversion_factor(from_unit, to_unit):
    if not from_unit or not to_unit:
        raise ValueError("unit conversion requires valid units")
    if from_unit.id == to_unit.id:
        return Decimal("1")
    graph = _build_conversion_graph()
    queue = deque([(from_unit.id, Decimal("1"))])
    seen = {from_unit.id}
    while queue:
        unit_id, acc = queue.popleft()
        if unit_id == to_unit.id:
            return acc
        for neighbor_id, factor in graph.get(unit_id, []):
            if neighbor_id in seen:
                continue
            seen.add(neighbor_id)
            queue.append((neighbor_id, acc * factor))
    raise ValueError(f"Unable to convert from {from_unit.code} to {to_unit.code}")


def _convert_to_base_qty(value, unit_code, base_unit):
    if base_unit is None:
        raise ValueError("inventory item missing base unit")
    qty = _parse_decimal_value(value, "qty", minimum=Decimal("0"))
    from_unit = _get_unit_by_code(unit_code or base_unit.code)
    if not from_unit:
        raise ValueError("unit not found")
    factor = _find_conversion_factor(from_unit, base_unit)
    return (qty * factor).quantize(Decimal("0.0001"))


def _ensure_supplier(name=None, supplier_id=None):
    if supplier_id:
        supplier = db.session.get(Supplier, supplier_id)
        if supplier:
            return supplier
    supplier_name = (name or "Default Supplier").strip()
    if not supplier_name:
        supplier_name = "Default Supplier"
    existing = Supplier.query.filter(func.lower(Supplier.name) == supplier_name.lower()).first()
    if existing:
        return existing
    supplier = Supplier(name=supplier_name)
    db.session.add(supplier)
    db.session.flush()
    return supplier


def _batch_response(batch):
    supplier = batch.supplier
    return {
        "id": batch.id,
        "qty": batch.qty,
        "unit_cost": str(batch.unit_cost),
        "expiration_date": batch.expiration_date.isoformat() if batch.expiration_date else None,
        "received_at": batch.received_at.isoformat() if batch.received_at else None,
        "supplier": {
            "id": supplier.id,
            "name": supplier.name,
            "phone": supplier.phone,
            "email": supplier.email,
        } if supplier else None,
    }


def _inventory_item_snapshot(item):
    batches = sorted(getattr(item, "batches", []) or [], key=lambda b: (b.expiration_date or date.max))
    total_qty = sum(Decimal(str(b.qty or 0)) for b in batches)
    soonest_exp = None
    for batch in batches:
        if batch.expiration_date:
            soonest_exp = batch.expiration_date
            break
    par_level = Decimal(str(item.par_level)) if item.par_level is not None else Decimal("0")
    low_stock = par_level > 0 and total_qty <= par_level
    expiring_soon = False
    if soonest_exp:
        days = (soonest_exp - date.today()).days
        expiring_soon = 0 <= days <= INVENTORY_EXPIRATION_ALERT_DAYS
    latest_batch = None
    for batch in sorted(getattr(item, "batches", []) or [], key=lambda b: b.received_at or datetime.min, reverse=True):
        if batch.supplier:
            latest_batch = batch
            break
    supplier_info = None
    if latest_batch and latest_batch.supplier:
        supplier_info = {
            "id": latest_batch.supplier.id,
            "name": latest_batch.supplier.name,
            "phone": latest_batch.supplier.phone,
            "email": latest_batch.supplier.email,
        }
    earliest_received = min((b.received_at for b in batches if b.received_at), default=None)
    return {
        "id": item.id,
        "name": item.name,
        "sku": item.sku,
        "base_unit": item.base_unit.code if item.base_unit else None,
        "par_level": item.par_level,
        "quantity": float(total_qty),
        "low_stock": bool(low_stock),
        "expiring_soon": expiring_soon,
        "expiration_date": soonest_exp.isoformat() if soonest_exp else None,
        "supplier": supplier_info,
        "date_added": earliest_received.isoformat() if earliest_received else None,
        "is_active": item.is_active,
        "batch_count": len(batches),
    }


def _inventory_alerts(snapshots):
    low_stock = [s for s in snapshots if s["low_stock"]][:INVENTORY_ALERT_DISPLAY]
    expiring = []
    today = date.today()
    for s in snapshots:
        if s["expiring_soon"] and s.get("expiration_date"):
            try:
                exp_date = datetime.fromisoformat(s["expiration_date"]).date()
            except Exception:
                continue
            expiring.append({
                **s,
                "days_to_expiration": max(0, (exp_date - today).days),
            })
            if len(expiring) >= INVENTORY_ALERT_DISPLAY:
                break
    return {"low_stock": low_stock, "expiring": expiring}


def _inventory_meta():
    units = Unit.query.order_by(Unit.code).all()
    suppliers = Supplier.query.order_by(Supplier.name).all()
    return {
        "units": [{"code": u.code, "name": u.name} for u in units],
        "suppliers": [{"id": s.id, "name": s.name, "phone": s.phone, "email": s.email} for s in suppliers],
    }


def _current_inventory_qty(item):
    return sum(Decimal(str(b.qty or 0)) for b in getattr(item, "batches", []) or [])


def _apply_inventory_adjustment(item, target_qty, expiration_date=None, session_id=None):
    if not getattr(item, "base_unit", None):
        raise ValueError("inventory item missing base unit")
    target = Decimal(str(target_qty))
    if target < 0:
        raise ValueError("new_qty must be zero or greater")
    current = _current_inventory_qty(item)
    delta = target - current
    if delta == 0:
        return float(current)
    if delta > 0:
        batch = InventoryBatch(
            inventory_item_id=item.id,
            qty=float(delta.quantize(Decimal("0.0001"))),
            unit_cost=Decimal("0.0000"),
            expiration_date=expiration_date,
        )
        db.session.add(batch)
    else:
        remaining = abs(delta)
        batches = sorted(getattr(item, "batches", []) or [], key=lambda b: b.received_at or datetime.min, reverse=True)
        for batch in batches:
            if remaining <= 0:
                break
            available = Decimal(str(batch.qty or 0))
            if available <= 0:
                continue
            take = min(available, remaining)
            batch.qty = float((available - take).quantize(Decimal("0.0001")))
            remaining -= take
        if remaining > 0:
            raise ValueError("insufficient inventory to reduce by requested amount")
    movement = StockMovement(
        inventory_item_id=item.id,
        qty_change=float(delta),
        reason="audit_adjustment",
        reference_type="inventory_audit_session",
        reference_id=session_id,
    )
    db.session.add(movement)
    return float(target)


def _create_batch_from_payload(item, payload):
    if not payload:
        raise ValueError("batch data is required")
    if not getattr(item, "base_unit", None):
        raise ValueError("inventory item missing base unit")
    qty_value = payload.get("qty")
    if qty_value in (None, "", "null", "None"):
        raise ValueError("qty is required for batch")
    unit_code = (payload.get("unit") or item.base_unit.code)
    converted_qty = _convert_to_base_qty(qty_value, unit_code, item.base_unit)
    unit_cost = _coerce_money(payload.get("unit_cost"), "unit_cost", minimum=Decimal("0.00")).quantize(Decimal("0.0001"))
    expiration_date = _parse_date(payload.get("expiration_date"))
    supplier = _ensure_supplier(payload.get("supplier"), payload.get("supplier_id"))
    batch = InventoryBatch(
        inventory_item_id=item.id,
        supplier_id=supplier.id,
        qty=float(converted_qty),
        unit_cost=unit_cost,
        expiration_date=expiration_date,
    )
    db.session.add(batch)
    db.session.flush()
    return batch


class AdminInventory(Resource):
    @require_admin
    def get(self):
        search = (request.args.get("search") or "").strip().lower()
        filter_flag = (request.args.get("filter") or "").strip().lower()
        unit_filter = (request.args.get("unit") or "").strip().lower()
        items = (
            InventoryItem.query
            .options(joinedload(InventoryItem.batches).joinedload(InventoryBatch.supplier))
            .order_by(InventoryItem.name)
            .all()
        )
        snapshots = []
        for item in items:
            snapshot = _inventory_item_snapshot(item)
            if search:
                supplier_name = (snapshot.get("supplier", {}).get("name") or "").lower()
                if search not in snapshot["name"].lower() and search not in supplier_name:
                    continue
            if unit_filter and (snapshot.get("base_unit") or "").lower() != unit_filter:
                continue
            if filter_flag == "low_stock" and not snapshot["low_stock"]:
                continue
            if filter_flag == "expiring" and not snapshot["expiring_soon"]:
                continue
            if filter_flag == "active" and not snapshot["is_active"]:
                continue
            if filter_flag == "inactive" and snapshot["is_active"]:
                continue
            snapshots.append(snapshot)
        alerts = _inventory_alerts(snapshots)
        meta = _inventory_meta()
        meta["filters"] = {
            "selected": filter_flag,
            "search": search,
            "unit": unit_filter,
        }
        meta["alert_threshold_days"] = INVENTORY_EXPIRATION_ALERT_DAYS
        return {
            "items": snapshots,
            "alerts": alerts,
            "meta": meta,
            "count": len(snapshots),
        }, 200

    @require_admin
    def post(self):
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        if not name:
            return {"error": "name is required"}, 400
        sku = (data.get("sku") or "").strip() or None
        base_unit_code = (data.get("base_unit") or "lb").strip()
        base_unit = _get_unit_by_code(base_unit_code)
        if not base_unit:
            return {"error": "base unit not found"}, 400
        try:
            par_level = float(Decimal(str(data.get("par_level") or 0)))
        except Exception:
            return {"error": "par_level must be numeric"}, 400
        existing = InventoryItem.query.filter(func.lower(InventoryItem.name) == name.lower()).first()
        if existing:
            return {"id": existing.id, "name": existing.name, "existing": True}, 200
        item = InventoryItem(
            name=name,
            sku=sku,
            base_unit=base_unit,
            par_level=par_level,
            is_active=bool(data.get("is_active", True)),
        )
        db.session.add(item)
        db.session.flush()
        try:
            for batch_payload in data.get("batches") or []:
                _create_batch_from_payload(item, batch_payload)
            db.session.commit()
            return {
                "id": item.id,
                "name": item.name,
                "base_unit": base_unit.code,
                "par_level": item.par_level,
            }, 201
        except ValueError as err:
            db.session.rollback()
            return {"error": str(err)}, 400
        except IntegrityError:
            db.session.rollback()
            return {"error": "constraint violation"}, 409
        except SQLAlchemyError:
            db.session.rollback()
            return {"error": "database error"}, 400


class AdminInventoryDetail(Resource):
    @require_admin
    def get(self, item_id):
        item = (
            InventoryItem.query
            .options(joinedload(InventoryItem.batches).joinedload(InventoryBatch.supplier))
            .get(item_id)
        )
        if not item:
            return {"error": "Inventory item not found"}, 404
        snapshot = _inventory_item_snapshot(item)
        batches = sorted(getattr(item, "batches", []) or [], key=lambda b: b.received_at or datetime.min, reverse=True)
        snapshot["batches"] = [_batch_response(b) for b in batches]
        return snapshot, 200

    @require_admin
    def patch(self, item_id):
        item = db.session.get(InventoryItem, item_id)
        if not item:
            return {"error": "Inventory item not found"}, 404
        data = request.get_json() or {}
        if "name" in data:
            item.name = (data.get("name") or item.name or "").strip()
        if "sku" in data:
            item.sku = (data.get("sku") or "").strip() or None
        if "par_level" in data:
            try:
                item.par_level = float(Decimal(str(data.get("par_level") or 0)))
            except Exception:
                return {"error": "par_level must be numeric"}, 400
        if "is_active" in data:
            item.is_active = bool(data.get("is_active"))
        if "base_unit" in data:
            target_code = (data.get("base_unit") or "").strip()
            if target_code:
                new_unit = _get_unit_by_code(target_code)
                if not new_unit:
                    return {"error": "base unit not found"}, 400
                if not item.base_unit:
                    item.base_unit = new_unit
                elif item.base_unit.id != new_unit.id:
                    try:
                        factor = _find_conversion_factor(item.base_unit, new_unit)
                        for batch in getattr(item, "batches", []) or []:
                            batch.qty = float((Decimal(str(batch.qty)) * factor).quantize(Decimal("0.0001")))
                        if item.par_level:
                            item.par_level = float((Decimal(str(item.par_level)) * factor).quantize(Decimal("0.0001")))
                    except ValueError as err:
                        return {"error": str(err)}, 400
                    item.base_unit = new_unit
        db.session.commit()
        return self.get(item_id)

    @require_admin
    def delete(self, item_id):
        item = db.session.get(InventoryItem, item_id)
        if not item:
            return {"error": "Inventory item not found"}, 404
        db.session.delete(item)
        db.session.commit()
        return "", 204


class AdminInventoryBatch(Resource):
    @require_admin
    def post(self, item_id):
        item = db.session.get(InventoryItem, item_id)
        if not item:
            return {"error": "Inventory item not found"}, 404
        try:
            batch = _create_batch_from_payload(item, request.get_json() or {})
            db.session.commit()
            return _batch_response(batch), 201
        except ValueError as err:
            db.session.rollback()
            return {"error": str(err)}, 400
        except IntegrityError:
            db.session.rollback()
            return {"error": "constraint violation"}, 409
        except SQLAlchemyError:
            db.session.rollback()
            return {"error": "database error"}, 400


class AdminInventoryBatchDetail(Resource):
    @require_admin
    def patch(self, batch_id):
        batch = db.session.get(InventoryBatch, batch_id)
        if not batch:
            return {"error": "Batch not found"}, 404
        data = request.get_json() or {}
        if "qty" in data:
            unit_code = (data.get("unit") or batch.inventory_item.base_unit.code)
            batch.qty = float(_convert_to_base_qty(data.get("qty"), unit_code, batch.inventory_item.base_unit))
        if "unit_cost" in data:
            try:
                batch.unit_cost = _coerce_money(data.get("unit_cost"), "unit_cost", minimum=Decimal("0.00")).quantize(Decimal("0.0001"))
            except ValueError as err:
                return {"error": str(err)}, 400
        if "expiration_date" in data:
            batch.expiration_date = _parse_date(data.get("expiration_date"))
        if "supplier" in data or "supplier_id" in data:
            batch.supplier = _ensure_supplier(data.get("supplier"), data.get("supplier_id"))
        db.session.commit()
        return _batch_response(batch), 200

    @require_admin
    def delete(self, batch_id):
        batch = db.session.get(InventoryBatch, batch_id)
        if not batch:
            return {"error": "Batch not found"}, 404
        db.session.delete(batch)
        db.session.commit()
        return "", 204


def _audit_item_response(record):
    count_unit = record.count_unit_code or getattr(getattr(record.inventory_item, "base_unit", None), "code", None)
    return {
        "id": record.id,
        "inventory_item": {
            "id": record.inventory_item.id if record.inventory_item else record.inventory_item_id,
            "name": getattr(record.inventory_item, "name", None),
            "sku": getattr(record.inventory_item, "sku", None),
            "base_unit": getattr(getattr(record.inventory_item, "base_unit", None), "code", None),
        },
        "previous_qty": record.previous_qty,
        "new_qty": record.new_qty,
        "count_unit_code": count_unit,
        "note": record.note,
        "expiration_date": record.expiration_date.isoformat() if record.expiration_date else None,
        "recorded_at": record.recorded_at.isoformat() if record.recorded_at else None,
    }


def _audit_session_response(session_obj, include_items=False):
    payload = {
        "id": session_obj.id,
        "note": session_obj.note,
        "started_at": session_obj.started_at.isoformat() if session_obj.started_at else None,
        "completed_at": session_obj.completed_at.isoformat() if session_obj.completed_at else None,
        "user": {
            "id": session_obj.user.id if session_obj.user else None,
            "email": getattr(session_obj.user, "email", None),
            "name": " ".join(filter(None, [getattr(session_obj.user, "first_name", None), getattr(session_obj.user, "last_name", None)])) or getattr(session_obj.user, "email", None),
        },
    }
    if include_items:
        items = sorted(session_obj.items or [], key=lambda r: r.recorded_at or datetime.min, reverse=True)
        payload["items"] = [_audit_item_response(item) for item in items]
        payload["count"] = len(items)
    return payload


class AdminInventoryAudits(Resource):
    @require_admin
    def get(self):
        sessions = (
            InventoryAuditSession.query
            .options(joinedload(InventoryAuditSession.items).joinedload(InventoryAuditItem.inventory_item))
            .order_by(InventoryAuditSession.started_at.desc())
            .limit(25)
            .all()
        )
        return {"sessions": [_audit_session_response(s, include_items=True) for s in sessions]}, 200

    @require_admin
    def post(self):
        data = request.get_json() or {}
        note = (data.get("note") or "").strip() or None
        if note and len(note) > NOTE_MAX_LEN:
            return {"error": f"note too long (max {NOTE_MAX_LEN} chars)"}, 400
        session_obj = InventoryAuditSession(user=request.user, note=note)
        db.session.add(session_obj)
        db.session.commit()
        return _audit_session_response(session_obj, include_items=True), 201


class AdminInventoryAuditDetail(Resource):
    @require_admin
    def get(self, session_id):
        session_obj = (
            InventoryAuditSession.query
            .options(joinedload(InventoryAuditSession.items).joinedload(InventoryAuditItem.inventory_item))
            .get(session_id)
        )
        if not session_obj:
            return {"error": "Audit session not found"}, 404
        return _audit_session_response(session_obj, include_items=True), 200

    @require_admin
    def patch(self, session_id):
        session_obj = db.session.get(InventoryAuditSession, session_id)
        if not session_obj:
            return {"error": "Audit session not found"}, 404
        data = request.get_json() or {}
        if "note" in data:
            note = (data.get("note") or "").strip() or None
            if note and len(note) > NOTE_MAX_LEN:
                return {"error": f"note too long (max {NOTE_MAX_LEN} chars)"}, 400
            session_obj.note = note
        if data.get("complete"):
            session_obj.completed_at = datetime.now(timezone.utc)
        db.session.commit()
        db.session.refresh(session_obj)
        return _audit_session_response(session_obj, include_items=True), 200


class AdminInventoryAuditItems(Resource):
    @require_admin
    def post(self, session_id):
        session_obj = (
            InventoryAuditSession.query
            .options(joinedload(InventoryAuditSession.items))
            .get(session_id)
        )
        if not session_obj:
            return {"error": "Audit session not found"}, 404
        if session_obj.completed_at:
            return {"error": "Session already completed"}, 400
        data = request.get_json() or {}
        item_id = data.get("inventory_item_id")
        if not item_id:
            return {"error": "inventory_item_id is required"}, 400
        item = db.session.get(InventoryItem, item_id)
        if not item:
            return {"error": "Inventory item not found"}, 404
        try:
            new_qty_input = Decimal(str(data.get("new_qty")))
        except Exception:
            return {"error": "new_qty must be numeric"}, 400
        unit_code = (data.get("unit") or getattr(getattr(item, "base_unit", None), "code", None))
        try:
            converted_qty = _convert_to_base_qty(new_qty_input, unit_code, item.base_unit)
        except ValueError as err:
            return {"error": str(err)}, 400
        expiration_date = None
        if "expiration_date" in data:
            try:
                expiration_date = _parse_date(data.get("expiration_date"))
            except ValueError as err:
                return {"error": str(err)}, 400
        note = (data.get("note") or "").strip() or None
        if note and len(note) > NOTE_MAX_LEN:
            return {"error": f"note too long (max {NOTE_MAX_LEN} chars)"}, 400
        previous_qty = float(_current_inventory_qty(item))
        try:
            _apply_inventory_adjustment(item, converted_qty, expiration_date=expiration_date, session_id=session_obj.id)
            record = InventoryAuditItem(
                session=session_obj,
                inventory_item=item,
                previous_qty=previous_qty,
                new_qty=float(converted_qty),
                count_unit_code=unit_code,
                expiration_date=expiration_date,
                note=note,
            )
            db.session.add(record)
            db.session.commit()
            db.session.refresh(session_obj)
            return {
                "audit_item": _audit_item_response(record),
                "session": _audit_session_response(session_obj, include_items=True),
            }, 201
        except ValueError as err:
            db.session.rollback()
            return {"error": str(err)}, 400
        except SQLAlchemyError:
            db.session.rollback()
            return {"error": "database error"}, 400


def _calculate_recipe_cost(menu_item_id):
    recipe = Recipe.query.filter_by(menu_item_id=menu_item_id).first()
    if not recipe:
        return None, []
    total = Decimal("0.00")
    breakdown = []
    for comp in recipe.components:
        last_batch = (
            InventoryBatch.query
            .filter_by(inventory_item_id=comp.inventory_item_id)
            .order_by(InventoryBatch.received_at.desc())
            .first()
        )
        unit_cost = Decimal(str(last_batch.unit_cost)) if last_batch and last_batch.unit_cost is not None else Decimal("0.00")
        extended = (Decimal(str(comp.qty)) * unit_cost).quantize(Decimal("0.0001"))
        total += extended
        breakdown.append({
            "ingredient": comp.inventory_item.name,
            "qty": comp.qty,
            "unit_cost": str(unit_cost),
            "extended": str(extended),
        })
    return total.quantize(Decimal("0.01")), breakdown


class AdminFoodCost(Resource):
    @require_admin
    def get(self, menu_item_id):
        cost, breakdown = _calculate_recipe_cost(menu_item_id)
        if cost is None:
            return {"error": "Recipe not found"}, 404
        return {"menu_item_id": menu_item_id, "food_cost": str(cost), "breakdown": breakdown}, 200


class AdminFoodCostSummary(Resource):
    @require_admin
    def get(self):
        period = (request.args.get("period") or "week").strip().lower()
        days = PERIOD_PRESETS.get(period, PERIOD_PRESETS["week"])
        now = datetime.now(timezone.utc)
        start = now - timedelta(days=days)
        orders = (
            Order.query
            .options(joinedload(Order.items))
            .filter(Order.placed_at >= start, Order.placed_at <= now)
            .all()
        )
        order_ids = [o.id for o in orders]
        payments = []
        if order_ids:
            payments = (
                Payment.query
                .filter(Payment.order_id.in_(order_ids), Payment.status.in_(STATUS_PAYMENT_OK))
                .all()
            )
        total_revenue = sum((p.amount for p in payments), Decimal("0.00"))
        sales_map = {}
        for order in orders:
            for item in order.items:
                key = item.menu_item_name.lower()
                sales_map[key] = sales_map.get(key, 0) + item.qty
        menu_items = (
            MenuItem.query
            .options(joinedload(MenuItem.recipe).joinedload(Recipe.components))
            .filter(MenuItem.is_active == True)
            .order_by(MenuItem.name)
            .all()
        )
        total_cogs = Decimal("0.00")
        items_output = []
        for menu_item in menu_items:
            cost_value, _ = _calculate_recipe_cost(menu_item.id)
            sale_price = Decimal(str(menu_item.price or 0))
            qty_sold = sales_map.get(menu_item.name.lower(), 0)
            if cost_value is not None and qty_sold:
                total_cogs += cost_value * qty_sold
            pct = None
            if sale_price > 0 and cost_value is not None:
                pct = ((cost_value / sale_price) * Decimal("100")).quantize(Decimal("0.01"))
            items_output.append({
                "name": menu_item.name,
                "ingredient_cost": str(cost_value if cost_value is not None else Decimal("0.00")),
                "sale_price": str(sale_price),
                "food_cost_pct": str(pct) if pct is not None else None,
                "qty_sold": qty_sold,
            })
        summary_pct = None
        if total_revenue > 0:
            summary_pct = ((total_cogs / total_revenue) * Decimal("100")).quantize(Decimal("0.01"))
        return {
            "period": {
                "key": period,
                "label": {"day": "Last 24h", "week": "Last 7 days", "month": "Last 30 days"}.get(period, "Last 7 days"),
                "from": start.isoformat(),
                "to": now.isoformat(),
            },
            "summary": {
                "total_revenue": str(total_revenue.quantize(Decimal("0.01"))),
                "total_cogs": str(total_cogs.quantize(Decimal("0.01"))),
                "food_cost_pct": str(summary_pct) if summary_pct is not None else None,
                "orders_count": len(orders),
                "payments_count": len(payments),
            },
            "items": items_output,
        }, 200


class AdminSettings(Resource):
    @require_admin
    def get(self):
        settings = AdminSetting.query.all()
        return {setting.key: setting.value for setting in settings}, 200

    @require_admin
    def patch(self):
        payload = request.get_json() or {}
        if not isinstance(payload, dict):
            return {"error": "payload must be an object"}, 400
        updated = {}
        for key, value in payload.items():
            if not isinstance(key, str) or not key.strip():
                continue
            setting = AdminSetting.query.filter_by(key=key).first()
            if setting:
                setting.value = value
            else:
                setting = AdminSetting(key=key, value=value)
                db.session.add(setting)
            updated[key] = setting.value
        db.session.commit()
        return updated, 200


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
api.add_resource(CheckoutPrepare, '/api/checkout/prepare')
api.add_resource(CheckoutUpdateTip, '/api/checkout/update_tip')
api.add_resource(StripeWebhook, '/api/webhook/stripe')

api.add_resource(Orders, '/api/orders')
api.add_resource(OrderById, '/api/orders/<int:order_id>')

api.add_resource(AdminOrders, '/api/admin/orders')
api.add_resource(AdminOrderDetail, '/api/admin/orders/<int:order_id>')

api.add_resource(AdminInventory, '/api/inventory')
api.add_resource(AdminInventoryDetail, '/api/inventory/<int:item_id>')
api.add_resource(AdminInventoryBatch, '/api/inventory/<int:item_id>/batches')
api.add_resource(AdminInventoryBatchDetail, '/api/inventory/batches/<int:batch_id>')
api.add_resource(AdminInventoryAudits, '/api/inventory/audits')
api.add_resource(AdminInventoryAuditDetail, '/api/inventory/audits/<int:session_id>')
api.add_resource(AdminInventoryAuditItems, '/api/inventory/audits/<int:session_id>/items')

api.add_resource(AdminFoodCostSummary, '/api/admin/food_cost')
api.add_resource(AdminFoodCost, '/api/admin/food_cost/<int:menu_item_id>')
api.add_resource(AdminSettings, '/api/admin/settings')

# Ensure sessions are properly removed after each request
@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5555)))
