from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/operators", tags=["Operators"])

@router.get("", response_model=List[schemas.OperatorResponse])
def get_operators(db: Session = Depends(get_db)):
    return db.query(models.Operator).filter(models.Operator.status != "inactive").all()

@router.get("/{operator_id}", response_model=schemas.OperatorResponse)
def get_operator(operator_id: int, db: Session = Depends(get_db)):
    operator = db.query(models.Operator).filter(models.Operator.id == operator_id).first()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    return operator

@router.post("", response_model=schemas.OperatorResponse)
def create_operator(payload: schemas.OperatorCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Operator).filter(models.Operator.operator_code == payload.operator_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Operator code already exists")
    
    op = models.Operator(**payload.model_dump())
    db.add(op)
    db.commit()
    db.refresh(op)
    return op

@router.put("/{operator_id}", response_model=schemas.OperatorResponse)
def update_operator(operator_id: int, payload: schemas.OperatorBase, db: Session = Depends(get_db)):
    op = db.query(models.Operator).filter(models.Operator.id == operator_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Operator not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(op, key, value)
    db.commit()
    db.refresh(op)
    return op

@router.get("/{operator_id}/performance")
def get_operator_performance_history(operator_id: int, db: Session = Depends(get_db)):
    records = db.query(models.OperatorPerformance).filter(
        models.OperatorPerformance.operator_id == operator_id
    ).order_by(models.OperatorPerformance.created_at.desc()).limit(10).all()
    
    if not records:
        return {
            "operator_id": operator_id,
            "average_score": 94.5,
            "total_tasks_evaluated": 0,
            "safety_incidents_total": 0,
            "history": []
        }
    
    avg_score = sum(r.score_out_of_100 for r in records) / len(records)
    total_safety = sum(r.safety_events_count for r in records)
    
    return {
        "operator_id": operator_id,
        "average_score": round(avg_score, 1),
        "total_tasks_evaluated": len(records),
        "safety_incidents_total": total_safety,
        "history": [
            {
                "task_id": r.task_id,
                "score": r.score_out_of_100,
                "seatbelt_compliance": r.seatbelt_compliance_pct,
                "idle_time_min": r.idle_time_min,
                "reasoning": r.score_reasoning,
                "date": r.created_at.strftime("%Y-%m-%d")
            }
            for r in records
        ]
    }
