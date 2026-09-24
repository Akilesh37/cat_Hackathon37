from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- Auth ---
class LoginRequest(BaseModel):
    pin: str
    role: Optional[str] = None # "admin" or "operator"
    operator_code: Optional[str] = None

class LoginResponse(BaseModel):
    token: str
    role: str
    user_id: int
    operator_code: Optional[str] = None
    name: str

# --- Operator ---
class OperatorBase(BaseModel):
    operator_code: str
    name: str
    role: str = "Heavy Equipment Operator"
    phone: Optional[str] = None
    license_no: Optional[str] = None
    cert_expiry_date: Optional[str] = None
    photo_url: Optional[str] = None
    employee_id: Optional[str] = None
    license_type: Optional[str] = None
    status: str = "active"

class OperatorCreate(OperatorBase):
    pin: str = "1234"

class OperatorUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    license_type: Optional[str] = None
    status: Optional[str] = None

class OperatorResponse(OperatorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Machine ---
class MachineBase(BaseModel):
    machine_code: str
    type: str
    model: str
    manufacture_year: int = 2022
    status: str = "running"
    fuel_level: float = 100.0
    engine_hours: float = 0.0
    hydraulic_temp: float = 65.0
    coolant_status: str = "Normal"
    engine_oil_status: str = "Normal"
    last_maintenance_date: Optional[str] = None
    next_maintenance_hours: float = 250.0
    manual_doc_path: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None

class MachineResponse(MachineBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Admin Assignment ---
class AssignmentCreate(BaseModel):
    operator_id: int
    machine_id: int
    task: str
    shift: str
    start_time: datetime
    end_time: datetime

class AssignmentResponse(BaseModel):
    id: int
    operator_id: int
    machine_id: int
    task: str
    shift: str
    start_time: datetime
    end_time: datetime
    status: str
    assigned_by: str

    class Config:
        from_attributes = True

# --- Zone ---
class ZoneBase(BaseModel):
    zone_code: str
    name: str
    site_id: str = "Site A"
    polygon_geojson: List[List[float]] # [[lat, lng], [lat, lng], ...]
    color_hex: str = "#2FA84F"

class ZoneResponse(ZoneBase):
    id: int

    class Config:
        from_attributes = True

# --- Shift ---
class ShiftBase(BaseModel):
    shift_code: str
    start_time: str
    end_time: str
    site_id: str = "Site A"

class ShiftResponse(ShiftBase):
    id: int

    class Config:
        from_attributes = True

class ShiftAssignmentCreate(BaseModel):
    operator_id: int
    machine_id: int
    shift_id: int
    date: Optional[str] = None

class ShiftAssignmentResponse(BaseModel):
    id: int
    operator_id: int
    machine_id: int
    shift_id: int
    date: str
    status: str

    class Config:
        from_attributes = True

# --- Task ---
class TaskBase(BaseModel):
    task_code: str
    task_type: str
    operator_id: Optional[int] = None
    machine_id: Optional[int] = None
    zone_id: Optional[int] = None
    material_type: str = "Soil / Gravel"
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    from_lat: Optional[float] = None
    from_lng: Optional[float] = None
    to_lat: Optional[float] = None
    to_lng: Optional[float] = None
    route_geojson: Optional[List[List[float]]] = None
    target_quantity: float = 100.0
    unit: str = "m3"
    priority: str = "Medium"

class TaskCreate(TaskBase):
    start_time: Optional[datetime] = None
    expected_end_time: Optional[datetime] = None

class TaskUpdateStatus(BaseModel):
    status: str
    completed_quantity: Optional[float] = None

class TaskResponse(TaskBase):
    id: int
    completed_quantity: float
    status: str
    route_distance_km: float
    route_duration_min: float
    weather_risk_flag: bool
    created_by: str
    created_at: datetime
    start_time: Optional[datetime] = None
    expected_end_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class TaskRouteResponse(BaseModel):
    task_id: int
    task_code: str
    zone_id: Optional[int]
    zone_polygon: Optional[List[List[float]]]
    from_location: Optional[str]
    to_location: Optional[str]
    from_coords: Optional[List[float]]
    to_coords: Optional[List[float]]
    route_geojson: Optional[List[List[float]]]
    distance_km: float
    duration_min: float

# --- Telemetry & Location ---
class TelemetryPayload(BaseModel):
    machine_id: int
    fuel_level: float
    hydraulic_temp: float
    engine_hours: float
    idle_seconds: int
    seatbelt_status: bool
    timestamp: str

class PositionPayload(BaseModel):
    machine_id: int
    task_id: Optional[int] = None
    zone_id: Optional[int] = None
    lat: float
    lng: float
    heading: float
    speed_kmh: float
    inside_geofence: bool
    timestamp: str

# --- Alerts ---
class AlertCreate(BaseModel):
    alert_type: str
    priority_rank: int = 3
    machine_id: Optional[int] = None
    operator_id: Optional[int] = None
    message: str
    severity: str = "Warning"

class AlertAcknowledge(BaseModel):
    status: str = "Acknowledged"

class AlertResponse(BaseModel):
    id: int
    alert_type: str
    priority_rank: int
    machine_id: Optional[int]
    operator_id: Optional[int]
    message: str
    severity: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Incidents ---
class IncidentCreate(BaseModel):
    incident_type: str
    machine_id: Optional[int] = None
    operator_id: Optional[int] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    telemetry_snapshot: Optional[Dict[str, Any]] = None
    description: str
    severity: str = "High"

class IncidentResponse(BaseModel):
    id: int
    incident_type: str
    machine_id: Optional[int]
    operator_id: Optional[int]
    location_lat: Optional[float]
    location_lng: Optional[float]
    telemetry_snapshot: Optional[Dict[str, Any]]
    description: str
    severity: str
    status: str
    resolution_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentReplayResponse(BaseModel):
    incident: IncidentResponse
    positions_window: List[Dict[str, Any]]
    telemetry_window: List[Dict[str, Any]]

# --- ETA ---
class ETAPredictRequest(BaseModel):
    task_id: int

class ETAPredictionResponse(BaseModel):
    task_id: int
    base_estimate_min: float
    weather_adjustment_min: float
    idle_adjustment_min: float
    machine_condition_adjustment_min: float
    final_eta_min: float
    confidence_score: float
    created_at: datetime

# --- Training ---
class TrainingModuleResponse(BaseModel):
    id: int
    title: str
    category: str
    video_url: Optional[str]
    duration_min: int
    quiz_data: Optional[Any]

    class Config:
        from_attributes = True

class TrainingAssignmentResponse(BaseModel):
    id: int
    operator_id: int
    module_id: int
    triggered_by_event_id: Optional[int]
    status: str
    assigned_at: datetime
    completed_at: Optional[datetime]
    quiz_score: Optional[float]
    module: Optional[TrainingModuleResponse] = None

    class Config:
        from_attributes = True

class TrainingAssignRequest(BaseModel):
    operator_id: int
    module_id: int
    triggered_by_event_id: Optional[int] = None

class QuizSubmitRequest(BaseModel):
    assignment_id: int
    answers: List[int] # chosen index for each question

class QuizSubmitResponse(BaseModel):
    assignment_id: int
    score_pct: float
    passed: bool
    status: str

# --- Copilot ---
class CopilotAskRequest(BaseModel):
    operator_id: Optional[int] = None
    machine_id: Optional[int] = None
    query_text: str

class ManualChunk(BaseModel):
    doc_name: str
    section: str
    content: str
    score: Optional[float] = None

class CopilotAskResponse(BaseModel):
    answer: str
    sources: List[ManualChunk]
    machine_context: Optional[Dict[str, Any]] = None

# --- Shift Summary & Performance ---
class ShiftSummaryResponse(BaseModel):
    operator_id: int
    operator_name: str
    task_id: int
    task_code: str
    machine_code: str
    expected_time_min: float
    actual_time_min: float
    eta_confidence_avg: float
    safety_events_count: int
    seatbelt_compliance_pct: float
    idle_time_min: float
    anomalies_count: int
    delay_min: float
    score_out_of_100: float
    score_reasoning: List[str]

# --- Admin Safety Thresholds ---
class SafetyThresholdUpdate(BaseModel):
    proximity_radius_m: Optional[float] = None
    max_hydraulic_temp_c: Optional[float] = None
    min_fuel_level_pct: Optional[float] = None
    max_idle_minutes: Optional[float] = None
    weather_sensitivity: Optional[str] = None

class SafetyThresholdResponse(BaseModel):
    proximity_radius_m: float
    max_hydraulic_temp_c: float
    min_fuel_level_pct: float
    max_idle_minutes: float
    weather_sensitivity: str
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Weather ---
class WeatherCheckResponse(BaseModel):
    site_id: str
    datetime: str
    temperature_c: float
    condition: str
    wind_speed_kmh: float
    precipitation_prob_pct: float
    visibility_km: float
    risk_level: str # Low, Medium, High
    risk_reason: Optional[str]
    is_favorable: bool
