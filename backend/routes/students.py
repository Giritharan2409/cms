from copy import deepcopy

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from backend.db import get_db
from backend.dev_store import DEV_STORE
from backend.schemas.common import StudentRecord
from backend.utils.mongo import serialize_doc

router = APIRouter(prefix="/api/students", tags=["students"])


# No mock seed required


@router.get("")
async def list_students():
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return []
        raise

    rows = []
    projection = {"avatar": 0, "documents": 0}
    async for row in db["students"].find({}, projection).sort("_id", -1):
        rows.append(serialize_doc(row))
    return rows


@router.get("/export")
async def export_students():
    try:
        db = get_db()
    except HTTPException as error:
        raise HTTPException(status_code=503, detail="Database unreachable")

    import csv
    import io
    from fastapi.responses import StreamingResponse

    rows = []
    async for row in db["students"].find().sort("_id", -1):
        rows.append(serialize_doc(row))

    if not rows:
        raise HTTPException(status_code=404, detail="No students to export")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students_export.csv"}
    )


@router.get("/{student_id}")
async def get_student(student_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            raise HTTPException(status_code=404, detail="Student not found (Database unreachable)")
        raise

    query = {"$or": [{"id": student_id}, {"rollNumber": student_id}]}
    
    # Also try to search by ObjectId if student_id is a valid hex string
    try:
        from bson import ObjectId
        if ObjectId.is_valid(student_id):
            query["$or"].append({"_id": ObjectId(student_id)})
    except:
        pass

    row = await db["students"].find_one(query)
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
            raise HTTPException(status_code=503, detail="Database unreachable")
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
            raise HTTPException(status_code=503, detail="Database unreachable")
        raise

    query = {"$or": [{"id": student_id}, {"rollNumber": student_id}]}
    try:
        from bson import ObjectId
        if ObjectId.is_valid(student_id):
            query["$or"].append({"_id": ObjectId(student_id)})
    except:
        pass

    result = await db["students"].find_one_and_update(
        query,
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
            raise HTTPException(status_code=503, detail="Database unreachable")
        raise

    query = {"$or": [{"id": student_id}, {"rollNumber": student_id}]}
    try:
        from bson import ObjectId
        if ObjectId.is_valid(student_id):
            query["$or"].append({"_id": ObjectId(student_id)})
    except:
        pass

    result = await db["students"].delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted"}
