from copy import deepcopy

from fastapi import APIRouter, Body, Header, HTTPException

from backend.db import get_db
from backend.routes.modules.settings.activity_routes import log_activity_entry
from backend.routes.modules.settings.realtime import broadcast, broadcast_settings_update

router = APIRouter(tags=["settings:faculty-alerts"])

FACULTY_ALERT_COLLECTION = "faculty_settings_v1"
ROLE_ADMIN = "admin"
ROLE_FACULTY = "faculty"
VALID_PRIORITIES = {"low", "medium", "high"}

DEFAULT_ALERT_SETTINGS = {
    "assignmentAlert": True,
    "submissionThreshold": 10,
    "priority": "medium",
    "doubtAlert": True,
    "workingHoursOnly": True,
    "evaluationReminder": True,
    "delayDays": 2,
}

DEV_FACULTY_ALERTS = {
    "FAC-204": deepcopy(DEFAULT_ALERT_SETTINGS),
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


def ensure_faculty_access(actor: dict, target_user_id: str) -> None:
    if actor["role"] == ROLE_ADMIN:
        return

    if actor["role"] != ROLE_FACULTY or actor["user_id"] != target_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access faculty alert settings")


def sanitize_alert_settings(incoming: dict, current: dict) -> dict:
    payload = incoming or {}

    assignment_alert = bool(payload.get("assignmentAlert", current.get("assignmentAlert", True)))
    doubt_alert = bool(payload.get("doubtAlert", current.get("doubtAlert", True)))
    working_hours_only = bool(payload.get("workingHoursOnly", current.get("workingHoursOnly", True)))
    evaluation_reminder = bool(payload.get("evaluationReminder", current.get("evaluationReminder", True)))

    threshold_raw = payload.get("submissionThreshold", current.get("submissionThreshold", 10))
    delay_days_raw = payload.get("delayDays", current.get("delayDays", 2))
    priority = str(payload.get("priority", current.get("priority", "medium"))).strip().lower()

    try:
        submission_threshold = int(threshold_raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="submissionThreshold must be a number")

    if submission_threshold <= 0:
        raise HTTPException(status_code=400, detail="submissionThreshold must be greater than zero")

    try:
        delay_days = int(delay_days_raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="delayDays must be a number")

    if delay_days <= 0:
        raise HTTPException(status_code=400, detail="delayDays must be a positive number")

    if priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail="priority must be one of low, medium, high")

    return {
        "assignmentAlert": assignment_alert,
        "submissionThreshold": submission_threshold,
        "priority": priority,
        "doubtAlert": doubt_alert,
        "workingHoursOnly": working_hours_only,
        "evaluationReminder": evaluation_reminder,
        "delayDays": delay_days,
    }


def normalize_stored_alerts(raw_alerts: dict | None) -> dict:
    merged = {**DEFAULT_ALERT_SETTINGS, **(raw_alerts or {})}
    try:
        return sanitize_alert_settings(merged, DEFAULT_ALERT_SETTINGS)
    except HTTPException:
        return deepcopy(DEFAULT_ALERT_SETTINGS)


async def load_alert_settings(user_id: str) -> dict:
    db = get_db_or_none()
    if db is None:
        current = DEV_FACULTY_ALERTS.get(user_id, deepcopy(DEFAULT_ALERT_SETTINGS))
        normalized = normalize_stored_alerts(current)
        DEV_FACULTY_ALERTS[user_id] = deepcopy(normalized)
        return normalized

    doc = await db[FACULTY_ALERT_COLLECTION].find_one({"user_id": user_id})
    if not doc:
        return deepcopy(DEFAULT_ALERT_SETTINGS)

    alerts = doc.get("alerts") if isinstance(doc.get("alerts"), dict) else {}
    return normalize_stored_alerts(alerts)


@router.get("/api/settings/faculty/alerts/{user_id}")
async def get_faculty_alert_settings(
    user_id: str,
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_faculty_access(actor, user_id)
    data = await load_alert_settings(user_id)
    return {"success": True, "data": data}


@router.put("/api/settings/faculty/alerts/{user_id}")
async def update_faculty_alert_settings(
    user_id: str,
    body: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_faculty_access(actor, user_id)

    current = await load_alert_settings(user_id)
    updated = sanitize_alert_settings(body or {}, current)

    db = get_db_or_none()
    if db is None:
        DEV_FACULTY_ALERTS[user_id] = deepcopy(updated)
    else:
        await db[FACULTY_ALERT_COLLECTION].update_one(
            {"user_id": user_id},
            {"$set": {"user_id": user_id, "alerts": updated}},
            upsert=True,
        )

    await log_activity_entry(
        user_id=user_id,
        activity="Settings updated",
        actor_role=actor["role"],
        metadata={"section": "alerts"},
    )
    await broadcast({"type": "FACULTY_ALERT_UPDATED", "user_id": user_id})
    await broadcast_settings_update(user_id=user_id, section="alerts", actor_role=actor["role"])

    return {
        "status": "updated",
        "message": "Alert settings updated",
        "data": updated,
    }