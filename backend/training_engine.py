"""
Training Engine:
Maps safety and operations events to training modules and handles automatic assignment.
"""
from typing import Optional, Dict
from sqlalchemy.orm import Session
from datetime import datetime
import models

EVENT_TO_MODULE_MAP = {
    "seatbelt_violation": "Seatbelt Safety",
    "proximity_alert": "Proximity Awareness",
    "excessive_idle": "Idle Management",
    "anomaly": "Machine Awareness",
    "geofence_breach": "Proximity Awareness",
    "hydraulic_overheat": "Machine Awareness"
}

def auto_assign_training(
    db: Session,
    operator_id: int,
    event_type: str,
    event_id: Optional[int] = None
) -> Optional[models.TrainingAssignment]:
    """
    Checks if an incident or alert triggers a required refresher module,
    and automatically assigns it to the operator if not already active.
    """
    normalized_key = event_type.lower().replace(" ", "_")
    module_title = None

    for key, title in EVENT_TO_MODULE_MAP.items():
        if key in normalized_key:
            module_title = title
            break

    if not module_title:
        return None

    # Find the training module
    module = db.query(models.TrainingModule).filter(
        models.TrainingModule.title == module_title
    ).first()

    if not module:
        return None

    # Check if there is already an uncompleted assignment for this operator and module
    existing = db.query(models.TrainingAssignment).filter(
        models.TrainingAssignment.operator_id == operator_id,
        models.TrainingAssignment.module_id == module.id,
        models.TrainingAssignment.status != "Completed"
    ).first()

    if existing:
        return existing

    # Create new assignment
    assignment = models.TrainingAssignment(
        operator_id=operator_id,
        module_id=module.id,
        triggered_by_event_id=event_id,
        status="Assigned",
        assigned_at=datetime.utcnow()
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
