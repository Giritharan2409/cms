from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from datetime import datetime
from bson import ObjectId
from backend.db import get_db
import json
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from backend.models.payroll_and_development import (
    Payroll, ProfessionalDevelopmentActivity, ResearchContribution, 
    DepartmentInitiative, CareerPathway, FacultyPerformanceMetrics
)

router = APIRouter(prefix="/api/faculty", tags=["faculty-payroll-development"])

LOCAL_FACULTY_DATA_PATH = Path(__file__).resolve().parent.parent / "faculty.json"
LOCAL_CAREER_PATHWAYS_PATH = Path(__file__).resolve().parent.parent / "career_pathways.json"


def _get_collection(name: str):
    return get_db().get_collection(name)


def _load_local_faculty_data() -> list[dict]:
    if not LOCAL_FACULTY_DATA_PATH.exists():
        return []
    try:
        with LOCAL_FACULTY_DATA_PATH.open("r", encoding="utf-8") as local_file:
            data = json.load(local_file)
            if isinstance(data, list):
                return data
    except Exception:
        return []
    return []


def _find_local_faculty(faculty_id: str) -> Optional[dict]:
    normalized_id = str(faculty_id).strip()
    if not normalized_id:
        return None

    for faculty in _load_local_faculty_data():
        candidate_ids = {
            str(faculty.get("employeeId", "")).strip(),
            str(faculty.get("id", "")).strip(),
            str(faculty.get("_id", "")).strip(),
        }
        if normalized_id in candidate_ids:
            return faculty
    return None


def _estimate_base_salary_by_designation(designation: str) -> float:
    lowered = str(designation or "").lower()
    if "professor" in lowered and "associate" not in lowered and "assistant" not in lowered:
        return 120000.0
    if "associate" in lowered:
        return 95000.0
    if "assistant" in lowered:
        return 72000.0
    if "lecturer" in lowered:
        return 55000.0
    return 65000.0


def _build_fallback_payroll(faculty_id: str, semester: str, academic_year: str) -> dict:
    faculty = _find_local_faculty(faculty_id) or {}
    base_salary = float(faculty.get("basicSalary") or _estimate_base_salary_by_designation(faculty.get("designation", "")))
    teaching_allowance = round(base_salary * 0.12, 2)
    research_allowance = round(base_salary * 0.08, 2)
    performance_bonus = round(base_salary * 0.05, 2)
    other_allowances = round(base_salary * 0.10, 2)
    total_earnings = round(base_salary + teaching_allowance + research_allowance + performance_bonus + other_allowances, 2)

    income_tax = round(total_earnings * 0.08, 2)
    provident_fund = round(base_salary * 0.12, 2)
    professional_tax = 200.0
    other_deductions = 0.0
    total_deductions = round(income_tax + provident_fund + professional_tax + other_deductions, 2)
    net_salary = round(total_earnings - total_deductions, 2)

    now = datetime.now()
    return {
        "faculty_id": faculty_id,
        "semester": semester,
        "academic_year": academic_year,
        "base_salary": base_salary,
        "teaching_allowance": teaching_allowance,
        "research_allowance": research_allowance,
        "performance_bonus": performance_bonus,
        "other_allowances": other_allowances,
        "allowances": round(teaching_allowance + research_allowance + performance_bonus + other_allowances, 2),
        "total_earnings": total_earnings,
        "income_tax": income_tax,
        "provident_fund": provident_fund,
        "professional_tax": professional_tax,
        "other_deductions": other_deductions,
        "total_deductions": total_deductions,
        "net_salary": net_salary,
        "payment_date": now,
        "created_date": now,
        "updated_date": now,
        "pay_period": f"{semester} {academic_year}",
        "source": "local-fallback",
    }


def _load_local_career_pathways() -> List[Dict[str, Any]]:
    if not LOCAL_CAREER_PATHWAYS_PATH.exists():
        return []
    try:
        with LOCAL_CAREER_PATHWAYS_PATH.open("r", encoding="utf-8") as local_file:
            data = json.load(local_file)
            if isinstance(data, list):
                return data
    except Exception:
        return []
    return []


