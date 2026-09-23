import sqlite3
import pandas as pd
import math

db = sqlite3.connect("cat_copilot.db")

print("Validating Telemetry Rows...")
telemetry_count = pd.read_sql_query("SELECT COUNT(*) as cnt FROM telemetry", db)["cnt"].iloc[0]
print(f"Total Telemetry Rows: {telemetry_count}")

print("\nValidating Incidents (Causal Links)...")
incidents = pd.read_sql_query("SELECT incident_type, severity, COUNT(*) as cnt FROM incidents GROUP BY incident_type, severity", db)
print(incidents)

print("\nValidating ETA Predictions...")
eta = pd.read_sql_query("SELECT task_id, base_estimate_min, weather_adjustment_min, machine_condition_adjustment_min, final_eta_min FROM eta_predictions LIMIT 5", db)
print(eta)

print("\nValidating Operator Performance...")
perf = pd.read_sql_query("SELECT task_id, score_out_of_100, safety_events_count FROM operator_performance LIMIT 5", db)
print(perf)

db.close()
