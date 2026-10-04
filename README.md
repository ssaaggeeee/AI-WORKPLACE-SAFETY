# SafeSight AI — AI-Powered Workplace Safety Monitoring and Risk Assessment Platform

**Group 173 Prototype**

SafeSight AI is a camera-based workplace safety platform that combines **PPE compliance detection**, **worker-to-hazard proximity monitoring**, **posture/unsafe-act detection**, a **rule-based risk fusion / decision engine**, **explainable real-time alerts**, **automatic incident logging** and **analytics** — into ONE explainable decision layer.

```
CAMERA → AI DETECTION → RISK FUSION → EXPLAINABLE DECISION → ALERT → AUTOMATIC INCIDENT LOGGING → ANALYTICS
```

---

## 1. Quick Start (Windows — one command)

Double-click **`run.bat`** (or run it from a terminal). It:

1. Installs backend dependencies if missing (`pip install -r backend/requirements.txt`)
2. Builds the frontend on first run (`npm install` + `npm run build`)
3. Starts the FastAPI backend (which serves the built frontend)
4. Opens the browser at **http://127.0.0.1:8000/**
5. Click **START LIVE DEMO** on the dashboard to run the safety scenario

> **No login / no credentials** — the prototype opens directly into the dashboard.

### Manual startup (equivalent)

Backend:
```
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Frontend (development mode with hot reload, port 5173):
```
cd frontend
npm install
npm run dev
```

Production-style single process (what run.bat does):
```
cd frontend && npm install && npm run build   # one-time
cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
The backend automatically serves `frontend/dist` at `/` — one URL for everything.

---

## 2. How to Run the Safety Scenario

On the **Dashboard**, in the DEMO CONTROL panel:

- **START LIVE DEMO** — runs the scripted scenario continuously (~30 s per loop):
  1. Worker W-002 appears in a safe zone
  2. Moves toward the Crane Swing Area (distance decreases, closing speed increases)
  3. Faces the hazard → helmet becomes missing → posture becomes unsafe
  4. Risk score rises → WARNING alert → CRITICAL alert (incident auto-saved to SQLite)
  5. Worker exits the zone → risk drops → alert auto-resolves (logged as near-miss)
- **RESET DEMO** — stops the loop, restores workers to their initial state, auto-resolves open alerts

You can also drive it with the API:
```
POST http://127.0.0.1:8000/api/demo/start
POST http://127.0.0.1:8000/api/demo/reset
```

---

## 3. What Uses Real AI/CV vs Simulated Data

| Feature | Mode | Notes |
|---|---|---|
| Risk fusion / decision engine | **REAL computation** | Pure rule-based engine (`risk_engine.py` + `risk_config.py`) — every point is computed and traceable |
| Proximity / zone geometry | **REAL computation** | Perspective-corrected ground-plane model + point-in-polygon (`detection/proximity.py`) |
| Demo scenario worker states | Simulated | `demo_engine.py` drives positions/PPE/posture through the real pipeline |
| Person detection (webcam/video frames) | **REAL (OpenCV)** | OpenCV HOG detector, built into opencv-python — no downloads |
| PPE detection (webcam/video) | Optional real YOLO | Auto-uses YOLO if weights are installed; otherwise falls back to OpenCV-HOG boxes + Mock mode |
| Posture detection (webcam/video) | Optional real YOLO-pose | Same graceful fallback |
| Seed analytics (KPIs, history) | Simulated DB data | Deterministic seed — realistic AND stable across refreshes |
| Live demo events | Simulated → REAL persistence | Every demo alert is really written to SQLite and streamed over WebSocket |

The UI always shows the active mode: **AI MODE: DEMO** or **AI MODE: YOLO + POSE** (sidebar + System Status page).

---

## 4. Where Real YOLO Models Can Be Plugged In

The detection-provider architecture accepts real models without touching the frontend:

