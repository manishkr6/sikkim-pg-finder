from pydantic import BaseModel, Field


class AdminPGQuery(BaseModel):
    status: str | None = None
    search: str | None = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class AdminUserQuery(BaseModel):
    role: str | None = None
    search: str | None = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class RejectPGRequest(BaseModel):
    reason: str = Field(min_length=5)


class ReportStatusUpdate(BaseModel):
    status: str