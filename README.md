# SentinelGrid — CCTV Registry, GIS & Watchlist Analytics Platform

**Submitted for**: Gujarat Police Innovation Challenge 2026 (Sentinel)  
**Problem ID**: KANADSHIELD26_P2_10  

SentinelGrid is a unified state-wide CCTV registry, PostGIS spatial gap analysis, department-scoped RBAC, real-time AI alert streaming, and chronological GIS vehicle route tracking platform built strictly to satisfy the acceptance criteria of the Gujarat Police Innovation Challenge 2026.

---

## Quick Start & Deployment Guide

> 📖 **Looking for full production instructions?** See the comprehensive [Full Production Deployment Guide](file:///c:/Users/mannt/OneDrive/Desktop/Guj%20CCTV/docs/full-deployment-guide.md) covering Vercel, Render, Docker, and Ubuntu Linux VPS with SSL. For Vercel specific instructions, see [Vercel Deployment Guide](file:///c:/Users/mannt/OneDrive/Desktop/Guj%20CCTV/docs/vercel-deployment.md).

### Option 1: Docker Compose Deployment (Recommended)

Run the entire platform (PostGIS database, FastAPI backend, and React Vite frontend) in containerized mode with a single command:

```bash
docker-compose up --build
```

Access services once containers start:
- **SentinelGrid Dashboard (React + Leaflet)**: `http://localhost:3000`
- **FastAPI OpenAPI Documentation**: `http://localhost:8000/docs`
- **Real-Time Alert WebSocket Stream**: `ws://localhost:8000/ws/alerts`

---

### Option 2: Local Development Setup

#### 1. Backend Setup (FastAPI + Python 3.11)
```bash
cd backend
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup (React.js + Vite + TailwindCSS)
```bash
cd frontend
npm install
npm run dev
```

---

## Live Demonstration Guide (Step 4 Jury Demo)

1. Open the dashboard at `http://localhost:3000`.
2. Navigate to **Vehicle Route Track** (The Step 4 Centerpiece).
3. Search target license plate **`GJ-01-AB-1234`** (or click search).
4. View the connected chronological route line rendered across 8 sequential highway camera nodes from Ahmedabad to Surat on the Leaflet map.
5. Click playback controls (**PLAY**) to watch the animated vehicle marker travel along the polyline.
6. Navigate to **Live Alerts** and click **Simulate AI Intercept Alert** to trigger a real-time WebSocket alert push with audio chime and pulsing map pin.
7. Navigate to **GIS Registry**, toggle **Uncovered Zones Overlay**, and select **Cross-Dept View** to demonstrate PostGIS gap analysis and metadata audit logging.

---

## Step 7 Rubric Mapping Matrix

| Rubric Evaluation Dimension | Compliance Implementation | Location in Codebase / Documentation |
| :--- | :--- | :--- |
| **1. GIS & Spatial Mapping** | Leaflet.js map with PostGIS spatial geography (`GEOGRAPHY(POINT,4326)`), `ST_DWithin` spatial gap analysis, and connected route polyline rendering. | [backend/app/routers/cameras.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/routers/cameras.py), [frontend/src/components/RegistryMap.jsx](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/frontend/src/components/RegistryMap.jsx) |
| **2. Database & PostGIS Schema** | PostgreSQL 15 + PostGIS 3.3 extension. `departments`, `cameras` (with status, legacy infrastructure, and tagged live test flags), `audit_log`, `watchlist_entries`, `events`, `alerts`. | [backend/app/models.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/models.py), [backend/app/database.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/database.py) |
| **3. Camera Onboarding (Manual & Bulk)** | Manual single-camera onboarding form AND CSV bulk upload widget with preview-before-commit validation table step. | [backend/app/routers/cameras.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/routers/cameras.py#L82), [frontend/src/components/CameraOnboardingModal.jsx](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/frontend/src/components/CameraOnboardingModal.jsx) |
| **4. Department-Scoped RBAC Auth** | JWT-based role authentication scoped per department (Police, RTO, Food & Civil Supplies, Municipal Corp, Mining) with cross-department audited search. | [backend/app/auth.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/auth.py), [backend/app/routers/auth.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/routers/auth.py) |
| **5. Watchlist & AI Matching Pipeline** | 5 named categories (`stolen_vehicle`, `wanted_person`, `missing_person`, `blacklisted_vehicle`, `suspect`) + extensible `other`. Exact ANPR & face cosine similarity matching engine. | [backend/app/matching.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/matching.py), [backend/app/routers/events.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/routers/events.py) |
| **6. Real-Time Alert WebSocket Stream** | FastAPI native WebSocket manager for sub-100ms alert push with audio chimes and pulsing Leaflet map pins. | [backend/app/websocket.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/websocket.py), [frontend/src/components/LiveAlertsDashboard.jsx](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/frontend/src/components/LiveAlertsDashboard.jsx) |
| **7. Chronological Vehicle Tracking (Step 4)** | Dedicated screen returning chronological camera nodes, PostGIS coordinates, connected route polyline, timeline sidebar, and playback controls for plate `GJ-01-AB-1234`. | [backend/app/routers/events.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/routers/events.py#L125), [frontend/src/components/VehicleTrackingView.jsx](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/frontend/src/components/VehicleTrackingView.jsx) |
| **8. Searchable Events & Audit Logs** | Dedicated multi-parameter searchable events view with CSV export and tamper-evident metadata audit log viewer. | [frontend/src/components/SearchableEventsView.jsx](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/frontend/src/components/SearchableEventsView.jsx), [frontend/src/components/AuditTrailView.jsx](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/frontend/src/components/AuditTrailView.jsx) |
| **9. Ingestion Adapters & DR / DPDP Bonus** | RTSP local & Govt Central CCTV REST feed normalization, Disaster Recovery failover toggle demo, and DPDP consent framing. | [backend/app/adapters/feed_adapters.py](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/backend/app/adapters/feed_adapters.py), [frontend/src/components/SystemAdaptersView.jsx](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/frontend/src/components/SystemAdaptersView.jsx) |
| **10. Documentation Deliverables** | High-Level Design (Mermaid, hybrid justification, ERD), Scalability Plan (9 portal sections), Output Report template, and OpenAPI docs. | [docs/high-level-design.md](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/docs/high-level-design.md), [docs/scalability-plan.md](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/docs/scalability-plan.md), [docs/output-report.md](file:///C:/Users/mannt/OneDrive/Desktop/Guj CCTV/docs/output-report.md) |

---

## Project Structure

```
.
├── docker-compose.yml
├── README.md
├── docs/
│   ├── high-level-design.md
│   ├── scalability-plan.md
│   └── output-report.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── auth.py
│       ├── matching.py
│       ├── websocket.py
│       ├── seed.py
│       ├── adapters/
│       │   └── feed_adapters.py
│       └── routers/
│           ├── auth.py
│           ├── cameras.py
│           ├── watchlist.py
│           ├── events.py
│           ├── alerts.py
│           └── system.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── index.css
        ├── main.jsx
        ├── App.jsx
        ├── services/
        │   └── api.js
        └── components/
            ├── Navbar.jsx
            ├── RegistryMap.jsx
            ├── CameraOnboardingModal.jsx
            ├── VehicleTrackingView.jsx
            ├── LiveAlertsDashboard.jsx
            ├── WatchlistManager.jsx
            ├── SearchableEventsView.jsx
            ├── AuditTrailView.jsx
            └── SystemAdaptersView.jsx
```
