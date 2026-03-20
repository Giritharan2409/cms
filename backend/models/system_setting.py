from typing import Any

from pydantic import BaseModel, Field


class SystemSetting(BaseModel):
    key: str
    value: Any
    description: str = ""
    updated_at: str | None = Field(default=None, alias="updatedAt")
