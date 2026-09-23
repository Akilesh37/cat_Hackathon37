# CAT Operator Intelligence & Safety Copilot

A closed-loop heavy-equipment safety and operations platform with a **Fleet Supervisor Web Dashboard** and an **In-Cabin Operator Web & Mobile App**, powered by a **FastAPI backend**, **Socket.IO real-time telemetry**, a **PostgreSQL database**, and an **AI Technical Copilot** built around Caterpillar operation and maintenance manuals.

---

## 1. Key Features & Innovations

- **Live Map Synchronization (Admin ↔ Operator)**:
  Single source of truth for equipment location. An autonomous machine simulator ticks every 2 seconds, moving machines along active task routes and excavation zones. Positions are broadcast via Socket.IO simultaneously to the `admin_fleet` room and the machine's assigned `operator_{id}` room. Both views render the coordinates via the single, shared `<LiveMap />` component, guaranteeing identical coordinates and breadcrumb trails without polling.
- **Deterministic Safety Gating Engine**:
  Zero-LLM life-safety rule engine for seatbelt enforcement, proximity radar alerts (<8m), pre-start inspection gating, and ray-casting geofence breach detection.
- **Explainable 100-Point Operator Score**:
  Shift scorecard starting at 100 points with itemized, transparent deductions for delay beyond ETA, unbuckled travel, perimeter infractions, equipment stress, and excessive idling.
- **AI Safety & Operations Copilot (RAG)**:
  Ingests CAT 320 manuals and correlates technical guidelines with real-time machine telemetry (temperatures, oil pressure, fuel level, diagnostic trouble codes). Supports **browser Web Speech API** hands-free cabin voice input and audio playback.
- **AccuWeather Feasibility Check**:
  Automated weather feasibility advisory during task assignment, warning supervisors of muddy haul road conditions.
- **Forensic Incident Replay**:
  Historical flight-recorder playback scrub tool for supervisors to investigate safety incidents with synchronized GPS map breadcrumbs and telemetry streams.

---

## 2. Tech Stack

- **Frontend**:
  - React.js (Vite) + TypeScript
  - TailwindCSS with **Caterpillar Brand Design Tokens**:
    - Black: `#1A1A1A`
    - Caterpillar Yellow: `#FFCD11`
    - Grays: `#F5F5F5`, `#E0E0E0`, `#8A8A8A`, `#4A4A4A`
    - Red (Critical): `#E23D3D`
    - Green (Normal): `#2FA84F`
    - Blue (Haul Corridor / ETA): `#2E6FDB`
    - Orange (Warning / Weather Risk): `#F7941E`
  - Leaflet + OpenStreetMap for live maps, shaded work zones, and haul routes
  - Socket.IO client (`/location`, `/telemetry`, `/alerts`)
  - Recharts for real-time sensor streams
  - Web Speech API (Browser STT / TTS)
  - Zustand for session, telemetry, and location stores
- **Backend**:
  - Python 3.11 + FastAPI (REST API + WebSocket/ASGI Socket.IO)
  - python-socketio AsyncServer
  - SQLAlchemy 2.0 ORM + Alembic
  - Pydantic v2 schemas
  - Autonomous Machine Simulator (2-second tick loop)
- **Data & AI**:
  - PostgreSQL / TimescaleDB (with SQLite out-of-the-box local fallback)
  - Redis for Socket.IO pub/sub
  - LangChain RAG + FAISS vector store + Anthropic Claude 3.5 Sonnet (with intelligent offline domain fallback)

---

## 3. Quick Start & Setup

### Option A: Running with Docker Compose (Recommended)

1. Clone or navigate to the repository directory:
   ```bash
   cd e:\CAT
   ```
2. (Optional) Set your Anthropic API key in `.env`:
   ```bash
   copy .env.example .env
   # Add ANTHROPIC_API_KEY=sk-ant-... if desired
   ```
3. Start all services (Backend, Frontend, PostgreSQL, Redis):
   ```bash
   docker-compose up --build
   ```
