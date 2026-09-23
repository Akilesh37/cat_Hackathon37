from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from database import Base

class Operator(Base):
    __tablename__ = "operators"

    id = Column(Integer, primary_key=True, index=True)
    operator_code = Column(String(50), unique=True, index=True, nullable=False)
    employee_id = Column(String(50), unique=True, index=True, nullable=True) # Added for Admin
    name = Column(String(120), nullable=False)
    role = Column(String(100), default="Heavy Equipment Operator")
    phone = Column(String(50), nullable=True)
    license_no = Column(String(100), nullable=True)
    license_type = Column(String(50), nullable=True) # Added for Admin
    cert_expiry_date = Column(String(50), nullable=True)
    photo_url = Column(String(255), nullable=True)
    status = Column(String(50), default="active") # active/inactive, Added for Admin
    pin = Column(String(10), default="1234")
    created_at = Column(DateTime, default=datetime.utcnow)

    shift_assignments = relationship("OperatorShiftAssignment", back_populates="operator")
    tasks = relationship("Task", back_populates="operator")
    alerts = relationship("Alert", back_populates="operator")
    incidents = relationship("Incident", back_populates="operator")
    training_assignments = relationship("TrainingAssignment", back_populates="operator")
    performance_records = relationship("OperatorPerformance", back_populates="operator")
    copilot_queries = relationship("CopilotQuery", back_populates="operator")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    machine_code = Column(String(50), unique=True, index=True, nullable=False)
    type = Column(String(80), nullable=False)  # Excavator, Wheel Loader, Motor Grader, Compactor, Dump Truck
    model = Column(String(80), nullable=False) # CAT 320, CAT 950, CAT 140, CAT CS56, Tipper
    manufacture_year = Column(Integer, default=2022)
    status = Column(String(50), default="running") # running, idle, maintenance, breakdown
    fuel_level = Column(Float, default=100.0)      # %
    engine_hours = Column(Float, default=0.0)
    hydraulic_temp = Column(Float, default=65.0)   # °C
    coolant_status = Column(String(50), default="Normal")
    engine_oil_status = Column(String(50), default="Normal")
    last_maintenance_date = Column(String(50), nullable=True)
    next_maintenance_hours = Column(Float, default=250.0)
    manual_doc_path = Column(String(255), nullable=True)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow) # Added for Admin

    shift_assignments = relationship("OperatorShiftAssignment", back_populates="machine")
    tasks = relationship("Task", back_populates="machine")
    telemetry_records = relationship("Telemetry", back_populates="machine")
    position_records = relationship("MachinePosition", back_populates="machine")
    alerts = relationship("Alert", back_populates="machine")
    incidents = relationship("Incident", back_populates="machine")
    admin_assignments = relationship("Assignment", back_populates="machine")

class Assignment(Base):
    __tablename__ = "admin_assignments"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    task = Column(String(255), nullable=False)
    shift = Column(String(50), nullable=False) # morning/evening/night
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="active") # active/completed/cancelled
    assigned_by = Column(String(100), nullable=False)

    operator = relationship("Operator", backref="admin_assignments")
    machine = relationship("Machine", back_populates="admin_assignments")



class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    zone_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    site_id = Column(String(50), default="Site A")
    polygon_geojson = Column(JSON, nullable=False) # list of [lat, lng] or GeoJSON polygon
    color_hex = Column(String(20), default="#2FA84F")

    tasks = relationship("Task", back_populates="zone")
    positions = relationship("MachinePosition", back_populates="zone")


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    shift_code = Column(String(50), unique=True, index=True, nullable=False)
    start_time = Column(String(50), nullable=False) # e.g. "06:00"
    end_time = Column(String(50), nullable=False)   # e.g. "14:00"
    site_id = Column(String(50), default="Site A")

    assignments = relationship("OperatorShiftAssignment", back_populates="shift")


class OperatorShiftAssignment(Base):
    __tablename__ = "operator_shift_assignments"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False)
    date = Column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    status = Column(String(50), default="Active")

    operator = relationship("Operator", back_populates="shift_assignments")
    machine = relationship("Machine", back_populates="shift_assignments")
    shift = relationship("Shift", back_populates="assignments")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String(50), unique=True, index=True, nullable=False)
    task_type = Column(String(80), nullable=False) # Excavation, Loading, Transport, Grading
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    material_type = Column(String(80), default="Soil / Gravel")
    from_location = Column(String(100), nullable=True)
    to_location = Column(String(100), nullable=True)
    from_lat = Column(Float, nullable=True)
    from_lng = Column(Float, nullable=True)
    to_lat = Column(Float, nullable=True)
    to_lng = Column(Float, nullable=True)
    route_geojson = Column(JSON, nullable=True) # list of [lat, lng] coordinates
    target_quantity = Column(Float, default=100.0)
    unit = Column(String(20), default="m3")
    completed_quantity = Column(Float, default=0.0)
    priority = Column(String(20), default="Medium") # Low, Medium, High, Critical
    start_time = Column(DateTime, nullable=True)
    expected_end_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="Pending") # Pending, In Progress, Completed, Paused
    route_distance_km = Column(Float, default=0.0)
    route_duration_min = Column(Float, default=0.0)
    weather_risk_flag = Column(Boolean, default=False)
    created_by = Column(String(80), default="Supervisor Admin")
    created_at = Column(DateTime, default=datetime.utcnow)

    operator = relationship("Operator", back_populates="tasks")
    machine = relationship("Machine", back_populates="tasks")
    zone = relationship("Zone", back_populates="tasks")
    eta_predictions = relationship("ETAPrediction", back_populates="task")
    performance_record = relationship("OperatorPerformance", back_populates="task", uselist=False)