1. `pip install ultralytics` (installs PyTorch, ~2 GB)
2. Place PPE weights at `backend/models/ppe_yolo.pt` (any open PPE dataset model: helmet/vest/gloves classes)
3. Place pose weights at `backend/models/yolov8n-pose.pt` (YOLOv8-nano pose)
4. Restart — `/api/system-status` will show the providers as **REAL**, and webcam/video inference switches to YOLO automatically

If anything fails (no torch, no weights, inference error), the pipeline falls back to Mock/Demo mode — the app never breaks.

---

## 5. Project File Structure

```
AI_Workplace_Safety/
│
├── frontend/
│   ├── package.json               React + Vite + Tailwind + Lucide + Recharts
│   ├── vite.config.js             dev proxy → backend :8000
│   ├── index.html
│   └── src/
│       ├── App.jsx                layout, sidebar nav, WebSocket + polling state
│       ├── components/
│       │   ├── CameraPanel.jsx    LIVE SAFETY MONITOR (canvas demo scene / webcam / video)
│       │   ├── AlertPanel.jsx     LIVE ALERTS feed (acknowledge / resolve)
│       │   ├── DecisionEngineCard.jsx  PPE + PROXIMITY + ... → RISK FUSION visual
│       │   ├── PipelineFlow.jsx   CAMERA → ... → INCIDENT LOGGED
│       │   ├── IncidentModal.jsx  details + explainable breakdown + timeline
│       │   ├── KpiCards.jsx       dashboard KPIs from real DB data
│       │   └── StatusBadge.jsx    severity/status badges
│       ├── pages/
│       │   ├── Dashboard.jsx      overview + live monitoring
│       │   ├── Incidents.jsx      table, filters, acknowledge/resolve/delete
│       │   ├── Analytics.jsx      8 Recharts charts from actual SQLite data
│       │   ├── Workers.jsx        worker table + detail drawer
│       │   ├── Zones.jsx          camera config + zone CRUD + live overlays
│       │   └── SystemStatus.jsx   health panel + edge-first privacy badge
│       └── services/
│           ├── api.js             REST client
│           └── websocket.js       live alerts with auto-reconnect
│
├── backend/
│   ├── main.py                    FastAPI app — all REST endpoints + /ws/alerts
│   ├── database.py                SQLite schema + deterministic seed + helpers
│   ├── risk_engine.py             rule-based risk fusion + root-cause tagging
│   ├── risk_config.py             ALL risk weights/thresholds (edit here)
│   ├── demo_engine.py             scripted crane-approach scenario
│   ├── detection/
│   │   ├── base.py                DetectionProvider abstract interface
│   │   ├── mock.py                MockDetectionProvider (guaranteed fallback)
│   │   ├── ppe.py                 YOLOPPEProvider (optional real YOLO)
│   │   ├── pose.py                YOLOPoseProvider (optional real pose)
│   │   └── proximity.py           ProximityProvider (geometry + OpenCV HOG)
│   └── safesight.db               SQLite database (auto-created + seeded on first run)
│
├── run.bat                        one-command Windows startup
└── README.md                      this file
```

---

## 6. Backend API Reference

Interactive docs: **http://127.0.0.1:8000/docs**

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check (also aliased at `/health`) |
| GET | `/api/dashboard` | KPI values from DB data |
| GET | `/api/workers` · `/api/workers/{id}` | Worker monitoring + detail/history |
| GET | `/api/incidents` | Incident list — filters: `severity, date, worker, zone, root_cause, status` |
| GET | `/api/incidents/{id}` | Detail + timeline + recommendation |
| POST | `/api/incidents/{id}/acknowledge` · `/resolve` · DELETE | Incident management |
| GET | `/api/analytics` | All chart data (real SQLite aggregates) |
| GET/POST/PUT/DELETE | `/api/zones` | Zone & camera configuration CRUD |
| POST | `/api/demo/start` · `/api/demo/reset` · GET `/api/demo/scenarios` | Demo control |
| GET | `/api/snapshot` | Static monitoring snapshot (initial render) |
| GET | `/api/system-status` | Provider/health panel data |
| POST | `/api/risk/score` | Score any detection through the real risk engine |
| POST | `/api/detect/ppe` · `/detect/pose` · `/detect/proximity` · `/detect/frame` | Detection interfaces (graceful fallback) |
| WS | `/ws/alerts` | Live alerts + snapshots + resolution events |

