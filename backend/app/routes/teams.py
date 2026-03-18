# app/routes/teams.py
# Team management — invite members, list team, update roles

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_db
from app.auth.jwt import get_current_user, hash_password

router = APIRouter(prefix="/api/teams", tags=["Teams"])


@router.get("/me")
async def get_my_team(user=Depends(get_current_user), db=Depends(get_db)):
    """Get the current user's team and all its members."""
    team = await db.teams.find_one({"_id": user["team_id"]})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    members = await db.users.find(
        {"team_id": user["team_id"]},
        {"password": 0}   # never return password hashes
    ).to_list(100)

    return {
        "id":         str(team["_id"]),
        "name":       team["name"],
        "owner_id":   str(team["owner_id"]),
        "created_at": team["created_at"].isoformat(),
        "members": [
            {
                "id":         str(m["_id"]),
                "name":       m["name"],
                "email":      m["email"],
                "role":       m.get("role", "member"),
                "created_at": m["created_at"].isoformat(),
            }
            for m in members
        ],
    }


@router.post("/invite")
async def invite_member(
    body: dict,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Invite a new member by creating their account.
    Only owner/admin can invite.
    In production you'd send an email instead.
    """
    if user.get("role") not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owners/admins can invite members")

    email = body.get("email", "").strip().lower()
    name  = body.get("name", "").strip()
    role  = body.get("role", "member")

    if not email or not name:
        raise HTTPException(status_code=400, detail="email and name are required")

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create member with temporary password
    temp_password = "Sentinel2024!"
    doc = {
        "email":      email,
        "name":       name,
        "password":   hash_password(temp_password),
        "team_id":    user["team_id"],
        "role":       role,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    return {
        "message":          "Member invited successfully",
        "temp_password":    temp_password,
        "member_id":        str(result.inserted_id),
    }


@router.put("/members/{member_id}/role")
async def update_member_role(
    member_id: str,
    body: dict,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """Change a team member's role. Owner only."""
    if user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can change roles")

    new_role = body.get("role")
    if new_role not in ("admin", "member", "viewer"):
        raise HTTPException(status_code=400, detail="Invalid role")

    await db.users.update_one(
        {"_id": ObjectId(member_id), "team_id": user["team_id"]},
        {"$set": {"role": new_role}}
    )
    return {"message": "Role updated"}


@router.delete("/members/{member_id}")
async def remove_member(
    member_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """Remove a member from the team. Owner only."""
    if user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can remove members")

    if str(user["_id"]) == member_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    result = await db.users.delete_one({
        "_id": ObjectId(member_id),
        "team_id": user["team_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member removed"}
