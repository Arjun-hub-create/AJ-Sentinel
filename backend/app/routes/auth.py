from fastapi import APIRouter, Depends, HTTPException, status
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
        "name": f"{body.name}'s Team",
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
