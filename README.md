# SENTINEL — Real-Time Developer Monitoring Platform

SENTINEL is a real-time monitoring dashboard built for developers and teams who want to keep an eye on their services, APIs, uptime, latency, incidents, and logs without jumping between multiple tools.

Think of it like a live health monitor for your app stack. If a service goes down, slows down, or starts throwing errors, the system can detect it quickly and show you what is happening in a clean dashboard.

This project is built with:
- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI + Python
- Database: MongoDB
- Cache / in-memory tasks: Redis
- Real-time updates: WebSockets
- Background checks: APScheduler

---

## Why this project exists

When an app is running in production, developers usually need to answer questions like:
- Is my service still alive?
- Is it slow?
- Did the API start failing?
- Did someone break something without us noticing?
- What happened in the last few minutes?

SENTINEL helps solve that by making monitoring feel simple and visible. Instead of manually checking servers or logs, you can see the health of your system from one place.

---

## What this app does

The platform gives you a complete overview of your services:

- Real-time service monitoring
- Health checks and uptime tracking
- Response time and latency measurement
- Incident detection and tracking
- Recent logs and error visibility
- Team-based access and permissions
- API key support for external log ingestion
- Dashboard summaries with live updates

It is especially useful for teams who want a central place to watch app health and quickly react when issues appear.

---

## Main features

### 1. Authentication and access
The app supports login and registration with JWT-based authentication and role-aware access control. Users can sign up, log in, and access dashboards based on their permissions.

### 2. Service monitoring
You can add services and track their health over time. The backend periodically checks whether a service is up or down and stores latency and status information.

### 3. Real-time updates
The dashboard listens for live updates over WebSockets so metrics, alerts, and incidents can update in real time without needing a page refresh.

### 4. Dashboard analytics
The main dashboard shows summaries like:
- total services
- online vs offline services
- degraded services
- uptime percentage
- average latency
- p95 latency
- active incidents
- recent logs

### 5. Incident management
When a service fails or behaves badly, the app records incidents and keeps track of them so the team can investigate and resolve them.

### 6. Log ingestion
External services can send logs to the backend using API keys. This is useful when you want to push application logs, errors, or warnings from other systems into SENTINEL.

### 7. Team management
Users can be grouped into teams, and different members can manage services and monitoring resources based on permissions.

---

## Tech stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- Recharts for charts
- Framer Motion for UI animations
- Axios for API calls

### Backend
- Python
- FastAPI
- Pydantic
- Motor (MongoDB async driver)
- Redis
- APScheduler
- JWT authentication

### Data and infra
- MongoDB for persistent data
- Redis for background jobs and cache support
- WebSockets for live streaming

---

## Project structure

This repo currently contains the app in this layout:

```bash
Sentinel – Real-Time Developer Monitoring Platform/
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── websocket/
│   │   └── workers/
│   ├── .env.example
│   ├── Dockerfile
│   ├── requirements.txt
│   └── runtime.txt
├── public/
├── src/
│   ├── Components/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   └── utils/
├── docker-compose.yml
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── README.md
```

The frontend sits in the root of the project, while the Python backend lives inside the `backend/` folder.

---

## Prerequisites

Before starting the project, make sure you have:

- Node.js installed (recommended: v18 or newer)
- Python 3.11+
- MongoDB running locally or a MongoDB Atlas connection string
- Redis running locally or a Redis server available
- A terminal/command prompt with access to the project folder

If you do not have MongoDB or Redis installed, install them first.

---

## Step-by-step setup

## 1. Clone the project

```bash
git clone <your-repository-url>
cd "Sentinel – Real-Time Developer Monitoring Platform"
```

---

## 2. Install frontend dependencies

From the project root:

```bash
npm install
```

This will install all frontend packages used by the React app.

---

## 3. Set up the backend

Go into the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it:

### Windows
```bash
venv\Scripts\activate
```

### Mac/Linux
```bash
source venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Now create your environment file:

```bash
copy .env.example .env
```

Or on Mac/Linux:

```bash
cp .env.example .env
```

Your `.env` file will contain variables like:

```env
APP_NAME=SENTINEL
APP_ENV=development
DEBUG=true
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=sentinel_db
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
CHECK_INTERVAL_SECONDS=30
REQUEST_TIMEOUT_SECONDS=10
```

Important:
- Replace the default secret key with your own strong secret in production.
- If you are using MongoDB Atlas, set `MONGODB_URL` to your Atlas connection string.

---

## 4. Start MongoDB

You need MongoDB to be running before the backend starts.

### Option A: Local MongoDB
If MongoDB is installed locally, start it with:

```bash
mongod
```

### Option B: MongoDB Atlas
Use a cloud database and put the connection string in `.env`:

```env
MONGODB_URL=mongodb+srv://<username>:<password>@cluster....mongodb.net/?retryWrites=true&w=majority
```

---

## 5. Start Redis

Redis is also required for background jobs and app monitoring flow.

If installed locally, start it with:

```bash
redis-server
```

If you are using Docker, the Redis service can be started from the compose file.

---

## 6. Run the backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload --port 8000
```

