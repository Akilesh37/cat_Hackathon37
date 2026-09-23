import httpx

BASE_URL = "http://localhost:8000/api"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc5MDI3NzgxNn0.wEASkBM6FNVXZdpSubMC-BwGO6Gu3nHESqa-F8FdFhM"

headers = {"Authorization": f"Bearer {TOKEN}"}

print("1. Add an operator")
res = httpx.post(f"{BASE_URL}/admin/operators", headers=headers, json={
    "operator_code": "OP-999",
    "employee_id": "EMP-999",
    "name": "Test Operator",
    "role": "Excavator Operator"
})
print(res.status_code, res.text)
op_id = res.json().get("id")

print("\n2. Add duplicate operator (expect 409)")
res = httpx.post(f"{BASE_URL}/admin/operators", headers=headers, json={
    "operator_code": "OP-998",
    "employee_id": "EMP-999",
    "name": "Duplicate Operator",
    "role": "Excavator Operator"
})
print(res.status_code, res.text)

print("\n3. Assign operator to machine")
# Get a machine
machines = httpx.get(f"{BASE_URL}/admin/machines", headers=headers).json()
m_id = machines[0]["id"]
print(f"Using Machine ID {m_id}")

res = httpx.post(f"{BASE_URL}/admin/assignments", headers=headers, json={
    "operator_id": op_id,
    "machine_id": m_id,
    "task": "Test Task",
    "shift": "morning",
    "start_time": "2026-09-24T00:00:00Z",
    "end_time": "2026-09-24T08:00:00Z"
})
print(res.status_code, res.text)
assignment_id = res.json().get("id")

print("\n4. Double-assign the same machine (expect 409)")
res = httpx.post(f"{BASE_URL}/admin/assignments", headers=headers, json={
    "operator_id": 1, # Different operator
    "machine_id": m_id,
    "task": "Test Task 2",
    "shift": "morning",
    "start_time": "2026-09-24T00:00:00Z",
    "end_time": "2026-09-24T08:00:00Z"
})
print(res.status_code, res.text)

print("\n5. Complete assignment (machine goes back to available)")
res = httpx.put(f"{BASE_URL}/admin/assignments/{assignment_id}/complete", headers=headers)
print(res.status_code, res.text)

# Check machine status
machines = httpx.get(f"{BASE_URL}/admin/machines", headers=headers).json()
m_status = next(m["status"] for m in machines if m["id"] == m_id)
print(f"Machine status is now: {m_status}")

print("\n6. Non-admin call (expect 403 or 401)")
res = httpx.get(f"{BASE_URL}/admin/machines", headers={"Authorization": "Bearer fake_token"})
print(res.status_code, res.text)
