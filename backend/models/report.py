from datetime import datetime

from pydantic import BaseModel, Field


class Report(BaseModel):
    report_type: str = Field(alias="reportType")
    generated_by: str = Field(alias="generatedBy")
    generated_at: datetime | None = Field(default=None, alias="generatedAt")
    file_url: str = Field(default="", alias="fileUrl")
