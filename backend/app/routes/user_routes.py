from types import SimpleNamespace

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.config.db import get_database
from app.controllers.user_controller import (
    change_password_controller,
    get_saved_pgs_controller,
    request_owner_controller,
    toggle_save_pg_controller,
    update_profile_controller,
)
from app.core.dependencies import get_current_user
from app.schemas.user import ChangePasswordRequest, UpdateProfileRequest
from app.services.cloudinary_service import upload_file

router = APIRouter(prefix="/api/user", tags=["user"])


@router.post("/save/{pg_id}")
async def toggle_save(pg_id: str, current_user=Depends(get_current_user), db=Depends(get_database)):
    return await toggle_save_pg_controller(db, pg_id, current_user)


@router.get("/saved")
async def saved_pgs(current_user=Depends(get_current_user), db=Depends(get_database)):
    return await get_saved_pgs_controller(db, current_user)


@router.post("/request-owner")
async def request_owner(
    fullName: str = Form(...),
    phoneNumber: str = Form(...),
    propertyDocument: UploadFile = File(...),
    identityDocument: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    property_document_url = await upload_file(propertyDocument, "sikkimpg/owner-docs")
    identity_document_url = await upload_file(identityDocument, "sikkimpg/owner-docs")
    payload = SimpleNamespace(
        fullName=fullName,
        phoneNumber=phoneNumber,
        propertyDocumentUrl=property_document_url,
        identityDocumentUrl=identity_document_url,
    )
    return await request_owner_controller(db, payload, current_user)


@router.put("/profile")
async def update_profile(payload: UpdateProfileRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    return await update_profile_controller(db, payload, current_user)


@router.put("/change-password")
async def change_password(payload: ChangePasswordRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    return await change_password_controller(db, payload, current_user)
