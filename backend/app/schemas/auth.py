from pydantic import BaseModel, EmailStr, Field

from app.models.enums import OTPPurpose


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    purpose: OTPPurpose


class ResendOtpRequest(BaseModel):
    email: EmailStr
    purpose: OTPPurpose


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    password: str = Field(min_length=6)


class AuthUser(BaseModel):
    id: str
    name: str
    email: str
    role: str
    ownerRequestStatus: str
    savedPGs: list[str] = []
    isBlocked: bool = False
    avatar: str | None = None


class OtpPendingResponse(BaseModel):
    success: bool = True
    requiresOtp: bool = True
    purpose: OTPPurpose
    email: str
    message: str


class AuthSuccessResponse(BaseModel):
    success: bool = True
    token: str
    user: AuthUser