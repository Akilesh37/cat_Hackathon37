import argparse
import asyncio
import json
import logging
import math
import random
from datetime import datetime, timedelta
import yaml

from sqlalchemy.orm import Session
from database import SessionLocal
import models
import sockets

logger = logging.getLogger("cat_synthetic_engine")
logging.basicConfig(level=logging.INFO)

class SyntheticEngine:
    def __init__(self, config_path: str, seed: int):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
        
        self.seed = seed
        random.seed(self.seed)
        
        with open("site_map.json", "r") as f:
            self.site_map = json.load(f)
            
        self.tick_interval = self.config.get("tick_interval", 2.0)
        self.thresholds = self.config["thresholds"]
        self.physics = self.config["physics"]
        self.truck_states = {}
        self.db = SessionLocal()
        
        # Load machines
        self.machines = self.db.query(models.Machine).filter(
            models.Machine.type.in_(["Dump Truck", "truck", "Tipper", "Hydraulic Excavator", "Motor Grader", "Compactor"])
        ).all()
        
        self.active_scenarios = {}
        self.weather = "Clear"
        self.time_now = datetime.utcnow()
        
    def _get_haul_road(self):
        for feature in self.site_map["features"]:
            if feature["properties"].get("name") == "Haul Road":
                return feature["geometry"]["coordinates"]
        return []

    def init_state(self):
        haul_road = self._get_haul_road()
        for i, m in enumerate(self.machines):
            is_truck = m.type in ["Dump Truck", "truck", "Tipper"]
            t_start = (i / len(self.machines)) % 1.0 if is_truck else 0.0
            
            # Start Excavators and Graders inside zones
            lat, lng = haul_road[0][1], haul_road[0][0]
            if not is_truck:
                lat, lng = 28.6145, 77.2095 # Center roughly
                
            self.truck_states[m.id] = {
                "t": t_start,
                "direction": 1,
                "is_truck": is_truck,
                "payload": 0.0,
                "fuel": m.fuel_level or 100.0,
                "temp": m.hydraulic_temp or 65.0,
                "tyre_pressure": [100.0] * 6,
                "idle_ticks": 0,
                "seatbelt": True,
                "hours": m.engine_hours or 1000.0,
                "lat": lat,
                "lng": lng,
                "active_scenarios": set(),
                "cycle_count": 0,
                "speed": 0.0
            }

    def _interpolate_polyline(self, coords, t):
        if not coords: return [0, 0]
        num_segments = len(coords) - 1
        scaled_t = t * num_segments
        segment_idx = min(int(scaled_t), num_segments - 1)
        seg_t = scaled_t - segment_idx
        p1, p2 = coords[segment_idx], coords[segment_idx + 1]
        return [p1[0] + (p2[0] - p1[0]) * seg_t, p1[1] + (p2[1] - p1[1]) * seg_t]

    def _get_zone_at(self, lat, lng):
        # A simple bounding box check for speed limits
        for feature in self.site_map["features"]:
            if feature["geometry"]["type"] == "Polygon":
                coords = feature["geometry"]["coordinates"][0]
                lats = [c[1] for c in coords]
                lngs = [c[0] for c in coords]
                if min(lats) <= lat <= max(lats) and min(lngs) <= lng <= max(lngs):
                    return feature["properties"]
        return None

    def tick(self, time_now: datetime, scenario_rate: float):
        import os
        trigger_file = "scenario_triggers.json"
        manual_triggers = []
        if os.path.exists(trigger_file):
            try:
                with open(trigger_file, "r") as f:
                    manual_triggers = json.load(f)
                os.remove(trigger_file) # consume them
            except:
                pass
                
        haul_road = self._get_haul_road()
        updates = []
        
        # Scenario 9: Rain
        if random.random() < (scenario_rate * 0.05 / 3600.0) or any(t["scenario_id"] == 9 for t in manual_triggers): 
            self.weather = "Rain" if self.weather == "Clear" else "Clear"
            
        for m in self.machines:
            state = self.truck_states[m.id]
            is_truck = state["is_truck"]
            
            # Apply manual triggers
            for t in manual_triggers:
                if t["machine_id"] is None or t["machine_id"] == m.id:
                    state["active_scenarios"].add(t["scenario_id"])
                    logger.info(f"Manual Scenario {t['scenario_id']} on {m.machine_code}")
                    
            if random.random() < (scenario_rate / 3600.0):
                scenario_id = random.randint(1, 12)
                state["active_scenarios"].add(scenario_id)
                logger.info(f"Triggered Scenario {scenario_id} on {m.machine_code}")

            if not is_truck:
                # Basic idle movement for non-trucks
                state["speed"] = 3.0
                state["lat"] += (random.random() - 0.5) * 0.0001
                state["lng"] += (random.random() - 0.5) * 0.0001
            else:
                target_speed = 40.0
                is_idle = False
                
                # Progression
                if state["t"] < 0.05:
                    target_speed = 15.0 # Yard
                elif 0.35 < state["t"] < 0.45:
                    target_speed = 0.0 # Loading
                    is_idle = True
                    state["payload"] = min(self.thresholds["max_payload_tons"], state["payload"] + 5.0)
                    if state["payload"] >= self.thresholds["max_payload_tons"]:
                        state["t"] += 0.02
                elif 0.75 < state["t"] < 0.85:
                    target_speed = 0.0 # Dump
                    is_idle = True
                    state["payload"] = max(0.0, state["payload"] - 10.0)
                    if state["payload"] <= 0:
                        state["t"] += 0.02
                        state["cycle_count"] += 1
                else:
                    target_speed = 40.0

                if self.weather == "Rain":
                    target_speed *= 0.7
                    
                # Apply Scenarios
                if 1 in state["active_scenarios"]: state["seatbelt"] = False
                if 2 in state["active_scenarios"]: target_speed *= 1.3
                if 4 in state["active_scenarios"]: 
                    target_speed = 0.0; is_idle = True
                if 7 in state["active_scenarios"]: state["tyre_pressure"][0] = max(50.0, state["tyre_pressure"][0] - 0.5)
                if 8 in state["active_scenarios"]: 
                    if 0.35 < state["t"] < 0.45: state["payload"] = self.thresholds["max_payload_tons"] * 1.2
                if 10 in state["active_scenarios"]:
                    state["fuel"] = max(5.0, state["fuel"] - 1.0)
                
                speed = target_speed if not is_idle else 0.0
                state["speed"] = speed
                
                if speed > 0:
                    dist_step = (speed / 3.6) * self.tick_interval
                    t_step = dist_step / 10000.0 
                    state["t"] = (state["t"] + t_step) % 1.0
                    
                lng, lat = self._interpolate_polyline(haul_road, state["t"])
                state["lat"], state["lng"] = lat, lng

            # Physics
            load_factor = 1.0 + (state["payload"] / self.thresholds["max_payload_tons"])
            if 8 in state["active_scenarios"]: load_factor += 0.5
            
            if state["speed"] > 0:
                state["fuel"] -= self.physics["fuel_burn_loaded"] * load_factor * self.tick_interval
                state["temp"] += self.physics["heating_rate"] * load_factor * self.tick_interval
                state["idle_ticks"] = 0
            else:
                state["fuel"] -= self.physics["fuel_burn_idle"] * self.tick_interval
                state["temp"] = max(65.0, state["temp"] - self.physics["cooling_rate"] * self.tick_interval)
                state["idle_ticks"] += 1

            if 6 in state["active_scenarios"]: state["temp"] += 0.5 * self.tick_interval
                
            state["fuel"] = max(0.0, state["fuel"])
            state["temp"] = min(120.0, state["temp"])
            state["hours"] += self.tick_interval / 3600.0
            
            updates.append({
                "machine": m,
                "lat": state["lat"],
                "lng": state["lng"],
                "speed_kmh": state["speed"],
                "payload": state["payload"],
                "fuel_level": state["fuel"],
                "hydraulic_temp": state["temp"],
                "seatbelt_status": state["seatbelt"],
                "engine_hours": state["hours"],
                "idle_seconds": state["idle_ticks"] * self.tick_interval,
                "time": time_now
            })
            
        # Scenario 5 Proximity
        for i in range(len(updates)):
            for j in range(i+1, len(updates)):
                m1, m2 = updates[i], updates[j]
                dist = math.hypot(m1["lat"] - m2["lat"], m1["lng"] - m2["lng"]) * 111000
                if dist < self.thresholds["proximity_radius_m"]:
                    self.truck_states[m1["machine"].id]["active_scenarios"].add(5)
                    self.truck_states[m2["machine"].id]["active_scenarios"].add(5)
                    # Force speed to 0 as safety response
                    m1["speed_kmh"] = 0
                    m2["speed_kmh"] = 0

        return updates

    async def broadcast_updates(self, updates):
        for u in updates:
            m = u["machine"]
            # Broadcast Position
            pos_payload = {
                "machine_id": m.id,
                "lat": round(u["lat"], 6),
                "lng": round(u["lng"], 6),
                "speed_kmh": round(u["speed_kmh"], 1),
                "heading": 0.0, # Placeholder
                "timestamp": u["time"].isoformat()
            }
            # Broadcast Telemetry
            tel_payload = {
                "machine_id": m.id,
                "fuel_level": round(u["fuel_level"], 1),
                "hydraulic_temp": round(u["hydraulic_temp"], 1),
                "engine_hours": round(u["engine_hours"], 2),
                "idle_seconds": int(u["idle_seconds"]),
                "seatbelt_status": u["seatbelt_status"],
                "speed_kmh": round(u["speed_kmh"], 1),
                "timestamp": u["time"].isoformat()
            }
            await sockets.broadcast_position(pos_payload)
            await sockets.broadcast_telemetry(tel_payload)
            
            # Persist to DB directly
            self.db.add(models.MachinePosition(
                machine_id=m.id, lat=u["lat"], lng=u["lng"], speed_kmh=u["speed_kmh"], time=u["time"]
            ))
            self.db.add(models.Telemetry(
                machine_id=m.id, fuel_level=u["fuel_level"], hydraulic_temp=u["hydraulic_temp"],
                engine_hours=u["engine_hours"], idle_seconds=u["idle_seconds"],
                speed_kmh=u["speed_kmh"], seatbelt_status=u["seatbelt_status"], time=u["time"]
            ))
            
            state = self.truck_states[m.id]
            incidents_created = 0
            
            # Simple Alerting and Incident Creation
            if not u["seatbelt_status"] and 1 in state["active_scenarios"]:
                await self._emit_alert(m.id, "Seatbelt Disengaged", 2, "Warning")
                self._create_incident(m.id, u, "Seatbelt Disengaged")
                state["active_scenarios"].remove(1)
                incidents_created += 1
                
            if u["hydraulic_temp"] > self.thresholds["max_hydraulic_temp_c"] and 6 in state["active_scenarios"]:
                await self._emit_alert(m.id, "Hydraulic Overheat", 1, "Critical")
                self._create_incident(m.id, u, "Hydraulic Overheat")
                state["active_scenarios"].remove(6)
                incidents_created += 1
                
            if 2 in state["active_scenarios"] and u["speed_kmh"] > 40:
                await self._emit_alert(m.id, "Overspeed Detected", 2, "Warning")
                self._create_incident(m.id, u, "Overspeed")
                state["active_scenarios"].remove(2)
                incidents_created += 1
                
            if 5 in state["active_scenarios"]:
                await self._emit_alert(m.id, "Proximity Warning", 1, "Critical")
                self._create_incident(m.id, u, "Proximity Collision Risk")
                state["active_scenarios"].remove(5)
                incidents_created += 1
                
            if u["idle_seconds"] > self.thresholds["max_idle_minutes"] * 60:
                await self._emit_alert(m.id, "Excessive Idle", 4, "Info")
                if 4 in state["active_scenarios"]: state["active_scenarios"].remove(4)

            # ETA and Performance Updates
            if u["cycle"] > 0 and state["is_truck"]:
                task = self.db.query(models.Task).filter(models.Task.machine_id == m.id, models.Task.status == "In Progress").first()
                if task:
                    task.completed_quantity = u["cycle"] * self.thresholds["max_payload_tons"]
                    
                    # Update ETA
                    eta_rec = self.db.query(models.ETAPrediction).filter(models.ETAPrediction.task_id == task.id).first()
                    if not eta_rec:
                        eta_rec = models.ETAPrediction(task_id=task.id)
                        self.db.add(eta_rec)
                        
                    eta_rec.weather_adjustment_min = 20.0 if self.weather == "Rain" else 0.0
                    eta_rec.idle_adjustment_min = (u["idle_seconds"] / 60.0)
                    eta_rec.machine_condition_adjustment_min = 15.0 if 7 in state["active_scenarios"] else 0.0
                    eta_rec.final_eta_min = eta_rec.base_estimate_min + eta_rec.weather_adjustment_min + eta_rec.idle_adjustment_min + eta_rec.machine_condition_adjustment_min
                    
                    # Update Performance
                    perf = self.db.query(models.OperatorPerformance).filter(models.OperatorPerformance.task_id == task.id).first()
                    if not perf:
                        perf = models.OperatorPerformance(task_id=task.id, operator_id=task.operator_id)
                        self.db.add(perf)
                    
                    perf.safety_events_count += incidents_created
                    perf.idle_time_min = (u["idle_seconds"] / 60.0)
                    perf.score_out_of_100 = max(0, 100 - (perf.safety_events_count * 10) - (perf.idle_time_min * 2))
                    
                    # Auto-assign Training if score < 80
                    if perf.score_out_of_100 < 80 and incidents_created > 0:
                        module = self.db.query(models.TrainingModule).first()
                        if module and task.operator_id:
                            existing = self.db.query(models.TrainingAssignment).filter(
                                models.TrainingAssignment.operator_id == task.operator_id,
                                models.TrainingAssignment.status == "Assigned"
                            ).first()
                            if not existing:
                                tr = models.TrainingAssignment(operator_id=task.operator_id, module_id=module.id)
                                self.db.add(tr)
                                await self._emit_alert(m.id, "Training Auto-Assigned for Operator", 3, "Info")

        self.db.commit()

    def _create_incident(self, machine_id, u, description):
        inc = models.Incident(
            incident_type=description,
            machine_id=machine_id,
            location_lat=u["lat"],
            location_lng=u["lng"],
            description=f"{description} detected on machine at {u['time']}",
            severity="High"
        )
        self.db.add(inc)

    async def _emit_alert(self, machine_id, msg, priority, severity):
        alert = models.Alert(
            alert_type="Safety",
            priority_rank=priority,
            machine_id=machine_id,
            message=msg,
            severity=severity,
            status="Active",
            created_at=datetime.utcnow()
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        await sockets.broadcast_new_alert({
            "id": alert.id,
            "alert_type": alert.alert_type,
            "priority_rank": alert.priority_rank,
            "machine_id": alert.machine_id,
            "message": alert.message,
            "severity": alert.severity,
            "created_at": alert.created_at.isoformat()
        })

async def live_loop(speed_multiplier: float, scenario_rate: float, seed: int):
    logger.info(f"Starting Live Engine (Speed {speed_multiplier}x)")
    engine = SyntheticEngine("config.yaml", seed)
    engine.init_state()
    
    interval = engine.tick_interval / speed_multiplier
    time_now = datetime.utcnow()
    
    while True:
        updates = engine.tick(time_now, scenario_rate)
        await engine.broadcast_updates(updates)
        time_now += timedelta(seconds=engine.tick_interval)
        await asyncio.sleep(interval)

def batch_loop(days: int, scenario_rate: float, seed: int):
    logger.info(f"Starting Batch Engine for {days} days...")
    # To implement later
    pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--batch", action="store_true")
    parser.add_argument("--days", type=int, default=1)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--scenario-rate", type=float, default=0.35)
    parser.add_argument("--speed", type=float, default=1.0)
    args = parser.parse_args()

    if args.batch:
        batch_loop(args.days, args.scenario_rate, args.seed)
    elif args.live:
        asyncio.run(live_loop(args.speed, args.scenario_rate, args.seed))
