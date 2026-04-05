import json
from types import SimpleNamespace

from fastapi import APIRouter, Body, Depends, File, Form, UploadFile

from app.config.db import get_database
from app.controllers.owner_controller import (
    create_pg_controller,
    delete_pg_controller,
    get_owner_pgs_controller,
    update_pg_controller,
)
from app.core.dependencies import get_current_user, require_roles
from app.models.enums import UserRole
from app.services.cloudinary_service import upload_file

router = APIRouter(prefix="/api/owner", tags=["owner"])


@router.get("/")
async def owner_pgs(
    current_user=Depends(require_roles(UserRole.OWNER, UserRole.ADMIN)),
    db=Depends(get_database),
):
    return await get_owner_pgs_controller(db, current_user)


@router.post("/")
async def create_pg(
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    city: str = Form(...),
    area: str = Form(...),
    address: str = Form(...),
    roomType: str = Form(...),
    genderPreference: str = Form(...),
    amenities: str = Form(""),
    rules: str = Form(""),
    contactNumber: str = Form(...),
    images: list[UploadFile] | None = File(default=None),
    current_user=Depends(require_roles(UserRole.OWNER)),
    db=Depends(get_database),
):
    image_urls: list[str] = []
    for image in images or []:
        image_urls.append(await upload_file(image, "sikkimpg/pgs"))

    parsed_rules = _parse_rules_input(rules)
    payload = SimpleNamespace(
        title=title,
        description=description,
        price=price,
        city=city,
        area=area,
        address=address,
        roomType=SimpleNamespace(value=roomType),
        genderPreference=SimpleNamespace(value=genderPreference),
        amenities=[item.strip() for item in amenities.split(",") if item.strip()],
        rules=parsed_rules,
        contactNumber=contactNumber,
        images=image_urls,
    )
    return await create_pg_controller(db, payload, current_user)


@router.put("/{pg_id}")
async def update_pg(
    pg_id: str,
    title: str | None = Form(default=None),
    description: str | None = Form(default=None),
    price: float | None = Form(default=None),
    city: str | None = Form(default=None),
    area: str | None = Form(default=None),
    address: str | None = Form(default=None),
    roomType: str | None = Form(default=None),
    genderPreference: str | None = Form(default=None),
    amenities: str | None = Form(default=None),
    rules: str | None = Form(default=None),
    contactNumber: str | None = Form(default=None),
    removeImages: list[str] | None = Form(default=None),
    images: list[UploadFile] | None = File(default=None),
    current_user=Depends(require_roles(UserRole.OWNER, UserRole.ADMIN)),
    db=Depends(get_database),
):
    image_urls: list[str] = []
    for image in images or []:
        image_urls.append(await upload_file(image, "sikkimpg/pgs"))

    parsed_rules = _parse_rules_input(rules) if rules is not None else None
    payload = SimpleNamespace(
        title=title,
        description=description,
        price=price,
        city=city,
        area=area,
        address=address,
        roomType=SimpleNamespace(value=roomType) if roomType else None,
        genderPreference=SimpleNamespace(value=genderPreference) if genderPreference else None,
        amenities=[item.strip() for item in amenities.split(",") if item.strip()] if amenities is not None else None,
        rules=parsed_rules,
        contactNumber=contactNumber,
        removeImages=removeImages,
        images=image_urls or None,
    )
    return await update_pg_controller(db, pg_id, payload, current_user)


@router.delete("/{pg_id}")
async def delete_pg(
    pg_id: str,
    reason: str = Body(..., embed=True),
    current_user=Depends(require_roles(UserRole.OWNER, UserRole.ADMIN)),
    db=Depends(get_database),
):
    return await delete_pg_controller(db, pg_id, current_user, reason)


def _parse_rules_input(value: str) -> list[str]:
    raw = (value or "").strip()
    if not raw:
        return []
    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except json.JSONDecodeError:
            pass
    return [line.strip() for line in raw.split("\n") if line.strip()]
