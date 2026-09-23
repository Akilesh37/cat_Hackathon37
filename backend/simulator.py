"""
Machine Simulator Engine:
Runs as an asyncio background task ticking every 2 seconds.
Simulates realistic machine GPS progression along routes and inside zone polygons,
emits telemetry and position via Socket.IO simultaneously to 'admin_fleet' and 'operator_{id}',
persists historical time-series points to database, and runs deterministic safety checks.
"""
import asyncio
import logging
import math
from datetime import datetime
from typing import Dict, Any, List
from database import SessionLocal
import models
import sockets
import rules_engine
from training_engine import auto_assign_training

logger = logging.getLogger("cat_simulator")

# In-memory simulator state tracker for smooth movement interpolation
# Key: machine_id -> { progress_t: float (0.0 to 1.0), direction: int (1 or -1), ... }
MACHINE_SIM_STATE: Dict[int, Dict[str, Any]] = {}

def get_point_along_polyline(coords: List[List[float]], t: float) -> List[float]:
    """
    Interpolates a [lat, lng] along an array of points for t in [0.0, 1.0].
    """
    if not coords:
        return [28.6139, 77.2090]
    if len(coords) == 1:
        return coords[0]

    num_segments = len(coords) - 1
    scaled_t = t * num_segments
    segment_idx = min(int(scaled_t), num_segments - 1)
    seg_t = scaled_t - segment_idx

    p1 = coords[segment_idx]
    p2 = coords[segment_idx + 1]

    lat = p1[0] + (p2[0] - p1[0]) * seg_t
    lng = p1[1] + (p2[1] - p1[1]) * seg_t
    return [lat, lng]