4. Access the applications:
   - **Web App (Supervisor Dashboard & Operator)**: `http://localhost:3000`
   - **FastAPI Documentation**: `http://localhost:8000/docs`

---

### Option B: Running Locally (Fastest Development Run)

#### 1. Backend:
```bash
cd e:\CAT\backend

# Install dependencies
pip install -r requirements.txt

# Seed dummy data
python seed.py

# Run FastAPI + Socket.IO server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend:
```bash
cd e:\CAT\frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 4. End-to-End Demonstration Walkthrough

Follow this step-by-step script to showcase the closed-loop functionality during a demo:

### Step 1: Admin Task Assignment & Weather Check
1. Go to `http://localhost:3000/login` and click **"Supervisor"** (PIN: `9999`).
2. Navigate to **"Task Assignment"** (`/admin/tasks/assign`).
3. Notice the **Weather Feasibility Advisory Banner** showing *High Risk - Rain forecast on Quarry ➔ Zone B transport corridor*.
4. On the interactive map on the right, observe the yellow Quarry origin pin, the purple Zone B polygon, and the blue connecting haul corridor polyline.
5. Click **"Assign Task & Sync Map Route"** to dispatch Task `T-005`.

### Step 2: Operator Login & Pre-Start Safety Gating
1. Open a new Incognito or second browser window and visit `http://localhost:3000/login`.
2. Click **"OP-003 Kumar"** (Tipper TN-XX-1234, PIN: `1234`).
3. Kumar's dashboard displays the assigned Transport Task from Quarry to Zone B with the active weather warning banner.
4. Click **"Pre-Start Check"** (`/operator/safety-check`).
5. Verify the safety checklist items (seatbelt mechanism, 360° walkaround, backup alarm, Cat Detect radar).
6. Click **"Verify Safety Checklist & Unlock Ignition"** — passing the gating unlocks the machine.

### Step 3: Flagship Live Map Synchronization (Dual Window Demo)
1. Place the **Supervisor Fleet Command** (`/admin/fleet`) on the left half of your screen.
2. Place the **Operator In-Cabin HUD** (`/operator/live`) on the right half of your screen.
3. **Observe**: Every 2 seconds, Tipper `Tipper TN-XX-1234` moves along the blue haul road corridor from Quarry Site A towards Zone B.
4. The exact latitude, longitude, heading, and speed update in lockstep across both screens via the `/location` Socket.IO namespace.
5. In the operator window, notice the real-time ETA pill updating (*ETA: ~45 min • 1.8 km remaining*).

### Step 4: Real-Time Geofence Breach Alert
1. While watching the Fleet Map, observe **CAT 140 Motor Grader** operating in Zone C.
2. When the grader temporarily crosses the northern perimeter of Zone C, the central simulator's deterministic rule engine triggers a **Geofence Breach Event**.
3. A pulsing red **Critical Alert banner (P1)** instantly appears on both the admin dashboard and operator notification queue, and automatically assigns a **Proximity Awareness** refresher module to the operator.

### Step 5: AI Voice & Technical Copilot
1. In the Operator HUD or via the sidebar, open **"AI Copilot"** (`/operator/copilot`).
2. Click the yellow microphone button (or click the sample question chip):
   > *"What is the standard hydraulic operating temperature for CAT 320?"*
3. The RAG pipeline retrieves the CAT 320 technical manual chapter, pulls live telemetry (68.2°C), synthesizes diagnostic advice, and provides speech synthesis audio playback while citing **Section 3.2 - Hydraulic System Operating Temperatures & Limits**.

### Step 6: End of Shift Scorecard & Incident Replay
1. Click **"End Shift"** on the operator HUD to open the **Shift Summary** (`/operator/summary/3`).
2. View the explainable 100-point performance score with transparent deductions (schedule adherence, 100% seatbelt compliance, safety violations, and idle minutes).
3. Back on the Admin Dashboard, navigate to **"Incident Center"** (`/admin/incidents`) and click **"Replay GPS & Telemetry"** on any incident to step through the historical flight-recorder timeline.
4. In **"Reports"** (`/admin/reports`), download the compliance CSV audit file with one click.
