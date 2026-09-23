from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
import models
import schemas

router = APIRouter(prefix="/training", tags=["Safety Training"])

@router.get("/modules", response_model=List[schemas.TrainingModuleResponse])
def get_training_modules(db: Session = Depends(get_db)):
    return db.query(models.TrainingModule).all()

@router.get("/recommendations/{operator_id}", response_model=List[schemas.TrainingAssignmentResponse])
def get_training_recommendations(operator_id: int, db: Session = Depends(get_db)):
    assignments = db.query(models.TrainingAssignment).filter(
        models.TrainingAssignment.operator_id == operator_id
    ).all()
    return assignments

@router.post("/assign", response_model=schemas.TrainingAssignmentResponse)
def assign_training(payload: schemas.TrainingAssignRequest, db: Session = Depends(get_db)):
    assignment = models.TrainingAssignment(
        operator_id=payload.operator_id,
        module_id=payload.module_id,
        triggered_by_event_id=payload.triggered_by_event_id,
        status="Assigned",
        assigned_at=datetime.utcnow()
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.post("/quiz-submit", response_model=schemas.QuizSubmitResponse)
def submit_quiz(payload: schemas.QuizSubmitRequest, db: Session = Depends(get_db)):
    assignment = db.query(models.TrainingAssignment).filter(
        models.TrainingAssignment.id == payload.assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Training assignment not found")

    module = db.query(models.TrainingModule).filter(
        models.TrainingModule.id == assignment.module_id
    ).first()

    questions = module.quiz_data or []
    if not questions:
        score_pct = 100.0
    else:
        correct_count = 0
        for i, q in enumerate(questions):
            correct_idx = q.get("correct_answer_index", 0)
            if i < len(payload.answers) and payload.answers[i] == correct_idx:
                correct_count += 1
        score_pct = round((correct_count / len(questions)) * 100.0, 1)

    passed = score_pct >= 80.0
    assignment.quiz_score = score_pct
    assignment.status = "Completed" if passed else "In Progress"
    assignment.completed_at = datetime.utcnow() if passed else None
    db.commit()

    return schemas.QuizSubmitResponse(
        assignment_id=assignment.id,
        score_pct=score_pct,
        passed=passed,
        status=assignment.status
    )
