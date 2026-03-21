from copy import deepcopy

from fastapi import APIRouter, Body, Header, HTTPException

from backend.db import get_db
from backend.routes.modules.settings.activity_routes import log_activity_entry
from backend.routes.modules.settings.realtime import broadcast_settings_update

router = APIRouter(tags=["settings:reminders"])

REMINDER_COLLECTION = "student_reminders"
ROLE_ADMIN = "admin"
ROLE_STUDENT = "student"
DEFAULT_REMINDERS = {
    "studyReminder": True,
    "examReminder": True,
}

DEV_REMINDERS = {
    "STU-2024-1547": deepcopy(DEFAULT_REMINDERS),
}


def normalize_role(role: str | None) -> str:
    return str(role or "").strip().lower()


def get_db_or_none():
    try:
        return get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return None
        raise


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


def ensure_student_access(actor: dict, target_user_id: str) -> None:
    if actor["role"] == ROLE_ADMIN:
        return

    if actor["role"] != ROLE_STUDENT or actor["user_id"] != target_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access these reminder settings")


async def load_reminders(user_id: str) -> dict:
    db = get_db_or_none()
    if db is None:
        current = DEV_REMINDERS.get(user_id, deepcopy(DEFAULT_REMINDERS))
        merged = {**DEFAULT_REMINDERS, **current}
        DEV_REMINDERS[user_id] = deepcopy(merged)
        return merged

    doc = await db[REMINDER_COLLECTION].find_one({"user_id": user_id})
    if not doc:
        return deepcopy(DEFAULT_REMINDERS)

    payload = {key: value for key, value in doc.items() if key not in {"_id", "user_id"}}
    return {**DEFAULT_REMINDERS, **payload}


async def upsert_reminders(user_id: str, payload: dict) -> dict:
    current = await load_reminders(user_id)
    merged = {
        "studyReminder": bool(payload.get("studyReminder", current.get("studyReminder", True))),
        "examReminder": bool(payload.get("examReminder", current.get("examReminder", True))),
    }

    db = get_db_or_none()
    if db is None:
        DEV_REMINDERS[user_id] = deepcopy(merged)
        return merged

    await db[REMINDER_COLLECTION].update_one(
        {"user_id": user_id},
        {"$set": {"user_id": user_id, **merged}},
        upsert=True,
    )
    return merged


@router.get("/api/student/reminders/{user_id}")
async def get_student_reminders(
    user_id: str,
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_student_access(actor, user_id)
    data = await load_reminders(user_id)
    return {"success": True, "data": data}


@router.put("/api/student/reminders/{user_id}")
async def update_student_reminders(
    user_id: str,
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_student_access(actor, user_id)

    updated = await upsert_reminders(user_id, payload or {})
    await log_activity_entry(
        user_id=user_id,
        activity="Settings updated",
        actor_role=actor["role"],
        metadata={"section": "reminders"},
    )
    await broadcast_settings_update(user_id=user_id, section="reminders", actor_role=actor["role"])

    return {
        "success": True,
        "message": "Saved successfully",
        "data": updated,
    }
