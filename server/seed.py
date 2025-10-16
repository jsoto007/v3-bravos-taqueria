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
    cat_tacos = Category(name="Tacos", sort_order=1)
    cat_bowls = Category(name="Bowls", sort_order=2)
    cat_drinks = Category(name="Drinks", sort_order=3)
    db.session.add_all([cat_tacos, cat_bowls, cat_drinks])
    db.session.commit()

    taco_chicken = MenuItem(category=cat_tacos, name="Chicken Taco", description="Grilled chicken on a 6\" tortilla", price=Decimal("3.50"))
    taco_veggie = MenuItem(category=cat_tacos, name="Veggie Taco", description="Seasonal veggies", price=Decimal("3.25"))
    bowl_burrito = MenuItem(category=cat_bowls, name="Burrito Bowl", description="Rice, beans, protein, toppings", price=Decimal("10.50"))
    drink_agua = MenuItem(category=cat_drinks, name="Agua Fresca", description="Rotating flavors", price=Decimal("3.00"))

    db.session.add_all([taco_chicken, taco_veggie, bowl_burrito, drink_agua])
    db.session.commit()

    # Modifier groups
    mg_protein = ModifierGroup(name="Protein", min_choices=0, max_choices=1, required=False)
    mg_toppings = ModifierGroup(name="Toppings", min_choices=0, max_choices=None, required=False)
    mg_salsa = ModifierGroup(name="Salsa", min_choices=0, max_choices=1, required=False)

    db.session.add_all([mg_protein, mg_toppings, mg_salsa])
    db.session.commit()

    # Modifier options
    opt_chicken = ModifierOption(group=mg_protein, name="Chicken", price_delta=Decimal("0.00"))
    opt_steak = ModifierOption(group=mg_protein, name="Steak", price_delta=Decimal("1.00"))
    opt_tofu = ModifierOption(group=mg_protein, name="Tofu", price_delta=Decimal("0.50"))

    opt_lettuce = ModifierOption(group=mg_toppings, name="Lettuce", price_delta=Decimal("0.00"))
    opt_beans = ModifierOption(group=mg_toppings, name="Beans", price_delta=Decimal("0.00"))

    opt_roja = ModifierOption(group=mg_salsa, name="Roja", price_delta=Decimal("0.00"))
    opt_verde = ModifierOption(group=mg_salsa, name="Verde", price_delta=Decimal("0.00"))

    db.session.add_all([opt_chicken, opt_steak, opt_tofu, opt_lettuce, opt_beans, opt_roja, opt_verde])
    db.session.commit()

    # Link modifier groups to items
    db.session.add_all([
        MenuItemModifierGroup(menu_item_id=taco_chicken.id, modifier_group_id=mg_protein.id),
        MenuItemModifierGroup(menu_item_id=taco_chicken.id, modifier_group_id=mg_toppings.id),
        MenuItemModifierGroup(menu_item_id=taco_chicken.id, modifier_group_id=mg_salsa.id),
        MenuItemModifierGroup(menu_item_id=taco_veggie.id, modifier_group_id=mg_toppings.id),
        MenuItemModifierGroup(menu_item_id=bowl_burrito.id, modifier_group_id=mg_protein.id),
        MenuItemModifierGroup(menu_item_id=bowl_burrito.id, modifier_group_id=mg_toppings.id),
        MenuItemModifierGroup(menu_item_id=bowl_burrito.id, modifier_group_id=mg_salsa.id),
    ])
    db.session.commit()

    # -----------------
    # Recipes (food cost BOM)
    # -----------------
    print("🥣 Creating recipes…")
    r_taco_chicken = Recipe(menu_item_id=taco_chicken.id, yield_qty=1)
    r_taco_veggie = Recipe(menu_item_id=taco_veggie.id, yield_qty=1)
    r_bowl = Recipe(menu_item_id=bowl_burrito.id, yield_qty=1)

    db.session.add_all([r_taco_chicken, r_taco_veggie, r_bowl])
    db.session.flush()

    comps = [
        # Chicken Taco
        RecipeComponent(recipe_id=r_taco_chicken.id, inventory_item_id=ing_tortilla.id, qty=1),   # 1 tortilla ea
        RecipeComponent(recipe_id=r_taco_chicken.id, inventory_item_id=ing_chicken.id, qty=0.20),# 0.20 lb chicken
        RecipeComponent(recipe_id=r_taco_chicken.id, inventory_item_id=ing_lettuce.id, qty=0.03),
        RecipeComponent(recipe_id=r_taco_chicken.id, inventory_item_id=ing_salsa_roja.id, qty=0.04),

        # Veggie Taco
        RecipeComponent(recipe_id=r_taco_veggie.id, inventory_item_id=ing_tortilla.id, qty=1),
        RecipeComponent(recipe_id=r_taco_veggie.id, inventory_item_id=ing_beans.id, qty=0.10),
        RecipeComponent(recipe_id=r_taco_veggie.id, inventory_item_id=ing_lettuce.id, qty=0.03),
        RecipeComponent(recipe_id=r_taco_veggie.id, inventory_item_id=ing_salsa_verde.id, qty=0.04),

        # Burrito Bowl
        RecipeComponent(recipe_id=r_bowl.id, inventory_item_id=ing_rice.id, qty=0.35),
        RecipeComponent(recipe_id=r_bowl.id, inventory_item_id=ing_beans.id, qty=0.20),
        RecipeComponent(recipe_id=r_bowl.id, inventory_item_id=ing_chicken.id, qty=0.30),
        RecipeComponent(recipe_id=r_bowl.id, inventory_item_id=ing_salsa_roja.id, qty=0.05),
    ]
    db.session.add_all(comps)
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
        subtotal=Decimal("13.50"),
        tax_total=Decimal("1.08"),
        discount_total=Decimal("0.00"),
        delivery_fee=Decimal("0.00"),
        tip=Decimal("2.00"),
        grand_total=Decimal("16.58"),
        currency="USD",
    )
    db.session.add(order)
    db.session.flush()

    oi1 = OrderItem(order_id=order.id, menu_item_name="Chicken Taco", qty=2, unit_price=Decimal("3.50"), line_total=Decimal("7.00"))
    oi2 = OrderItem(order_id=order.id, menu_item_name="Agua Fresca", qty=1, unit_price=Decimal("3.00"), line_total=Decimal("3.00"))
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
    print("✅ Seeding complete.")