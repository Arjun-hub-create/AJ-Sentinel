import httpx
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global scheduler instance (started in main.py lifespan)
scheduler = AsyncIOScheduler()


# ─── Single Health Check ─────────────────────────────

async def run_single_check(db, service: dict) -> dict:
    """
    Pings a service endpoint, measures latency, stores a metric,
    and updates the service's live status in MongoDB.

    Returns a dict with the check result.
    """
    service_id = service["_id"]
    url        = service["url"]
    method     = service.get("method", "GET")
    headers    = service.get("headers") or {}
    expected   = service.get("expected_status", 200)

    start = datetime.now(timezone.utc)
    latency_ms = None
    status_code = None
    is_up = False
    error = None

    try:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            t0 = asyncio.get_event_loop().time()
            resp = await client.request(method, url, headers=headers)
            t1 = asyncio.get_event_loop().time()

            latency_ms  = round((t1 - t0) * 1000, 2)
            status_code = resp.status_code
            is_up       = (status_code == expected)

    except httpx.TimeoutException:
        error = f"Timeout after {settings.REQUEST_TIMEOUT_SECONDS}s"
        is_up = False
    except httpx.ConnectError:
        error = "Connection refused"
        is_up = False
    except Exception as e:
        error = str(e)[:200]
        is_up = False

    # ── Determine degraded vs offline ────────────────
    # If it responded but with wrong status code → degraded
    # If it didn't respond at all → offline
    if not is_up and status_code is not None:
        new_status = "degraded"
    elif not is_up:
        new_status = "offline"
    elif latency_ms and latency_ms > 1000:
        new_status = "degraded"  # Slow response counts as degraded
    else:
        new_status = "online"

    # ── Store metric ─────────────────────────────────
    metric_doc = {
        "service_id":  service_id,
        "latency_ms":  latency_ms,
        "status_code": status_code,
        "is_up":       is_up,
        "error":       error,
        "timestamp":   start,
    }
    await db.metrics.insert_one(metric_doc)

    # ── Calculate rolling 30-day uptime ──────────────
    since_30d = datetime.now(timezone.utc) - timedelta(days=30)
    total     = await db.metrics.count_documents({"service_id": service_id, "timestamp": {"$gte": since_30d}})
    up_count  = await db.metrics.count_documents({"service_id": service_id, "timestamp": {"$gte": since_30d}, "is_up": True})
    uptime_pct = round(up_count / total * 100, 2) if total > 0 else (100.0 if is_up else 0.0)

    # ── Update service document ───────────────────────
    await db.services.update_one(
        {"_id": service_id},
        {"$set": {
            "status":         new_status,
            "latency_ms":     latency_ms,
            "uptime_percent": uptime_pct,
            "last_checked":   start,
        }}
    )

    # ── Detect status change → maybe trigger incident ─
    old_status = service.get("status", "unknown")
    if old_status != new_status:
        await handle_status_change(db, service, old_status, new_status)

    result = {
        "service_id":  str(service_id),
        "status":      new_status,
        "latency_ms":  latency_ms,
        "status_code": status_code,
        "is_up":       is_up,
        "error":       error,
        "checked_at":  start.isoformat(),
    }

    # ── Broadcast via WebSocket ───────────────────────
    try:
        from app.websocket.manager import ws_manager
        await ws_manager.broadcast({
            "type":    "metric",
            "payload": result,
        })
    except Exception:
        pass  # WS broadcast failure should never crash the worker

    logger.info(f"[CHECK] {service.get('name')} → {new_status} | {latency_ms}ms | {status_code}")
    return result


# ─── Status Change Handler ───────────────────────────

async def handle_status_change(db, service: dict, old: str, new: str):
    """
    Called when a service transitions between online/degraded/offline.
    - Creates an incident if going offline/degraded
    - Resolves the incident if coming back online
    - Sends alerts
    """
    service_id = service["_id"]
    now = datetime.now(timezone.utc)

    if new in ("offline", "degraded") and old == "online":
        # Open a new incident
        incident = {
            "title":        f"{service['name']} — {new.capitalize()}",
            "service_id":   service_id,
            "service_name": service.get("name"),
            "severity":     "critical" if new == "offline" else "high",
            "status":       "active",
            "description":  f"Automated detection: service transitioned from {old} to {new}.",
            "started_at":   now,
            "resolved_at":  None,
            "affected_users": 0,
            "updates": [{
                "ts":     now,
                "text":   f"Incident auto-detected. Service is {new}.",
                "author": "SENTINEL AUTO",
            }],
        }
        await db.incidents.insert_one(incident)
        logger.warning(f"[INCIDENT OPENED] {service['name']} → {new}")

        # Broadcast incident alert via WebSocket
        try:
            from app.websocket.manager import ws_manager
            await ws_manager.broadcast({
                "type":    "incident",
                "payload": {
                    "service": service.get("name"),
                    "status":  new,
                    "severity": incident["severity"],
                }
            })
        except Exception:
            pass

    elif new == "online" and old in ("offline", "degraded"):
        # Auto-resolve the open incident for this service
        result = await db.incidents.update_one(
            {"service_id": service_id, "status": {"$in": ["active", "investigating"]}},
            {"$set": {
                "status":      "resolved",
                "resolved_at": now,
            }, "$push": {
                "updates": {
                    "ts":     now,
                    "text":   "Service recovered. Incident auto-resolved by SENTINEL.",
                    "author": "SENTINEL AUTO",
                }
            }}
        )
        if result.modified_count:
            logger.info(f"[INCIDENT RESOLVED] {service['name']} recovered")


# ─── Per-Service Check Job ───────────────────────────

async def check_service_job(db, service_id_str: str):
    """APScheduler job function — fetches the service and runs a check."""
    try:
        svc = await db.services.find_one({"_id": ObjectId(service_id_str)})
        if svc:
            await run_single_check(db, svc)
    except Exception as e:
        logger.error(f"[WORKER ERROR] service {service_id_str}: {e}")


# ─── Scheduler Setup ─────────────────────────────────

async def start_scheduler(db):
    """
    Called once at app startup.
    Loads all existing services from DB and registers an
    APScheduler job for each one based on its check_interval.
    """
    scheduler.start()
    logger.info("APScheduler started")

    # Register a job for every existing service
    services = await db.services.find({}).to_list(length=1000)
    for svc in services:
        register_service_job(db, svc)

    logger.info(f"Registered {len(services)} monitoring jobs")


def register_service_job(db, service: dict):
    """Add (or replace) the APScheduler job for one service."""
    job_id   = f"check_{service['_id']}"
    interval = service.get("check_interval", settings.CHECK_INTERVAL_SECONDS)

    # Remove existing job if it exists (e.g. on update)
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    scheduler.add_job(
        check_service_job,
        trigger=IntervalTrigger(seconds=interval),
        args=[db, str(service["_id"])],
        id=job_id,
        replace_existing=True,
        max_instances=1,          # Don't pile up if check is slow
        misfire_grace_time=10,
    )
    logger.debug(f"Job registered: {job_id} (every {interval}s)")


def stop_scheduler():
    """Gracefully shut down APScheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
