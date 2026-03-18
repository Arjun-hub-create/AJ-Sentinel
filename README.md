 # SENTINEL — Real-Time Developer Monitoring Platform

## Project Structure

```
SENTINEL/
├── sentinel-frontend/     ← React + Vite
├── sentinel-backend/      ← FastAPI + Python
└── docker-compose.yml
```

---

## Quick Start (Local Dev — No Docker)

### 1. Backend Setup

```bash
cd sentinel-backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
copy .env.example .env     # Windows
cp .env.example .env       # Mac/Linux

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
Swagger docs at: http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd sentinel-frontend

# Install dependencies
npm install axios react-router-dom lucide-react recharts framer-motion

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

### 3. MongoDB (required)

Option A — Install locally:
https://www.mongodb.com/try/download/community

Option B — Use MongoDB Atlas (free cloud):
1. Go to https://cloud.mongodb.com
2. Create free cluster
3. Get connection string
4. Paste into .env as MONGODB_URL

---

## Docker Setup (runs everything)

```bash
# From the root SENTINEL folder
docker-compose up --build
```

This starts:
- Frontend:  http://localhost:5173
- Backend:   http://localhost:8000
- MongoDB:   localhost:27017
- Redis:     localhost:6379

---

## API Endpoints

| Method | Endpoint                        | Description                  |
|--------|----------------------------------|------------------------------|
| POST   | /api/auth/register               | Create account               |
| POST   | /api/auth/login                  | Get JWT token                |
| GET    | /api/auth/me                     | Current user                 |
| GET    | /api/services                    | List services                |
| POST   | /api/services                    | Add service                  |
| DELETE | /api/services/{id}               | Remove service               |
| GET    | /api/services/{id}/metrics       | Latency/uptime data          |
| POST   | /api/services/{id}/check         | Manual check                 |
| GET    | /api/logs                        | Query logs                   |
| POST   | /api/logs                        | Ingest log (API key auth)    |
| GET    | /api/incidents                   | List incidents               |
| POST   | /api/incidents/{id}/resolve      | Resolve incident             |
| GET    | /api/dashboard/summary           | Dashboard overview data      |
| WS     | /ws                              | Real-time WebSocket stream   |

---

## Log Ingestion from External Services

```bash
# Get an API key from Settings page, then:

curl -X POST http://localhost:8000/api/logs \
  -H "X-Api-Key: sk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "my-api",
    "level": "error",
    "message": "Database connection failed"
  }'
```

---

## WebSocket Live Data

```javascript
const ws = new WebSocket("ws://localhost:8000/ws?token=YOUR_JWT")

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  // msg.type: "metric" | "incident" | "log" | "connected"
  console.log(msg)
}

```
<!-- Backend -->
<!-- cd "C:\Users\arjun\Downloads\Documents\Sentinel\Sentinel – Real-Time Developer Monitoring Platform\backend"
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000 -->

<!-- frontend -->
<!-- cd "C:\Users\arjun\Downloads\Documents\Sentinel\Sentinel – Real-Time Developer Monitoring Platform"
npm run dev
``` -->

 