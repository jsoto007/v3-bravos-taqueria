import time
from threading import Thread
from math import radians, cos, sin, asin, sqrt
from sqlalchemy import event
import logging

# Globals - set this from your Flask app on startup
_handler_app = None

def set_handler_app(app):
    """
    Call this once from your Flask app initialization to provide the app context for background threads.
    """
    global _handler_app
    _handler_app = app

# Setup logging for the module
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance in miles between two points on earth (decimal degrees).
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 3956  # Earth radius in miles
    return c * r

def handle_location_change_async(event_type, instance_data):
    """
    Runs in a background thread with explicit Flask app context for safe DB access.
    """
    try:
        # Import models and db here to avoid circular imports and only when needed
        from models import CarInventory, db

        if _handler_app is None:
            logging.error("Flask app not set in handler; cannot run background job with app context.")
            return

        with _handler_app.app_context():
            logging.info(f"[LocationEvent] {event_type.upper()} triggered for: {instance_data['name']} (ID: {instance_data['id']})")

            location_lat = instance_data["latitude"]
            location_lon = instance_data["longitude"]
            location_id = instance_data["id"]
            account_group_id = instance_data["account_group_id"]

            cars = CarInventory.query.filter_by(account_group_id=account_group_id).all()
            for car in cars:
                if car.latitude is None or car.longitude is None:
                    logging.warning(f"Skipping car {car.id}: No coordinates available.")
                    continue
                distance = haversine(location_lon, location_lat, car.longitude, car.latitude)
                if distance <= 0.15:
                    if car.designated_location_id != location_id:
                        logging.info(f"Assigning car {car.id} to designated location {location_id}.")
                    car.designated_location_id = location_id
            # Only unassign cars for deleted locations
            if event_type == "delete":
                for car in cars:
                    if car.designated_location_id == location_id:
                        logging.info(f"Unassigning car {car.id} from designated location due to location deletion.")
                        car.designated_location_id = None

            db.session.commit()
            logging.info(f"[LocationEvent] Completed processing {event_type.upper()} for DesignatedLocation ID {location_id}")

    except Exception as e:
        logging.error(f"Error during {event_type.upper()} event for DesignatedLocation ID {instance_data.get('id')}: {e}", exc_info=True)

def start_background_task(event_type, instance):
    """
    Start the async task in a thread, passing the instance data.
    """
    instance_data = {
        "id": instance.id,
        "name": instance.name,
        "latitude": instance.latitude,
        "longitude": instance.longitude,
        "account_group_id": instance.account_group_id,
    }

    logging.info(f"Starting background task for {event_type} on DesignatedLocation ID {instance.id}.")
    thread = Thread(target=handle_location_change_async, args=(event_type, instance_data))
    thread.daemon = True  # Ensures threads don't block program exit
    thread.start()

# SQLAlchemy event listeners to automatically trigger tasks on CRUD

def after_insert_listener(mapper, connection, target):
    logging.info(f"[SQLAlchemy-Listener] Insert event detected for DesignatedLocation ID {target.id}")
    start_background_task('create', target)

def after_update_listener(mapper, connection, target):
    logging.info(f"[SQLAlchemy-Listener] Update event detected for DesignatedLocation ID {target.id}")
    start_background_task('update', target)

def after_delete_listener(mapper, connection, target):
    logging.info(f"[SQLAlchemy-Listener] Delete event detected for DesignatedLocation ID {target.id}")
    start_background_task('delete', target)

# Attach event listeners to your model (import DesignatedLocation here or in main)

from models import DesignatedLocation

event.listen(DesignatedLocation, 'after_insert', after_insert_listener)
event.listen(DesignatedLocation, 'after_update', after_update_listener)
event.listen(DesignatedLocation, 'after_delete', after_delete_listener)
