from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId

from backend.db import get_db
from backend.models.department import Department

router = APIRouter(prefix="/api/departments", tags=["departments"])


@router.get("/")
async def get_all_departments():
    """
    Fetch all departments from MongoDB
    """
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Fetch all departments from the departments collection
        departments_collection = db["departments"]
        departments = []
        
        async for dept in departments_collection.find({}):
            dept_data = {
                "id": str(dept.get("_id", "")),
                "name": dept.get("name", ""),
                "code": dept.get("code", ""),
                "head": dept.get("head_of_department", dept.get("head", "")),
                "totalFaculty": dept.get("total_faculty", 0),
                "totalStudents": dept.get("total_students", 0),
                "courses": dept.get("total_courses", 0),
                "email": dept.get("email", ""),
                "phone": dept.get("phone", ""),
                "location": dept.get("location", ""),
                "description": dept.get("description", "")
            }
            departments.append(dept_data)
        
        return {
            "status": "success",
            "data": departments,
            "count": len(departments)
        }
    except Exception as e:
        print(f"Error fetching departments: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching departments: {str(e)}"
        )


@router.get("/{department_id}")
async def get_department(department_id: str):
    """
    Fetch a specific department by ID
    """
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        departments_collection = db["departments"]
        
        # Try to convert to ObjectId if it looks like a MongoDB ID
        try:
            dept_id = ObjectId(department_id)
        except:
            dept_id = department_id
        
        department = await departments_collection.find_one({"_id": dept_id})
        
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        
        dept_data = {
            "id": str(department.get("_id", "")),
            "name": department.get("name", ""),
            "code": department.get("code", ""),
            "head": department.get("head_of_department", department.get("head", "")),
            "totalFaculty": department.get("total_faculty", 0),
            "totalStudents": department.get("total_students", 0),
            "courses": department.get("total_courses", 0),
            "email": department.get("email", ""),
            "phone": department.get("phone", ""),
            "location": department.get("location", ""),
            "description": department.get("description", "")
        }
        
        return {
            "status": "success",
            "data": dept_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching department: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching department: {str(e)}"
        )


@router.get("/by-code/{code}")
async def get_department_by_code(code: str):
    """
    Fetch a specific department by code (e.g., CSE, EEE)
    """
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        departments_collection = db["departments"]
        department = await departments_collection.find_one({"code": code.upper()})
        
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        
        dept_data = {
            "id": str(department.get("_id", "")),
            "name": department.get("name", ""),
            "code": department.get("code", ""),
            "head": department.get("head_of_department", department.get("head", "")),
            "totalFaculty": department.get("total_faculty", 0),
            "totalStudents": department.get("total_students", 0),
            "courses": department.get("total_courses", 0),
            "email": department.get("email", ""),
            "phone": department.get("phone", ""),
            "location": department.get("location", ""),
            "description": department.get("description", "")
        }
        
        return {
            "status": "success",
            "data": dept_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching department by code: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching department: {str(e)}"
        )


@router.post("/")
async def create_department(department_data: Dict[str, Any]):
    """
    Create a new department in MongoDB
    """
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Validate required fields
        if not department_data.get("name") or not department_data.get("code"):
            raise HTTPException(
                status_code=400,
                detail="Department name and code are required"
            )
        
        # Prepare document for MongoDB
        dept_doc = {
            "name": department_data.get("name", ""),
            "code": department_data.get("code", "").upper(),
            "head_of_department": department_data.get("head", ""),
            "total_faculty": int(department_data.get("totalFaculty", 0)),
            "total_students": int(department_data.get("totalStudents", 0)),
            "total_courses": int(department_data.get("courses", 0)),
            "email": department_data.get("email", ""),
            "phone": department_data.get("phone", ""),
            "location": department_data.get("location", ""),
            "description": department_data.get("description", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        departments_collection = db["departments"]
        result = await departments_collection.insert_one(dept_doc)
        
        return {
            "status": "success",
            "message": "Department created successfully",
            "id": str(result.inserted_id)
        }
    except Exception as e:
        print(f"Error creating department: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating department: {str(e)}"
        )


@router.put("/{department_id}")
async def update_department(department_id: str, department_data: Dict[str, Any]):
    """
    Update a department in MongoDB
    """
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Try to convert to ObjectId
        try:
            dept_id = ObjectId(department_id)
        except:
            dept_id = department_id
        
        # Prepare update document
        update_doc = {
            "name": department_data.get("name", ""),
            "code": department_data.get("code", "").upper() if department_data.get("code") else "",
            "head_of_department": department_data.get("head", ""),
            "total_faculty": int(department_data.get("totalFaculty", 0)),
            "total_students": int(department_data.get("totalStudents", 0)),
            "total_courses": int(department_data.get("courses", 0)),
            "email": department_data.get("email", ""),
            "phone": department_data.get("phone", ""),
            "location": department_data.get("location", ""),
            "description": department_data.get("description", ""),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        departments_collection = db["departments"]
        result = await departments_collection.update_one(
            {"_id": dept_id},
            {"$set": update_doc}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Department not found")
        
        return {
            "status": "success",
            "message": "Department updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating department: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error updating department: {str(e)}"
        )


@router.delete("/{department_id}")
async def delete_department(department_id: str):
    """
    Delete a department from MongoDB
    """
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Try to convert to ObjectId
        try:
            dept_id = ObjectId(department_id)
        except:
            dept_id = department_id
        
        departments_collection = db["departments"]
        result = await departments_collection.delete_one({"_id": dept_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Department not found")
        
        return {
            "status": "success",
            "message": "Department deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting department: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting department: {str(e)}"
        )
