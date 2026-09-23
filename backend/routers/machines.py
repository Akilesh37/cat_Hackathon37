from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from database import get_db
import models
import schemas

router = APIRouter(prefix="/machines", tags=["Machines"])

@router.get("", response_model=List[schemas.MachineResponse])
def get_machines(db: Session = Depends(get_db)):
    return db.query(models.Machine).all()

@router.get("/{machine_id}", response_model=schemas.MachineResponse)
def get_machine(machine_id: int, db: Session = Depends(get_db)):
    machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return machine

@router.get("/{machine_id}/telemetry")
def get_machine_telemetry(machine_id: int, limit: int = 40, db: Session = Depends(get_db)):
    records = db.query(models.Telemetry).filter(
        models.Telemetry.machine_id == machine_id
    ).order_by(models.Telemetry.time.desc()).limit(limit).all()
    
    # Return in chronological order for charting
    records.reverse()
    return [
        {
            "time": r.time.strftime("%H:%M:%S"),
            "hydraulic_temp": r.hydraulic_temp,
            "fuel_level": r.fuel_level,
            "engine_hours": r.engine_hours,
            "speed_kmh": r.speed_kmh,
            "idle_seconds": r.idle_seconds,
            "seatbelt_status": r.seatbelt_status
        }
        for r in records
    ]

@router.get("/{machine_id}/position")
def get_machine_position(machine_id: int, db: Session = Depends(get_db)):
    machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    recent_positions = db.query(models.MachinePosition).filter(
        models.MachinePosition.machine_id == machine_id
    ).order_by(models.MachinePosition.time.desc()).limit(30).all()
    
    trail = [[p.lat, p.lng] for p in reversed(recent_positions)]
    
    return {
        "machine_id": machine.id,
        "machine_code": machine.machine_code,
        "current_lat": machine.current_lat,
        "current_lng": machine.current_lng,
        "status": machine.status,
        "trail": trail
    }
