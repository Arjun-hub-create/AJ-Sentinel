import os

BASE = os.path.dirname(os.path.abspath(__file__))

files = {}

# ── app/main.py ──────────────────────────────────────────────────────────────
files["app/main.py"] = '''from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.database import connect_db, close_db, db_instance
from app.workers.monitor import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SENTINEL starting up...")
    await connect_db()
    await start_scheduler(db_instance.db)
    logger.info("SENTINEL is online")
    yield
    stop_scheduler()
    await close_db()


app = FastAPI(title="SENTINEL API", version="2.4.1", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

from app.routes.auth      import router as auth_router
from app.routes.services  import router as services_router
from app.routes.logs      import router as logs_router
from app.routes.incidents import router as incidents_router
from app.routes.dashboard import router as dashboard_router
from app.routes.teams     import router as teams_router
from app.routes.api_keys  import router as api_keys_router
from app.websocket.routes import router as ws_router

app.include_router(auth_router)
app.include_router(services_router)
app.include_router(logs_router)
app.include_router(incidents_router)
app.include_router(dashboard_router)
app.include_router(teams_router)
app.include_router(api_keys_router)
app.include_router(ws_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SENTINEL"}


@app.get("/")
async def root():
    return {"message": "SENTINEL API is running", "docs": "/docs"}
'''

# ── app/models/schemas.py ────────────────────────────────────────────────────
files["app/models/schemas.py"] = '''from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2, max_length=60)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ServiceCreate(BaseModel):
    name: str
    url: str
    method: Literal["GET", "POST", "HEAD"] = "GET"
    check_interval: int = 30
    tag: str = "production"
    headers: Optional[dict] = None
    expected_status: int = 200

    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    check_interval: Optional[int] = None
    tag: Optional[str] = None
    headers: Optional[dict] = None


class LogIngest(BaseModel):
    service: str
    level: Literal["info", "warn", "error", "debug", "success"]
    message: str
    metadata: Optional[dict] = None


class IncidentCreate(BaseModel):
    title: str
    service_id: str
    severity: Literal["critical", "high", "medium", "low"] = "high"
    description: Optional[str] = None


class IncidentUpdate(BaseModel):
    text: str
    author: str = "operator"


class AlertConfig(BaseModel):
    type: Literal["email", "webhook", "discord", "slack"]
    enabled: bool = True
    email_to: Optional[str] = None
    webhook_url: Optional[str] = None
'''

# ── app/routes/auth.py ───────────────────────────────────────────────────────
files["app/routes/auth.py"] = '''from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_db
from app.auth.jwt import hash_password, verify_password, create_access_token, get_current_user
from app.models.schemas import UserRegister, UserLogin

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def user_to_out(user: dict) -> dict:
    return {
        "id":      str(user["_id"]),
        "email":   user["email"],
        "name":    user["name"],
        "team_id": str(user["team_id"]) if user.get("team_id") else None,
        "role":    user.get("role", "member"),
    }


@router.post("/register", status_code=201)
async def register(body: UserRegister, db=Depends(get_db)):
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.now(timezone.utc)

    team_result = await db.teams.insert_one({
        "name": f"{body.name}\'s Team",
        "owner_id": None,
        "created_at": now,
    })
    team_id = team_result.inserted_id

    user_result = await db.users.insert_one({
        "email":      body.email,
        "name":       body.name,
        "password":   hash_password(body.password),
        "team_id":    team_id,
        "role":       "owner",
        "created_at": now,
    })
    user_id = user_result.inserted_id

    await db.teams.update_one({"_id": team_id}, {"$set": {"owner_id": user_id}})

    user  = await db.users.find_one({"_id": user_id})
    token = create_access_token({"sub": str(user_id)})

    return {"access_token": token, "token_type": "bearer", "user": user_to_out(user)}


@router.post("/login")
async def login(body: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer", "user": user_to_out(user)}


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {
        "id":      str(user["_id"]),
        "email":   user["email"],
        "name":    user["name"],
        "team_id": str(user["team_id"]) if user.get("team_id") else None,
        "role":    user.get("role", "member"),
    }
'''

# ── app/routes/logs.py ───────────────────────────────────────────────────────
files["app/routes/logs.py"] = '''from fastapi import APIRouter, Depends, Query, Header, HTTPException
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.auth.jwt import get_current_user
from app.models.schemas import LogIngest
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/api/logs", tags=["Logs"])


@router.post("/", status_code=202)
async def ingest_log(body: LogIngest, x_api_key: str = Header(default=None), db=Depends(get_db)):
    doc = {**body.model_dump(), "timestamp": datetime.now(timezone.utc)}
    await db.logs.insert_one(doc)
    await ws_manager.broadcast({
        "type": "log",
        "payload": {
            "service":   body.service,
            "level":     body.level,
            "message":   body.message,
            "timestamp": doc["timestamp"].isoformat(),
        }
    })
    return {"message": "Log ingested"}


@router.get("/")
async def get_logs(
    service: str   = Query(default=None),
    level: str     = Query(default=None),
    search: str    = Query(default=None),
    hours: int     = Query(default=24),
    page: int      = Query(default=1),
    per_page: int  = Query(default=50),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    query = {"timestamp": {"$gte": since}}
    if service: query["service"] = service
    if level:   query["level"]   = level
    if search:  query["message"] = {"$regex": search, "$options": "i"}

    total  = await db.logs.count_documents(query)
    skip   = (page - 1) * per_page
    cursor = db.logs.find(query).sort("timestamp", -1).skip(skip).limit(per_page)
    logs   = await cursor.to_list(length=per_page)

    return {
        "items": [
            {
                "id":        str(l["_id"]),
                "service":   l["service"],
                "level":     l["level"],
                "message":   l["message"],
                "timestamp": l["timestamp"].isoformat(),
            }
            for l in logs
        ],
        "total": total, "page": page, "per_page": per_page,
    }


@router.get("/stats")
async def log_stats(hours: int = Query(default=24), user=Depends(get_current_user), db=Depends(get_db)):
    since    = datetime.now(timezone.utc) - timedelta(hours=hours)
    pipeline = [
        {"$match": {"timestamp": {"$gte": since}}},
        {"$group": {"_id": "$level", "count": {"$sum": 1}}},
    ]
    result = await db.logs.aggregate(pipeline).to_list(length=20)
    return {r["_id"]: r["count"] for r in result}
'''

# ── Write all files ───────────────────────────────────────────────────────────
for relative_path, content in files.items():
    full_path = os.path.join(BASE, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Written: {relative_path}")

print("\n✅ All files fixed! Now run:")
print("   python -c \"from app.main import app; print('OK')\"")
print("   uvicorn app.main:app --reload --port 8000")
