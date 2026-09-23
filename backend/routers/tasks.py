from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
import models
import schemas
from eta_engine import predict_task_eta
import rules_engine

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[schemas.TaskResponse])
def get_tasks(
    operator_id: Optional[int] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Task)
    if operator_id:
        query = query.filter(models.Task.operator_id == operator_id)
    if status:
        query = query.filter(models.Task.status == status)
    return query.order_by(models.Task.created_at.desc()).all()

@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.post("", response_model=schemas.TaskResponse)
def assign_task(payload: schemas.TaskCreate, db: Session = Depends(get_db)):
    """
    Creates a new operational task.
    Validates weather risk and calculates initial distance and ETA.
    """
    # Calculate distance if route_geojson or from/to coords exist
    distance_km = 0.0
    if payload.route_geojson and len(payload.route_geojson) > 1:
        total_m = 0.0
        for i in range(len(payload.route_geojson) - 1):
            p1 = payload.route_geojson[i]
            p2 = payload.route_geojson[i + 1]
            total_m += rules_engine.calculate_distance_meters(p1[0], p1[1], p2[0], p2[1])
        distance_km = round(total_m / 1000.0, 2)
    elif payload.from_lat and payload.to_lat:
        dist_m = rules_engine.calculate_distance_meters(
            payload.from_lat, payload.from_lng, payload.to_lat, payload.to_lng
        )
        distance_km = round(dist_m / 1000.0, 2)

    # Weather risk check: Flag risk if Transport task or target location is Quarry/Zone B
    weather_risk = False
    if "trans" in payload.task_type.lower() or (payload.to_location and "zone b" in payload.to_location.lower()):
        weather_risk = True

    duration_min = round(max(15.0, distance_km * 3.5 if distance_km > 0 else 60.0), 1)

    task = models.Task(
        task_code=payload.task_code,
        task_type=payload.task_type,
        operator_id=payload.operator_id,
        machine_id=payload.machine_id,
        zone_id=payload.zone_id,
        material_type=payload.material_type,
        from_location=payload.from_location,
        to_location=payload.to_location,
        from_lat=payload.from_lat,
        from_lng=payload.from_lng,
        to_lat=payload.to_lat,
        to_lng=payload.to_lng,
        route_geojson=payload.route_geojson,
        target_quantity=payload.target_quantity,
        unit=payload.unit,
        completed_quantity=0.0,
        priority=payload.priority,
        status="Pending",
        route_distance_km=distance_km,
        route_duration_min=duration_min,
        weather_risk_flag=weather_risk,
        created_by="Supervisor Admin",
        created_at=datetime.utcnow()
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    # Generate initial ETA prediction row
    eta_calc = predict_task_eta(
        {
            "task_type": task.task_type,
            "target_quantity": task.target_quantity,
            "completed_quantity": 0.0,
            "route_duration_min": duration_min
        },
        weather_risk=weather_risk
    )

    eta_row = models.ETAPrediction(
        task_id=task.id,
        base_estimate_min=eta_calc["base_estimate_min"],
        weather_adjustment_min=eta_calc["weather_adjustment_min"],
        idle_adjustment_min=eta_calc["idle_adjustment_min"],
        machine_condition_adjustment_min=eta_calc["machine_condition_adjustment_min"],
        final_eta_min=eta_calc["final_eta_min"],
        confidence_score=eta_calc["confidence_score"]
    )
    db.add(eta_row)
    db.commit()

    return task

@router.put("/{task_id}/status", response_model=schemas.TaskResponse)
def update_task_status(task_id: int, payload: schemas.TaskUpdateStatus, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = payload.status
    if payload.completed_quantity is not None:
        task.completed_quantity = payload.completed_quantity

    if payload.status == "In Progress" and not task.start_time:
        task.start_time = datetime.utcnow()
    elif payload.status == "Completed":
        task.expected_end_time = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return task

@router.get("/{task_id}/route", response_model=schemas.TaskRouteResponse)
def get_task_route(task_id: int, db: Session = Depends(get_db)):
    """
    SINGLE SOURCE OF TRUTH for map sync:
    The operator mobile app and admin assignment map both read this exact endpoint
    to render the route polyline and zone polygon.
    """
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    zone_poly = None
    if task.zone_id:
        zone = db.query(models.Zone).filter(models.Zone.id == task.zone_id).first()
        if zone:
            zone_poly = zone.polygon_geojson

    from_coords = [task.from_lat, task.from_lng] if task.from_lat and task.from_lng else None
    to_coords = [task.to_lat, task.to_lng] if task.to_lat and task.to_lng else None

    return schemas.TaskRouteResponse(
        task_id=task.id,
        task_code=task.task_code,
        zone_id=task.zone_id,
        zone_polygon=zone_poly,
        from_location=task.from_location,
        to_location=task.to_location,
        from_coords=from_coords,
        to_coords=to_coords,
        route_geojson=task.route_geojson,
        distance_km=task.route_distance_km,
        duration_min=task.route_duration_min
    )
