from typing import Any

from pydantic import BaseModel


class ChangePasswordPayload(BaseModel):
    userId: str
    oldPassword: str
    newPassword: str


class UpdateEmailPayload(BaseModel):
    userId: str
    email: str
    role: str | None = None


class LogoutAllPayload(BaseModel):
    userId: str
    role: str | None = None


class DeleteRequestPayload(BaseModel):
    reason: str | None = None


class PartialSettingsPayload(BaseModel):
    model_config = {"extra": "allow"}

    def as_dict(self) -> dict[str, Any]:
        return self.model_dump(exclude_unset=True)
