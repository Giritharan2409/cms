from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Body, Header, HTTPException, Query

from backend.db import get_db
from backend.routes.modules.settings.realtime import broadcast

router = APIRouter(tags=["settings:activity"])

ACTIVITY_COLLECTION = "settings_activity_logs"
DEV_ACTIVITY_LOGS: list[dict] = []

ROLE_ADMIN = "admin"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_db_or_none():
    try:
        return get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return None
        raise


def normalize_role(role: str | None) -> str:
    return str(role or "").strip().lower()


def require_actor(x_actor_user_id: str | None, x_actor_role: str | None) -> dict:
    user_id = str(x_actor_user_id or "").strip()
    role = normalize_role(x_actor_role)

    if not user_id or not role:
        raise HTTPException(
            status_code=401,
            detail="Authenticated actor context is required through X-Actor-UserId and X-Actor-Role headers",
        )

    return {
        "user_id": user_id,
        "role": role,
    }


def ensure_activity_access(actor: dict, target_user_id: str) -> None:
    if actor["role"] == ROLE_ADMIN:
        return

    if actor["user_id"] != target_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this activity log")


def to_public_activity(entry: dict) -> dict:
    payload = deepcopy(entry)
    payload.pop("_id", None)
    return payload


async def log_activity_entry(
    user_id: str,
    activity: str,
    actor_role: str | None = None,
    metadata: dict | None = None,
) -> dict:
    entry = {
        "id": f"ACT-{uuid4().hex[:10].upper()}",
        "user_id": user_id,
        "activity": str(activity or "Settings updated"),
        "actor_role": normalize_role(actor_role) or None,
        "metadata": metadata or {},
        "timestamp": now_iso(),
    }

    db = get_db_or_none()
    if db is None:
        DEV_ACTIVITY_LOGS.append(deepcopy(entry))
    else:
        await db[ACTIVITY_COLLECTION].insert_one(entry)

    await broadcast(
        {
            "type": "SETTINGS_ACTIVITY",
            "user_id": user_id,
            "activity": entry["activity"],
            "timestamp": entry["timestamp"],
        }
    )

    return entry


@router.get("/api/settings/activity/{user_id}")
async def get_activity_log(
    user_id: str,
    limit: int = Query(default=25, ge=1, le=100),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_activity_access(actor, user_id)

    db = get_db_or_none()
    if db is None:
        rows = [item for item in DEV_ACTIVITY_LOGS if item.get("user_id") == user_id]
        rows.sort(key=lambda row: row.get("timestamp", ""), reverse=True)
        return {"success": True, "data": [to_public_activity(row) for row in rows[:limit]]}

    cursor = db[ACTIVITY_COLLECTION].find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
    rows = []
    async for row in cursor:
        rows.append(to_public_activity(row))

    return {"success": True, "data": rows}


@router.post("/api/settings/activity")
async def create_activity_log(
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)

    user_id = str(payload.get("user_id") or payload.get("userId") or "").strip()
    activity = str(payload.get("activity") or "").strip()
    metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}

    if not user_id or not activity:
        raise HTTPException(status_code=400, detail="user_id and activity are required")

    ensure_activity_access(actor, user_id)

    created = await log_activity_entry(
        user_id=user_id,
        activity=activity,
        actor_role=actor["role"],
        metadata=metadata,
    )

    return {"success": True, "data": to_public_activity(created)}
