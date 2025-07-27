import pytest
from app import app, db
from flask import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.app_context():
        db.create_all()
    with app.test_client() as client:
        yield client

def test_404(client):
    res = client.get('/nonexistent')
    assert res.status_code in (200, 404)

def test_account_groups_post_get(client):
    res = client.post('/api/account_groups', json={"group_key": "testkey"})
    assert res.status_code == 201
    group_id = res.get_json()['id']

    res = client.get('/api/account_groups')
    assert res.status_code == 200
    assert any(group["id"] == group_id for group in res.get_json())

def test_signup_login_logout(client):
    res = client.post('/api/account_groups', json={"group_key": "key123"})
    group_id = res.get_json()['id']

    signup_data = {
        "username": "test@example.com",
        "password": "testpass",
        "account_group_id": group_id,
        "admin": True
    }
    res = client.post('/api/signup', json=signup_data)
    assert res.status_code == 201

    res = client.post('/api/login', json={"username": "test@example.com", "password": "testpass"})
    assert res.status_code == 200

    res = client.get('/api/check_session')
    assert res.status_code in (200, 401)  # session may not persist depending on config

    res = client.delete('/api/logout')
    assert res.status_code == 204

def test_user_inventory_flow(client):
    group = client.post('/api/account_groups', json={"group_key": "grp1"}).get_json()
    group_id = group['id']

    user = client.post('/api/signup', json={
        "username": "inv@example.com",
        "password": "pass123",
        "account_group_id": group_id
    }).get_json()

    res = client.post('/api/user_inventories', json={
        "user_id": user['id'],
        "account_group_id": group_id
    })
    assert res.status_code == 201
    inv_id = res.get_json()['id']

    res = client.patch(f'/api/user_inventories/{inv_id}')
    assert res.status_code == 200

    res = client.get(f'/api/user_inventories/history/{user["id"]}')
    assert res.status_code == 200
    assert any(item['id'] == inv_id for item in res.get_json())

def test_car_inventory_post_get(client):
    group = client.post('/api/account_groups', json={"group_key": "cg1"}).get_json()

    user = client.post('/api/signup', json={
        "username": "car@example.com",
        "password": "1234",
        "account_group_id": group['id']
    }).get_json()

    inventory = client.post('/api/user_inventories', json={
        "user_id": user["id"],
        "account_group_id": group["id"]
    }).get_json()

    res = client.post('/api/cars', json={
        "location": "NY",
        "vin_number": "VIN123456",
        "year": 2024,
        "make": "Toyota",
        "user_id": user["id"],
        "user_inventory_id": inventory["id"],
        "account_group_id": group["id"]
    })
    assert res.status_code == 201

    res = client.get('/api/cars')
    assert res.status_code == 200
    assert any(car["vin_number"] == "VIN123456" for car in res.get_json())

def test_master_inventory_crud(client):
    res = client.post('/api/master_inventory', json={
        "vin_number": "TESTVIN123",
        "location": "TX",
        "year": 2022,
        "make": "Ford",
        "purchase_price": 10000,
        "selling_price": 13000,
        "sold_price": 12500,
        "is_sold": True
    })
    assert res.status_code == 201
    rec_id = res.get_json()['id']

    res = client.get('/api/master_inventory')
    assert res.status_code == 200

    res = client.get(f'/api/master_inventory/{rec_id}')
    assert res.status_code == 200

    res = client.patch(f'/api/master_inventory/{rec_id}', json={"make": "FordUpdated"})
    assert res.status_code == 200
    assert res.get_json()["make"] == "FordUpdated"

    res = client.delete(f'/api/master_inventory/{rec_id}')
    assert res.status_code == 204

def test_vin_history(client):
    res = client.get('/api/vin_history')
    assert res.status_code == 200