from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from bson import ObjectId
from backend.db import db
from backend.models.payroll_and_development import (
    Payroll, ProfessionalDevelopmentActivity, ResearchContribution, 
    DepartmentInitiative, CareerPathway, FacultyPerformanceMetrics
)

router = APIRouter(prefix="/api/faculty", tags=["faculty-payroll-development"])


# ============== PAYROLL ROUTES ==============

@router.get("/{faculty_id}/payroll")
async def get_payroll(faculty_id: str, semester: str, academic_year: str):
    """Get payroll information for a faculty member"""
    try:
        payroll_collection = db.get_collection("faculty_payroll")
        payroll = await payroll_collection.find_one({
            "faculty_id": faculty_id,
            "semester": semester,
            "academic_year": academic_year
        })
        
        if not payroll:
            # Create default payroll if not exists
            default_payroll = {
                "faculty_id": faculty_id,
                "semester": semester,
                "academic_year": academic_year,
                "base_salary": 0,
                "teaching_allowance": 0,
                "research_allowance": 0,
                "performance_bonus": 0,
                "other_allowances": 0,
                "total_earnings": 0,
                "income_tax": 0,
                "provident_fund": 0,
                "professional_tax": 0,
                "other_deductions": 0,
                "total_deductions": 0,
                "net_salary": 0,
                "created_date": datetime.now(),
                "updated_date": datetime.now()
            }
            result = await payroll_collection.insert_one(default_payroll)
            return {**default_payroll, "_id": str(result.inserted_id)}
        
        return {**payroll, "_id": str(payroll.get("_id", ""))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{faculty_id}/payroll")
async def create_or_update_payroll(faculty_id: str, payroll_data: Payroll):
    """Create or update payroll information"""
    try:
        payroll_collection = db.get_collection("faculty_payroll")
        
        payroll_dict = payroll_data.dict(by_alias=True)
        payroll_dict["faculty_id"] = faculty_id
        payroll_dict["updated_date"] = datetime.now()
        
        result = await payroll_collection.update_one(
            {
                "faculty_id": faculty_id,
                "semester": payroll_data.semester,
                "academic_year": payroll_data.academic_year
            },
            {"$set": payroll_dict},
            upsert=True
        )
        
        return {"message": "Payroll saved successfully", "modified_count": result.modified_count}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{faculty_id}/payroll/history")
async def get_payroll_history(faculty_id: str, limit: int = Query(default=10, le=50)):
    """Get payroll history for a faculty member"""
    try:
        payroll_collection = db.get_collection("faculty_payroll")
        payroll_records = await payroll_collection.find(
            {"faculty_id": faculty_id}
        ).sort("academic_year", -1).limit(limit).to_list(limit)
        
        return [
            {**record, "_id": str(record.get("_id", ""))}
            for record in payroll_records
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== PROFESSIONAL DEVELOPMENT ROUTES ==============

@router.post("/{faculty_id}/professional-development")
async def add_professional_development(faculty_id: str, activity: ProfessionalDevelopmentActivity):
    """Record professional development activity"""
    try:
        pd_collection = db.get_collection("professional_development")
        
        activity_dict = activity.dict(by_alias=True)
        activity_dict["faculty_id"] = faculty_id
        
        result = await pd_collection.insert_one(activity_dict)
        
        return {"message": "Activity recorded successfully", "activity_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{faculty_id}/professional-development")
async def get_professional_development(
    faculty_id: str,
    activity_type: str = Query(default=None),
    limit: int = Query(default=20, le=100)
):
    """Get professional development activities"""
    try:
        pd_collection = db.get_collection("professional_development")
        
        query = {"faculty_id": faculty_id}
        if activity_type:
            query["activity_type"] = activity_type
        
        activities = await pd_collection.find(query).sort("start_date", -1).limit(limit).to_list(limit)
        
        return [
            {**activity, "_id": str(activity.get("_id", ""))}
            for activity in activities
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{faculty_id}/professional-development/summary")
async def get_pd_summary(faculty_id: str, academic_year: str):
    """Get professional development summary"""
    try:
        pd_collection = db.get_collection("professional_development")
        
        activities = await pd_collection.find({"faculty_id": faculty_id}).to_list(None)
        
        summary = {
            "total_activities": len(activities),
            "conferences_attended": len([a for a in activities if a.get("activity_type") == "Conference"]),
            "workshops_attended": len([a for a in activities if a.get("activity_type") == "Workshop"]),
            "certifications_earned": len([a for a in activities if a.get("activity_type") == "Certification"]),
            "total_hours": sum(a.get("hours", 0) for a in activities),
            "total_budget_spent": sum(a.get("budget_spent", 0) for a in activities)
        }
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== RESEARCH CONTRIBUTIONS ROUTES ==============

@router.post("/{faculty_id}/research")
async def add_research_contribution(faculty_id: str, research: ResearchContribution):
    """Record research contribution"""
    try:
        research_collection = db.get_collection("research_contributions")
        
        research_dict = research.dict(by_alias=True)
        research_dict["faculty_id"] = faculty_id
        
        result = await research_collection.insert_one(research_dict)
        
        return {"message": "Research recorded successfully", "research_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{faculty_id}/research")
async def get_research_contributions(faculty_id: str, limit: int = Query(default=20, le=100)):
    """Get all research contributions"""
    try:
        research_collection = db.get_collection("research_contributions")
        
        research_records = await research_collection.find(
            {"faculty_id": faculty_id}
        ).sort("start_date", -1).limit(limit).to_list(limit)
        
        return [
            {**record, "_id": str(record.get("_id", ""))}
            for record in research_records
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{faculty_id}/research/summary")
async def get_research_summary(faculty_id: str):
    """Get research summary statistics"""
    try:
        research_collection = db.get_collection("research_contributions")
        
        research_records = await research_collection.find({"faculty_id": faculty_id}).to_list(None)
        
        summary = {
            "total_projects": len(research_records),
            "ongoing_projects": len([r for r in research_records if r.get("status") == "Ongoing"]),
            "completed_projects": len([r for r in research_records if r.get("status") == "Completed"]),
            "total_publications": sum(r.get("publications", 0) for r in research_records),
            "total_funding": sum(r.get("grant_amount", 0) for r in research_records),
            "collaborators_count": len(set(
                c for r in research_records 
                for c in r.get("collaborators", [])
            ))
        }
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== CAREER PATHWAY ROUTES ==============

@router.post("/{faculty_id}/career-pathway")
async def create_career_pathway(faculty_id: str, pathway: CareerPathway):
    """Create career development pathway"""
    try:
        pathway_collection = db.get_collection("career_pathways")
        
        pathway_dict = pathway.dict(by_alias=True)
        pathway_dict["faculty_id"] = faculty_id
        
        result = await pathway_collection.insert_one(pathway_dict)
        
        return {"message": "Career pathway created", "pathway_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{faculty_id}/career-pathway")
async def get_career_pathway(faculty_id: str):
    """Get career pathway"""
    try:
        pathway_collection = db.get_collection("career_pathways")
        
        pathway = await pathway_collection.find_one({"faculty_id": faculty_id, "status": "Active"})
        
        if not pathway:
            raise HTTPException(status_code=404, detail="No active career pathway found")
        
        return {**pathway, "_id": str(pathway.get("_id", ""))}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{faculty_id}/career-pathway/{pathway_id}")
async def update_career_pathway(faculty_id: str, pathway_id: str, pathway: CareerPathway):
    """Update career pathway"""
    try:
        pathway_collection = db.get_collection("career_pathways")
        
        pathway_dict = pathway.dict(by_alias=True)
        pathway_dict["updated_date"] = datetime.now()
        
        result = await pathway_collection.update_one(
            {"_id": ObjectId(pathway_id), "faculty_id": faculty_id},
            {"$set": pathway_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Career pathway not found")
        
        return {"message": "Career pathway updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== PERFORMANCE METRICS ROUTES ==============

@router.post("/{faculty_id}/performance-metrics")
async def record_performance_metrics(faculty_id: str, metrics: FacultyPerformanceMetrics):
    """Record faculty performance metrics"""
    try:
        metrics_collection = db.get_collection("faculty_performance_metrics")
        
        metrics_dict = metrics.dict(by_alias=True)
        metrics_dict["faculty_id"] = faculty_id
        
        result = await metrics_collection.update_one(
            {"faculty_id": faculty_id, "academic_year": metrics.academic_year},
            {"$set": metrics_dict},
            upsert=True
        )
        
        return {"message": "Performance metrics recorded successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{faculty_id}/performance-metrics")
async def get_performance_metrics(faculty_id: str, academic_year: str):
    """Get performance metrics"""
    try:
        metrics_collection = db.get_collection("faculty_performance_metrics")
        
        metrics = await metrics_collection.find_one({
            "faculty_id": faculty_id,
            "academic_year": academic_year
        })
        
        if not metrics:
            raise HTTPException(status_code=404, detail="Performance metrics not found")
        
        return {**metrics, "_id": str(metrics.get("_id", ""))}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{faculty_id}/performance-metrics/history")
async def get_performance_metrics_history(faculty_id: str, limit: int = Query(default=5, le=10)):
    """Get performance metrics history"""
    try:
        metrics_collection = db.get_collection("faculty_performance_metrics")
        
        metrics_list = await metrics_collection.find(
            {"faculty_id": faculty_id}
        ).sort("academic_year", -1).limit(limit).to_list(limit)
        
        return [
            {**metrics, "_id": str(metrics.get("_id", ""))}
            for metrics in metrics_list
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== DEPARTMENT INITIATIVES ROUTES ==============

@router.post("/department/{department_id}/initiatives")
async def create_initiative(department_id: str, initiative: DepartmentInitiative):
    """Create department initiative"""
    try:
        initiative_collection = db.get_collection("department_initiatives")
        
        initiative_dict = initiative.dict(by_alias=True)
        initiative_dict["department_id"] = department_id
        
        result = await initiative_collection.insert_one(initiative_dict)
        
        return {"message": "Initiative created", "initiative_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/department/{department_id}/initiatives")
async def get_department_initiatives(department_id: str, limit: int = Query(default=20, le=100)):
    """Get department initiatives"""
    try:
        initiative_collection = db.get_collection("department_initiatives")
        
        initiatives = await initiative_collection.find(
            {"department_id": department_id}
        ).sort("start_date", -1).limit(limit).to_list(limit)
        
        return [
            {**initiative, "_id": str(initiative.get("_id", ""))}
            for initiative in initiatives
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/department/{department_id}/initiatives/{initiative_id}")
async def update_initiative(department_id: str, initiative_id: str, initiative: DepartmentInitiative):
    """Update department initiative"""
    try:
        initiative_collection = db.get_collection("department_initiatives")
        
        initiative_dict = initiative.dict(by_alias=True)
        
        result = await initiative_collection.update_one(
            {"_id": ObjectId(initiative_id), "department_id": department_id},
            {"$set": initiative_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Initiative not found")
        
        return {"message": "Initiative updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