class MachinePosition(Base):
    __tablename__ = "machine_positions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    time = Column(DateTime, default=datetime.utcnow, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), index=True, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    heading = Column(Float, default=0.0)
    speed_kmh = Column(Float, default=0.0)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    inside_geofence = Column(Boolean, default=True)

    machine = relationship("Machine", back_populates="position_records")
    zone = relationship("Zone", back_populates="positions")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    time = Column(DateTime, default=datetime.utcnow, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), index=True, nullable=False)
    engine_hours = Column(Float, default=0.0)
    fuel_level = Column(Float, default=100.0)
    hydraulic_temp = Column(Float, default=65.0)
    load_cycle = Column(Integer, default=0)
    idle_seconds = Column(Integer, default=0)
    speed_kmh = Column(Float, default=0.0)
    seatbelt_status = Column(Boolean, default=True)

    machine = relationship("Machine", back_populates="telemetry_records")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False) # Proximity, Anomaly, Weather, ETA, Idle, Geofence
    priority_rank = Column(Integer, default=3)      # 1=Highest (Proximity/Geofence), 5=Lowest (Idle)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    message = Column(String(255), nullable=False)
    severity = Column(String(20), default="Warning") # Info, Warning, Critical
    status = Column(String(20), default="Active")     # Active, Acknowledged, Resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    machine = relationship("Machine", back_populates="alerts")
    operator = relationship("Operator", back_populates="alerts")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_type = Column(String(80), nullable=False) # Proximity, Anomaly, Geofence, Excess Idle
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    telemetry_snapshot = Column(JSON, nullable=True)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="High")
    status = Column(String(20), default="Open") # Open, Under Review, Closed
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    machine = relationship("Machine", back_populates="incidents")
    operator = relationship("Operator", back_populates="incidents")


class ETAPrediction(Base):
    __tablename__ = "eta_predictions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    base_estimate_min = Column(Float, default=60.0)
    weather_adjustment_min = Column(Float, default=0.0)
    idle_adjustment_min = Column(Float, default=0.0)
    machine_condition_adjustment_min = Column(Float, default=0.0)
    final_eta_min = Column(Float, default=60.0)
    confidence_score = Column(Float, default=0.92) # 0.0 - 1.0
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="eta_predictions")


class TrainingModule(Base):
    __tablename__ = "training_modules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False)
    category = Column(String(80), nullable=False) # Safety, Machine Operations, Efficiency
    video_url = Column(String(255), nullable=True)
    duration_min = Column(Integer, default=15)
    quiz_data = Column(JSON, nullable=True) # 5 questions with options and answer

    assignments = relationship("TrainingAssignment", back_populates="module")


class TrainingAssignment(Base):
    __tablename__ = "training_assignments"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("training_modules.id"), nullable=False)
    triggered_by_event_id = Column(Integer, nullable=True)
    status = Column(String(50), default="Assigned") # Assigned, In Progress, Completed
    assigned_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    quiz_score = Column(Float, nullable=True)

    operator = relationship("Operator", back_populates="training_assignments")
    module = relationship("TrainingModule", back_populates="assignments")


class OperatorPerformance(Base):
    __tablename__ = "operator_performance"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    expected_time_min = Column(Float, default=60.0)
    actual_time_min = Column(Float, default=65.0)
    eta_confidence_avg = Column(Float, default=0.88)
    safety_events_count = Column(Integer, default=0)
    seatbelt_compliance_pct = Column(Float, default=100.0)
    idle_time_min = Column(Float, default=5.0)
    anomalies_count = Column(Integer, default=0)
    delay_min = Column(Float, default=5.0)
    score_out_of_100 = Column(Float, default=95.0)
    score_reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    operator = relationship("Operator", back_populates="performance_records")
    task = relationship("Task", back_populates="performance_record")


class CopilotQuery(Base):
    __tablename__ = "copilot_queries"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    query_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=False)
    source_manual_chunks = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    operator = relationship("Operator", back_populates="copilot_queries")


class SafetyThreshold(Base):
    __tablename__ = "safety_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    proximity_radius_m = Column(Float, default=8.0)
    max_hydraulic_temp_c = Column(Float, default=85.0)
    min_fuel_level_pct = Column(Float, default=15.0)
    max_idle_minutes = Column(Float, default=20.0)
    weather_sensitivity = Column(String(50), default="Moderate")
    updated_at = Column(DateTime, default=datetime.utcnow)
