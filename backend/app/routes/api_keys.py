import secrets
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_db
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/keys", tags=["API Keys"])


def hash_key(key: str) -> str:
    """SHA-256 hash of the raw key — only the hash is stored in DB."""
    return hashlib.sha256(key.encode()).hexdigest()


@router.get("/")
async def list_keys(user=Depends(get_current_user), db=Depends(get_db)):
    """List all API keys for the team (never returns the raw key)."""
    keys = await db.api_keys.find(
        {"team_id": user["team_id"]}
    ).sort("created_at", -1).to_list(50)

    return [
        {
            "id":         str(k["_id"]),
            "name":       k["name"],
            "key_prefix": k["key_prefix"],   # e.g. "sk_live_ab"
            "created_at": k["created_at"].isoformat(),
            "last_used":  k["last_used"].isoformat() if k.get("last_used") else None,
        }
        for k in keys
    ]


@router.post("/", status_code=201)
async def create_key(
    body: dict,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Generate a new API key.
    The raw key is returned ONCE — it is never stored in plain text.
    The client must save it immediately.
    """
    name = body.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Key name is required")

    # Generate a cryptographically secure random key
    raw_key    = f"sk_live_{secrets.token_urlsafe(32)}"
    key_prefix = raw_key[:12]   # first 12 chars shown in UI
    key_hash   = hash_key(raw_key)

    doc = {
        "name":       name,
        "key_hash":   key_hash,
        "key_prefix": key_prefix,
        "team_id":    user["team_id"],
        "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc),
        "last_used":  None,
    }
    result = await db.api_keys.insert_one(doc)

    return {
        "id":         str(result.inserted_id),
        "name":       name,
        "key":        raw_key,      # ← only returned once
        "key_prefix": key_prefix,
        "message":    "Save this key — it will not be shown again",
    }


@router.delete("/{key_id}", status_code=204)
async def delete_key(
    key_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    result = await db.api_keys.delete_one({
        "_id":     ObjectId(key_id),
        "team_id": user["team_id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
