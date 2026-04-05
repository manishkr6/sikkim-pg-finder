from fastapi import APIRouter, Depends, Response

from app.config.db import get_database
from app.controllers.auth_controller import (
    forgot_password_controller,
    get_me_controller,
    login_controller,
    resend_otp_controller,
    reset_password_controller,
    signup_controller,
    verify_otp_controller,
)
from app.core.dependencies import get_current_user
from app.core.settings import get_settings
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResendOtpRequest,
    ResetPasswordRequest,
    SignupRequest,
    VerifyOtpRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/")
async def auth_info():
    return {
        "success": True,
        "message": "Auth router is active. Use POST for authentication.",
        "endpoints": {
            "signup": "POST /signup",
            "login": "POST /login",
            "verifyOtp": "POST /verify-otp",
            "resendOtp": "POST /resend-otp",
            "forgotPassword": "POST /forgot-password",
            "resetPassword": "PUT /reset-password/{token}",
            "me": "GET /me",
        },
    }


@router.post("/signup")
async def signup(payload: SignupRequest, db=Depends(get_database)):
    return await signup_controller(db, payload)


@router.post("/login")
async def login(payload: LoginRequest, response: Response, db=Depends(get_database)):
    token, user = await login_controller(db, payload)
    settings = get_settings()
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=settings.environment == "production",
        samesite="none" if settings.environment == "production" else "strict",
        max_age=7 * 24 * 60 * 60,
    )
    return {"success": True, "token": token, "user": user}


@router.post("/verify-otp")
async def verify_otp(payload: VerifyOtpRequest, response: Response, db=Depends(get_database)):
    token, user = await verify_otp_controller(db, payload)
    settings = get_settings()
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=settings.environment == "production",
        samesite="none" if settings.environment == "production" else "strict",
        max_age=7 * 24 * 60 * 60,
    )
    return {"success": True, "token": token, "user": user}


@router.post("/resend-otp")
async def resend_otp(payload: ResendOtpRequest, db=Depends(get_database)):
    return await resend_otp_controller(db, payload)


@router.get("/me")
async def me(current_user=Depends(get_current_user), db=Depends(get_database)):
    return await get_me_controller(db, current_user)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="token")
    return {"success": True, "message": "Logged out successfully"}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db=Depends(get_database)):
    return await forgot_password_controller(db, payload)


@router.put("/reset-password/{token}")
async def reset_password(token: str, payload: ResetPasswordRequest, response: Response, db=Depends(get_database)):
    new_token, user = await reset_password_controller(db, token, payload.password)
    settings = get_settings()
    response.set_cookie(
        key="token",
        value=new_token,
        httponly=True,
        secure=settings.environment == "production",
        samesite="none" if settings.environment == "production" else "strict",
        max_age=7 * 24 * 60 * 60,
    )
    return {"success": True, "token": new_token, "user": user}
