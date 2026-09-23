import json

# Base center around 28.61, 77.21 (from seed.py roughly)
C_LAT, C_LNG = 28.6145, 77.2095

def rect(clat, clng, w, h):
    return [
        [clat - h, clng - w],
        [clat - h, clng + w],
        [clat + h, clng + w],
        [clat + h, clng - w],
        [clat - h, clng - w]
    ]

# The Haul road will go from Yard -> Loading -> Dump -> Yard
haul_road_coords = [
    [C_LAT - 0.005, C_LNG - 0.005], # Yard
    [C_LAT - 0.002, C_LNG],         # Waypoint
    [C_LAT + 0.005, C_LNG + 0.005], # Loading
    [C_LAT + 0.002, C_LNG + 0.010], # Waypoint
    [C_LAT - 0.006, C_LNG + 0.008], # Dump
    [C_LAT - 0.005, C_LNG - 0.005], # Back to Yard
]

features = []

def add_polygon(name, coords, speed_limit=None, color="#cccccc"):
    props = {"name": name, "color": color}
    if speed_limit: props["speed_limit_kmh"] = speed_limit
    features.append({
        "type": "Feature",
        "properties": props,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[ [lng, lat] for lat, lng in coords ]] # GeoJSON is [lng, lat]
        }
    })

# Add Zones
add_polygon("Yard", rect(C_LAT - 0.005, C_LNG - 0.005, 0.001, 0.001), speed_limit=15, color="#555555")
add_polygon("Loading", rect(C_LAT + 0.005, C_LNG + 0.005, 0.0015, 0.0015), speed_limit=20, color="#f39c12")
add_polygon("Dump", rect(C_LAT - 0.006, C_LNG + 0.008, 0.002, 0.002), speed_limit=20, color="#e74c3c")
add_polygon("Maintenance Bay", rect(C_LAT - 0.004, C_LNG - 0.006, 0.0005, 0.0005), speed_limit=10, color="#3498db")
add_polygon("Restricted", rect(C_LAT, C_LNG + 0.005, 0.001, 0.001), color="#c0392b")

# Haul Road Feature
features.append({
    "type": "Feature",
    "properties": {
        "name": "Haul Road",
        "speed_limit_kmh": 40,
        "color": "#95a5a6"
    },
    "geometry": {
        "type": "LineString",
        "coordinates": [ [lng, lat] for lat, lng in haul_road_coords ]
    }
})

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open("site_map.json", "w") as f:
    json.dump(geojson, f, indent=2)

print("Generated site_map.json")
