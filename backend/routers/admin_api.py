from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas
from security import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin API"])

# --- Operators ---

@router.post("/operators", response_model=schemas.OperatorResponse, status_code=status.HTTP_201_CREATED)
def create_operator(operator: schemas.OperatorCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    if operator.employee_id:
        existing = db.query(models.Operator).filter(models.Operator.employee_id == operator.employee_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Operator with this employee_id already exists")
    
    new_op = models.Operator(**operator.model_dump())
    db.add(new_op)
    db.commit()
    db.refresh(new_op)
    return new_op

@router.get("/operators", response_model=List[schemas.OperatorResponse])
def get_operators(status: Optional[str] = None, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    query = db.query(models.Operator)
    if status:
        query = query.filter(models.Operator.status == status)
    return query.all()

@router.put("/operators/{operator_id}", response_model=schemas.OperatorResponse)
def update_operator(operator_id: int, operator_update: schemas.OperatorUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    db_op = db.query(models.Operator).filter(models.Operator.id == operator_id).first()
    if not db_op:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    update_data = operator_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_op, key, value)
    
    db.commit()
    db.refresh(db_op)
    return db_op

@router.delete("/operators/{operator_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_operator(operator_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    db_op = db.query(models.Operator).filter(models.Operator.id == operator_id).first()
    if not db_op:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    # Check active assignments
    active_assignment = db.query(models.Assignment).filter(
        models.Assignment.operator_id == operator_id,
        models.Assignment.status == "active"
    ).first()
    if active_assignment:
        raise HTTPException(status_code=400, detail="Cannot delete operator with active assignment")
    
    db_op.status = "inactive"
    db.commit()

# --- Machines ---

@router.get("/machines", response_model=List[schemas.MachineResponse])
def get_machines(status: Optional[str] = None, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    query = db.query(models.Machine)
    if status:
        query = query.filter(models.Machine.status == status)
    return query.all()

# --- Assignments ---

@router.post("/assignments", response_model=schemas.AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(assignment: schemas.AssignmentCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    db_op = db.query(models.Operator).filter(models.Operator.id == assignment.operator_id).first()
    if not db_op:
        raise HTTPException(status_code=404, detail="Operator not found")
    if db_op.status == "inactive":
        raise HTTPException(status_code=400, detail="Cannot assign inactive operator")
    
    db_mach = db.query(models.Machine).filter(models.Machine.id == assignment.machine_id).first()
    if not db_mach:
        raise HTTPException(status_code=404, detail="Machine not found")
    if db_mach.status == "maintenance":
        raise HTTPException(status_code=400, detail="Cannot assign machine in maintenance")
    
    # Check if machine or operator already active
    active_mach = db.query(models.Assignment).filter(
        models.Assignment.machine_id == assignment.machine_id,
        models.Assignment.status == "active"
    ).first()
    if active_mach:
        raise HTTPException(status_code=409, detail="Machine already has an active assignment")

    active_op = db.query(models.Assignment).filter(
        models.Assignment.operator_id == assignment.operator_id,
        models.Assignment.status == "active"
    ).first()
    if active_op:
        raise HTTPException(status_code=409, detail="Operator already has an active assignment")
    
    new_assignment = models.Assignment(
        **assignment.model_dump(),
        status="active",
        assigned_by=admin.get("sub", "admin")
    )
    db.add(new_assignment)
    
    db_mach.status = "assigned"
    
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

@router.put("/assignments/{assignment_id}/{action}", response_model=schemas.AssignmentResponse)
def update_assignment_status(assignment_id: int, action: str, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    if action not in ["complete", "cancel"]:
        raise HTTPException(status_code=400, detail="Invalid action, use complete or cancel")
        
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if db_assignment.status != "active":
        raise HTTPException(status_code=400, detail=f"Assignment already {db_assignment.status}")
    
    db_assignment.status = "completed" if action == "complete" else "cancelled"
    
    db_mach = db.query(models.Machine).filter(models.Machine.id == db_assignment.machine_id).first()
    if db_mach:
        db_mach.status = "available"
        
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.get("/assignments", response_model=List[schemas.AssignmentResponse])
def get_assignments(status: Optional[str] = None, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    query = db.query(models.Assignment)
    if status:
        query = query.filter(models.Assignment.status == status)
    return query.all()

import json
import os
from pydantic import BaseModel

class ScenarioTrigger(BaseModel):
    scenario_id: int
    machine_id: Optional[int] = None

@router.post("/trigger_scenario")
def trigger_scenario(trigger: ScenarioTrigger, admin=Depends(get_current_admin)):
    file_path = "scenario_triggers.json"
    triggers = []
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            try:
                triggers = json.load(f)
            except:
                pass
    triggers.append(trigger.model_dump())
    with open(file_path, "w") as f:
        json.dump(triggers, f)
    return {"status": "triggered"}
