from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.seed import seed_data
from app.websocket import manager as ws_manager
from app.routers import auth, cameras, watchlist, events, alerts, system

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables & run initial seed if empty
    print(f"Starting {settings.PROJECT_NAME} Backend Service...")
    await init_db()
    try:
        await seed_data()
    except Exception as e:
        print(f"Seeding notice: {e}")
    yield
    print("Shutting down SentinelGrid Backend Service...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
# SentinelGrid — CCTV Registry, GIS & Watchlist Analytics Platform
**Submitted for**: Gujarat Police Innovation Challenge 2026 (Sentinel)  
**Problem ID**: KANADSHIELD26_P2_10  

SentinelGrid provides a unified state-wide CCTV registry, PostGIS spatial gap analysis, department-scoped RBAC, real-time AI alert streaming, and chronological GIS vehicle route tracking.

### Core Capabilities:
- **Layer 1 Registry & GIS**: Camera metadata, PostGIS `GEOGRAPHY(POINT,4326)` geometries, manual & bulk CSV/JSON camera onboarding with preview, department-scoped JWT RBAC, PostGIS spatial gap analysis for uncovered zones.
- **Layer 2 VMS & Watchlist**: Multi-category watchlist management, AI matching engine for ANPR plates and face embeddings, real-time WebSocket alert stream, and chronological vehicle route tracking.
- **Deliverables & Live Test Case**: Dedicated vehicle route tracking centerpiece (`/vehicle-track/{plate_number}`), multi-parameter searchable events, system DR failover toggle, and metadata audit trail logging.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Registration
app.include_router(auth.router)
app.include_router(cameras.router)
app.include_router(watchlist.router)
app.include_router(events.router)
app.include_router(alerts.router)
app.include_router(system.router)

@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint streaming AI detection alerts to connected dashboards.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive loop
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@app.get("/", tags=["Health Check"])
async def root_health_check():
    return {
        "status": "ONLINE",
        "system": settings.PROJECT_NAME,
        "challenge": "Gujarat Police Innovation Challenge 2026",
        "docs": "/docs",
        "websocket_alerts": "/ws/alerts"
    }
