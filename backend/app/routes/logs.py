from fastapi import APIRouter, Depends, Query, Header, HTTPException
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
