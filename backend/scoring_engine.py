"""
100-Point Explainable Operator Scoring Engine:
Evaluates shift performance with full transparency and itemized reasoning deductions.
"""
from typing import Dict, Any, List, Tuple

def calculate_operator_score(
    expected_time_min: float,
    actual_time_min: float,
    seatbelt_compliance_pct: float,
    safety_events_count: int,
    anomalies_count: int,
    idle_time_min: float,
    max_allowed_idle_min: float = 15.0
) -> Tuple[float, List[str]]:
    """
    Computes a score out of 100 with itemized deductions.
    Returns (final_score, list_of_reasoning_strings).
    """
    score = 100.0
    deductions = []

    # 1. Schedule Adherence / Delay
    delay = max(0.0, actual_time_min - expected_time_min)
    if delay > 0:
        delay_penalty = min(15.0, round((delay / 5.0) * 1.5, 1))
        score -= delay_penalty
        deductions.append(f"Delay Deduction: -{delay_penalty:.1f} pts ({delay:.0f} min beyond expected duration)")
    else:
        deductions.append("Schedule Bonus: Completed on or ahead of target timeline (+0 pts)")

    # 2. Seatbelt Compliance
    if seatbelt_compliance_pct < 100.0:
        deficit = 100.0 - seatbelt_compliance_pct
        seatbelt_penalty = min(25.0, round(deficit * 0.5, 1))
        score -= seatbelt_penalty
        deductions.append(f"Seatbelt Compliance ({seatbelt_compliance_pct:.1f}%): -{seatbelt_penalty:.1f} pts for unfastened movement")
    else:
        deductions.append("Safety Habit: 100% Seatbelt compliance maintained (+0 pts)")

    # 3. Safety Events (Proximity, Geofence breach)
    if safety_events_count > 0:
        safety_penalty = min(30.0, safety_events_count * 10.0)
        score -= safety_penalty
        deductions.append(f"Safety Violations ({safety_events_count} event(s)): -{safety_penalty:.1f} pts (proximity or boundary infractions)")
    else:
        deductions.append("Zero Safety Violations: Clean perimeter & zone compliance (+0 pts)")

    # 4. Machine Care & Anomalies (overheat, harsh loading)
    if anomalies_count > 0:
        anomaly_penalty = min(15.0, anomalies_count * 5.0)
        score -= anomaly_penalty
        deductions.append(f"Equipment Stress ({anomalies_count} anomaly event(s)): -{anomaly_penalty:.1f} pts (hydraulic or engine threshold warning)")
    else:
        deductions.append("Smooth Operation: Hydraulic & engine parameters remained in optimal green zone (+0 pts)")

    # 5. Excessive Idle Time
    excess_idle = max(0.0, idle_time_min - max_allowed_idle_min)
    if excess_idle > 0:
        idle_penalty = min(15.0, round((excess_idle / 2.0) * 1.0, 1))
        score -= idle_penalty
        deductions.append(f"Excess Idle ({idle_time_min:.0f} min, threshold {max_allowed_idle_min:.0f} min): -{idle_penalty:.1f} pts for unnecessary fuel burn")

    final_score = max(0.0, min(100.0, round(score, 1)))
    return final_score, deductions
