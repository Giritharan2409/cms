from fastapi import APIRouter, HTTPException
from bson import ObjectId

from backend.db import get_db
from backend.schemas.admission_schema import AdmissionCreate

router = APIRouter(prefix="/admissions", tags=["Admissions"])


# -----------------------------
# Create Admission
# -----------------------------
@router.post("/create")
async def create_admission(data: AdmissionCreate):

    db = get_db()

    admissions_collection = db["admissions"]

    admission = data.model_dump()

    admission.setdefault("status", "Pending")

    payment = admission.get("payment") or {}
    admission["payment_status"] = (
        admission.get("payment_status")
        or payment.get("status")
        or "Pending"
    )

    result = await admissions_collection.insert_one(admission)

    return {
        "message": "Admission created successfully",
        "id": str(result.inserted_id)
    }


# -----------------------------
# Get All Admissions
# -----------------------------
@router.get("/")
async def get_all_admissions():

    db = get_db()

    admissions_collection = db["admissions"]

    data = []

    async for item in admissions_collection.find():
        item["_id"] = str(item["_id"])
        data.append(item)

    return data


# -----------------------------
# Approve Admission
# -----------------------------
@router.put("/approve/{id}")
async def approve_admission(id: str):

    db = get_db()

    admissions_collection = db["admissions"]

    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid admission id")

    result = await admissions_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "Approved"}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Admission not found")

    return {"message": "Admission approved successfully"}


# -----------------------------
# Reject Admission
# -----------------------------
@router.put("/reject/{id}")
async def reject_admission(id: str):

    db = get_db()

    admissions_collection = db["admissions"]

    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid admission id")

    result = await admissions_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "Rejected"}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Admission not found")

    return {"message": "Admission rejected successfully"}