from fastapi import APIRouter, HTTPException, Body, Path
from typing import Dict, Any
from bson import ObjectId
from datetime import datetime, timezone

from backend.db import get_db
from backend.utils.mongo import serialize_doc

router = APIRouter(prefix="/api/faculty", tags=["faculty"])


# ======================
# DB COLLECTION
# ======================

def get_faculty_collection():
    db = get_db()
    return db["faculty_admissions"]   # ✅ using your existing collection


# ======================
# HELPERS
# ======================

def utc_now():
    return datetime.now(timezone.utc)


def normalize_faculty(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure all required fields exist (VERY IMPORTANT)"""

    generated_id = f"FAC-{int(datetime.now().timestamp() * 1000)}"

    faculty_id = data.get("id") or data.get("admission_id") or generated_id

    return {
        "id": faculty_id,
        "admission_id": faculty_id,

        "name": data.get("name") or data.get("fullName") or "N/A",
        "fullName": data.get("fullName") or data.get("name") or "N/A",

        "email": data.get("email"),
        "phone": data.get("phone"),

        "designation": data.get("designation"),
        "department": data.get("department") or data.get("departmentId"),

        "status": data.get("status") or "Pending",

        "created_at": utc_now(),
        "updated_at": utc_now(),

        # keep original data
        **data
    }


def build_query(faculty_id: str):
    query = [
        {"id": faculty_id},
        {"admission_id": faculty_id},
    ]

    if ObjectId.is_valid(faculty_id):
        query.append({"_id": ObjectId(faculty_id)})

    return {"$or": query}


# ======================
# CREATE FACULTY
# ======================

@router.post("")
async def create_faculty(data: Dict[str, Any] = Body(...)):
    """Create faculty - allows multiple submissions from same email"""
    collection = get_faculty_collection()

    faculty = normalize_faculty(data)

    result = await collection.insert_one(faculty)
    new_doc = await collection.find_one({"_id": result.inserted_id})

    return serialize_doc(new_doc)


# ======================
# SUBMIT FACULTY ADMISSION
# ======================

@router.post("/admission/submit")
async def submit_faculty_admission(data: Dict[str, Any] = Body(...)):
    """Submit faculty admission - allows multiple submissions from same email"""
    collection = get_faculty_collection()

    # Normalize and save admission without duplicate check
    faculty = normalize_faculty(data)
    
    result = await collection.insert_one(faculty)
    new_doc = await collection.find_one({"_id": result.inserted_id})

    return serialize_doc(new_doc)


# ======================
# GET ALL FACULTY
# ======================

@router.get("")
async def list_faculty():
    collection = get_faculty_collection()

    faculty_list = []

    async for doc in collection.find().sort("created_at", -1):
        item = serialize_doc(doc)

        # ✅ ensure UI fields exist
        item["name"] = item.get("name") or item.get("fullName")
        item["department"] = item.get("department") or item.get("departmentId")

        faculty_list.append(item)

    return faculty_list


# ======================
# GET ONE FACULTY
# ======================

@router.get("/{faculty_id}")
async def get_faculty(faculty_id: str = Path(...)):
    collection = get_faculty_collection()

    doc = await collection.find_one(build_query(faculty_id))

    if not doc:
        raise HTTPException(status_code=404, detail="Faculty not found")

    return serialize_doc(doc)


# ======================
# UPDATE FACULTY
# ======================

@router.put("/{faculty_id}")
async def update_faculty(
    faculty_id: str,
    updates: Dict[str, Any] = Body(...)
):
    collection = get_faculty_collection()

    updates.pop("_id", None)
    updates["updated_at"] = utc_now()

    result = await collection.update_one(
        build_query(faculty_id),
        {"$set": updates}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Faculty not found")

    updated_doc = await collection.find_one(build_query(faculty_id))

    return serialize_doc(updated_doc)


# ======================
# DELETE FACULTY
# ======================

@router.delete("/{faculty_id}")
async def delete_faculty(faculty_id: str):
    collection = get_faculty_collection()

    result = await collection.delete_one(build_query(faculty_id))

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Faculty not found")

    return {"message": "Faculty deleted successfully"}