
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
    Recipe,
    RecipeComponent,
)

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

        item = db.session.get(InventoryItem, item_id)
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
api.add_resource(CheckoutPrepare, '/api/checkout/prepare')
api.add_resource(CheckoutUpdateTip, '/api/checkout/update_tip')
api.add_resource(StripeWebhook, '/api/webhook/stripe')

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
