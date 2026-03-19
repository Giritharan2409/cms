from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class NotificationCreate(BaseModel):
    title: str
    message: str
    senderRole: str
    receiverRole: str
    module: str
    priority: str
    actionId: Optional[str] = None
    relatedData: dict[str, Any] = Field(default_factory=dict)
    department: Optional[str] = None


class StudentRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    rollNumber: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    departmentId: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    cgpa: Optional[float] = None
    attendancePct: Optional[float] = None
    feeStatus: Optional[str] = None
    status: Optional[str] = "Active"
    avatar: Optional[str] = None
    enrollDate: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    guardian: Optional[str] = None
    guardianPhone: Optional[str] = None
    guardianEmail: Optional[str] = None
    guardianOccupation: Optional[str] = None
    admissionType: Optional[str] = None
    previousInstitution: Optional[str] = None
    bloodGroup: Optional[str] = None
    relationship: Optional[str] = None
    subjects: list[dict[str, Any]] = Field(default_factory=list)
    fees: list[dict[str, Any]] = Field(default_factory=list)
    documents: list[dict[str, Any]] = Field(default_factory=list)
    attendanceMonthly: list[dict[str, Any]] = Field(default_factory=list)
