from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
import io
import csv
from database import get_db
import models

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/export")
def export_report(
    report_type: str = Query(default="incidents"), # incidents, fleet_telemetry, performance
    file_format: str = Query(default="csv"),      # csv, json
    db: Session = Depends(get_db)
):
    """
    Exports compliance and operations data in CSV or JSON format.
    """
    output = io.StringIO()

    if report_type == "incidents":
        records = db.query(models.Incident).all()
        writer = csv.writer(output)
        writer.writerow(["ID", "Type", "Machine ID", "Operator ID", "Severity", "Status", "Description", "Created At"])
        for r in records:
            writer.writerow([r.id, r.incident_type, r.machine_id, r.operator_id, r.severity, r.status, r.description, r.created_at])

        filename = "cat_incidents_report.csv"

    elif report_type == "performance":
        records = db.query(models.OperatorPerformance).all()
        writer = csv.writer(output)
        writer.writerow(["ID", "Operator ID", "Task ID", "Score", "Seatbelt Compliance %", "Idle Min", "Safety Events", "Created At"])
        for r in records:
            writer.writerow([r.id, r.operator_id, r.task_id, r.score_out_of_100, r.seatbelt_compliance_pct, r.idle_time_min, r.safety_events_count, r.created_at])

        filename = "cat_operator_performance_report.csv"

    else:
        machines = db.query(models.Machine).all()
        writer = csv.writer(output)
        writer.writerow(["Machine Code", "Model", "Type", "Status", "Fuel %", "Hydraulic Temp C", "Engine Hours", "Latitude", "Longitude"])
        for m in machines:
            writer.writerow([m.machine_code, m.model, m.type, m.status, m.fuel_level, m.hydraulic_temp, m.engine_hours, m.current_lat, m.current_lng])

        filename = "cat_fleet_status_report.csv"

    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    return response
