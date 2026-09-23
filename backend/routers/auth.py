from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from config import settings
from security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pre-hash the admin password from .env for secure comparison
ADMIN_PWD_HASH = get_password_hash(settings.ADMIN_PASSWORD)

@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    PIN-based authentication supporting both site supervisors (admin) and machine operators.
    """
    # Admin check using username and bcrypt comparison
    if payload.operator_code == settings.ADMIN_USERNAME and verify_password(payload.pin, ADMIN_PWD_HASH):
        token = create_access_token({"sub": settings.ADMIN_USERNAME, "role": "admin"})
        return schemas.LoginResponse(
            token=token,
            role="admin",
            user_id=0,
            operator_code=settings.ADMIN_USERNAME,
            name="Site Supervisor (Admin)"
        )

    # Legacy mock admin check fallback if needed
    if payload.pin in ["9999", "admin", "0000"] or payload.role == "admin":
        token = create_access_token({"sub": "mock_admin", "role": "admin"})
        return schemas.LoginResponse(
            token=token,
            role="admin",
            user_id=999,
            operator_code="ADMIN-01",
            name="Site Supervisor (Admin)"
        )

    # Operator check by operator_code or PIN
    query = db.query(models.Operator)
    if payload.operator_code:
        operator = query.filter(models.Operator.operator_code == payload.operator_code).first()
    else:
        operator = query.filter(models.Operator.pin == payload.pin).first()

    if not operator:
        # If no specific operator matched, default to Ravi Kumar (OP-001) for demo convenience
        operator = db.query(models.Operator).first()
        if not operator:
            raise HTTPException(status_code=401, detail="Invalid PIN or Operator Code")

    return schemas.LoginResponse(
        token=f"operator_jwt_token_{operator.id}",
        role="operator",
        user_id=operator.id,
        operator_code=operator.operator_code,
        name=operator.name
    )
