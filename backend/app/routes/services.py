from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_db
from app.auth.jwt import get_current_user
from app.models.schemas import ServiceCreate, ServiceUpdate
from app.workers.monitor import run_single_check

router = APIRouter(prefix="/api/services", tags=["Services"])


def svc_to_out(svc: dict) -> dict:
    return {
        "id":             str(svc["_id"]),
        "name":           svc["name"],
        "url":            svc["url"],
        "method":         svc.get("method", "GET"),
        "check_interval": svc.get("check_interval", 30),
        "tag":            svc.get("tag", "production"),
        "status":         svc.get("status", "unknown"),
        "latency_ms":     svc.get("latency_ms"),
        "uptime_percent": svc.get("uptime_percent"),
        "last_checked":   svc.get("last_checked"),
        "created_at":     svc["created_at"],
        "team_id":        str(svc["team_id"]),
    }


# ─── List Services ───────────────────────────────────

@router.get("/")
async def list_services(
    tag: str = Query(None),
    status: str = Query(None),
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """List all services for the authenticated user's team."""
    query = {"team_id": user["team_id"]}
    if tag:    query["tag"] = tag
    if status: query["status"] = status

    cursor = db.services.find(query).sort("created_at", -1)
    services = await cursor.to_list(length=100)
    return [svc_to_out(s) for s in services]


# ─── Create Service ──────────────────────────────────

@router.post("/", status_code=201)
async def create_service(
    body: ServiceCreate,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Add a new service to monitor.
    After creation, immediately runs the first health check
    so the user sees real data right away.
    """
    now = datetime.now(timezone.utc)
    doc = {
        **body.model_dump(),
        "team_id":        user["team_id"],
        "status":         "unknown",
        "latency_ms":     None,
        "uptime_percent": None,
        "last_checked":   None,
        "created_at":     now,
    }
    result = await db.services.insert_one(doc)
    svc_id = result.inserted_id

    # Run first check immediately (async, non-blocking)
    svc = await db.services.find_one({"_id": svc_id})
    try:
        await run_single_check(db, svc)
        svc = await db.services.find_one({"_id": svc_id})
    except Exception:
        pass  # First check failed gracefully

    return svc_to_out(svc)


# ─── Get Service ─────────────────────────────────────

@router.get("/{service_id}")
async def get_service(
    service_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    svc = await db.services.find_one({
        "_id": ObjectId(service_id),
        "team_id": user["team_id"]
    })
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    return svc_to_out(svc)


# ─── Update Service ──────────────────────────────────

@router.put("/{service_id}")
async def update_service(
    service_id: str,
    body: ServiceUpdate,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.services.update_one(
        {"_id": ObjectId(service_id), "team_id": user["team_id"]},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")

    svc = await db.services.find_one({"_id": ObjectId(service_id)})
    return svc_to_out(svc)


# ─── Delete Service ──────────────────────────────────

@router.delete("/{service_id}", status_code=204)
async def delete_service(
    service_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    result = await db.services.delete_one({
        "_id": ObjectId(service_id),
        "team_id": user["team_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")

    # Also clean up associated metrics
    await db.metrics.delete_many({"service_id": ObjectId(service_id)})


# ─── Get Metrics for a Service ───────────────────────

@router.get("/{service_id}/metrics")
async def get_service_metrics(
    service_id: str,
    hours: int = Query(default=24, ge=1, le=168),
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Returns raw metric data points for a service.
    Used by the frontend latency charts.
    hours: 1–168 (1 hour to 7 days)
    """
    from datetime import timedelta
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    cursor = db.metrics.find({
        "service_id": ObjectId(service_id),
        "timestamp":  {"$gte": since}
    }).sort("timestamp", 1).limit(500)

    metrics = await cursor.to_list(length=500)

    # Calculate summary stats
    latencies = [m["latency_ms"] for m in metrics if m.get("is_up") and m.get("latency_ms")]
    up_count  = sum(1 for m in metrics if m.get("is_up"))
    total     = len(metrics)

    latencies_sorted = sorted(latencies)
    p95 = latencies_sorted[int(len(latencies_sorted) * 0.95)] if latencies_sorted else 0
    p99 = latencies_sorted[int(len(latencies_sorted) * 0.99)] if latencies_sorted else 0

    return {
        "data": [
            {
                "ts":         m["timestamp"].isoformat(),
                "latency_ms": m.get("latency_ms", 0),
                "status_code":m.get("status_code"),
                "is_up":      m.get("is_up", False),
            }
            for m in metrics
        ],
        "summary": {
            "uptime_percent": round(up_count / total * 100, 2) if total else 0,
            "avg_latency_ms": round(sum(latencies) / len(latencies), 1) if latencies else 0,
            "p95_latency_ms": round(p95, 1),
            "p99_latency_ms": round(p99, 1),
            "total_checks":   total,
            "period_hours":   hours,
        }
    }


# ─── Trigger Manual Check ────────────────────────────

@router.post("/{service_id}/check")
async def manual_check(
    service_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """Force an immediate health check for a service."""
    svc = await db.services.find_one({
        "_id": ObjectId(service_id),
        "team_id": user["team_id"]
    })
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    result = await run_single_check(db, svc)
    return {"message": "Check complete", "result": result}
