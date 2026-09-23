from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
import models
import schemas
from eta_engine import predict_task_eta

router = APIRouter(prefix="/eta", tags=["ETA Engine"])

@router.post("/predict", response_model=schemas.ETAPredictionResponse)
def predict_eta(payload: schemas.ETAPredictRequest, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == payload.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    eta_data = predict_task_eta(
        {
            "task_type": task.task_type,
            "target_quantity": task.target_quantity,
            "completed_quantity": task.completed_quantity,
            "route_duration_min": task.route_duration_min
        },
        weather_risk=task.weather_risk_flag
    )

    eta_record = models.ETAPrediction(
        task_id=task.id,
        base_estimate_min=eta_data["base_estimate_min"],
        weather_adjustment_min=eta_data["weather_adjustment_min"],
        idle_adjustment_min=eta_data["idle_adjustment_min"],
        machine_condition_adjustment_min=eta_data["machine_condition_adjustment_min"],
        final_eta_min=eta_data["final_eta_min"],
        confidence_score=eta_data["confidence_score"],
        created_at=datetime.utcnow()
    )
    db.add(eta_record)
    db.commit()
    db.refresh(eta_record)

    return schemas.ETAPredictionResponse(
        task_id=eta_record.task_id,
        base_estimate_min=eta_record.base_estimate_min,
        weather_adjustment_min=eta_record.weather_adjustment_min,
        idle_adjustment_min=eta_record.idle_adjustment_min,
        machine_condition_adjustment_min=eta_record.machine_condition_adjustment_min,
        final_eta_min=eta_record.final_eta_min,
        confidence_score=eta_record.confidence_score,
        created_at=eta_record.created_at
    )