def _save_local_career_pathways(pathways: List[Dict[str, Any]]) -> None:
    def _json_default(value: Any):
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)

    tmp_path = LOCAL_CAREER_PATHWAYS_PATH.with_suffix(".json.tmp")
    with tmp_path.open("w", encoding="utf-8") as local_file:
        json.dump(
            pathways,
            local_file,
            ensure_ascii=True,
            separators=(",", ":"),
            default=_json_default,
        )
    tmp_path.replace(LOCAL_CAREER_PATHWAYS_PATH)


def _find_local_career_pathway(faculty_id: str) -> Optional[Dict[str, Any]]:
    for pathway in _load_local_career_pathways():
        if str(pathway.get("faculty_id", "")).strip() == str(faculty_id).strip() and str(pathway.get("status", "Active")) == "Active":
            return pathway
    return None


def _normalize_career_pathway_record(pathway: Dict[str, Any], faculty_id: Optional[str] = None) -> Dict[str, Any]:
    normalized_faculty_id = pathway.get("faculty_id") or pathway.get("facultyId") or faculty_id
    return {
        "_id": str(pathway.get("_id") or pathway.get("pathway_id") or pathway.get("pathwayId") or f"local-{normalized_faculty_id}"),
        "pathway_id": str(pathway.get("pathway_id") or pathway.get("pathwayId") or pathway.get("_id") or f"local-{normalized_faculty_id}"),
        "faculty_id": normalized_faculty_id,
        "current_designation": pathway.get("current_designation") or pathway.get("currentDesignation") or "",
        "target_designation": pathway.get("target_designation") or pathway.get("targetDesignation") or "",
        "target_years": pathway.get("target_years") or pathway.get("targetYears") or 0,
        "required_qualifications": pathway.get("required_qualifications") or pathway.get("requiredQualifications") or [],
        "completed_milestones": pathway.get("completed_milestones") or pathway.get("completedMilestones") or [],
        "pending_milestones": pathway.get("pending_milestones") or pathway.get("pendingMilestones") or [],
        "mentors": pathway.get("mentors") or [],
        "status": pathway.get("status") or "Active",
        "created_date": pathway.get("created_date") or pathway.get("createdDate"),
        "updated_date": pathway.get("updated_date") or pathway.get("updatedDate"),
    }


def _create_local_career_pathway(faculty_id: str, pathway_dict: Dict[str, Any]) -> Dict[str, Any]:
    pathways = _load_local_career_pathways()
    now = datetime.now().isoformat()
    record = _normalize_career_pathway_record({
        **pathway_dict,
        "_id": f"local-{faculty_id}",
        "faculty_id": faculty_id,
        "status": pathway_dict.get("status", "Active"),
        "created_date": pathway_dict.get("created_date", now),
        "updated_date": pathway_dict.get("updated_date", now),
    }, faculty_id=faculty_id)

    # Upsert semantics for single active pathway per faculty.
    replaced = False
    for idx, pathway in enumerate(pathways):
        if str(pathway.get("faculty_id", "")).strip() == str(faculty_id).strip():
            pathways[idx] = record
            replaced = True
            break
    if not replaced:
        pathways.append(record)

    _save_local_career_pathways(pathways)
    return record


