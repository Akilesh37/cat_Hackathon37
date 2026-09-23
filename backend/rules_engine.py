"""
Deterministic Pure-Python Rule Engine for Safety-Critical Gating.
Zero LLM reliance — guaranteed deterministic responses for life-safety checks.
"""
from typing import List, Tuple, Optional, Dict, Any
import math

def point_in_polygon(point: List[float], polygon: List[List[float]]) -> bool:
    """
    Ray-casting algorithm to determine if a [lat, lng] is inside a polygon [[lat, lng], ...].
    """
    if not polygon or len(polygon) < 3:
        return True # Default to inside if polygon not defined

    x, y = point[0], point[1]
    n = len(polygon)
    inside = False

    p1x, p1y = polygon[0][0], polygon[0][1]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n][0], polygon[i % n][1]
        if min(p1y, p2y) < y <= max(p1y, p2y):
            if x <= max(p1x, p2x):
                if p1y != p2y:
                    xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                if p1x == p2x or x <= xinters:
                    inside = not inside
        p1x, p1y = p2x, p2y

    return inside

def calculate_distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Haversine formula to compute distance between two lat/lng points in meters.
    """
    R = 6371000  # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def seatbelt_ok(speed_kmh: float, seatbelt_status: bool) -> bool:
    """
    Seatbelt check: If machine is moving (> 1 km/h), seatbelt must be fastened.
    """
    if speed_kmh > 1.0 and not seatbelt_status:
        return False
    return True

def proximity_breach(lat: float, lng: float, obstacles: List[Dict[str, Any]], threshold_m: float = 8.0) -> Tuple[bool, Optional[str]]:
    """
    Evaluates if machine is within dangerous proximity to ground workers or fixed obstacles.
    """
    for obs in obstacles:
        dist = calculate_distance_meters(lat, lng, obs.get("lat", 0.0), obs.get("lng", 0.0))
        if dist < threshold_m:
            return True, f"Proximity alert: {obs.get('name', 'Ground worker / hazard')} detected at {dist:.1f}m (Threshold: {threshold_m}m)"
    return False, None

def pre_start_block_reasons(checklist: Dict[str, bool], machine: Dict[str, Any]) -> List[str]:
    """
    Determines if machine ignition/task start is blocked due to pre-start safety checklist failures
    or machine fluid / system issues.
    """
    reasons = []

    # Mandatory checklist items
    if not checklist.get("seatbelt_functioning", False):
        reasons.append("Pre-start Block: Seatbelt mechanism inspection not verified.")
    if not checklist.get("walkaround_inspection_passed", False):
        reasons.append("Pre-start Block: Visual walkaround inspection incomplete or flagged.")
    if not checklist.get("backup_alarm_functional", False):
        reasons.append("Pre-start Block: Backup audible alarm / horn test failed.")
    if not checklist.get("mirrors_and_cameras_clean", False):
        reasons.append("Pre-start Block: Blind-spot mirrors or Cat Detect cameras obstructed.")

    # Machine condition checks
    fuel = machine.get("fuel_level", 100.0)
    if fuel < 15.0:
        reasons.append(f"Pre-start Block: Fuel level critical ({fuel:.1f}%). Must refuel before shift start.")

    coolant = machine.get("coolant_status", "Normal")
    if coolant.lower() in ["low", "critical", "leak"]:
        reasons.append(f"Pre-start Block: Engine coolant status is '{coolant}'.")

    engine_oil = machine.get("engine_oil_status", "Normal")
    if engine_oil.lower() in ["low", "critical", "degraded"]:
        reasons.append(f"Pre-start Block: Engine oil status is '{engine_oil}'.")

    return reasons

def geofence_check(point: List[float], polygon: List[List[float]]) -> bool:
    """
    Returns True if machine point [lat, lng] is safely within assigned zone polygon.
    """
    return point_in_polygon(point, polygon)

def idle_threshold_exceeded(idle_seconds: int, max_idle_minutes: float = 20.0) -> bool:
    """
    Flags when idle duration exceeds site efficiency threshold.
    """
    return idle_seconds > (max_idle_minutes * 60)

def hydraulic_temp_anomaly(temp_c: float, max_temp_c: float = 85.0) -> bool:
    """
    Flags hydraulic fluid overheating beyond normal CAT operating window (60-82°C).
    """
    return temp_c > max_temp_c
