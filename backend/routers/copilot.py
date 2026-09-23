from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
import models
import schemas
from rag.pipeline import ask_copilot

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

@router.post("/ask", response_model=schemas.CopilotAskResponse)
async def query_copilot(payload: schemas.CopilotAskRequest, db: Session = Depends(get_db)):
    """
    Operator and supervisor AI Copilot.
    Injects real-time machine telemetry and queries the manual vector store chunks.
    """
    machine_state = None
    if payload.machine_id:
        machine = db.query(models.Machine).filter(models.Machine.id == payload.machine_id).first()
        if machine:
            machine_state = {
                "machine_code": machine.machine_code,
                "model": machine.model,
                "type": machine.type,
                "hydraulic_temp": machine.hydraulic_temp,
                "fuel_level": machine.fuel_level,
                "engine_hours": machine.engine_hours,
                "coolant_status": machine.coolant_status,
                "engine_oil_status": machine.engine_oil_status,
                "status": machine.status
            }

    result = await ask_copilot(
        query_text=payload.query_text,
        machine_state=machine_state,
        operator_id=payload.operator_id
    )

    # Persist query for historical compliance logs
    try:
        q_record = models.CopilotQuery(
            operator_id=payload.operator_id,
            machine_id=payload.machine_id,
            query_text=payload.query_text,
            response_text=result["answer"],
            source_manual_chunks=[s.get("section", "") for s in result.get("sources", [])],
            created_at=datetime.utcnow()
        )
        db.add(q_record)
        db.commit()
    except Exception as e:
        db.rollback()

    return schemas.CopilotAskResponse(
        answer=result["answer"],
        sources=[
            schemas.ManualChunk(
                doc_name=s["doc_name"],
                section=s["section"],
                content=s["content"],
                score=s.get("score")
            )
            for s in result.get("sources", [])
        ],
        machine_context=result.get("machine_context")
    )
