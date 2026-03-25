from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


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
    model_config = {"extra": "allow"}

    id: str
    name: str
    email: str
    rollNumber: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    cgpa: Optional[float] = None
    attendancePct: Optional[float] = None
    feeStatus: Optional[str] = None
    status: Optional[str] = "Active"
    avatar: Optional[str] = None
    enrollDate: Optional[Any] = None
    dob: Optional[Any] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    guardian: Optional[str] = None
    motherName: Optional[str] = None
    guardianName: Optional[str] = None  # Alias from frontend
    guardianPhone: Optional[str] = None
    bloodGroup: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    subjects: list[dict[str, Any]] = Field(default_factory=list)
    fees: list[dict[str, Any]] = Field(default_factory=list)
    documents: list[dict[str, Any]] = Field(default_factory=list)
    attendanceMonthly: list[dict[str, Any]] = Field(default_factory=list)
    is_admission: bool = False


class StudentResponse(BaseModel):
    id: str
    rollNumber: str
    name: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    section: Optional[str] = None
    year: Optional[str] = None
    semester: Optional[int] = None
    status: Optional[str] = "Active"
    cgpa: Optional[float] = None
    attendancePct: Optional[float] = None
    avatar: Optional[str] = None
    is_admission: bool = False
    enrollDate: Optional[Any] = None # Support both str and datetime
