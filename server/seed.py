from app import app
from config import db
from models import (
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
    AdminSetting,
)

from datetime import datetime, timedelta, timezone, date
from decimal import Decimal

# ----------------------------------
# Helper: wipe tables in FK-safe order
# ----------------------------------

def wipe_all():
    # Order-related (children first)
    db.session.query(OrderItemModifier).delete()
    db.session.query(OrderItem).delete()
    db.session.query(OrderDelivery).delete()
    db.session.query(Payment).delete()
    db.session.query(Receipt).delete()
    db.session.query(Order).delete()

    # Cart
    db.session.query(CartItemModifier).delete()
    db.session.query(CartItem).delete()
    db.session.query(Cart).delete()

    # Inventory & recipes (children first)
    db.session.query(StockMovement).delete()
    db.session.query(InventoryBatch).delete()
    db.session.query(RecipeComponent).delete()
    db.session.query(Recipe).delete()

    # Menu + modifiers (children first)
    db.session.query(MenuItemModifierGroup).delete()
    db.session.query(ModifierOption).delete()
    db.session.query(ModifierGroup).delete()
    db.session.query(MenuItem).delete()
    db.session.query(Category).delete()

    # Units / suppliers / items
    db.session.query(UnitConversion).delete()
    db.session.query(InventoryItem).delete()
    db.session.query(Supplier).delete()
    db.session.query(Unit).delete()

    # Users & support
    db.session.query(Address).delete()
    db.session.query(AuthThrottle).delete()
    db.session.query(User).delete()

    db.session.commit()


