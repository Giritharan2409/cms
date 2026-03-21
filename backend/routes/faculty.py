from fastapi import APIRouter, HTTPException, Query, Body, Path
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel

from backend.db import get_db
from backend.utils.mongo import serialize_doc
from backend.models.faculty import Faculty
from backend.models.faculty_activity import CourseAssignment, PerformanceMetric, ProfessionalDevelopment

router = APIRouter(prefix="/api/faculty", tags=["faculty"])

# Helper functions
async def get_faculty_collection():
    db = get_db()
    return db["faculty"]

async def get_faculty_activity_collection(collection_name: str):
    db = get_db()
    return db[collection_name]

# -----------------
# Faculty CRUD
# -----------------

@router.get("")
async def list_faculty(
    department_id: Optional[str] = Query(None, alias="departmentId"),
    designation: Optional[str] = None,
    employment_status: Optional[str] = Query(None, alias="employmentStatus"),
    search: Optional[str] = None
):
    collection = await get_faculty_collection()
    
    query = {}
    if department_id:
        query["departmentId"] = department_id
    if designation:
        query["designation"] = designation
    if employment_status:
        query["employment_status"] = employment_status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"employeeId": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
        
    cursor = collection.find(query)
    faculty_list = []
    async for doc in cursor:
        faculty_list.append(serialize_doc(doc))
    return faculty_list

@router.post("")
async def create_faculty(faculty: Faculty):
    collection = await get_faculty_collection()
    
    # Check if employee_id already exists
    existing = await collection.find_one({"employeeId": faculty.employee_id})
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
        
    faculty_dict = faculty.dict(by_alias=True)
    result = await collection.insert_one(faculty_dict)
    
    created_doc = await collection.find_one({"_id": result.inserted_id})
    return serialize_doc(created_doc)

@router.get("/{faculty_id}")
async def get_faculty(faculty_id: str = Path(...)):
    collection = await get_faculty_collection()
    try:
        obj_id = ObjectId(faculty_id)
        doc = await collection.find_one({"_id": obj_id})
    except:
        doc = await collection.find_one({"employeeId": faculty_id})
        
    if not doc:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    # Fetch related data
    doc_serialized = serialize_doc(doc)
    emp_id = doc_serialized.get("employeeId")
    
    # Courses
    courses_col = await get_faculty_activity_collection("faculty_courses")
    courses = []
    if emp_id:
        async for c in courses_col.find({"facultyId": emp_id}):
            courses.append(serialize_doc(c))
    doc_serialized["teaching_load"] = courses
    
    # Performance
    perf_col = await get_faculty_activity_collection("faculty_performance")
    performance = []
    if emp_id:
        async for p in perf_col.find({"facultyId": emp_id}):
            performance.append(serialize_doc(p))
    doc_serialized["performance_metrics"] = performance
    
    # Development
    dev_col = await get_faculty_activity_collection("faculty_development")
    devs = []
    if emp_id:
        async for d in dev_col.find({"facultyId": emp_id}):
            devs.append(serialize_doc(d))
    doc_serialized["professional_development"] = devs
    
    return doc_serialized

@router.put("/{faculty_id}")
async def update_faculty(faculty_id: str, updates: Dict[str, Any] = Body(...)):
    collection = await get_faculty_collection()
    try:
        query = {"_id": ObjectId(faculty_id)}
    except:
        query = {"employeeId": faculty_id}
        
    # Prevent updating _id or core immutable fields if needed
    if "_id" in updates:
        del updates["_id"]
        
    result = await collection.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Faculty not found")
        
    updated_doc = await collection.find_one(query)
    return serialize_doc(updated_doc)

@router.delete("/{faculty_id}")
async def delete_faculty(faculty_id: str):
    collection = await get_faculty_collection()
    try:
        query = {"_id": ObjectId(faculty_id)}
    except:
        query = {"employeeId": faculty_id}
        
    result = await collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Faculty not found")
        
    return {"status": "success", "message": "Faculty deleted"}


# -----------------
# Faculty Course Mapping
# -----------------

@router.post("/{faculty_id}/courses")
async def assign_course(faculty_id: str, assignment: CourseAssignment):
    collection = await get_faculty_activity_collection("faculty_courses")
    
    # Validate faculty exists
    fac_col = await get_faculty_collection()
    try:
        query = {"_id": ObjectId(faculty_id)}
    except:
        query = {"employeeId": faculty_id}
    if not await fac_col.find_one(query):
        raise HTTPException(status_code=404, detail="Faculty not found")
        
    # Ensure facultyId matches
    assignment_dict = assignment.dict(by_alias=True)
    if assignment_dict["facultyId"] != faculty_id:
        if assignment_dict["facultyId"] == "string": # Default swagger value
            assignment_dict["facultyId"] = faculty_id
        else:
            raise HTTPException(status_code=400, detail="Faculty ID mismatch")
            
    result = await collection.insert_one(assignment_dict)
    doc = await collection.find_one({"_id": result.inserted_id})
    return serialize_doc(doc)


# -----------------
# Faculty Performance
# -----------------

@router.post("/{faculty_id}/performance")
async def add_performance_metric(faculty_id: str, metric: PerformanceMetric):
    collection = await get_faculty_activity_collection("faculty_performance")
    
    metric_dict = metric.dict(by_alias=True)
    if metric_dict["facultyId"] != faculty_id:
        if metric_dict["facultyId"] == "string":
            metric_dict["facultyId"] = faculty_id
        else:
            raise HTTPException(status_code=400, detail="Faculty ID mismatch")
            
    result = await collection.insert_one(metric_dict)
    doc = await collection.find_one({"_id": result.inserted_id})
    return serialize_doc(doc)


# -----------------
# Professional Development
# -----------------

@router.post("/{faculty_id}/development")
async def add_development_record(faculty_id: str, dev: ProfessionalDevelopment):
    collection = await get_faculty_activity_collection("faculty_development")
    
    dev_dict = dev.dict(by_alias=True)
    if dev_dict["facultyId"] != faculty_id:
         if dev_dict["facultyId"] == "string":
             dev_dict["facultyId"] = faculty_id
         else:
             raise HTTPException(status_code=400, detail="Faculty ID mismatch")
             
    result = await collection.insert_one(dev_dict)
    doc = await collection.find_one({"_id": result.inserted_id})
    return serialize_doc(doc)
