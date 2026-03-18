from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def dashboard_summary(
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Returns all data needed for the Dashboard page:
    - Service counts by status
    - Overall uptime
    - Average latency
    - Active incidents
    - Recent logs (last 20)
    - Hourly latency series (last 24h for chart)
    """
    team_id = user["team_id"]
    now     = datetime.now(timezone.utc)
    since_24h = now - timedelta(hours=24)
    since_30d = now - timedelta(days=30)

    # ── Services ────────────────────────────────────
    services    = await db.services.find({"team_id": team_id}).to_list(100)
    total_svcs  = len(services)
    online_svcs = sum(1 for s in services if s.get("status") == "online")
    offline_svcs= sum(1 for s in services if s.get("status") == "offline")
    degrad_svcs = sum(1 for s in services if s.get("status") == "degraded")

    # ── Uptime (all services, last 30d) ─────────────
    service_ids = [s["_id"] for s in services]
    total_checks= await db.metrics.count_documents({"service_id": {"$in": service_ids}, "timestamp": {"$gte": since_30d}})
    up_checks   = await db.metrics.count_documents({"service_id": {"$in": service_ids}, "timestamp": {"$gte": since_30d}, "is_up": True})
    uptime_pct  = round(up_checks / total_checks * 100, 2) if total_checks else 100.0

    # ── Avg latency (last 24h) ───────────────────────
    pipeline = [
        {"$match": {"service_id": {"$in": service_ids}, "timestamp": {"$gte": since_24h}, "is_up": True}},
        {"$group": {"_id": None, "avg": {"$avg": "$latency_ms"}, "p95": {"$percentile": {"input": "$latency_ms", "p": [0.95], "method": "approximate"}}}},
    ]
    # Fallback for MongoDB versions without $percentile
    lat_metrics = await db.metrics.find(
        {"service_id": {"$in": service_ids}, "timestamp": {"$gte": since_24h}, "is_up": True},
        {"latency_ms": 1}
    ).to_list(5000)

    latencies = sorted([m["latency_ms"] for m in lat_metrics if m.get("latency_ms")])
    avg_lat = round(sum(latencies) / len(latencies), 1) if latencies else 0
    p95_lat = round(latencies[int(len(latencies) * 0.95)], 1) if latencies else 0

    # ── Hourly latency data for chart ───────────────
    hourly = []
    for h in range(23, -1, -1):
        hour_start = now - timedelta(hours=h+1)
        hour_end   = now - timedelta(hours=h)
        hour_lats  = [m["latency_ms"] for m in lat_metrics
                      if m.get("latency_ms") and hour_start <= m.get("timestamp", now) < hour_end]
        hour_lats_sorted = sorted(hour_lats)
        hourly.append({
            "time": hour_start.strftime("%H:00"),
            "p50":  round(hour_lats_sorted[len(hour_lats_sorted)//2], 1) if hour_lats_sorted else 0,
            "p95":  round(hour_lats_sorted[int(len(hour_lats_sorted)*0.95)], 1) if hour_lats_sorted else 0,
            "p99":  round(hour_lats_sorted[int(len(hour_lats_sorted)*0.99)], 1) if hour_lats_sorted else 0,
        })

    # ── Active incidents ─────────────────────────────
    active_incidents = await db.incidents.find(
        {"status": {"$in": ["active", "investigating"]}}
    ).sort("started_at", -1).limit(5).to_list(5)

    # ── Recent logs ──────────────────────────────────
    recent_logs = await db.logs.find(
        {"timestamp": {"$gte": since_24h}}
    ).sort("timestamp", -1).limit(20).to_list(20)

    return {
        "services": {
            "total":    total_svcs,
            "online":   online_svcs,
            "offline":  offline_svcs,
            "degraded": degrad_svcs,
        },
        "uptime_percent":  uptime_pct,
        "avg_latency_ms":  avg_lat,
        "p95_latency_ms":  p95_lat,
        "latency_chart":   hourly,
        "active_incidents": len(active_incidents),
        "recent_logs": [
            {
                "level":   l["level"],
                "service": l["service"],
                "message": l["message"],
                "ts":      l["timestamp"].isoformat(),
            }
            for l in recent_logs
        ],
    }
