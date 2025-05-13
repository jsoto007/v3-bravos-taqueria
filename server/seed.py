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
        email='user3@example.com',
        admin=False
    )
    user1.password_hash = 'hashedpassword4'
   
    user2 = User(
        email='test3@example.com',
        admin=True
    )
    user2.password_hash = 'hashedpassword3'

   

    print('Adding bird and user objects to transaction...')
    db.session.add_all([chickadee, grackle, starling, dove, user1, user2])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')
