import geopy.distance

def find_designated_location(lat, lon, designated_locations):
    for dl in designated_locations:
        distance = geopy.distance.distance((lat, lon), (dl.latitude, dl.longitude)).miles
        if distance <= 0.5:
            return dl.name
    return None

