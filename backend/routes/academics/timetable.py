from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from backend.db import get_db
from backend.dev_store import create_notification as create_dev_notification
from backend.dev_store import get_timetable as get_dev_timetable
from backend.dev_store import list_timetables as list_dev_timetables
from backend.dev_store import upsert_timetable as upsert_dev_timetable
from backend.schemas.academics import TimetableRecord
from backend.services.notification_service import create_notification as create_notification_service
from backend.utils.mongo import serialize_doc

router = APIRouter(prefix="/api/academics/timetable", tags=["academics:timetable"])

WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _entry_display(entry: dict) -> str:
    if not isinstance(entry, dict):
        return "Empty"
    name = (entry.get("name") or "").strip()
    code = (entry.get("code") or "").strip()
    room = (entry.get("room") or "").strip()
    instructor = (entry.get("instructor") or "").strip()

    primary = name or code or "Untitled subject"
    suffix = []
    if code and code != primary:
        suffix.append(code)
    if room:
        suffix.append(f"Room {room}")
    if instructor:
        suffix.append(instructor)
    return f"{primary} ({', '.join(suffix)})" if suffix else primary


def _normalize_entry(entry: dict) -> dict:
    if not isinstance(entry, dict):
        return {}
    return {
        "code": (entry.get("code") or "").strip(),
        "name": (entry.get("name") or "").strip(),
        "room": (entry.get("room") or "").strip(),
        "instructor": (entry.get("instructor") or "").strip(),
        "type": (entry.get("type") or "").strip(),
    }


def _slot_label(period_index: int, new_period_slots: list, old_period_slots: list) -> str:
    if period_index < len(new_period_slots):
        return f"Hour {period_index + 1} ({new_period_slots[period_index]})"
    if period_index < len(old_period_slots):
        return f"Hour {period_index + 1} ({old_period_slots[period_index]})"
    return f"Hour {period_index + 1}"


def _day_label(row_index: int) -> str:
    if row_index < len(WEEKDAY_LABELS):
        return WEEKDAY_LABELS[row_index]
    return f"Day {row_index + 1}"


def _build_change_details(previous: dict, data: dict) -> list[str]:
    details = []

    old_period_slots = previous.get("periodSlots") or []
    new_period_slots = data.get("periodSlots") or []
    old_slots = previous.get("slots") or []
    new_slots = data.get("slots") or []

    if len(new_period_slots) > len(old_period_slots):
        added = ", ".join(new_period_slots[len(old_period_slots):])
        details.append(f"Added new hour slots: {added}")
    elif len(new_period_slots) < len(old_period_slots):
        removed = ", ".join(old_period_slots[len(new_period_slots):])
        details.append(f"Removed hour slots: {removed}")

    max_rows = max(len(old_slots), len(new_slots))
    for row_index in range(max_rows):
        old_row = old_slots[row_index] if row_index < len(old_slots) else []
        new_row = new_slots[row_index] if row_index < len(new_slots) else []

        max_cols = max(len(old_row), len(new_row))
        for col_index in range(max_cols):
            old_entry = old_row[col_index] if col_index < len(old_row) else None
            new_entry = new_row[col_index] if col_index < len(new_row) else None

            if not old_entry and not new_entry:
                continue

            day_label = _day_label(row_index)
            hour_label = _slot_label(col_index, new_period_slots, old_period_slots)

            if not old_entry and new_entry:
                details.append(f"Added { _entry_display(new_entry) } at {day_label}, {hour_label}")
                continue

            if old_entry and not new_entry:
                details.append(f"Removed { _entry_display(old_entry) } from {day_label}, {hour_label}")
                continue

            old_norm = _normalize_entry(old_entry)
            new_norm = _normalize_entry(new_entry)
            if old_norm != new_norm:
                details.append(
                    f"Updated {day_label}, {hour_label}: { _entry_display(old_entry) } -> { _entry_display(new_entry) }"
                )

    return details


def _build_timetable_target(data: dict):
    department = data.get("department") or data.get("dept")
    section = data.get("section")
    return {
        "role": "student",
        "department": department,
        "section": section,
    }


def _build_timetable_notification_text(previous: dict, data: dict, class_id: str):
    department = data.get("department") or data.get("dept") or "General"
    section = data.get("section") or "All"
    changes = _build_change_details(previous, data)

    title = f"Timetable Updated: {department}-{section}"
    if changes:
        preview = changes[:5]
        lines = "\n".join([f"- {line}" for line in preview])
        extra_count = len(changes) - len(preview)
        extra_line = f"\n- ... and {extra_count} more changes" if extra_count > 0 else ""
        message = (
            f"Timetable was modified for {department} section {section} (Class: {class_id}).\n"
            f"Changes:\n{lines}{extra_line}"
        )
    else:
        message = f"A timetable update was saved for {department} section {section} (Class: {class_id})."

    return title, message, changes


@router.get("")
async def list_timetables():
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": list_dev_timetables()}
        raise
    records = []
    async for record in db["academic_timetables"].find().sort("classId", 1):
        records.append(serialize_doc(record))
    return {"success": True, "data": records}


@router.get("/{class_id}")
async def get_timetable(class_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            record = get_dev_timetable(class_id)
            if not record:
                raise HTTPException(status_code=404, detail="Timetable not found")
            return {"success": True, "data": record}
        raise
    record = await db["academic_timetables"].find_one({"classId": class_id})
    if not record:
        raise HTTPException(status_code=404, detail="Timetable not found")
    return {"success": True, "data": serialize_doc(record)}


@router.put("/{class_id}")
async def upsert_timetable(class_id: str, payload: TimetableRecord):
    data = payload.model_dump()
    data["classId"] = class_id

    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            previous_dev = get_dev_timetable(class_id) or {}
            updated_dev = upsert_dev_timetable(class_id, data)
            title, message, changes = _build_timetable_notification_text(previous_dev, data, class_id)
            create_dev_notification(
                {
                    "title": title,
                    "message": message,
                    "senderRole": "system",
                    "receiverRole": "student",
                    "module": "Academic",
                    "priority": "Medium",
                    "type": "TIMETABLE_UPDATE",
                    "source": "system",
                    "target": _build_timetable_target(data),
                    "user_ids": [],
                    "is_global": False,
                    "read_by": [],
                    "relatedData": {
                        "classId": class_id,
                        "department": data.get("department") or data.get("dept"),
                        "section": data.get("section"),
                        "changeCount": len(changes),
                        "changes": changes,
                    },
                }
            )
            return {"success": True, "data": updated_dev}
        raise

    previous = await db["academic_timetables"].find_one({"classId": class_id}) or {}

    updated = await db["academic_timetables"].find_one_and_update(
        {"classId": class_id},
        {"$set": data},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    title, message, changes = _build_timetable_notification_text(previous, data, class_id)
    await create_notification_service(
        db=db,
        title=title,
        message=message,
        type="TIMETABLE_UPDATE",
        source="system",
        target=_build_timetable_target(data),
        user_ids=[],
        is_global=False,
        extra_fields={
            "status": "unread",
            "senderRole": "system",
            "receiverRole": "student",
            "module": "Academic",
            "priority": "Medium",
            "classId": class_id,
            "relatedData": {
                "classId": class_id,
                "department": data.get("department") or data.get("dept"),
                "section": data.get("section"),
                "changeCount": len(changes),
                "changes": changes,
            },
        },
    )

    return {"success": True, "data": serialize_doc(updated)}


@router.post("/update")
async def update_timetable(payload: TimetableRecord):
    class_id = payload.classId
    return await upsert_timetable(class_id, payload)
