"""
Seed Script:
Populates exact dummy/temp data matching the specification so the platform is
100% demo-ready out of the box with zero external hardware needed.
"""
from datetime import datetime, timedelta
from database import engine, SessionLocal, Base
import models
from rag.ingest import load_or_init_chunks

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if database is already seeded with basic data
    already_seeded = db.query(models.Zone).count() > 0

    if not already_seeded:
        print("Initial seed - clearing tables...")
        # Clear existing data to allow clean re-seeding
        try:
            db.query(models.CopilotQuery).delete()
            db.query(models.OperatorPerformance).delete()
            db.query(models.TrainingAssignment).delete()
            db.query(models.TrainingModule).delete()
            db.query(models.ETAPrediction).delete()
            db.query(models.Incident).delete()
            db.query(models.Alert).delete()
            db.query(models.Telemetry).delete()
            db.query(models.MachinePosition).delete()
            db.query(models.Task).delete()
            db.query(models.OperatorShiftAssignment).delete()
            db.query(models.Shift).delete()
            db.query(models.Zone).delete()
            db.query(models.Machine).delete()
            db.query(models.Operator).delete()
            db.query(models.SafetyThreshold).delete()
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Notice on table clean: {e}")

    if not already_seeded:
        print("Seeding Zones...")
        zone_a = models.Zone(
            zone_code="Zone A",
            name="Foundation Excavation",
            site_id="Site A",
            polygon_geojson=[
                [28.6150, 77.2080],
                [28.6160, 77.2100],
                [28.6145, 77.2115],
                [28.6135, 77.2095]
            ],
            color_hex="#2FA84F" # Green
        )
        zone_b = models.Zone(
            zone_code="Zone B",
            name="Backfill Operations",
            site_id="Site A",
            polygon_geojson=[
                [28.6110, 77.2120],
                [28.6125, 77.2145],
                [28.6105, 77.2160],
                [28.6090, 77.2135]
            ],
            color_hex="#9B51E0" # Purple
        )
        zone_c = models.Zone(
            zone_code="Zone C",
            name="Surface Grading",
            site_id="Site A",
            polygon_geojson=[
                [28.6170, 77.2120],
                [28.6185, 77.2145],
                [28.6170, 77.2170],
                [28.6155, 77.2145]
            ],
            color_hex="#2E6FDB" # Blue
        )
        db.add_all([zone_a, zone_b, zone_c])
        db.commit()
        print("Seeding Machines...")
        # CAT 320: Zone A Centroid
        m_320 = models.Machine(
            machine_code="CAT-320-01",
            type="Hydraulic Excavator",
            model="CAT 320",
            manufacture_year=2023,
            status="running",
            fuel_level=78.0,
            engine_hours=1850.5,
            hydraulic_temp=68.0,
            coolant_status="Normal",
            engine_oil_status="Normal",
            last_maintenance_date="2026-08-15",
            next_maintenance_hours=2000.0,
            manual_doc_path="/manuals/cat-operator-manual-320-323.pdf",
            current_lat=28.6147,
            current_lng=77.2097
        )
        # CAT 950: Zone A Edge
        m_950 = models.Machine(
            machine_code="CAT-950-01",
            type="Wheel Loader",
            model="CAT 950",
            manufacture_year=2022,
            status="idle",
            fuel_level=64.0,
            engine_hours=3210.0,
            hydraulic_temp=58.5,
            coolant_status="Normal",
            engine_oil_status="Normal",
            last_maintenance_date="2026-07-10",
            next_maintenance_hours=3500.0,
            manual_doc_path="/manuals/956882007-Front-Loader-Manual-HRM.pdf",
            current_lat=28.6136,
            current_lng=77.2096
        )
        # CAT 140: Zone C
        m_140 = models.Machine(
            machine_code="CAT-140-01",
            type="Motor Grader",
            model="CAT 140",
            manufacture_year=2022,
            status="running",
            fuel_level=82.0,
            engine_hours=4120.0,
            hydraulic_temp=71.2,
            coolant_status="Normal",
            engine_oil_status="Normal",
            last_maintenance_date="2026-08-01",
            next_maintenance_hours=4250.0,
            manual_doc_path=None,
            current_lat=28.6170,
            current_lng=77.2145
        )
        # CAT CS56: Zone B
        m_cs56 = models.Machine(
            machine_code="CAT-CS56-01",
            type="Compactor",
            model="CAT CS56",
            manufacture_year=2021,
            status="running",
            fuel_level=90.0,
            engine_hours=980.0,
            hydraulic_temp=66.0,
            coolant_status="Normal",
            engine_oil_status="Normal",
            last_maintenance_date="2026-09-01",
            next_maintenance_hours=1200.0,
            manual_doc_path=None,
            current_lat=28.6107,
            current_lng=77.2140
        )
        # Tipper TN-XX-1234: Quarry Site A
        m_tipper = models.Machine(
            machine_code="Tipper TN-XX-1234",
            type="Dump Truck",
            model="Tipper 797F",
            manufacture_year=2023,
            status="running",
            fuel_level=72.0,
            engine_hours=1450.0,
            hydraulic_temp=62.0,
            coolant_status="Normal",
            engine_oil_status="Normal",
            last_maintenance_date="2026-08-20",
            next_maintenance_hours=1750.0,
            manual_doc_path="/manuals/944413905-Work-Truck-Systems-797F-March-2012.pdf",
            current_lat=28.6210,
            current_lng=77.2050
        )
        db.add_all([m_320, m_950, m_140, m_cs56, m_tipper])
        db.commit()

        print("Seeding Shifts...")
        s1 = models.Shift(shift_code="Shift 1", start_time="06:00", end_time="14:00", site_id="Site A")
        s2 = models.Shift(shift_code="Shift 2", start_time="14:00", end_time="22:00", site_id="Site A")
        db.add_all([s1, s2])
        db.commit()

        print("Seeding Operators...")
        op1 = models.Operator(
            operator_code="OP-001",
            name="Ravi Kumar",
            role="Excavator Operator",
            phone="+91 98765 43210",
            license_no="DL-HE-2018-0982",
            cert_expiry_date="2027-12-31",
            pin="1234"
        )
        op2 = models.Operator(
            operator_code="OP-002",
            name="Suresh P.",
            role="Loader Operator",
            phone="+91 98765 43211",
            license_no="DL-HE-2019-1144",
            cert_expiry_date="2028-06-30",
            pin="1234"
        )
        op3 = models.Operator(
            operator_code="OP-003",
            name="Kumar R.",
            role="Truck Driver",
            phone="+91 98765 43212",
            license_no="DL-HTV-2017-4401",
            cert_expiry_date="2027-09-15",
            pin="1234"
        )
        db.add_all([op1, op2, op3])
        db.commit()

        print("Seeding Shift Assignments...")
        sa1 = models.OperatorShiftAssignment(operator_id=op1.id, machine_id=m_320.id, shift_id=s1.id, status="Active")
        sa2 = models.OperatorShiftAssignment(operator_id=op2.id, machine_id=m_950.id, shift_id=s1.id, status="Active")
        sa3 = models.OperatorShiftAssignment(operator_id=op3.id, machine_id=m_tipper.id, shift_id=s2.id, status="Active")
        db.add_all([sa1, sa2, sa3])
        db.commit()

        print("Seeding Tasks...")
        # T-001: Excavation in Zone A
        t1 = models.Task(
            task_code="T-001",
            task_type="Excavation",
            operator_id=op1.id,
            machine_id=m_320.id,
            zone_id=zone_a.id,
            material_type="Hard Clay / Soil",
            from_location="Zone A North Pit",
            to_location="Zone A Stockpile",
            from_lat=28.6150,
            from_lng=77.2085,
            to_lat=28.6140,
            to_lng=77.2105,
            route_geojson=[
                [28.6150, 77.2085],
                [28.6148, 77.2095],
                [28.6140, 77.2105]
            ],
            target_quantity=200.0,
            unit="m3",
            completed_quantity=145.0,
            priority="Medium",
            status="In Progress",
            route_distance_km=0.25,
            route_duration_min=45.0,
            weather_risk_flag=False,
            start_time=datetime.utcnow() - timedelta(hours=3),
            created_at=datetime.utcnow() - timedelta(hours=4)
        )

        # T-002: Loading in Zone A
        t2 = models.Task(
            task_code="T-002",
            task_type="Loading",
            operator_id=op2.id,
            machine_id=m_950.id,
            zone_id=zone_a.id,
            material_type="Gravel Aggregate",
            from_location="Zone A Stockpile",
            to_location="Hopper Bin 2",
            from_lat=28.6136,
            from_lng=77.2096,
            to_lat=28.6142,
            to_lng=77.2102,
            target_quantity=40.0,
            unit="loads",
            completed_quantity=28.0,
            priority="Medium",
            status="In Progress",
            route_distance_km=0.15,
            route_duration_min=35.0,
            weather_risk_flag=False,
            start_time=datetime.utcnow() - timedelta(hours=2),
            created_at=datetime.utcnow() - timedelta(hours=3)
        )

        # T-003: Flagship Demo Task: Transport Quarry -> Zone B (Live Map Sync flagship!)
        quarry_route = [
            [28.6210, 77.2050], # Quarry Site A
            [28.6190, 77.2070],
            [28.6170, 77.2085],
            [28.6150, 77.2105],
            [28.6130, 77.2125],
            [28.6110, 77.2138]  # Zone B Backfill
        ]
        t3 = models.Task(
            task_code="T-003",
            task_type="Transport",
            operator_id=op3.id,
            machine_id=m_tipper.id,
            zone_id=zone_b.id,
            material_type="Crushed Limestone Base",
            from_location="Quarry Site A",
            to_location="Zone B Backfill",
            from_lat=28.6210,
            from_lng=77.2050,
            to_lat=28.6110,
            to_lng=77.2138,
            route_geojson=quarry_route,
            target_quantity=12.0,
            unit="trips",
            completed_quantity=0.0,
            priority="High",
            status="Pending",
            route_distance_km=1.85,
            route_duration_min=50.0,
            weather_risk_flag=True, # Triggers weather risk warning banner!
            created_at=datetime.utcnow() - timedelta(hours=1)
        )

        # T-004: Grading in Zone C
        t4 = models.Task(
            task_code="T-004",
            task_type="Grading",
            operator_id=None,
            machine_id=m_140.id,
            zone_id=zone_c.id,
            material_type="Sub-base Levelling",
            from_location="Zone C West",
            to_location="Zone C East",
            from_lat=28.6170,
            from_lng=77.2120,
            to_lat=28.6170,
            to_lng=77.2170,
            target_quantity=6000.0,
            unit="m2",
            completed_quantity=4200.0,
            priority="Low",
            status="In Progress",
            route_distance_km=0.8,
            route_duration_min=90.0,
            weather_risk_flag=False,
            created_at=datetime.utcnow() - timedelta(hours=5)
        )
        db.add_all([t1, t2, t3, t4])
        db.commit()

        print("Seeding Incidents & Alerts...")
        # Incident 1: Proximity alert (Zone B)
        inc1 = models.Incident(
            incident_type="Proximity Breach",
            machine_id=m_cs56.id,
            operator_id=op1.id,
            location_lat=28.6108,
            location_lng=77.2142,
            telemetry_snapshot={"speed_kmh": 4.2, "distance_m": 4.1, "sensor": "Cat Detect Radar Front"},
            description="Machine approached within 4.1m of ground spotter without audible horn acknowledgment.",
            severity="High",
            status="Under Review",
            created_at=datetime.utcnow() - timedelta(hours=2, minutes=45)
        )
        # Incident 2: Hydraulic temp anomaly (CAT 320)
        inc2 = models.Incident(
            incident_type="Hydraulic Overheat Anomaly",
            machine_id=m_320.id,
            operator_id=op1.id,
            location_lat=28.6147,
            location_lng=77.2097,
            telemetry_snapshot={"hydraulic_temp": 88.5, "engine_rpm": 1820, "ambient_c": 34.0},
            description="Hydraulic fluid reached 88.5°C during continuous heavy clay trenching.",
            severity="Medium",
            status="Closed",
            resolution_notes="Operator idled engine for 5 min. Radiator cooler cleared of dust debris.",
            created_at=datetime.utcnow() - timedelta(hours=1, minutes=30)
        )
        # Incident 3: Excessive idle (31 min, CAT 950)
        inc3 = models.Incident(
            incident_type="Excessive Idle Duration",
            machine_id=m_950.id,
            operator_id=op2.id,
            location_lat=28.6136,
            location_lng=77.2096,
            telemetry_snapshot={"idle_seconds": 1860, "fuel_burned_liters": 4.8},
            description="Loader remained stationary with engine running continuously for 31 minutes waiting for haul trucks.",
            severity="Low",
            status="Closed",
            created_at=datetime.utcnow() - timedelta(hours=3, minutes=10)
        )
        # Incident 4: Geofence breach (CAT 140 left Zone C)
        inc4 = models.Incident(
            incident_type="Geofence Breach Event",
            machine_id=m_140.id,
            operator_id=None,
            location_lat=28.6190,
            location_lng=77.2155,
            telemetry_snapshot={"zone_code": "Zone C", "boundary_deviation_m": 18.2},
            description="CAT 140 Grader crossed northern perimeter boundary of Zone C during turn-around sweep.",
            severity="High",
            status="Open",
            created_at=datetime.utcnow() - timedelta(minutes=45)
        )
        db.add_all([inc1, inc2, inc3, inc4])
        db.commit()

        # Create matching Alerts
        a1 = models.Alert(alert_type="Proximity", priority_rank=1, machine_id=m_cs56.id, operator_id=op1.id, message="Proximity Warning: Ground personnel detected at 4.1m (Zone B)", severity="Critical", status="Active")
        a2 = models.Alert(alert_type="Anomaly", priority_rank=2, machine_id=m_320.id, operator_id=op1.id, message="Hydraulic Fluid Temp elevated at 88.5°C (Threshold: 85.0°C)", severity="Warning", status="Acknowledged")
        a3 = models.Alert(alert_type="Idle", priority_rank=5, machine_id=m_950.id, operator_id=op2.id, message="Excessive Idle Detected: 31 minutes without hydraulic motion", severity="Warning", status="Active")
        a4 = models.Alert(alert_type="Geofence", priority_rank=1, machine_id=m_140.id, operator_id=None, message="Boundary Breach: CAT 140 crossed Zone C authorized work area", severity="Critical", status="Active")
        a5 = models.Alert(alert_type="Weather", priority_rank=3, machine_id=m_tipper.id, operator_id=op3.id, message="Muddy Haul Road Advisory: Rain forecast on Quarry ➔ Zone B corridor", severity="Warning", status="Active")
        db.add_all([a1, a2, a3, a4, a5])
        db.commit()

        print("Seeding Training Modules & 5-Question Quizzes...")
        quiz_seatbelt = [
            {"q": "When is it permissible to operate heavy machinery without a seatbelt?", "options": ["During low-speed travel (<5 km/h)", "Never — seatbelt must always be buckled", "Only inside enclosed cabs", "When performing pre-trip inspection"], "correct_answer_index": 1},
            {"q": "What does the ROPS structure rely on for operator survival?", "options": ["Airbags", "Operator remaining secured inside the cab envelope", "Emergency cab ejection", "Ballistic glass"], "correct_answer_index": 1},
            {"q": "What action does the Cat Smart Seatbelt interlock take when unbuckled during motion?", "options": ["Shuts off radio", "Sounds alarm and logs safety violation event", "Stops engine instantly", "Drains hydraulic tank"], "correct_answer_index": 1},
            {"q": "How often should operator seatbelts and latches be visually inspected?", "options": ["Annually", "Daily during pre-start walkaround", "Every 500 operating hours", "Only after an accident"], "correct_answer_index": 1},
            {"q": "What should you do if the seatbelt webbing is cut, frayed, or the buckle sticks?", "options": ["Tie a knot in the webbing", "Tag machine out and report for immediate replacement", "Operate carefully at half throttle", "Use electrical tape to repair"], "correct_answer_index": 1}
        ]

        quiz_proximity = [
            {"q": "What is the minimum safe exclusion zone around an active 360-degree swing excavator?", "options": ["2 meters", "The maximum bucket reach plus 5 meters", "1 meter", "Cab door length"], "correct_answer_index": 1},
            {"q": "What must an operator do before rotating or reversing if a person is in the blind spot?", "options": ["Accelerate to pass quickly", "Sound 2 horn blasts and make positive eye contact", "Turn off Cat Detect radar", "Close cabin door"], "correct_answer_index": 1},
            {"q": "How does Cat Detect with Smart Edge protect ground personnel?", "options": ["Deploys airbags", "Visual & audio in-cab alerts plus optional auto-slowdown", "Shuts off all site power", "Emits strobe lights"], "correct_answer_index": 1},
            {"q": "When approaching a designated work zone boundary, what system assists the operator?", "options": ["Cat Grade E-Fence", "Traction control", "Cruise control", "Auto-shift"], "correct_answer_index": 0},
            {"q": "What does a Priority 1 Proximity Alert indicate?", "options": ["Routine telemetry heartbeat", "Immediate hazard within the critical reaction buffer (<5m)", "Low windshield washer fluid", "Scheduled tea break"], "correct_answer_index": 1}
        ]

        quiz_idle = [
            {"q": "What is the primary operational consequence of excessive engine idling?", "options": ["Higher productivity", "Wasted fuel, Tier 4 DPF soot buildup, and unbilled machine wear", "Cleaner exhaust", "Extended tire life"], "correct_answer_index": 1},
            {"q": "What feature automatically reduces engine RPM when joysticks remain in neutral?", "options": ["Auto Engine Speed Control (AESC)", "Manual choke", "Hydrostatic overdrive", "Differential lock"], "correct_answer_index": 0},
            {"q": "What is the recommended idle cool-down period before shutting down after heavy cycle work?", "options": ["30 minutes", "3 to 5 minutes at low idle", "Immediate key shutoff", "1 hour"], "correct_answer_index": 1},
            {"q": "At what site threshold does the Cat Copilot flag an excessive idle warning?", "options": ["2 minutes", "15 to 20 minutes of continuous inactive run", "4 hours", "Never"], "correct_answer_index": 1},
            {"q": "Which operating mode on the Cat 320 optimizes fuel efficiency based on load demand?", "options": ["Power Mode only", "Smart Mode", "Limp Mode", "Sprint Mode"], "correct_answer_index": 1}
        ]

        quiz_machine = [
            {"q": "What is the normal operating temperature range for Cat 320 hydraulic oil?", "options": ["30°C to 45°C", "60°C to 82°C (140°F to 180°F)", "110°C to 130°C", "Below freezing"], "correct_answer_index": 1},
            {"q": "What action should you take if hydraulic temperature reaches Level 2 Warning (85°C)?", "options": ["Keep digging faster to finish earlier", "Idle engine at 800-1000 RPM, clean oil cooler cores, do not shutdown hot", "Pour cold water on the hydraulic pump", "Add engine coolant into hydraulic tank"], "correct_answer_index": 1},
            {"q": "Where is the hydraulic oil level sight glass checked on the Cat 320?", "options": ["Under the cabin floor", "Right-hand side of the upper structure with arm out and bucket curled", "Inside the fuel filler neck", "On the radiator cap"], "correct_answer_index": 1},
            {"q": "What does a Level 3 warning code on the Cat in-cab display demand?", "options": ["Ignore until end of shift", "Immediate safe machine shutdown to prevent catastrophic component failure", "Take a photo for Instagram", "Accelerate to depot"], "correct_answer_index": 1},
            {"q": "What type of engine oil is specified for Tier 4 Final Cat diesel engines?", "options": ["Standard vegetable oil", "Cat DEO-ULS (Ultra Low Sulfur) 15W-40 or 10W-30", "Brake fluid DOT 4", "Automatic transmission fluid"], "correct_answer_index": 1}
        ]

        mod_seatbelt = models.TrainingModule(title="Seatbelt Safety", category="Safety", video_url="https://www.youtube.com/watch?v=mock_seatbelt", duration_min=10, quiz_data=quiz_seatbelt)
        mod_proximity = models.TrainingModule(title="Proximity Awareness", category="Safety", video_url="https://www.youtube.com/watch?v=mock_proximity", duration_min=15, quiz_data=quiz_proximity)
        mod_idle = models.TrainingModule(title="Idle Management", category="Efficiency", video_url="https://www.youtube.com/watch?v=mock_idle", duration_min=12, quiz_data=quiz_idle)
        mod_machine = models.TrainingModule(title="Machine Awareness", category="Machine Operations", video_url="https://www.youtube.com/watch?v=mock_machine", duration_min=20, quiz_data=quiz_machine)
        db.add_all([mod_seatbelt, mod_proximity, mod_idle, mod_machine])
        db.commit()

        # Assign initial training to operators based on the seed incidents
        ta1 = models.TrainingAssignment(operator_id=op1.id, module_id=mod_proximity.id, triggered_by_event_id=inc1.id, status="Assigned")
        ta2 = models.TrainingAssignment(operator_id=op1.id, module_id=mod_machine.id, triggered_by_event_id=inc2.id, status="In Progress")
        ta3 = models.TrainingAssignment(operator_id=op2.id, module_id=mod_idle.id, triggered_by_event_id=inc3.id, status="Assigned")
        ta4 = models.TrainingAssignment(operator_id=op3.id, module_id=mod_seatbelt.id, status="Completed", completed_at=datetime.utcnow() - timedelta(days=2), quiz_score=100.0)
        db.add_all([ta1, ta2, ta3, ta4])
        db.commit()

        print("Seeding Safety Thresholds...")
        thresholds = models.SafetyThreshold(
            proximity_radius_m=8.0,
            max_hydraulic_temp_c=85.0,
            min_fuel_level_pct=15.0,
            max_idle_minutes=20.0,
            weather_sensitivity="Moderate"
        )
        db.add(thresholds)
        db.commit()

    if not already_seeded:
        # Initialize RAG manual chunks
        load_or_init_chunks()

    # --- ENFORCE 9 TRUCKS IN FLEET ---
    print("Verifying truck fleet size (target: 9)...")
    from sqlalchemy import or_
    existing_trucks = db.query(models.Machine).filter(
        or_(models.Machine.type == "Dump Truck", models.Machine.type == "truck")
    ).all()
    
    truck_count = len(existing_trucks)
    if truck_count < 9:
        truck_models = ["CAT 770", "CAT 772", "CAT 775", "CAT 777"]
        missing = 9 - truck_count
        print(f"Adding {missing} missing trucks...")
        for i in range(1, 10):
            # Check if this specific code exists
            code = f"TRK-0{i}"
            if not db.query(models.Machine).filter(models.Machine.machine_code == code).first():
                new_truck = models.Machine(
                    machine_code=code,
                    type="truck",
                    model=truck_models[i % 4],
                    manufacture_year=2024,
                    status="available",
                    fuel_level=100.0,
                    engine_hours=0.0,
                    created_at=datetime.utcnow()
                )
                db.add(new_truck)
                missing -= 1
                if missing == 0:
                    break
        db.commit()
        print("Fleet size is now exactly 9 trucks.")
    else:
        print(f"Fleet already has {truck_count} trucks. No action needed.")

    print("Database seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
