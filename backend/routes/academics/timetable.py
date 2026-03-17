from datetime import datetime
import re

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from backend.db import get_db
from backend.dev_store import get_timetable as get_dev_timetable
from backend.dev_store import list_timetables as list_dev_timetables
from backend.dev_store import upsert_timetable as upsert_dev_timetable
from backend.schemas.academics import TimetableRecord
from backend.utils.mongo import serialize_doc
from backend.utils.websocket_manager import connection_manager

router = APIRouter(prefix="/api/academics/timetable", tags=["academics:timetable"])

DEPT_CODE_MAP = {
    "CS": ["CS", "CSE", "COMPUTER SCIENCE"],
    "EC": ["EC", "ECE", "ELECTRONICS"],
    "EE": ["EE", "EEE", "ELECTRICAL"],
    "ME": ["ME", "MECH", "MECHANICAL"],
    "CE": ["CE", "CIVIL"],
}

CLASS_FALLBACK_STUDENTS = {
    "CS-S4A": ["STU-2024-1547"],
}


async def _resolve_class_student_ids(db, class_id: str) -> list[str]:
    student_ids: set[str] = set()

    async for student in db["students"].find({"classId": class_id}):
        candidate = student.get("id") or student.get("userId") or student.get("rollNumber")
        if candidate:
            student_ids.add(str(candidate))

    class_match = re.match(r"^([A-Z]+)-S(\d+)([A-Z])$", class_id.upper())
    if class_match:
        dept_code, semester_str, section = class_match.groups()
        semester = int(semester_str)
        department_ids = DEPT_CODE_MAP.get(dept_code, [dept_code])

        query = {
            "semester": semester,
            "section": section,
            "$or": [
                {"departmentId": {"$in": department_ids}},
                {"department": {"$in": department_ids}},
            ],
        }

        async for student in db["students"].find(query):
            candidate = student.get("id") or student.get("userId") or student.get("rollNumber")
            if candidate:
                student_ids.add(str(candidate))

    if not student_ids and class_id in CLASS_FALLBACK_STUDENTS:
        for student_id in CLASS_FALLBACK_STUDENTS[class_id]:
            student_ids.add(student_id)

    return list(student_ids)


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
            return {"success": True, "data": upsert_dev_timetable(class_id, data)}
        raise

    existing = await db["academic_timetables"].find_one({"classId": class_id})

    updated = await db["academic_timetables"].find_one_and_update(
        {"classId": class_id},
        {"$set": data},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    student_ids = await _resolve_class_student_ids(db, class_id)
    if student_ids:
        notification_doc = {
            "title": f"Timetable Updated: {data.get('label', class_id)}",
            "message": f"Your class timetable has been updated for {data.get('semester', '')} {data.get('section', '')}. Please review the latest schedule.",
            "category": "announcement",
            "priority": "medium",
            "senderRole": "faculty",
            "receiverRole": "student",
            "receiverIds": student_ids,
            "status": "unread",
            "triggerType": "timetable_updated",
            "relatedId": class_id,
            "createdAt": datetime.utcnow(),
            "updatedAt": None,
        }

        if existing is None:
            notification_doc["title"] = f"Timetable Published: {data.get('label', class_id)}"
            notification_doc["priority"] = "high"
            notification_doc["triggerType"] = "timetable_published"

        result = await db["notifications"].insert_one(notification_doc)
        created_notification = await db["notifications"].find_one({"_id": result.inserted_id})
        await connection_manager.broadcast_to_many(
            student_ids,
            {
                "type": "notification",
                "notification": serialize_doc(created_notification),
            },
        )

    return {"success": True, "data": serialize_doc(updated)}
