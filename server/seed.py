from app import app
from config import db
from models import (
    User,
    CarPhoto,
    CarInventory,
    MasterCarRecord,
    UserInventory,
    AccountGroup,
    OwnerDealer,
    CarNote,
    DesignatedLocation,
)

import random
from datetime import datetime, timezone

from faker import Faker
from faker.providers import automotive

# ----------------------------
# Helper data & generators
# ----------------------------
ALLOWED_VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"  # I, O, Q excluded
MAKES_MODELS = {
    "Honda": ["Accord", "Civic", "CR-V", "Pilot"],
    "Toyota": ["Corolla", "Camry", "RAV4", "Tacoma"],
    "Ford": ["F-150", "Escape", "Explorer", "Mustang"],
    "Chevrolet": ["Silverado", "Equinox", "Malibu", "Tahoe"],
    "Nissan": ["Altima", "Rogue", "Sentra", "Pathfinder"],
    "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe"],
    "Kia": ["Optima", "Soul", "Sportage", "Sorento"],
}
COLORS = [
    "Black", "White", "Silver", "Gray", "Blue", "Red", "Green", "Brown"
]
BODIES = ["Sedan", "Hatchback", "SUV", "Truck", "Coupe", "Wagon"]
TRANSMISSIONS = ["Automatic", "Manual", "CVT"]
DRIVETRAINS = ["FWD", "RWD", "AWD", "4WD"]
FUEL_TYPES = ["Gasoline", "Diesel", "Hybrid", "Electric"]

LOCATIONS = [
    ("New York Lot A", 40.7128, -74.0060),
    ("Los Angeles Lot B", 34.0522, -118.2437),
    ("Miami Lot C", 25.7617, -80.1918),
    ("Dallas Lot D", 32.7767, -96.7970),
]

CURRENT_PLUS_ONE = datetime.now(timezone.utc).year + 1

fake = Faker()
fake.add_provider(automotive)

def generate_unique_vins(count):
    vins = set()
    # Keep trying until we have `count` unique VINs
    while len(vins) < count:
        vin = fake.vin()  # Valid 17-char VIN (excludes I, O, Q)
        vins.add(vin)
    return list(vins)


# ----------------------------
# Main seeding routine
# ----------------------------
NUM_CARS = 900

with app.app_context():
    print("🧹 Deleting old data…")
    db.session.query(CarNote).delete()
    db.session.query(OwnerDealer).delete()
    db.session.query(CarPhoto).delete()
    db.session.query(CarInventory).delete()
    db.session.query(MasterCarRecord).delete()
    db.session.query(UserInventory).delete()
    db.session.query(User).delete()
    db.session.query(DesignatedLocation).delete()
    db.session.query(AccountGroup).delete()
    db.session.commit()
    print("✅ Old data deleted.")

    # --- Account group & users ---
    print("👥 Creating account group & users…")
    account_group = AccountGroup(group_key="group123")
    db.session.add(account_group)
    db.session.commit()

    user1 = User(
        email="user33@example.com",
        first_name="Fernandito",
        last_name="Perreo",
        admin=False,
        is_owner_admin=False,
        account_group_id=account_group.id,
    )
    user1.password_hash = "password123"

    user2 = User(
        email="admin33@example.com",
        first_name="Jone",
        last_name="Doe",
        admin=True,
        is_owner_admin=True,
        account_group_id=account_group.id,
    )
    user2.password_hash = "adminpass456"

    db.session.add_all([user1, user2])
    db.session.commit()

    owner_dealer = OwnerDealer(user_id=user2.id, account_group_id=account_group.id)
    db.session.add(owner_dealer)
    db.session.commit()

    # --- Locations ---
    print("📍 Creating designated locations…")
    dl_objects = []
    for name, lat, lng in LOCATIONS:
        dl_objects.append(
            DesignatedLocation(
                name=name, latitude=lat, longitude=lng, account_group_id=account_group.id
            )
        )
    db.session.bulk_save_objects(dl_objects)
    db.session.commit()

    # --- User inventory ---
    print("📦 Creating user inventory…")
    user_inventory = UserInventory(
        user_id=user1.id, account_group_id=account_group.id, submitted=False, reviewed=False
    )
    db.session.add(user_inventory)
    db.session.commit()

    # --- Generate cars ---
    print(f"🚗 Creating {NUM_CARS} cars…")
    vins = generate_unique_vins(NUM_CARS)

    master_records = []
    car_inventories = []

    # Build objects in memory and bulk insert for speed
    for i in range(NUM_CARS):
        vin = vins[i]
        try:
            make = fake.vehicle_make()
        except Exception:
            make = random.choice(list(MAKES_MODELS.keys()))
        try:
            model = fake.vehicle_model()
        except Exception:
            model = random.choice(MAKES_MODELS.get(make, ["Standard"]))
        try:
            year = int(fake.vehicle_year())
        except Exception:
            year = random.randint(1998, CURRENT_PLUS_ONE)
        # Clamp year to your validator range
        if year < 1886:
            year = 1886
        if year > CURRENT_PLUS_ONE:
            year = CURRENT_PLUS_ONE

        try:
            color = fake.color_name()
        except Exception:
            color = random.choice(COLORS)
        color = (color or "Unknown").strip()[:255]

        body = random.choice(BODIES)
        transmission = random.choice(TRANSMISSIONS)
        drivetrain = random.choice(DRIVETRAINS)
        fuel = random.choice(FUEL_TYPES)
        mileage = round(random.uniform(10_000, 220_000), 1)
        purchase_price = round(random.uniform(1_500, 30_000), 2)

        loc_name, lat, lng = LOCATIONS[i % len(LOCATIONS)]

        master_records.append(
            MasterCarRecord(
                vin_number=vin,
                location=loc_name,
                year=year,
                make=make,
                model=model,
                trim=None,
                body_style=body,
                color=color,
                interior_color=None,
                transmission=transmission,
                drivetrain=drivetrain,
                engine=None,
                fuel_type=fuel,
                date_acquired=None,
                date_sold=None,
                mileage=mileage,
                purchase_price=purchase_price,
                selling_price=None,
                is_sold=False,
                sold_price=None,
            )
        )

        car_inventories.append(
            CarInventory(
                location=loc_name,
                vin_number=vin,
                year=year,
                make=make,
                color=color,
                body=body,
                latitude=lat,
                longitude=lng,
                user_id=user1.id,
                user_inventory_id=user_inventory.id,
                account_group_id=account_group.id,
                designated_location_id=dl_objects[i % len(dl_objects)].id,
            )
        )

    # Bulk insert in two phases to respect unique vin on MasterCarRecord
    db.session.bulk_save_objects(master_records)
    db.session.commit()

    db.session.bulk_save_objects(car_inventories)
    db.session.commit()

    # A few sample notes/photos on first few cars for UI testing
    print("📝 Adding sample notes & photos…")
    first_five = (
        db.session.query(CarInventory)
        .filter_by(account_group_id=account_group.id)
        .order_by(CarInventory.id.asc())
        .limit(5)
        .all()
    )
    notes = []
    photos = []
    for idx, car in enumerate(first_five, start=1):
        notes.append(
            CarNote(
                car_inventory_id=car.id,
                content=f"QC note {idx}: inspected on seed; minor wear consistent with age."
            )
        )
        photos.append(CarPhoto(url=f"https://example.com/car{idx}_a.jpg", car_inventory_id=car.id))
        photos.append(CarPhoto(url=f"https://example.com/car{idx}_b.jpg", car_inventory_id=car.id))

    db.session.bulk_save_objects(notes + photos)
    db.session.commit()

    print("✅ Seeding complete.")