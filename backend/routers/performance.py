from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
import models
import schemas
from scoring_engine import calculate_operator_score

router = APIRouter(prefix="/performance", tags=["Performance & Shift Summary"])

@router.get("/shift-summary/{operator_id}/{task_id}", response_model=schemas.ShiftSummaryResponse)
def get_shift_summary(operator_id: int, task_id: int, db: Session = Depends(get_db)):
    operator = db.query(models.Operator).filter(models.Operator.id == operator_id).first()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")

    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    machine = db.query(models.Machine).filter(models.Machine.id == task.machine_id).first()
    machine_code = machine.machine_code if machine else "CAT-320"

    # Fetch safety alerts and anomalies recorded for this operator/machine
    alerts = db.query(models.Alert).filter(
        models.Alert.operator_id == operator_id
    ).all()

    safety_events = [a for a in alerts if a.alert_type in ["Proximity", "Geofence"]]
    anomalies = [a for a in alerts if a.alert_type in ["Anomaly", "Hydraulic"]]

    expected_time = task.route_duration_min or 55.0
    actual_time = expected_time + 4.0 # simulated 4-minute variance
    seatbelt_compliance = 100.0 if not any(a.alert_type == "Seatbelt" for a in alerts) else 82.0
    idle_time = 14.0 # minutes

    # Calculate 100-point explainable score
    final_score, reasoning = calculate_operator_score(
        expected_time_min=expected_time,
        actual_time_min=actual_time,
        seatbelt_compliance_pct=seatbelt_compliance,
        safety_events_count=len(safety_events),
        anomalies_count=len(anomalies),
        idle_time_min=idle_time
    )

    # Persist or update performance record
    perf = db.query(models.OperatorPerformance).filter(
        models.OperatorPerformance.operator_id == operator_id,
        models.OperatorPerformance.task_id == task_id
    ).first()

    if not perf:
        perf = models.OperatorPerformance(
            operator_id=operator_id,
            task_id=task_id,
            expected_time_min=expected_time,
            actual_time_min=actual_time,
            eta_confidence_avg=0.91,
            safety_events_count=len(safety_events),
            seatbelt_compliance_pct=seatbelt_compliance,
            idle_time_min=idle_time,
            anomalies_count=len(anomalies),
            delay_min=max(0.0, actual_time - expected_time),
            score_out_of_100=final_score,
            score_reasoning="\n".join(reasoning),
            created_at=datetime.utcnow()
        )
        db.add(perf)
        db.commit()

    return schemas.ShiftSummaryResponse(
        operator_id=operator.id,
        operator_name=operator.name,
        task_id=task.id,
        task_code=task.task_code,
        machine_code=machine_code,
        expected_time_min=expected_time,
        actual_time_min=actual_time,
        eta_confidence_avg=0.91,
        safety_events_count=len(safety_events),
        seatbelt_compliance_pct=seatbelt_compliance,
        idle_time_min=idle_time,
        anomalies_count=len(anomalies),
        delay_min=max(0.0, actual_time - expected_time),
        score_out_of_100=final_score,
        score_reasoning=reasoning
    )
