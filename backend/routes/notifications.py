from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from backend.db import get_db
from backend.dev_store import clear_notifications as clear_dev_notifications
from backend.dev_store import create_notification as create_dev_notification
from backend.dev_store import delete_notification as delete_dev_notification
from backend.dev_store import list_notifications as list_dev_notifications
from backend.dev_store import mark_notification_read as mark_dev_notification_read
from backend.dev_store import mark_role_notifications_read as mark_dev_role_notifications_read
from backend.dev_store import unread_notifications as unread_dev_notifications
from backend.schemas.common import NotificationCreate
from backend.services.notification_service import create_notification as create_notification_service
from backend.utils.mongo import parse_object_id, serialize_doc

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/{role}")
async def list_notifications(role: str, limit: Optional[int] = None, search: Optional[str] = None):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            data, unread_count = list_dev_notifications(role, limit, search)
            return {"success": True, "role": role, "data": data, "count": len(data), "unreadCount": unread_count}
        raise
    query = {
        "$or": [
            {"receiverRole": role},
            {"receiverRole": "ALL"},
            {"senderRole": role},
        ]
    }

    if search:
        query["$and"] = [
            {
                "$or": [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"message": {"$regex": search, "$options": "i"}},
                ]
            }
        ]

    cursor = db["notifications"].find(query).sort("createdAt", -1)
    if limit and limit > 0:
        cursor = cursor.limit(limit)

    data = []
    async for row in cursor:
        data.append(serialize_doc(row))

    unread_count = await db["notifications"].count_documents(
        {
            "$or": [
                {"receiverRole": role},
                {"receiverRole": "ALL"},
                {"senderRole": role},
            ],
            "status": "unread",
        }
    )

    return {
        "success": True,
        "role": role,
        "data": data,
        "count": len(data),
        "unreadCount": unread_count,
    }


@router.get("/{role}/unread")
async def unread_count(role: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "role": role, "unreadCount": unread_dev_notifications(role)}
        raise
    unread = await db["notifications"].count_documents(
        {
            "$or": [
                {"receiverRole": role},
                {"receiverRole": "ALL"},
                {"senderRole": role},
            ],
            "status": "unread",
        }
    )
    return {"success": True, "role": role, "unreadCount": unread}


@router.post("")
async def create_notification(payload: NotificationCreate):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            created = create_dev_notification(payload.model_dump())
            return {"success": True, "message": "Notification created", "data": created}
        raise

    body = payload.model_dump()
    receiver_role = body.get("receiverRole")
    target_role = receiver_role if receiver_role != "ALL" else ["student", "faculty", "admin", "finance"]
    created = await create_notification_service(
        db=db,
        title=body.get("title", ""),
        message=body.get("message", ""),
        type="MANUAL",
        source="manual",
        target={
            "role": target_role,
            "department": body.get("department"),
            "section": body.get("relatedData", {}).get("section") if isinstance(body.get("relatedData"), dict) else None,
        },
        user_ids=[],
        is_global=receiver_role == "ALL",
        extra_fields={
            "status": "unread",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "senderRole": body.get("senderRole"),
            "receiverRole": receiver_role,
            "module": body.get("module"),
            "priority": body.get("priority"),
            "actionId": body.get("actionId"),
            "relatedData": body.get("relatedData", {}),
            "department": body.get("department"),
        },
    )
    return {"success": True, "message": "Notification created", "data": created}


@router.put("/{notification_id}/read")
async def mark_read(notification_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            updated = mark_dev_notification_read(notification_id)
            if not updated:
                raise HTTPException(status_code=404, detail="Notification not found")
            return {"success": True, "message": "Notification marked as read", "data": updated}
        raise
    updated = await db["notifications"].find_one_and_update(
        {"_id": parse_object_id(notification_id)},
        {"$set": {"status": "read"}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True, "message": "Notification marked as read", "data": serialize_doc(updated)}


@router.put("/{role}/read-all")
async def mark_all_read(role: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            count = mark_dev_role_notifications_read(role)
            return {"success": True, "message": "All notifications marked as read", "count": count}
        raise
    result = await db["notifications"].update_many(
        {"$or": [{"receiverRole": role}, {"receiverRole": "ALL"}], "status": "unread"},
        {"$set": {"status": "read"}},
    )
    return {"success": True, "message": "All notifications marked as read", "count": result.modified_count}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            deleted = delete_dev_notification(notification_id)
            if not deleted:
                raise HTTPException(status_code=404, detail="Notification not found")
            return {"success": True, "message": "Notification deleted"}
        raise
    result = await db["notifications"].delete_one({"_id": parse_object_id(notification_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True, "message": "Notification deleted"}


@router.post("/{role}/clear-all")
async def clear_all(role: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            deleted_count = clear_dev_notifications(role)
            return {"success": True, "message": "All notifications cleared", "deletedCount": deleted_count}
        raise
    result = await db["notifications"].delete_many(
        {"$or": [{"receiverRole": role}, {"receiverRole": "ALL"}]}
    )
    return {"success": True, "message": "All notifications cleared", "deletedCount": result.deleted_count}
