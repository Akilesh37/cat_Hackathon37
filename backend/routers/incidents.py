from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
import models
import schemas
from training_engine import auto_assign_training

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[schemas.IncidentResponse])
def get_incidents(
    machine_id: Optional[int] = Query(default=None),
    operator_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Incident)
    if machine_id:
        query = query.filter(models.Incident.machine_id == machine_id)
    if operator_id:
        query = query.filter(models.Incident.operator_id == operator_id)
    return query.order_by(models.Incident.created_at.desc()).all()

@router.get("/{incident_id}", response_model=schemas.IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.get("/{incident_id}/replay", response_model=schemas.IncidentReplayResponse)
def get_incident_replay(incident_id: int, db: Session = Depends(get_db)):
    """
    Returns the incident snapshot and a historical time-window of machine GPS positions
    and telemetry for synchronized historical incident replay.
    """
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Fetch positions around incident (or latest 30 positions for the machine)
    positions = []
    telemetry = []

    if incident.machine_id:
        pos_records = db.query(models.MachinePosition).filter(
            models.MachinePosition.machine_id == incident.machine_id
        ).order_by(models.MachinePosition.time.desc()).limit(35).all()

        positions = [
            {
                "lat": p.lat,
                "lng": p.lng,
                "speed_kmh": p.speed_kmh,
                "heading": p.heading,
                "inside_geofence": p.inside_geofence,
                "time": p.time.strftime("%H:%M:%S")
            }
            for p in reversed(pos_records)
        ]

        tel_records = db.query(models.Telemetry).filter(
            models.Telemetry.machine_id == incident.machine_id
        ).order_by(models.Telemetry.time.desc()).limit(35).all()

        telemetry = [
            {
                "hydraulic_temp": t.hydraulic_temp,
                "fuel_level": t.fuel_level,
                "engine_hours": t.engine_hours,
                "speed_kmh": t.speed_kmh,
                "seatbelt_status": t.seatbelt_status,
                "time": t.time.strftime("%H:%M:%S")
            }
            for t in reversed(tel_records)
        ]

    return schemas.IncidentReplayResponse(
        incident=schemas.IncidentResponse.model_validate(incident),
        positions_window=positions,
        telemetry_window=telemetry
    )

@router.post("", response_model=schemas.IncidentResponse)
def create_incident(payload: schemas.IncidentCreate, db: Session = Depends(get_db)):
    incident = models.Incident(
        incident_type=payload.incident_type,
        machine_id=payload.machine_id,
        operator_id=payload.operator_id,
        location_lat=payload.location_lat,
        location_lng=payload.location_lng,
        telemetry_snapshot=payload.telemetry_snapshot,
        description=payload.description,
        severity=payload.severity,
        status="Open",
        created_at=datetime.utcnow()
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Auto-assign safety training to the operator
    if payload.operator_id:
        auto_assign_training(db, payload.operator_id, payload.incident_type, incident.id)

    return incident
