from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/shifts", tags=["Shifts"])

@router.get("", response_model=List[schemas.ShiftResponse])
def get_shifts(db: Session = Depends(get_db)):
    return db.query(models.Shift).all()

@router.get("/assignments", response_model=List[schemas.ShiftAssignmentResponse])
def get_shift_assignments(db: Session = Depends(get_db)):
    return db.query(models.OperatorShiftAssignment).all()

@router.post("/assign", response_model=schemas.ShiftAssignmentResponse)
def assign_operator_shift(payload: schemas.ShiftAssignmentCreate, db: Session = Depends(get_db)):
    assignment = models.OperatorShiftAssignment(
        operator_id=payload.operator_id,
        machine_id=payload.machine_id,
        shift_id=payload.shift_id,
        date=payload.date or "2026-09-24",
        status="Active"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
