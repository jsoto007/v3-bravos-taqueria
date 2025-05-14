from app import app
from models import Bird, User
from config import db

with app.app_context():

    print('Deleting existing birds...')
    Bird.query.delete()

    print('Creating bird objects...')
    chickadee = Bird(
        name='Black-Capped Chickadee',
        species='Poecile Atricapillus',
        image='/images/black-capped-chickadee.jpeg'
    )
    grackle = Bird(
        name='Grackle',
        species='Quiscalus Quiscula',
        image='/images/grackle.jpeg'
    )
    starling = Bird(
        name='Common Starling',
        species='Sturnus Vulgaris',
        image='/images/starling.jpeg'
    )
    dove = Bird(
        name='Mourning Dove',
        species='Zenaida Macroura',
        image='/images/dove.jpeg'
    )

    print('🐒🐒🐒 Creating user objects...')
    user1 = User(
        email='user33@example.com',
        admin=False
    )
    user1.password_hash = 'hashedpassword43'
   
    user2 = User(
        email='test33@example.com',
        admin=True
    )
    user2.password_hash = 'hashedpassword33'

   

    print('Adding bird and user objects to transaction...')
    db.session.add_all([chickadee, grackle, starling, dove, user1, user2])
    print('Committing transaction...')
    db.session.commit()

    # ---- Seed data for new tables ----
    from models import CarInventory, CarPhoto, MasterCarRecord, UserInventory

    print('Creating user inventory records...')
    user_inventory1 = UserInventory(user=user1)

    print('Creating car inventory records...')
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

    print('Creating car photo records...')
    photo1 = CarPhoto(url='data:image/jpeg;base64,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', car_inventory=car1)
    photo2 = CarPhoto(url='https://upload.wikimedia.org/wikipedia/commons/1/1b/Honda_CR-V_e-HEV_Elegance_AWD_%28VI%29_%E2%80%93_f_14072024.jpg', car_inventory=car1)
    photo3 = CarPhoto(url='https://www.kbb.com/wp-content/uploads/2022/10/2023-toyota-rav4-prime-frt-3qtr.jpg?w=918', car_inventory=car2)


    print('Creating master car records...')
    master1 = MasterCarRecord(
        vin_number='1HGCM82633A004352',
        location='New York Lot A',
        year=2015,
        make='Honda',
        purchase_price=5000.00,
        is_sold=True
    )

    master2 = MasterCarRecord(
        vin_number='2T1BURHE0JC123456',
        location='Los Angeles Lot B',
        year=2017,
        make='Toyota',
        purchase_price=4000.00,
        is_sold=False
    )

    db.session.add_all([user_inventory1, car1, car2, photo1, photo2, photo3, master1, master2])
    db.session.commit()
    print('New car-related seed data committed.')
    print('✅✅✅✅ Complete.')
