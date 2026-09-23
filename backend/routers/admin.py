from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
import models
import schemas

router = APIRouter(prefix="/admin", tags=["Admin Configuration"])

@router.get("/thresholds", response_model=schemas.SafetyThresholdResponse)
def get_thresholds(db: Session = Depends(get_db)):
    threshold = db.query(models.SafetyThreshold).first()
    if not threshold:
        threshold = models.SafetyThreshold(
            proximity_radius_m=8.0,
            max_hydraulic_temp_c=85.0,
            min_fuel_level_pct=15.0,
            max_idle_minutes=20.0,
            weather_sensitivity="Moderate",
            updated_at=datetime.utcnow()
        )
        db.add(threshold)
        db.commit()
        db.refresh(threshold)
    return threshold

@router.put("/thresholds", response_model=schemas.SafetyThresholdResponse)
def update_thresholds(payload: schemas.SafetyThresholdUpdate, db: Session = Depends(get_db)):
    threshold = db.query(models.SafetyThreshold).first()
    if not threshold:
        threshold = models.SafetyThreshold()
        db.add(threshold)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(threshold, field, value)

    threshold.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(threshold)
    return threshold
