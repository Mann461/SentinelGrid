# SentinelGrid — Full Production Deployment Guide

This guide provides end-to-end instructions for deploying the **SentinelGrid CCTV Registry, GIS & Watchlist Analytics Platform** across multiple deployment environments:
1. **Cloud Architecture (Frontend on Vercel + Backend on Render/Railway)**
2. **Docker Compose (Single-command full stack with PostGIS container)**
3. **Dedicated Cloud VPS (Ubuntu 22.04 / 24.04 + Nginx + Systemd + Let's Encrypt SSL)**
4. **Instant Public URL / Demo Tunnels (Cloudflare Tunnel)**

---

## 1. System Architecture & Topology

```mermaid
graph TD
    Client["Browser / Mobile Client"] -->|HTTPS / WSS| CDN["Vercel Edge CDN (Frontend)"]
    Client -->|API Requests| Backend["FastAPI Backend (Render / VPS)"]
    Client -->|Alert Push| WS["WebSocket Stream (/ws/alerts)"]
    Backend --> DB[("PostgreSQL 15 + PostGIS 3.3 (or SQLite)")]
    Backend --> Seed["Corridor Seeder (266 Cameras / 175 Route Nodes)"]
    Backend --> MatchingEngine["ANPR & Face Cosine Matching"]
```

---

## 2. Environment Variables Specification

### Backend Variables (`backend/.env` or Cloud Dashboard)

| Variable | Description | Default / Example | Production Recommended |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | Name of the platform | `SentinelGrid` | `SentinelGrid — CCTV Registry` |
| `SECRET_KEY` | JWT signing secret | `sentinelgrid-secret-2026` | Generate 32+ char random string |
| `ALGORITHM` | Cryptographic algorithm | `HS256` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Session token expiry | `1440` (24 hours) | `1440` |
| `USE_SQLITE` | Fast zero-dependency fallback | `true` | `false` (when using PostgreSQL) |
| `DATABASE_URL` | Async connection string | `sqlite+aiosqlite:///./sentinelgrid.db` | `postgresql+asyncpg://user:pass@host:5432/dbname` |
| `SYNC_DATABASE_URL` | Sync connection string | `sqlite:///./sentinelgrid.db` | `postgresql://user:pass@host:5432/dbname` |

### Frontend Variables (`frontend/.env` or Vercel Settings)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_BASE` | URL of the running FastAPI backend | `http://localhost:8000` (Local) / `https://your-backend.onrender.com` |
| `VITE_WS_BASE` | WebSocket endpoint for real-time alerts | `ws://localhost:8000/ws/alerts` (Local) / `wss://your-backend.onrender.com/ws/alerts` |

---

## 3. Deployment Option A: Vercel (Frontend) + Render (Backend)

This is the recommended serverless/cloud architecture. It provides high global performance via Vercel's Edge CDN for the Leaflet dashboard, combined with a dedicated Python server on Render for real-time WebSocket alerts and PostGIS processing.

### Step 1: Deploy Backend to Render.com
1. Push your repository to **GitHub**.
2. Sign in to [Render.com](https://render.com) and click **New + > Web Service**.
3. Select your repository.
4. Fill in the service configuration:
   * **Name**: `sentinelgrid-backend`
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Region**: `Singapore` (or closest to target users)
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   * `USE_SQLITE` = `true` (or link a managed PostgreSQL database)
   * `SECRET_KEY` = `<your-secure-random-key>`
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g., `https://sentinelgrid-backend.onrender.com`).

### Step 2: Deploy Frontend to Vercel
1. Sign in to [Vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import the same GitHub repository.
3. Configure settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend` *(or leave `./` since root `vercel.json` is configured)*
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Add **Environment Variables**:
   * `VITE_API_BASE`: `https://sentinelgrid-backend.onrender.com`
   * `VITE_WS_BASE`: `wss://sentinelgrid-backend.onrender.com/ws/alerts`
5. Click **Deploy**.
6. Vercel will build and assign you a permanent `https://<your-project>.vercel.app` URL with automated HTTPS and CDN caching.

---

## 4. Deployment Option B: Docker Compose (All-in-One)

Deploy PostgreSQL 15 + PostGIS 3.3, FastAPI backend, and React Vite frontend on any Docker-compatible server with a single command.

### Prerequisites
* Docker Engine 20.10+ and Docker Compose v2+ installed.

### Commands
```bash
# Clone repository
git clone https://github.com/your-username/sentinelgrid.git
cd sentinelgrid

# Build and start all services in detached mode
docker-compose up --build -d

# Verify all containers are healthy
docker ps
```

### Accessing Services
* **Frontend Web Dashboard**: `http://<server-ip>:3000`
* **FastAPI OpenAPI Swagger**: `http://<server-ip>:8000/docs`
* **Health Check**: `http://<server-ip>:8000/`

---

## 5. Deployment Option C: Production Linux VPS (Ubuntu 22.04 / 24.04)

For sovereign on-premise police infrastructure, dedicated bare-metal, or AWS EC2 / DigitalOcean Droplets.

### 1. System Dependencies & Python Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx certbot python3-certbot-nginx git

# Clone repository to /var/www
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/your-username/sentinelgrid.git
sudo chown -R $USER:$USER /var/www/sentinelgrid
```

### 2. Backend Virtualenv & Service
```bash
cd /var/www/sentinelgrid/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run initial seed
python -m app.seed
```

Create Systemd Service (`/etc/systemd/system/sentinelgrid-backend.service`):
```ini
[Unit]
Description=SentinelGrid FastAPI Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/sentinelgrid/backend
Environment="PATH=/var/www/sentinelgrid/backend/venv/bin"
Environment="USE_SQLITE=true"
ExecStart=/var/www/sentinelgrid/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sentinelgrid-backend
sudo systemctl start sentinelgrid-backend
sudo systemctl status sentinelgrid-backend
```

### 3. Frontend Production Build
```bash
cd /var/www/sentinelgrid/frontend
npm install
npm run build
```

### 4. Nginx Reverse Proxy Configuration
Create `/etc/nginx/sites-available/sentinelgrid`:
```nginx
server {
    server_name your-domain.gujaratpolice.gov.in;

    # Frontend Static Files
    location / {
        root /var/www/sentinelgrid/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Alert Stream
    location /ws/ {
        proxy_pass http://127.0.0.1:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

Enable site and configure SSL:
```bash
sudo ln -s /etc/nginx/sites-available/sentinelgrid /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.gujaratpolice.gov.in
```

---

## 6. Verification & Post-Deployment Smoke Test

Perform these checks to verify full operational status:

1. **Backend Health Check**:
   ```bash
   curl -I https://<your-backend-url>/
   # Expected: HTTP/1.1 200 OK with {"status": "ONLINE"}
   ```
2. **Interactive API Documentation**:
   * Open `https://<your-backend-url>/docs`
   * Confirm all endpoints (`/auth`, `/cameras`, `/watchlist`, `/events`, `/alerts`, `/system`) are listed.
3. **Camera Spatial Corridor Registry**:
   * Test `/cameras` returns 266 camera nodes.
4. **Step 4 Vehicle Route Tracking Centerpiece**:
   * Open `https://<your-frontend-url>/`
   * Navigate to **Vehicle Route Track** and search plate `GJ-01-AB-1234`.
   * Verify all 175 corridor nodes, Leaflet route polyline, and Markov AI predictions render properly.
5. **Real-time Alert Simulation**:
   * Under **Live Alerts**, click **Simulate AI Intercept Alert**.
   * Verify instant sub-100ms notification push with audio alert and Leaflet pulse indicator.