Once it starts, you can open:
- API server: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## 7. Run the frontend

Open a second terminal and go back to the project root:

```bash
npm run dev
```

Then visit:

```text
http://localhost:5173
```

This is the app UI where you can register/login and use the dashboard.

---

## How the app works in simple terms

This project works like this:

1. A user signs up and logs in.
2. The user adds services to monitor.
3. The backend worker checks those services in the background.
4. Each check records if the service is up or down.
5. The app saves the response time and status in MongoDB.
6. If something looks wrong, the system creates or updates an incident.
7. The dashboard reads the data and shows live metrics using charts and cards.
8. WebSockets push updates to the frontend instantly.

So in one sentence: the backend monitors services, the database stores the data, and the frontend displays the real-time health of the application.

---

## API overview

These are some of the main endpoints exposed by the backend.

### Auth
- `POST /api/auth/register` — create a user account
- `POST /api/auth/login` — log in and get JWT token
- `GET /api/auth/me` — get current user info

### Services
- `GET /api/services` — list services
- `POST /api/services` — add a service
- `DELETE /api/services/{id}` — remove a service
- `GET /api/services/{id}/metrics` — fetch service metrics
- `POST /api/services/{id}/check` — trigger manual health check

### Logs
- `GET /api/logs` — fetch logs
- `POST /api/logs` — ingest log data using API key auth

### Incidents
- `GET /api/incidents` — list incidents
- `POST /api/incidents/{id}/resolve` — resolve an incident

### Dashboard
- `GET /api/dashboard/summary` — get summary data for the dashboard

### WebSocket
- `WS /ws` — real-time event stream

---

## Log ingestion example

You can send log data to the platform using an API key.

```bash
curl -X POST http://localhost:8000/api/logs \
  -H "X-Api-Key: sk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "my-api",
    "level": "error",
    "message": "Database connection failed"
  }'
```

This is helpful if your app or external service wants to push alerts into SENTINEL.

---

## WebSocket usage example

```javascript
const ws = new WebSocket("ws://localhost:8000/ws?token=YOUR_JWT")

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  console.log(msg)
}
```

This lets the frontend receive live health updates as they happen.

---

## Docker setup

A `docker-compose.yml` file is included in the project for running a full stack setup.

```bash
docker-compose up --build
```

This is meant to start the backend, frontend, MongoDB, and Redis together.

However, in the current repository layout, the Docker config is designed around a slightly different folder naming pattern. If the compose file does not match your local folder names, the manual setup above is the safer and most reliable option for this repo as it currently exists.

---

## Typical user flow

A normal flow in this app looks like this:

1. Create an account
2. Log in
3. Add a service such as an API or backend app
4. Set health check configuration
5. Watch the dashboard update in real time
6. Investigate incidents when they appear
7. Review logs and latency metrics
8. Manage team access and settings

This makes it a useful internal monitoring tool for software teams.

---

## Common issues and fixes

### Frontend cannot connect to backend
- Check whether the backend is running at port 8000.
- Make sure your CORS settings allow `http://localhost:5173`.
- Ensure the backend is not failing to start due to missing env variables.

### MongoDB connection error
- Confirm MongoDB is running.
- Check your `MONGODB_URL` in `.env`.
- If using Atlas, verify the username, password, and cluster details are correct.

### Redis connection error
- Start Redis locally.
- Confirm `REDIS_URL` is correct.

### Dependency installation problems
- Delete `node_modules` and reinstall if needed.
- Re-create the Python virtual environment if packages are broken.

---

## Production notes

This project is a solid foundation for a real monitoring platform, but for production-level deployment you should also consider:

- using a strong secret key instead of the default example key
- setting proper environment variables for each deployment
- using HTTPS and domain-based CORS rules
- adding proper monitoring for the monitoring system itself
- using a managed MongoDB and Redis setup in production
- adding logs and alerts for backend errors

---

## Final note

SENTINEL is a practical developer monitoring project that combines backend monitoring, frontend dashboarding, real-time data, and team visibility into a single application. It is a great example of a full-stack monitoring system that feels close to how production systems are watched in real life.

If you are learning full-stack development, this project is useful because it includes:
- authentication
- API development
- database work
- background jobs
- WebSockets
- dashboards and charts
- team management
- real-world monitoring patterns

This is the kind of project that teaches you how modern systems work together in a real application.

---

## Quick start summary

```bash
# frontend
npm install
npm run dev

# backend
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Then open:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Docs: http://localhost:8000/docs

---

If you want, I can also make a second version of this README in a more polished GitHub style with badges, screenshots placeholders, and a cleaner project pitch for public sharing.