---

## 7. Risk Fusion Engine (How It Works)

All weights live in **`backend/risk_config.py`** — edit and restart to tune:

| Factor | Rule | Points |
|---|---|---|
| Helmet missing | PPE item weight | +30 |
| Vest missing | PPE item weight | +20 |
| Gloves missing | PPE item weight | +10 |
| Proximity | <3 m: +40 · 3–5 m: +25 · 5–10 m: +10 · >10 m: 0 | 0–40 |
| Facing hazard | Looking toward the hazard | +10 |
| Facing away | Looking away | −5 |
| Closing speed | (speed − 0.5 m/s) × 6, max | 0–15 |
| Posture | Unsafe +20 · Severe +30 | 0–30 |
| Zone bonus | Inside danger +10 · critical +15 | 0–15 |

Final score **clamped to 0–100** → classification: **0–24 SAFE · 25–49 LOW (WARNING) · 50–74 HIGH · 75–100 CRITICAL**.
Every alert shows the factor breakdown, the root-cause tag (e.g. `PPE NON-COMPLIANCE + INATTENTIVENESS`) and a safety recommendation — the supervisor sees exactly why an alert fired.

---

## 8. Database

SQLite (`backend/safesight.db`), auto-created and seeded on first run with deterministic demonstration data:
12 workers, 2 cameras, 3 hazard zones, ~70 incidents (today: 18 — 2 critical / 5 high / 7 warning / 4 safe, 2 open alerts), 12 near-misses, ~400 PPE events (~91% compliance), proximity and posture events over 7 days.

Tables: `workers, zones, cameras, incidents, ppe_events, proximity_events, posture_events`.

To re-seed from scratch: delete `backend/safesight.db*` and restart (or run `python database.py` inside `backend/`).

---

## 9. Dependencies That Must Be Installed Manually

Backend (`pip install -r backend/requirements.txt`): fastapi, uvicorn[standard], python-multipart, opencv-python, numpy.
Frontend (`npm install` inside `frontend/`): react, react-dom, lucide-react, recharts, vite, tailwindcss (+ postcss, autoprefixer).
Optional (manual, for real YOLO): `pip install ultralytics` + model weights in `backend/models/`.

---

## 10. Privacy / Edge-First Design

Badge: **EDGE-FIRST • NO CLOUD VIDEO**. Video processing is designed for local/edge inference (Jetson/Raspberry-Pi-class concept). Raw video is never uploaded to the cloud — webcam/uploaded video stays in the browser; only lightweight detection results are exchanged with the local backend. No external cloud storage is used.

---

## 11. Known Limitations

- Real YOLO PPE/pose detection requires `ultralytics` + weights (heavy install) — not enabled by default; Mock/Demo fallback is always active and the full workflow works without it.
- OpenCV HOG person detection works best with clearly visible, full-body people; occluded/small figures may not be detected (it is a classical detector, not deep learning).
- Distances use an explainable linear ground-plane depth model (homography concept) rather than calibrated camera homography.
- Single fixed-camera scene for the demo; multi-camera fusion is represented in the data model (CAM-01/CAM-02) but only CAM-01 is visualized live.
- WebSocket snapshots are sent at the scenario tick rate (~0.8 FPS); the monitoring canvas interpolates between snapshots for smooth motion.
- No authentication/admin permissions by design (exhibition prototype).
- Analytics "WHY" percentages cover all-time incidents; they update live as demo events are generated.

## 12. Testing

Backend self-tests included (run inside `backend/`):
- `python risk_engine.py` — prints a worked risk-fusion example
- `python database.py` — creates/seeds the DB and prints table counts
- `_test_endpoints.py` — calls analytics/system-status/dashboard directly
- `_test_workflow.py` — full end-to-end: demo start → alerts → incidents → analytics → reset
- `_test_ws.py` — WebSocket delivery test (alerts, snapshots, auto-resolve)