def _update_local_career_pathway(faculty_id: str, pathway_id: str, pathway_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    pathways = _load_local_career_pathways()
    target_faculty = str(faculty_id).strip()
    target_id = str(pathway_id).strip()

    for idx, pathway in enumerate(pathways):
        same_faculty = str(pathway.get("faculty_id", "")).strip() == target_faculty
        same_id = str(pathway.get("_id", "")).strip() == target_id or str(pathway.get("pathway_id", "")).strip() == target_id
        if not same_faculty:
            continue
        if target_id and target_id != "" and not same_id:
            continue

        updated = _normalize_career_pathway_record({
            **pathway,
            **pathway_dict,
            "faculty_id": faculty_id,
            "_id": pathway.get("_id") or f"local-{faculty_id}",
            "updated_date": datetime.now().isoformat(),
        }, faculty_id=faculty_id)
        pathways[idx] = updated
        _save_local_career_pathways(pathways)
        return updated

    return None


def _map_payroll_record(record: dict, faculty_id: str, semester: str, academic_year: str) -> dict:
    tax = float(record.get("tax") or 0)
    pf = float(record.get("pf") or 0)
    professional_tax = float(record.get("professionalTax") or 0)
    esi = float(record.get("esi") or 0)
    tds = float(record.get("tds") or 0)
    total_deductions = float(record.get("deductions") or 0)

    return {
        "faculty_id": faculty_id,
        "semester": semester,
        "academic_year": academic_year,
        "base_salary": float(record.get("basicSalary") or 0),
        "teaching_allowance": float(record.get("allowance") or 0),
        "research_allowance": 0,
        "performance_bonus": float(record.get("bonus") or 0),
        "other_allowances": float(record.get("hra") or 0),
        "allowances": float(record.get("hra") or 0) + float(record.get("allowance") or 0),
        "total_earnings": float(record.get("grossPay") or 0),
        "income_tax": tax,
        "provident_fund": pf,
        "professional_tax": professional_tax,
        "other_deductions": max(total_deductions - (tax + pf + professional_tax + esi + tds), 0),
        "total_deductions": total_deductions,
        "net_salary": float(record.get("netPay") or 0),
        "payment_date": record.get("paidDate") or None,
        "source": "payroll",
        "pay_period": record.get("payPeriodDetailed") or record.get("payMonth"),
        "_id": str(record.get("_id", "")),
    }


# ============== PAYROLL ROUTES ==============

@router.get("/{faculty_id}/payroll")
async def get_payroll(faculty_id: str, semester: str, academic_year: str):
    """Get payroll information for a faculty member"""
    try:
        payroll_records = _get_collection("payroll")
        existing_payroll = await payroll_records.find_one(
            {"staffId": faculty_id},
            sort=[("_id", -1)]
        )

        if existing_payroll:
            return _map_payroll_record(existing_payroll, faculty_id, semester, academic_year)

        payroll_collection = _get_collection("faculty_payroll")
        payroll = await payroll_collection.find_one({
            "faculty_id": faculty_id,
            "semester": semester,
            "academic_year": academic_year
        })

        if payroll:
            return {**payroll, "_id": str(payroll.get("_id", ""))}

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
    except HTTPException as e:
        if e.status_code == 503:
            return _build_fallback_payroll(faculty_id, semester, academic_year)
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{faculty_id}/payroll")
async def create_or_update_payroll(faculty_id: str, payroll_data: Payroll):
    """Create or update payroll information"""
    try:
        payroll_collection = _get_collection("faculty_payroll")
        
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
        payroll_collection = _get_collection("faculty_payroll")
        payroll_records = await payroll_collection.find(
            {"faculty_id": faculty_id}
        ).sort("academic_year", -1).limit(limit).to_list(limit)
        
        return [
            {**record, "_id": str(record.get("_id", ""))}
            for record in payroll_records
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{faculty_id}/payroll/payslip")
async def download_payslip(faculty_id: str, semester: str = None, academic_year: str = None):
    """Download payslip as PDF"""
    try:
        payroll_collection = _get_collection("faculty_payroll")
        
        # Fetch payroll data
        query = {"faculty_id": faculty_id}
        if semester:
            query["semester"] = semester
        if academic_year:
            query["academic_year"] = academic_year
            
        payroll = await payroll_collection.find_one(query, sort=[("_id", -1)])
        
        if not payroll:
            # Try to get from payroll collection
            payroll_records = _get_collection("payroll")
            existing_payroll = await payroll_records.find_one(
                {"staffId": faculty_id},
                sort=[("_id", -1)]
            )
            if existing_payroll:
                payroll = _map_payroll_record(existing_payroll, faculty_id, semester or "Current", academic_year or datetime.now().year)
            else:
                raise HTTPException(status_code=404, detail="Payroll data not found")
        
        # Create PDF
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, rightMargin=0.5*inch, leftMargin=0.5*inch,
                                topMargin=0.75*inch, bottomMargin=0.75*inch)
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1162d4'),
            spaceAfter=12,
            alignment=1  # Center
        )
        elements.append(Paragraph("PAYSLIP", title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Faculty Info
        info_data = [
            ["Faculty ID:", payroll.get("faculty_id", "N/A")],
            ["Semester:", payroll.get("semester", semester or "Current")],
            ["Academic Year:", payroll.get("academic_year", academic_year or "N/A")],
            ["Pay Period:", payroll.get("pay_period", "N/A")]
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1162d4')),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f0f4f8')])
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Earnings
        elements.append(Paragraph("EARNINGS", styles['Heading3']))
        earnings_data = [
            ["Description", "Amount (₹)"],
            ["Base Salary", f"₹{payroll.get('base_salary', 0):,.2f}"],
            ["Teaching Allowance", f"₹{payroll.get('teaching_allowance', 0):,.2f}"],
            ["Research Allowance", f"₹{payroll.get('research_allowance', 0):,.2f}"],
            ["Performance Bonus", f"₹{payroll.get('performance_bonus', 0):,.2f}"],
            ["Other Allowances", f"₹{payroll.get('other_allowances', 0):,.2f}"],
            ["TOTAL EARNINGS", f"₹{payroll.get('total_earnings', 0):,.2f}"]
        ]
        
        earnings_table = Table(earnings_data, colWidths=[4*inch, 2*inch])
        earnings_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1162d4')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8f0ff')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        elements.append(earnings_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Deductions
        elements.append(Paragraph("DEDUCTIONS", styles['Heading3']))
        deductions_data = [
            ["Description", "Amount (₹)"],
            ["Income Tax", f"₹{payroll.get('income_tax', 0):,.2f}"],
            ["Provident Fund", f"₹{payroll.get('provident_fund', 0):,.2f}"],
            ["Professional Tax", f"₹{payroll.get('professional_tax', 0):,.2f}"],
            ["Other Deductions", f"₹{payroll.get('other_deductions', 0):,.2f}"],
            ["TOTAL DEDUCTIONS", f"₹{payroll.get('total_deductions', 0):,.2f}"]
        ]
        
        deductions_table = Table(deductions_data, colWidths=[4*inch, 2*inch])
        deductions_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ff6b6b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#ffe8e8')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        elements.append(deductions_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Net Salary
        net_data = [
            ["NET SALARY (Take Home)", f"₹{payroll.get('net_salary', 0):,.2f}"]
        ]
        net_table = Table(net_data, colWidths=[4*inch, 2*inch])
        net_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('PADDING', (0, 0), (-1, 0), 15)
        ]))
        elements.append(net_table)
        
        if payroll.get("payment_date"):
            elements.append(Spacer(1, 0.2*inch))
            payment_text = f"Payment Date: {payroll.get('payment_date')}"
            elements.append(Paragraph(payment_text, styles['Normal']))
        
        # Build PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=payslip_{faculty_id}_{academic_year or 'current'}.pdf"}
        )
    except HTTPException as e:
        if e.status_code == 503:
            payroll = _build_fallback_payroll(
                faculty_id,
                semester or "Semester 1",
                str(academic_year or datetime.now().year),
            )

            pdf_buffer = BytesIO()
            doc = SimpleDocTemplate(
                pdf_buffer,
                pagesize=letter,
                rightMargin=0.5 * inch,
                leftMargin=0.5 * inch,
                topMargin=0.75 * inch,
                bottomMargin=0.75 * inch,
            )
            elements = []
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                "CustomTitle",
                parent=styles["Heading1"],
                fontSize=16,
                textColor=colors.HexColor("#1162d4"),
                spaceAfter=12,
                alignment=1,
            )
            elements.append(Paragraph("PAYSLIP", title_style))
            elements.append(Spacer(1, 0.2 * inch))

            info_data = [
                ["Faculty ID:", payroll.get("faculty_id", "N/A")],
                ["Semester:", payroll.get("semester", semester or "Current")],
                ["Academic Year:", payroll.get("academic_year", academic_year or "N/A")],
                ["Pay Period:", payroll.get("pay_period", "N/A")],
            ]
            info_table = Table(info_data, colWidths=[2 * inch, 4 * inch])
            info_table.setStyle(
                TableStyle(
                    [
                        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                        ("FONTSIZE", (0, 0), (-1, -1), 10),
                        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1162d4")),
                    ]
                )
            )
            elements.append(info_table)
            elements.append(Spacer(1, 0.2 * inch))
            elements.append(Paragraph(f"Net Salary: INR {payroll.get('net_salary', 0):,.2f}", styles["Heading3"]))
            doc.build(elements)
            pdf_buffer.seek(0)

            filename = f"payslip_{faculty_id}_{semester or 'Current'}_{academic_year or datetime.now().year}.pdf"
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== PROFESSIONAL DEVELOPMENT ROUTES ==============

