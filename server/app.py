import os

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, request, make_response, render_template, session
from flask_migrate import Migrate
from flask_restful import Api, Resource
from sqlalchemy.exc import IntegrityError

from config import db, bcrypt, app
from models import User, Bird


migrate = Migrate(app, db)
db.init_app(app)

@app.errorhandler(404)
def not_found(e):
    return render_template("index.html")

api = Api(app)


class Signup(Resource):
    def post(self):
        json = request.get_json()
        user = User(
            email = json['email']
        )
        try:
            user.password_hash = json['password']
            db.session.add(user)
            db.session.commit()
            return user.to_dict(), 201
        except IntegrityError:
            db.session.rollback()
            return {"error": "Username already exists."}, 422


class CheckSession(Resource):
    def get(self):
        if session.get('user_id'):
            user = User.query.filter(User.id == session['user_id']).first()
            return user.to_dict(), 200
        return {"error": "Please log in"}, 401


class Login(Resource):
    def post(self):
        username = request.get_json()['username']
        password = request.get_json()['password']

        user = User.query.filter(User.username == username).first()

        if user and user.authenticate(password):
            session['user_id'] = user.id
            return user.to_dict(), 200
        return {'error': "401 Unauthorized"}, 401


class Logout(Resource):
    def delete(self):
        session['user_id'] = None

        return {}, 204








class Birds(Resource):

    def get(self):
        birds = [bird.to_dict() for bird in Bird.query.all()]
        return make_response(jsonify(birds), 200)

    def post(self):

        data = request.get_json()

        new_bird = Bird(
            name=data['name'],
            species=data['species'],
            image=data['image'],
        )

        db.session.add(new_bird)
        db.session.commit()

        return make_response(new_bird.to_dict(), 201)

api.add_resource(Birds, '/birds')

class BirdByID(Resource):
    
    def get(self, id):
        bird = Bird.query.filter_by(id=id).first().to_dict()
        return make_response(jsonify(bird), 200)

    def patch(self, id):

        data = request.get_json()

        bird = Bird.query.filter_by(id=id).first()

        for attr in data:
            setattr(bird, attr, data[attr])

        db.session.add(bird)
        db.session.commit()

        return make_response(bird.to_dict(), 200)

    def delete(self, id):

        bird = Bird.query.filter_by(id=id).first()
        db.session.delete(bird)
        db.session.commit()

        return make_response('', 204)


api.add_resource(Signup, '/signup', endpoint='signup')
api.add_resource(CheckSession, '/check_session', endpoint='check_session')
api.add_resource(Login, '/login', endpoint='login')
api.add_resource(Logout, '/logout', endpoint='logout')

api.add_resource(BirdByID, '/birds/<int:id>')

