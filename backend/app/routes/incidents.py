from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_db
from app.auth.jwt import get_current_user
from app.models.schemas import IncidentCreate, IncidentUpdate

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


def inc_to_out(inc: dict) -> dict:
    return {
        "id":             str(inc["_id"]),
        "title":          inc["title"],
        "service_id":     str(inc["service_id"]),
        "service_name":   inc.get("service_name"),
        "severity":       inc["severity"],
        "status":         inc["status"],
        "description":    inc.get("description"),
        "started_at":     inc["started_at"].isoformat(),
        "resolved_at":    inc["resolved_at"].isoformat() if inc.get("resolved_at") else None,
        "affected_users": inc.get("affected_users", 0),
        "updates":        [
            {**u, "ts": u["ts"].isoformat() if hasattr(u.get("ts"), "isoformat") else u.get("ts")}
            for u in inc.get("updates", [])
        ],
    }


@router.get("/")
async def list_incidents(
    status: str = Query(default=None),
    page: int   = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    query = {}
    if status: query["status"] = status

    total  = await db.incidents.count_documents(query)
    skip   = (page - 1) * per_page
    cursor = db.incidents.find(query).sort("started_at", -1).skip(skip).limit(per_page)
    items  = await cursor.to_list(length=per_page)

    return {
        "items":    [inc_to_out(i) for i in items],
        "total":    total,
        "page":     page,
        "per_page": per_page,
    }


@router.post("/", status_code=201)
async def create_incident(
    body: IncidentCreate,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    now = datetime.now(timezone.utc)
    svc = await db.services.find_one({"_id": ObjectId(body.service_id)})

    doc = {
        **body.model_dump(),
        "service_id":    ObjectId(body.service_id),
        "service_name":  svc["name"] if svc else None,
        "status":        "active",
        "started_at":    now,
        "resolved_at":   None,
        "affected_users":0,
        "updates": [{
            "ts":     now,
            "text":   f"Incident created manually by {user.get('name', 'operator')}.",
            "author": user.get("name", "operator"),
        }],
    }
    result = await db.incidents.insert_one(doc)
    created = await db.incidents.find_one({"_id": result.inserted_id})
    return inc_to_out(created)


@router.post("/{incident_id}/updates")
async def add_update(
    incident_id: str,
    body: IncidentUpdate,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    update_entry = {
        "ts":     datetime.now(timezone.utc),
        "text":   body.text,
        "author": body.author or user.get("name", "operator"),
    }
    result = await db.incidents.update_one(
        {"_id": ObjectId(incident_id)},
        {"$push": {"updates": update_entry}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Update added"}


@router.post("/{incident_id}/resolve")
async def resolve_incident(
    incident_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    now = datetime.now(timezone.utc)
    result = await db.incidents.update_one(
        {"_id": ObjectId(incident_id), "status": {"$ne": "resolved"}},
        {"$set": {"status": "resolved", "resolved_at": now},
         "$push": {"updates": {
             "ts":     now,
             "text":   f"Incident resolved by {user.get('name', 'operator')}.",
             "author": user.get("name", "operator"),
         }}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found or already resolved")
    return {"message": "Incident resolved"}