with app.app_context():
    print("🧹 Clearing existing data…")
    wipe_all()
    print("✅ Cleared.")

    # -----------------
    # Users
    # -----------------
    print("👥 Creating users…")
    owner = User(
        email="owner@example.com",
        first_name="Owner",
        last_name="Admin",
        admin=True,
        is_owner_admin=True,
        is_active=True,
    )
    owner.password_hash = "ownerpass"

    customer = User(
        email="customer@example.com",
        first_name="Casey",
        last_name="Customer",
        admin=False,
        is_owner_admin=False,
        is_active=True,
    )
    customer.password_hash = "customerpass"

    db.session.add_all([owner, customer])
    db.session.commit()

    # -----------------
    # Units & Conversions
    # -----------------
    print("📐 Seeding units…")
    u_each = Unit(code="ea", name="each")
    u_g = Unit(code="g", name="gram")
    u_kg = Unit(code="kg", name="kilogram")
    u_oz = Unit(code="oz", name="ounce")
    u_lb = Unit(code="lb", name="pound")
    db.session.add_all([u_each, u_g, u_kg, u_oz, u_lb])
    db.session.flush()

    convs = [
        UnitConversion(from_unit_id=u_kg.id, to_unit_id=u_g.id, factor=1000.0),
        UnitConversion(from_unit_id=u_lb.id, to_unit_id=u_oz.id, factor=16.0),
        UnitConversion(from_unit_id=u_lb.id, to_unit_id=u_g.id, factor=453.59237),
        UnitConversion(from_unit_id=u_oz.id, to_unit_id=u_g.id, factor=28.349523125),
    ]
    db.session.add_all(convs)
    db.session.commit()

    # -----------------
    # Suppliers
    # -----------------
    print("🏭 Adding suppliers…")
    sup_main = Supplier(name="FreshPro Foods", contact="rep@freshpro.test", phone="555-111-2222", email="rep@freshpro.test")
    sup_meat = Supplier(name="Carnitas Co.", contact="sales@carnitas.test", phone="555-333-4444", email="sales@carnitas.test")
    db.session.add_all([sup_main, sup_meat])
    db.session.commit()

    # -----------------
    # Inventory items (ingredients)
    # -----------------
    print("🍅 Creating inventory items…")
    ing_tortilla = InventoryItem(name="Tortilla (6in)", sku="TORT-6", base_unit=u_each)
    ing_chicken = InventoryItem(name="Chicken Breast", sku="CHK-BRST", base_unit=u_lb)
    ing_steak = InventoryItem(name="Flank Steak", sku="STK-FLNK", base_unit=u_lb)
    ing_rice = InventoryItem(name="Rice (cooked)", sku="RICE-CKD", base_unit=u_lb)
    ing_beans = InventoryItem(name="Black Beans", sku="BEAN-BLK", base_unit=u_lb)
    ing_lettuce = InventoryItem(name="Lettuce", sku="LETT-ICE", base_unit=u_lb)
    ing_salsa_roja = InventoryItem(name="Salsa Roja", sku="SLS-ROJA", base_unit=u_lb)
    ing_salsa_verde = InventoryItem(name="Salsa Verde", sku="SLS-VERD", base_unit=u_lb)

    db.session.add_all([
        ing_tortilla, ing_chicken, ing_steak, ing_rice,
        ing_beans, ing_lettuce, ing_salsa_roja, ing_salsa_verde
    ])
    db.session.commit()

    # -----------------
    # Inventory batches with expiration & unit cost (per base unit)
    # -----------------
    print("📦 Receiving inventory batches…")
    today = date.today()
    batches = [
        InventoryBatch(inventory_item_id=ing_tortilla.id, supplier_id=sup_main.id, qty=500, unit_cost=Decimal("0.10"), expiration_date=today + timedelta(days=10)),
        InventoryBatch(inventory_item_id=ing_chicken.id, supplier_id=sup_meat.id, qty=100, unit_cost=Decimal("2.75"), expiration_date=today + timedelta(days=5)),
        InventoryBatch(inventory_item_id=ing_steak.id, supplier_id=sup_meat.id, qty=80, unit_cost=Decimal("4.20"), expiration_date=today + timedelta(days=5)),
        InventoryBatch(inventory_item_id=ing_rice.id, supplier_id=sup_main.id, qty=60, unit_cost=Decimal("0.60"), expiration_date=today + timedelta(days=7)),
        InventoryBatch(inventory_item_id=ing_beans.id, supplier_id=sup_main.id, qty=60, unit_cost=Decimal("0.70"), expiration_date=today + timedelta(days=7)),
        InventoryBatch(inventory_item_id=ing_lettuce.id, supplier_id=sup_main.id, qty=30, unit_cost=Decimal("1.10"), expiration_date=today + timedelta(days=4)),
        InventoryBatch(inventory_item_id=ing_salsa_roja.id, supplier_id=sup_main.id, qty=40, unit_cost=Decimal("1.50"), expiration_date=today + timedelta(days=6)),
        InventoryBatch(inventory_item_id=ing_salsa_verde.id, supplier_id=sup_main.id, qty=40, unit_cost=Decimal("1.60"), expiration_date=today + timedelta(days=6)),
    ]
    db.session.add_all(batches)
    db.session.commit()

    # -----------------
    # Menu & Modifiers
    # -----------------
    print("📋 Creating menu and modifiers…")
    # Categories
    cat_tacos = Category(name="Tacos", sort_order=1)
    cat_tortas = Category(name="Tortas", sort_order=2)
    cat_quesadillas = Category(name="Quesadillas", sort_order=3)
    cat_burritos = Category(name="Burritos", sort_order=4)
    cat_flautas = Category(name="Flautas", sort_order=5)
    cat_tostadas = Category(name="Tostadas", sort_order=6)
    cat_sopes = Category(name="Sopes", sort_order=7)
    cat_nachos = Category(name="Nachos", sort_order=8)
    cat_gorditas = Category(name="Gorditas", sort_order=9)
    cat_picaditas = Category(name="Picaditas", sort_order=10)
    cat_sides = Category(name="Sides", sort_order=11)
    cat_drinks = Category(name="Drinks", sort_order=12)
    db.session.add_all([
        cat_tacos, cat_tortas, cat_quesadillas, cat_burritos,
        cat_flautas, cat_tostadas, cat_sopes, cat_nachos,
        cat_gorditas, cat_picaditas, cat_sides, cat_drinks
    ])
    db.session.commit()

    # Menu Items (bilingual descriptions where provided)
    tacos_reg = MenuItem(
        category=cat_tacos,
        name="Tacos (Regulares / Regular)",
        description="Cilantro y cebolla / Cilantro & onions",
        price=Decimal("4.00")
    )
    tacos_todo = MenuItem(
        category=cat_tacos,
        name="Tacos (Con Todo / With Everything)",
        description="Cilantro, cebolla, queso y crema / Cilantro, onions, cheese & sour cream",
        price=Decimal("4.50")
    )
    torta = MenuItem(
        category=cat_tortas,
        name="Tortas",
        description="Mexican sandwich with choice of meat",
        price=Decimal("9.00")
    )
    quesadilla = MenuItem(
        category=cat_quesadillas,
        name="Quesadillas",
        description="Corn tortilla with melted cheese & choice of meat",
        price=Decimal("10.00")
    )
    burrito = MenuItem(
        category=cat_burritos,
        name="Burritos",
        description="Flour tortilla with rice, beans, cheese, and meat",
        price=Decimal("10.00")
    )
    flautas = MenuItem(
        category=cat_flautas,
        name="Flautas (4 por orden / per order)",
        description="Crispy rolled tacos filled with meat",
        price=Decimal("8.00")
    )
    tostada = MenuItem(
        category=cat_tostadas,
        name="Tostadas",
        description="Crispy flat tortilla topped with beans, lettuce, cheese & meat",
        price=Decimal("4.00")
    )
    sope = MenuItem(
        category=cat_sopes,
        name="Sopes",
        description="Thick corn base topped with beans, lettuce, cheese & meat",
        price=Decimal("5.00")
    )
    nachos = MenuItem(
        category=cat_nachos,
        name="Nachos",
        description="Corn chips with cheese, avocado, beans, jalapeños, sour cream & choice of meat",
        price=Decimal("13.00")
    )
    gordita = MenuItem(
        category=cat_gorditas,
        name="Gorditas",
        description="Stuffed corn pockets with meat, cheese, and lettuce",
        price=Decimal("5.00")
    )
    picaditas = MenuItem(
        category=cat_picaditas,
        name="Picaditas (3 por orden / per order)",
        description="Corn bases with salsa, cheese, and meat",
        price=Decimal("10.00")
    )
    guac_chips = MenuItem(
        category=cat_sides,
        name="Guacamole with Chips",
        description="Fresh guacamole served with chips",
        price=Decimal("10.00")
    )

    canned_soda = MenuItem(
        category=cat_drinks,
        name="Canned Sodas",
        description="Assorted canned sodas",
        price=Decimal("1.50")
    )
    bottle_soda = MenuItem(
        category=cat_drinks,
        name="Bottle Sodas",
        description="Assorted bottled sodas",
        price=Decimal("3.00")
    )
    aguas = MenuItem(
        category=cat_drinks,
        name="Aguas Frescas / Flavored Waters",
        description="House-made aguas frescas, rotating flavors",
        price=Decimal("5.00")
    )

    db.session.add_all([
        tacos_reg, tacos_todo, torta, quesadilla, burrito, flautas,
        tostada, sope, nachos, gordita, picaditas, guac_chips,
        canned_soda, bottle_soda, aguas
    ])
    db.session.commit()

    # Modifier Groups
    mg_meat = ModifierGroup(name="Meat Choice / Elección de Carne", min_choices=0, max_choices=1, required=False)
    mg_extras = ModifierGroup(name="Add-ons / Extras", min_choices=0, max_choices=None, required=False)
    db.session.add_all([mg_meat, mg_extras])
    db.session.commit()

    # Modifier Options (Add-ons pricing)
    # Meats
    opt_meat_chicken = ModifierOption(group=mg_meat, name="Chicken / Pollo", price_delta=Decimal("1.50"))
    opt_meat_steak = ModifierOption(group=mg_meat, name="Steak / Bistec", price_delta=Decimal("2.00"))
    opt_meat_pork = ModifierOption(group=mg_meat, name="Pork / Puerco (Enchilada / Al Pastor / Carnitas)", price_delta=Decimal("1.75"))
    opt_meat_chorizo = ModifierOption(group=mg_meat, name="Chorizo", price_delta=Decimal("1.75"))

    # Extras
    opt_extra_cheese = ModifierOption(group=mg_extras, name="Cheese / Queso", price_delta=Decimal("1.00"))
    opt_extra_sourcream = ModifierOption(group=mg_extras, name="Sour Cream / Crema", price_delta=Decimal("0.75"))
    opt_extra_guac = ModifierOption(group=mg_extras, name="Guacamole", price_delta=Decimal("1.50"))
    opt_extra_doublemeat = ModifierOption(group=mg_extras, name="Extra Meat / Doble Carne", price_delta=Decimal("2.00"))

    db.session.add_all([
        opt_meat_chicken, opt_meat_steak, opt_meat_pork, opt_meat_chorizo,
        opt_extra_cheese, opt_extra_sourcream, opt_extra_guac, opt_extra_doublemeat
    ])
    db.session.commit()

    # Link modifier groups to applicable items
    items_with_meat = [
        tacos_reg, tacos_todo, torta, quesadilla, burrito, flautas,
        tostada, sope, nachos, gordita, picaditas
    ]
    for it in items_with_meat:
        db.session.add(MenuItemModifierGroup(menu_item_id=it.id, modifier_group_id=mg_meat.id))
        db.session.add(MenuItemModifierGroup(menu_item_id=it.id, modifier_group_id=mg_extras.id))
    db.session.commit()


    # -----------------
    # Optional: a sample order to verify flows
    # -----------------
    print("🧾 Creating a sample order…")
    order = Order(
        user_id=customer.id,
        status="paid",
        channel="web",
        fulfillment="pickup",
        subtotal=Decimal("9.50"),   # 2x tacos regular ($8.00) + 1x canned soda ($1.50)
        tax_total=Decimal("0.76"),  # example 8% tax
        discount_total=Decimal("0.00"),
        delivery_fee=Decimal("0.00"),
        tip=Decimal("2.00"),
        grand_total=Decimal("12.26"),
        currency="USD",
    )
    db.session.add(order)
    db.session.flush()

    oi1 = OrderItem(order_id=order.id, menu_item_name="Tacos (Regulares / Regular)", qty=2, unit_price=Decimal("4.00"), line_total=Decimal("8.00"))
    oi2 = OrderItem(order_id=order.id, menu_item_name="Canned Sodas", qty=1, unit_price=Decimal("1.50"), line_total=Decimal("1.50"))
    db.session.add_all([oi1, oi2])
    db.session.flush()

    pay = Payment(order_id=order.id, provider="test", reference="PAY-TEST-1", amount=order.grand_total, currency="USD", status="captured")
    db.session.add(pay)

    rec = Receipt(order_id=order.id, pdf_url=None, data={"lines": [
        {"name": oi1.menu_item_name, "qty": oi1.qty, "unit_price": str(oi1.unit_price), "line_total": str(oi1.line_total)},
        {"name": oi2.menu_item_name, "qty": oi2.qty, "unit_price": str(oi2.unit_price), "line_total": str(oi2.line_total)},
    ]})
    db.session.add(rec)

    db.session.commit()
    defaults = {
        "theme_preference": "system",
        "notifications": {
            "low_inventory": True,
            "new_orders": True,
            "status_changes": True,
        },
        "role_access": {
            "orders": "admin",
            "inventory": "admin",
            "food_cost": "admin",
            "settings": "admin",
        },
    }
    for key, value in defaults.items():
        existing = AdminSetting.query.filter_by(key=key).first()
        if existing:
            existing.value = value
        else:
            db.session.add(AdminSetting(key=key, value=value))
    db.session.commit()
    print("✅ Seeding complete.")
