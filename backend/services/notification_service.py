from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException

from backend.utils.mongo import serialize_doc


async def create_notification(
    db,
    title: str,
    message: str,
    type: str,
    source: str = "system",
    target: Optional[dict] = None,
    user_ids: Optional[list[str]] = None,
    is_global: bool = False,
    extra_fields: Optional[dict] = None,
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database is not available")

    safe_title = (title or "").strip()
    safe_message = (message or "").strip()
    if not safe_title:
        raise HTTPException(status_code=422, detail="title is required")
    if not safe_message:
        raise HTTPException(status_code=422, detail="message is required")

    safe_target = target if isinstance(target, dict) else {}
    safe_user_ids = [str(item) for item in (user_ids or []) if str(item).strip()]

    role_value = safe_target.get("role")
    if isinstance(role_value, list):
        normalized_roles = [str(role).strip() for role in role_value if str(role).strip()]
        safe_target["role"] = normalized_roles
    elif isinstance(role_value, str):
        safe_target["role"] = role_value.strip()
    elif role_value is None:
        safe_target.pop("role", None)

    notification_doc = {
        "title": safe_title,
        "message": safe_message,
        "type": str(type or "SYSTEM").strip() or "SYSTEM",
        "source": str(source or "system").strip() or "system",
        "target": {
            "role": safe_target.get("role"),
            "department": safe_target.get("department"),
            "section": safe_target.get("section"),
        },
        "user_ids": safe_user_ids,
        "is_global": bool(is_global),
        "created_at": datetime.now(timezone.utc),
        "read_by": [],
    }

    if isinstance(extra_fields, dict):
        for key, value in extra_fields.items():
            if value is not None:
                notification_doc[key] = value

    result = await db["notifications"].insert_one(notification_doc)
    created = await db["notifications"].find_one({"_id": result.inserted_id})
    return serialize_doc(created)


def _match_value_or_missing(value: Optional[str], field: str):
    if not value:
        return [{field: {"$exists": False}}, {field: None}]
    return [{field: value}, {field: {"$exists": False}}, {field: None}]


def build_notification_filter(
    user_id: str,
    role: str,
    department: Optional[str] = None,
    section: Optional[str] = None,
):
    safe_user_id = (user_id or "").strip()
    safe_role = (role or "").strip()

    if not safe_user_id or not safe_role:
        raise HTTPException(status_code=422, detail="user_id and role are required")

    role_match = {
        "$and": [
            {"target.role": safe_role},
            {
                "$or": _match_value_or_missing(department, "target.department"),
            },
            {
                "$or": _match_value_or_missing(section, "target.section"),
            },
        ]
    }

    return {
        "$or": [
            {"is_global": True},
            {"user_ids": safe_user_id},
            role_match,
        ]
    }