@router.post("/{faculty_id}/professional-development")
async def add_professional_development(faculty_id: str, activity: ProfessionalDevelopmentActivity):
    """Record professional development activity"""
    try:
        pd_collection = _get_collection("professional_development")
        
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
        pd_collection = _get_collection("professional_development")
        
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
        pd_collection = _get_collection("professional_development")
        
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
        research_collection = _get_collection("research_contributions")
        
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
        research_collection = _get_collection("research_contributions")
        
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
        research_collection = _get_collection("research_contributions")
        
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
        pathway_collection = _get_collection("career_pathways")
        
        pathway_dict = pathway.dict(by_alias=False)
        pathway_dict["faculty_id"] = faculty_id
        
        result = await pathway_collection.insert_one(pathway_dict)
        
        return {"message": "Career pathway created", "pathway_id": str(result.inserted_id)}
    except HTTPException as e:
        if e.status_code == 503:
            pathway_dict = pathway.dict(by_alias=False)
            pathway_dict["faculty_id"] = faculty_id
            created = _create_local_career_pathway(faculty_id, pathway_dict)
            return {"message": "Career pathway created", "pathway_id": str(created.get("_id", ""))}
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{faculty_id}/career-pathway")
async def get_career_pathway(faculty_id: str):
    """Get career pathway"""
    try:
        pathway_collection = _get_collection("career_pathways")
        
        pathway = await pathway_collection.find_one({"faculty_id": faculty_id, "status": "Active"})
        
        if not pathway:
            raise HTTPException(status_code=404, detail="No active career pathway found")
        
        return _normalize_career_pathway_record(pathway, faculty_id=faculty_id)
    except HTTPException as e:
        pathway = _find_local_career_pathway(faculty_id)
        if pathway:
            return _normalize_career_pathway_record(pathway, faculty_id=faculty_id)
        if e.status_code == 503:
            raise HTTPException(status_code=404, detail="No active career pathway found")
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{faculty_id}/career-pathway/{pathway_id}")
async def update_career_pathway(faculty_id: str, pathway_id: str, pathway: CareerPathway):
    """Update career pathway"""
    try:
        pathway_collection = _get_collection("career_pathways")
        
        pathway_dict = pathway.dict(by_alias=False)
        pathway_dict["updated_date"] = datetime.now()
        
        result = await pathway_collection.update_one(
            {"_id": ObjectId(pathway_id), "faculty_id": faculty_id},
            {"$set": pathway_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Career pathway not found")
        
        return {"message": "Career pathway updated successfully"}
    except HTTPException as e:
        if e.status_code == 503:
            pathway_dict = pathway.dict(by_alias=False)
            updated = _update_local_career_pathway(faculty_id, pathway_id, pathway_dict)
            if not updated:
                raise HTTPException(status_code=404, detail="Career pathway not found")
            return {"message": "Career pathway updated successfully"}
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== PERFORMANCE METRICS ROUTES ==============

@router.post("/{faculty_id}/performance-metrics")
async def record_performance_metrics(faculty_id: str, metrics: FacultyPerformanceMetrics):
    """Record faculty performance metrics"""
    try:
        metrics_collection = _get_collection("faculty_performance_metrics")
        
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
        metrics_collection = _get_collection("faculty_performance_metrics")
        
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
        metrics_collection = _get_collection("faculty_performance_metrics")
        
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
        initiative_collection = _get_collection("department_initiatives")
        
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
        initiative_collection = _get_collection("department_initiatives")
        
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
        initiative_collection = _get_collection("department_initiatives")
        
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
