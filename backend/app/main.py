from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.database import connect_db, close_db, db_instance
from app.workers.monitor import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
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
    logger.info("SENTINEL shutdown complete")


app = FastAPI(title="SENTINEL API", version="2.4.1", lifespan=lifespan)

# ── CORS ─────────────────────────────────────────────
import os
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    os.getenv("FRONTEND_URL", ""),
    os.getenv("RENDER_EXTERNAL_URL", ""),
]
ALLOWED_ORIGINS = [o for o in ALLOWED_ORIGINS if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Routes ────────────────────────────────────────────
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