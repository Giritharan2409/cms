from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from backend.db import get_db
from backend.dev_store import DEV_STORE
from backend.schemas.common import ManualNotificationCreate
from backend.services.notification_service import build_notification_filter, create_notification
from backend.utils.mongo import serialize_doc

router = APIRouter(prefix="/api/notifications", tags=["notifications:unified"])


@router.post("/create")
async def create_manual_notification(payload: ManualNotificationCreate):
    target_payload = payload.target.model_dump()
    target_role = target_payload.get("role")
    legacy_receiver_role = "ALL" if payload.is_global else (target_role if isinstance(target_role, str) else "ALL")

    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            doc = {
                "id": f"notification_{len(DEV_STORE['notifications']) + 1}",
                "title": payload.title,
                "message": payload.message,
                "type": "MANUAL",
                "source": "manual",
                "target": target_payload,
                "user_ids": payload.user_ids,
                "is_global": payload.is_global,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "read_by": [],
                "status": "unread",
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "senderRole": "manual",
                "receiverRole": legacy_receiver_role,
                "module": "System",
                "priority": "Medium",
            }
            DEV_STORE["notifications"].append(doc)
            return {"success": True, "message": "Notification created", "data": doc}
        raise

    created = await create_notification(
        db=db,
        title=payload.title,
        message=payload.message,
        type="MANUAL",
        source="manual",
        target=target_payload,
        user_ids=payload.user_ids,
        is_global=payload.is_global,
        extra_fields={
            "status": "unread",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "senderRole": "manual",
            "receiverRole": legacy_receiver_role,
            "module": "System",
            "priority": "Medium",
        },
    )
    return {"success": True, "message": "Notification created", "data": created}


@router.get("")
async def get_notifications(
    user_id: str,
    role: str,
    department: Optional[str] = None,
    section: Optional[str] = None,
    limit: Optional[int] = None,
):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            filtered = []
            for item in DEV_STORE["notifications"]:
                if item.get("is_global"):
                    filtered.append(item)
                    continue
                if user_id in (item.get("user_ids") or []):
                    filtered.append(item)
                    continue
                target = item.get("target") or {}
                target_role = target.get("role")
                role_match = False
                if isinstance(target_role, list):
                    role_match = role in target_role
                elif isinstance(target_role, str):
                    role_match = target_role == role
                if not role_match:
                    continue
                target_department = target.get("department")
                target_section = target.get("section")
                if target_department and department and target_department != department:
                    continue
                if target_section and section and target_section != section:
                    continue
                filtered.append(item)
            if limit and limit > 0:
                filtered = filtered[:limit]
            return {"success": True, "data": filtered, "count": len(filtered)}
        raise

    query = build_notification_filter(
        user_id=user_id,
        role=role,
        department=department,
        section=section,
    )

    cursor = db["notifications"].find(query).sort("created_at", -1)
    if limit and limit > 0:
        cursor = cursor.limit(limit)

    data = []
    async for row in cursor:
        if "read_by" not in row:
            row["read_by"] = []
        data.append(serialize_doc(row))

    return {"success": True, "data": data, "count": len(data)}
