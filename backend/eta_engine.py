"""
ETA Prediction Engine:
Calculates final completion ETA and confidence score using task parameters,
weather factors, historical idle ratios, and machine health telemetry.
"""
from typing import Dict, Any

def predict_task_eta(
    task: Dict[str, Any],
    weather_risk: bool = False,
    weather_condition: str = "Clear",
    idle_ratio: float = 0.05,
    machine_health_penalty: float = 0.0
) -> Dict[str, float]:
    """
    Computes explainable ETA components and confidence.
    """
    target_qty = task.get("target_quantity", 100.0)
    completed_qty = task.get("completed_quantity", 0.0)
    remaining_qty = max(0.0, target_qty - completed_qty)

    # Base rate estimates per task type (minutes per unit)
    task_type = task.get("task_type", "Excavation").lower()
    if "excav" in task_type:
        rate = 0.35 # min per m3
    elif "load" in task_type:
        rate = 1.8  # min per load
    elif "trans" in task_type:
        rate = 4.5  # min per trip
    elif "grad" in task_type:
        rate = 0.012 # min per m2
    else:
        rate = 0.5

    base_estimate = remaining_qty * rate
    if base_estimate <= 0:
        base_estimate = task.get("route_duration_min", 45.0)

    # Weather adjustment
    weather_adj = 0.0
    if weather_risk or "rain" in weather_condition.lower() or "storm" in weather_condition.lower():
        weather_adj = base_estimate * 0.20 # 20% slowdown under wet/muddy haul road conditions
    elif "wind" in weather_condition.lower():
        weather_adj = base_estimate * 0.08

    # Idle adjustment based on historical operator idle ratio
    idle_adj = base_estimate * (idle_ratio * 0.8)

    # Machine condition adjustment (e.g. elevated hydraulic temp or maintenance overdue)
    condition_adj = base_estimate * machine_health_penalty

    final_eta = base_estimate + weather_adj + idle_adj + condition_adj

    # Confidence score calculation (0.0 to 1.0)
    # Starts at 0.95 and drops based on unpredictable factors
    confidence = 0.95
    if weather_risk:
        confidence -= 0.12
    if idle_ratio > 0.20:
        confidence -= 0.08
    if machine_health_penalty > 0.1:
        confidence -= 0.10

    confidence = max(0.60, min(0.99, confidence))

    return {
        "base_estimate_min": round(base_estimate, 1),
        "weather_adjustment_min": round(weather_adj, 1),
        "idle_adjustment_min": round(idle_adj, 1),
        "machine_condition_adjustment_min": round(condition_adj, 1),
        "final_eta_min": round(final_eta, 1),
        "confidence_score": round(confidence, 2)
    }
