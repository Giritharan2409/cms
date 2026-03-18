from fastapi import APIRouter, HTTPException

from backend.db import get_db
from backend.schemas.common import StudentRecord
from backend.utils.mongo import serialize_doc

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("")
async def list_students():
    db = get_db()
    rows = []
    async for row in db["students"].find().sort("_id", -1):
        rows.append(serialize_doc(row))
    return rows


@router.get("/{student_id}")
async def get_student(student_id: str):
    db = get_db()
    row = await db["students"].find_one({"id": student_id})
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    return serialize_doc(row)


@router.post("", status_code=201)
async def create_student(payload: StudentRecord):
    db = get_db()
    data = payload.model_dump()
    exists = await db["students"].find_one({"id": data["id"]})
    if exists:
        raise HTTPException(status_code=400, detail="Student with this id already exists")

    result = await db["students"].insert_one(data)
    created = await db["students"].find_one({"_id": result.inserted_id})
    return serialize_doc(created)
@router.put("/{student_id}")
async def update_student(student_id: str, payload: StudentRecord):
    db = get_db()
    data = payload.model_dump()
    # Ensure ID consistency
    data["id"] = student_id
    
    result = await db["students"].replace_one({"id": student_id}, data)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
        
    updated = await db["students"].find_one({"id": student_id})
    return serialize_doc(updated)


@router.delete("/{student_id}")
async def delete_student(student_id: str):
    db = get_db()
    result = await db["students"].delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully", "id": student_id}
