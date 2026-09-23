from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
import models
import schemas
import sockets

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[schemas.AlertResponse])
def get_alerts(
    status: Optional[str] = Query(default=None),
    machine_id: Optional[int] = Query(default=None),
    operator_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Alert)
    if status:
        query = query.filter(models.Alert.status == status)
    if machine_id:
        query = query.filter(models.Alert.machine_id == machine_id)
    if operator_id:
        query = query.filter(models.Alert.operator_id == operator_id)

    # Sort by priority rank (1 is highest/most critical), then created_at desc
    return query.order_by(models.Alert.priority_rank.asc(), models.Alert.created_at.desc()).all()

@router.post("", response_model=schemas.AlertResponse)
async def create_alert(payload: schemas.AlertCreate, db: Session = Depends(get_db)):
    alert = models.Alert(
        alert_type=payload.alert_type,
        priority_rank=payload.priority_rank,
        machine_id=payload.machine_id,
        operator_id=payload.operator_id,
        message=payload.message,
        severity=payload.severity,
        status="Active",
        created_at=datetime.utcnow()
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Broadcast to Socket.IO alerts namespace
    await sockets.broadcast_new_alert({
        "id": alert.id,
        "alert_type": alert.alert_type,
        "priority_rank": alert.priority_rank,
        "machine_id": alert.machine_id,
        "operator_id": alert.operator_id,
        "message": alert.message,
        "severity": alert.severity,
        "created_at": alert.created_at.isoformat()
    })

    return alert

@router.patch("/{alert_id}/acknowledge", response_model=schemas.AlertResponse)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "Acknowledged"
    db.commit()
    db.refresh(alert)
    return alert

@router.patch("/{alert_id}/resolve", response_model=schemas.AlertResponse)
async def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "Resolved"
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)

    await sockets.broadcast_alert_resolved(alert.id)
    return alert
