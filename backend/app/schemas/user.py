from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    name: str = Field(min_length=2, max_length=50)


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(min_length=1)
    newPassword: str = Field(min_length=6)


class OwnerRequestPayload(BaseModel):
    fullName: str = Field(min_length=2)
    phoneNumber: str = Field(min_length=8)
    propertyDocumentUrl: str
    identityDocumentUrl: str