def calculate_heading(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculates compass heading angle in degrees (0-360) from point 1 to point 2.
    """
    d_lng = math.radians(lng2 - lng1)
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    y = math.sin(d_lng) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(d_lng)
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360) % 360

async def simulation_loop(interval_seconds: float = 2.0):
    logger.info(f"Starting Machine Telemetry & GPS Simulator (tick={interval_seconds}s)...")
    tick_count = 0

    while True:
        try:
            await asyncio.sleep(interval_seconds)
            tick_count += 1
            db = SessionLocal()

            try:
                machines = db.query(models.Machine).all()
                zones_map = {z.id: z for z in db.query(models.Zone).all()}

                for machine in machines:
                    # Find active task and assigned operator
                    active_task = db.query(models.Task).filter(
                        models.Task.machine_id == machine.id,
                        models.Task.status.in_(["In Progress", "Pending"])
                    ).first()

                    operator_id = active_task.operator_id if active_task else None
                    if not operator_id:
                        # Check shift assignment
                        shift_ass = db.query(models.OperatorShiftAssignment).filter(
                            models.OperatorShiftAssignment.machine_id == machine.id
                        ).first()
                        if shift_ass:
                            operator_id = shift_ass.operator_id

                    # Initialize or get sim state
                    state = MACHINE_SIM_STATE.setdefault(machine.id, {
                        "t": 0.0,
                        "direction": 1,
                        "idle_seconds": 0,
                        "fuel_level": machine.fuel_level or 85.0,
                        "temp": machine.hydraulic_temp or 68.0,
                        "hours": machine.engine_hours or 1200.0,
                        "prev_lat": machine.current_lat or 28.6145,
                        "prev_lng": machine.current_lng or 77.2095,
                        "was_inside": True
                    })

                    new_lat = state["prev_lat"]
                    new_lng = state["prev_lng"]
                    speed = 0.0
                    heading = 0.0
                    inside_geofence = True
                    zone_id = active_task.zone_id if active_task else None

                    # Calculate new GPS coordinate
                    if active_task and active_task.route_geojson and len(active_task.route_geojson) > 1:
                        # Machine is traveling along a predefined route (e.g. Tipper Truck)
                        # Progress along route: step ~0.015 per tick
                        state["t"] += 0.015 * state["direction"]
                        if state["t"] >= 1.0:
                            state["t"] = 1.0
                            state["direction"] = -1 # Reverse trip or return
                        elif state["t"] <= 0.0:
                            state["t"] = 0.0
                            state["direction"] = 1

                        point = get_point_along_polyline(active_task.route_geojson, state["t"])
                        new_lat, new_lng = point[0], point[1]
                        speed = 28.5 if machine.type in ["Dump Truck", "Tipper"] else 12.0
                        heading = calculate_heading(state["prev_lat"], state["prev_lng"], new_lat, new_lng)
                        state["idle_seconds"] = 0

                    elif zone_id and zone_id in zones_map:
                        # Machine is excavating or grading within a zone polygon
                        zone = zones_map[zone_id]
                        poly = zone.polygon_geojson or []

                        # Circular/elliptical sweep within zone centroid
                        state["t"] = (state["t"] + 0.02) % 1.0
                        angle = state["t"] * 2 * math.pi

                        # Get centroid of zone
                        if poly and len(poly) >= 3:
                            cent_lat = sum(p[0] for p in poly) / len(poly)
                            cent_lng = sum(p[1] for p in poly) / len(poly)
                        else:
                            cent_lat, cent_lng = 28.6145, 77.2095

                        # Slight radius drift
                        radius_lat = 0.0006
                        radius_lng = 0.0008

                        # For demo of geofence breach on CAT 140 (machine_code contains '140'):
                        if "140" in machine.machine_code and (tick_count % 60) in range(25, 35):
                            # Temporarily step outside polygon to trigger real-time geofence alert!
                            new_lat = cent_lat + radius_lat * 2.5 * math.cos(angle)
                            new_lng = cent_lng + radius_lng * 2.5 * math.sin(angle)
                        else:
                            new_lat = cent_lat + radius_lat * math.cos(angle)
                            new_lng = cent_lng + radius_lng * math.sin(angle)

                        speed = 3.8 if machine.status == "running" else 0.0
                        heading = (math.degrees(angle) + 90) % 360

                        # Check geofence
                        inside_geofence = rules_engine.geofence_check([new_lat, new_lng], poly)

                    else:
                        # Idle machine
                        state["idle_seconds"] += int(interval_seconds)
                        speed = 0.0

                    # Telemetry drift simulation
                    if speed > 0:
                        state["fuel_level"] = max(5.0, state["fuel_level"] - 0.008)
                        state["hours"] += (interval_seconds / 3600.0)
                        # Normal operating temp fluctuates between 65°C and 74°C
                        state["temp"] = 68.0 + 3.0 * math.sin(tick_count * 0.1)
                        seatbelt_status = True
                    else:
                        state["idle_seconds"] += int(interval_seconds)
                        state["fuel_level"] = max(5.0, state["fuel_level"] - 0.001)
                        state["temp"] = max(50.0, state["temp"] - 0.05)
                        seatbelt_status = (machine.status == "running")

                    # Update machine in DB
                    machine.current_lat = new_lat
                    machine.current_lng = new_lng
                    machine.fuel_level = round(state["fuel_level"], 1)
                    machine.hydraulic_temp = round(state["temp"], 1)
                    machine.engine_hours = round(state["hours"], 2)

                    # Geofence breach detection: if just transitioned from inside to outside
                    if state.get("was_inside", True) and not inside_geofence:
                        alert_msg = f"Geofence breach: Machine {machine.machine_code} exited authorized work boundary!"
                        new_alert = models.Alert(
                            alert_type="Geofence",
                            priority_rank=1,
                            machine_id=machine.id,
                            operator_id=operator_id,
                            message=alert_msg,
                            severity="Critical",
                            status="Active",
                            created_at=datetime.utcnow()
                        )
                        db.add(new_alert)
                        db.commit()
                        db.refresh(new_alert)

                        # Broadcast alert to all clients
                        await sockets.broadcast_new_alert({
                            "id": new_alert.id,
                            "alert_type": new_alert.alert_type,
                            "priority_rank": new_alert.priority_rank,
                            "machine_id": new_alert.machine_id,
                            "operator_id": new_alert.operator_id,
                            "message": new_alert.message,
                            "severity": new_alert.severity,
                            "created_at": new_alert.created_at.isoformat()
                        })

                        # Auto-assign safety training
                        if operator_id:
                            auto_assign_training(db, operator_id, "geofence_breach", new_alert.id)

                    state["was_inside"] = inside_geofence
                    state["prev_lat"] = new_lat
                    state["prev_lng"] = new_lng

                    # Record position in machine_positions table
                    pos_record = models.MachinePosition(
                        machine_id=machine.id,
                        lat=new_lat,
                        lng=new_lng,
                        heading=round(heading, 1),
                        speed_kmh=round(speed, 1),
                        zone_id=zone_id,
                        inside_geofence=inside_geofence,
                        time=datetime.utcnow()
                    )
                    db.add(pos_record)

                    # Record telemetry in telemetry table
                    tel_record = models.Telemetry(
                        machine_id=machine.id,
                        engine_hours=machine.engine_hours,
                        fuel_level=machine.fuel_level,
                        hydraulic_temp=machine.hydraulic_temp,
                        load_cycle=active_task.completed_quantity if active_task else 0,
                        idle_seconds=state["idle_seconds"],
                        speed_kmh=round(speed, 1),
                        seatbelt_status=seatbelt_status,
                        time=datetime.utcnow()
                    )
                    db.add(tel_record)

                    # Prepare payloads for real-time Socket.IO emission
                    pos_payload = {
                        "machine_id": machine.id,
                        "task_id": active_task.id if active_task else None,
                        "zone_id": zone_id,
                        "lat": round(new_lat, 6),
                        "lng": round(new_lng, 6),
                        "heading": round(heading, 1),
                        "speed_kmh": round(speed, 1),
                        "inside_geofence": inside_geofence,
                        "timestamp": datetime.utcnow().isoformat()
                    }

                    tel_payload = {
                        "machine_id": machine.id,
                        "fuel_level": machine.fuel_level,
                        "hydraulic_temp": machine.hydraulic_temp,
                        "engine_hours": machine.engine_hours,
                        "idle_seconds": state["idle_seconds"],
                        "seatbelt_status": seatbelt_status,
                        "speed_kmh": round(speed, 1),
                        "timestamp": datetime.utcnow().isoformat()
                    }

                    # BROADCAST SYNCHRONIZED POSITION TO BOTH ROOMS SIMULTANEOUSLY
                    await sockets.broadcast_position(pos_payload, operator_id=operator_id)
                    # BROADCAST TELEMETRY
                    await sockets.broadcast_telemetry(tel_payload)

                db.commit()

            except Exception as e:
                db.rollback()
                logger.error(f"Error in simulation tick: {e}", exc_info=True)
            finally:
                db.close()

        except asyncio.CancelledError:
            logger.info("Simulation loop stopped.")
            break
        except Exception as e:
            logger.error(f"Unexpected error in simulator: {e}")
            await asyncio.sleep(2.0)
