from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/zones", tags=["Zones"])

@router.get("", response_model=List[schemas.ZoneResponse])
def get_zones(db: Session = Depends(get_db)):
    return db.query(models.Zone).all()

@router.get("/{zone_id}", response_model=schemas.ZoneResponse)
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone
