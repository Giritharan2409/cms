from fastapi import APIRouter, HTTPException, Path
from typing import Dict, Any
from datetime import datetime, timezone

from backend.db import get_db

router = APIRouter(prefix="/api/faculty", tags=["faculty"])


# ============================================================
# DIAGNOSTIC ENDPOINTS (Optional - for debugging)
# ============================================================

@router.get("/health/db")
async def check_db_health():
    """Check database connection health"""
    try:
        db = get_db()
        if db is None:
            return {"status": "error", "message": "Database object is None"}
        
        await db.command("ping")
        return {
            "status": "healthy",
            "message": "Database connection is working",
            "database_name": db.name
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "type": type(e).__name__
        }


# ============================================================
# FACULTY ADMISSION - MAIN ENDPOINT
# ============================================================

@router.post("/admission/submit")
async def submit_faculty_admission(payload: Dict[str, Any]):
    """
    Submit faculty admission form
    Saves faculty details to MongoDB faculty_admissions collection
    """
    try:
        print("\n" + "="*70)
        print("[FACULTY ADMISSION] Processing submission...")
        print("="*70)
        
        # Get database connection
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Extract required fields
        full_name = payload.get("fullName", "").strip() if payload.get("fullName") else ""
        email = payload.get("email", "").strip() if payload.get("email") else ""
        phone = payload.get("phone", "").strip() if payload.get("phone") else ""
        
        # Validate required fields
        if not full_name or not email or not phone:
            raise HTTPException(
                status_code=400,
                detail="Name, email, and phone are required"
            )
        
        # Prepare data for database
        admission_data = {
            "type": "faculty",
            "role": "faculty",
            
            # Personal Information
            "fullName": full_name,
            "name": payload.get("name", full_name).strip(),
            "email": email,
            "phone": phone,
            "dateOfBirth": payload.get("dateOfBirth", ""),
            "gender": payload.get("gender", ""),
            
            # Professional Information
            "designation": payload.get("designation", payload.get("role", "")),
            "department": payload.get("department", ""),
            "yearsOfExperience": int(payload.get("yearsOfExperience", 0)) if payload.get("yearsOfExperience") else 0,
            
            # Qualification
            "qualification": payload.get("qualification", payload.get("highestQualification", "")),
            "specialization": payload.get("specialization", ""),
            "university": payload.get("university", ""),
            
            # Employment
            "employmentType": payload.get("employmentType", ""),
            
            # Status and Payment
            "status": payload.get("status", "Pending"),
            "paymentStatus": payload.get("paymentStatus", "Pending"),
            "payment_status": payload.get("paymentStatus", "Pending"),
            
            # Timestamps
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        # Insert into database
        faculty_admissions = db["faculty_admissions"]
        result = await faculty_admissions.insert_one(admission_data)
        
        # Generate admission ID
        admission_id = f"FAC-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        
        # Update with admission ID
        await faculty_admissions.update_one(
            {"_id": result.inserted_id},
            {"$set": {"admission_id": admission_id, "id": admission_id}}
        )
        
        print(f"✓ SUCCESS: Admission saved")
        print(f"  Admission ID: {admission_id}")
        print(f"  Faculty Name: {full_name}")
        print(f"  Database ID: {result.inserted_id}")
        print("="*70 + "\n")
        
        return {
            "success": True,
            "message": "Faculty admission submitted successfully",
            "mongo_id": str(result.inserted_id),
            "id": admission_id,
            "admission_id": admission_id,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ ERROR: {type(e).__name__}: {str(e)}")
        print("="*70 + "\n")
        raise HTTPException(
            status_code=500,
            detail=f"Error: {type(e).__name__} - {str(e)}"
        )


# ============================================================
# RETRIEVE ADMISSIONS (GET endpoints)
# ============================================================

@router.get("/admissions")
async def get_all_admissions():
    """Get all faculty admissions"""
    try:
        db = get_db()
        admissions_collection = db["faculty_admissions"]
        
        admissions = []
        async for admission in admissions_collection.find().sort("created_at", -1):
            admission["_id"] = str(admission["_id"])
            admissions.append(admission)
        
        return {
            "success": True,
            "count": len(admissions),
            "data": admissions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admissions/{admission_id}")
async def get_admission(admission_id: str):
    """Get specific faculty admission by ID"""
    try:
        db = get_db()
        admissions_collection = db["faculty_admissions"]
        
        admission = await admissions_collection.find_one({"admission_id": admission_id})
        
        if not admission:
            raise HTTPException(status_code=404, detail="Admission not found")
        
        admission["_id"] = str(admission["_id"])
        return {
            "success": True,
            "data": admission
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admissions/{admission_id}")
async def delete_admission(admission_id: str):
    """Delete a faculty admission"""
    try:
        db = get_db()
        admissions_collection = db["faculty_admissions"]
        
        result = await admissions_collection.delete_one({"admission_id": admission_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Admission not found")
        
        return {
            "success": True,
            "message": "Admission deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
