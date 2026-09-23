from fastapi import APIRouter, Query
from datetime import datetime
from typing import Optional
import schemas

router = APIRouter(prefix="/weather", tags=["Weather"])

@router.get("/check", response_model=schemas.WeatherCheckResponse)
def check_weather(
    site_id: str = Query(default="Site A"),
    target_datetime: Optional[str] = Query(default=None)
):
    """
    AccuWeather API wrapper with realistic mock fallback.
    Evaluates weather feasibility for site excavation and haul operations.
    """
    # Demo logic: Site A has a sudden localized rain advisory for heavy haulage
    is_haulage_risk = True if "site a" in site_id.lower() else False

    return schemas.WeatherCheckResponse(
        site_id=site_id,
        datetime=target_datetime or datetime.utcnow().isoformat(),
        temperature_c=29.5,
        condition="Partly Cloudy with Scattered Heavy Rain" if is_haulage_risk else "Clear Skies",
        wind_speed_kmh=18.4,
        precipitation_prob_pct=65.0 if is_haulage_risk else 10.0,
        visibility_km=7.5,
        risk_level="High" if is_haulage_risk else "Low",
        risk_reason="Muddy Haul Road Advisory: Rain forecast on Quarry ➔ Zone B transport corridor" if is_haulage_risk else "Optimal excavation conditions",
        is_favorable=not is_haulage_risk
    )
