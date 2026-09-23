import sqlite3

db = sqlite3.connect("cat_copilot.db")
c = db.cursor()

# We need 5 CAT 320s named CAT 320 A through CAT 320 E
names = ["CAT 320 A", "CAT 320 B", "CAT 320 C", "CAT 320 D", "CAT 320 E"]

for i, name in enumerate(names):
    c.execute("SELECT id FROM machines WHERE model = 'CAT 320' OR machine_code = ?", (name,))
    row = c.fetchone()
    if row:
        c.execute("UPDATE machines SET machine_code = ?, model = 'CAT 320', type='Hydraulic Excavator' WHERE id = ?", (name, row[0]))
    else:
        c.execute("INSERT INTO machines (machine_code, type, model, manufacture_year, status, fuel_level, engine_hours) VALUES (?, 'Hydraulic Excavator', 'CAT 320', 2024, 'available', 100, 0)", (name,))

db.commit()
db.close()
print("Machines updated.")
