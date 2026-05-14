from fastapi import APIRouter, Depends, Query

from app.config.db import get_database
from app.controllers.notification_controller import (
    get_notifications_controller,
    get_unread_count_controller,
    mark_all_read_controller,
    mark_one_read_controller,
)
from app.core.dependencies import get_current_user
from app.schemas.notification import NotificationQuery

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/")
async def list_notifications(
    type: str | None = None,
    isRead: bool | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    query = NotificationQuery(type=type, isRead=isRead, page=page, limit=limit)
    return await get_notifications_controller(db, current_user, query)


@router.put("/mark-read")
async def mark_all_read(current_user=Depends(get_current_user), db=Depends(get_database)):
    return await mark_all_read_controller(db, current_user)


@router.get("/unread-count")
async def unread_count(current_user=Depends(get_current_user), db=Depends(get_database)):
    return await get_unread_count_controller(db, current_user)


@router.put("/{notification_id}/read")
async def mark_one(notification_id: str, current_user=Depends(get_current_user), db=Depends(get_database)):
    return await mark_one_read_controller(db, notification_id, current_user)