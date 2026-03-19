from copy import deepcopy

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from backend.db import get_db
from backend.dev_store import DEV_STORE
from backend.schemas.common import StudentRecord
from backend.utils.mongo import serialize_doc

router = APIRouter(prefix="/api/students", tags=["students"])


def _seed_dev_students() -> None:
    if DEV_STORE.get("students"):
        return

    DEV_STORE["students"] = [
        {
            "id": "STU-2024-1547",
            "rollNumber": "STU-2024-1547",
            "name": "John Anderson",
            "email": "john.anderson@mit.edu",
            "phone": "+91 90123 45678",
            "department": "Computer Science",
            "year": "3rd Year",
            "semester": 6,
            "section": "A",
            "cgpa": 8.7,
            "attendancePct": 92,
            "feeStatus": "Pending",
            "status": "Active",
        },
        {
            "id": "STU-2024-001",
            "rollNumber": "STU-2024-001",
            "name": "Aarav Kumar",
            "email": "aarav.kumar@mit.edu",
            "phone": "+91 98765 43210",
            "department": "Computer Science",
            "year": "3rd Year",
            "semester": 6,
            "section": "A",
            "cgpa": 8.7,
            "attendancePct": 92,
            "feeStatus": "Paid",
            "status": "Active",
        },
        {
            "id": "STU-2024-042",
            "rollNumber": "STU-2024-042",
            "name": "Priya Sharma",
            "email": "priya.sharma@mit.edu",
            "phone": "+91 87654 32109",
            "department": "Computer Science",
            "year": "3rd Year",
            "semester": 6,
            "section": "A",
            "cgpa": 9.1,
            "attendancePct": 96,
            "feeStatus": "Paid",
            "status": "Active",
        },
    ]


@router.get("")
async def list_students():
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            _seed_dev_students()
            return deepcopy(DEV_STORE["students"])
        raise

    rows = []
    async for row in db["students"].find().sort("_id", -1):
        rows.append(serialize_doc(row))
    return rows


@router.get("/{student_id}")
async def get_student(student_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            _seed_dev_students()
            row = next(
                (
                    item
                    for item in DEV_STORE["students"]
                    if item.get("id") == student_id or item.get("rollNumber") == student_id
                ),
                None,
            )
            if not row:
                raise HTTPException(status_code=404, detail="Student not found")
            return deepcopy(row)
        raise

    row = await db["students"].find_one(
        {"$or": [{"id": student_id}, {"rollNumber": student_id}]}
    )
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    return serialize_doc(row)


@router.post("", status_code=201)
async def create_student(payload: StudentRecord):
    data = payload.model_dump()

    if not data.get("rollNumber"):
        data["rollNumber"] = data["id"]

    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            _seed_dev_students()
            exists = next(
                (
                    item
                    for item in DEV_STORE["students"]
                    if item.get("id") == data["id"] or item.get("rollNumber") == data["rollNumber"]
                ),
                None,
            )
            if exists:
                raise HTTPException(status_code=400, detail="Student with this id already exists")
            DEV_STORE["students"].insert(0, deepcopy(data))
            return data
        raise

    exists = await db["students"].find_one(
        {"$or": [{"id": data["id"]}, {"rollNumber": data["rollNumber"]}]}
    )
    if exists:
        raise HTTPException(status_code=400, detail="Student with this id already exists")

    result = await db["students"].insert_one(data)
    created = await db["students"].find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.put("/{student_id}")
async def update_student(student_id: str, payload: dict):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            _seed_dev_students()
            target = next(
                (
                    item
                    for item in DEV_STORE["students"]
                    if item.get("id") == student_id or item.get("rollNumber") == student_id
                ),
                None,
            )
            if not target:
                raise HTTPException(status_code=404, detail="Student not found")
            target.update(payload)
            return deepcopy(target)
        raise

    result = await db["students"].find_one_and_update(
        {"$or": [{"id": student_id}, {"rollNumber": student_id}]},
        {"$set": payload},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Student not found")
    return serialize_doc(result)


@router.delete("/{student_id}")
async def delete_student(student_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            _seed_dev_students()
            before = len(DEV_STORE["students"])
            DEV_STORE["students"] = [
                item
                for item in DEV_STORE["students"]
                if item.get("id") != student_id and item.get("rollNumber") != student_id
            ]
            if len(DEV_STORE["students"]) == before:
                raise HTTPException(status_code=404, detail="Student not found")
            return {"message": "Student deleted"}
        raise

    result = await db["students"].delete_one(
        {"$or": [{"id": student_id}, {"rollNumber": student_id}]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted"}
