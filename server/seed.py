from app import app
from models import User, CarPhoto, CarInventory, MasterCarRecord, UserInventory
from config import db

with app.app_context():
    print('🧹 Deleting old data...')
    db.session.query(CarPhoto).delete()
    db.session.query(CarInventory).delete()
    db.session.query(MasterCarRecord).delete()
    db.session.query(UserInventory).delete()
    db.session.query(User).delete()
    db.session.commit()
    print('✅ Old data deleted.')

    print('👤 Creating users...')
    user1 = User(email='user33@example.com', admin=False)
    user1.password_hash = 'password123'

    user2 = User(email='test33@example.com', admin=True)
    user2.password_hash = 'adminpass456'

    db.session.add_all([user1, user2])
    db.session.commit()

    print('📦 Creating user inventory...')
    user_inventory1 = UserInventory(user=user1)
    db.session.add(user_inventory1)
    db.session.commit()

    print('🚗 Creating car inventories...')
    car1 = CarInventory(
        location='New York Lot A',
        vin_number='1HGCM82633A004352',
        year=2015,
        make='Honda',
        user=user1,
        user_inventory=user_inventory1
    )
    car2 = CarInventory(
        location='Los Angeles Lot B',
        vin_number='2T1BURHE0JC123456',
        year=2017,
        make='Toyota',
        user=user1,
        user_inventory=user_inventory1
    )
    db.session.add_all([car1, car2])
    db.session.commit()

    print('📸 Creating car photos...')
    photo1 = CarPhoto(url='https://example.com/photo1.jpg', car_inventory=car1)
    photo2 = CarPhoto(url='https://example.com/photo2.jpg', car_inventory=car1)
    photo3 = CarPhoto(url='https://example.com/photo3.jpg', car_inventory=car2)
    db.session.add_all([photo1, photo2, photo3])
    db.session.commit()

    print('🗂️ Creating master car records...')
    master1 = MasterCarRecord(
        vin_number='1HGCM82633A004352',
        location='New York Lot A',
        year=2015,
        make='Honda',
        model='Accord',
        trim='EX',
        body_style='Sedan',
        color='Black',
        interior_color='Beige',
        transmission='Automatic',
        drivetrain='FWD',
        engine='2.4L I4',
        fuel_type='Gasoline',
        mileage=75000,
        purchase_price=5000.00,
        selling_price=7500.00,
        is_sold=True,
        sold_price=7500.00
    )
    master2 = MasterCarRecord(
        vin_number='2T1BURHE0JC123456',
        location='Los Angeles Lot B',
        year=2017,
        make='Toyota',
        model='Corolla',
        trim='LE',
        body_style='Sedan',
        color='White',
        interior_color='Gray',
        transmission='CVT',
        drivetrain='FWD',
        engine='1.8L I4',
        fuel_type='Gasoline',
        mileage=60000,
        purchase_price=4000.00,
        is_sold=False
    )
    db.session.add_all([master1, master2])
    db.session.commit()

    print('✅ Seeding complete.')
