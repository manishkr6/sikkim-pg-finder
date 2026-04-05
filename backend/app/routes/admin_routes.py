from fastapi import APIRouter, Depends, Query

from app.config.db import get_database
from app.controllers.admin_controller import (
    approve_owner_controller,
    approve_pg_controller,
    force_delete_pg_controller,
    get_all_pgs_controller,
    get_all_users_controller,
    get_reports_controller,
    get_stats_controller,
    reject_pg_controller,
    toggle_block_user_controller,
    update_report_controller,
)
from app.core.dependencies import require_roles
from app.models.enums import UserRole
from app.schemas.admin import AdminPGQuery, AdminUserQuery, RejectPGRequest, ReportStatusUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
async def stats(_: dict = Depends(require_roles(UserRole.ADMIN)), db=Depends(get_database)):
    return await get_stats_controller(db)


@router.get("/pgs")
async def all_pgs(
    status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _: dict = Depends(require_roles(UserRole.ADMIN)),
    db=Depends(get_database),
):
    query = AdminPGQuery(status=status, search=search, page=page, limit=limit)
    return await get_all_pgs_controller(db, query)


@router.put("/pgs/{pg_id}/approve")
async def approve_pg(pg_id: str, _: dict = Depends(require_roles(UserRole.ADMIN)), db=Depends(get_database)):
    return await approve_pg_controller(db, pg_id)


@router.put("/pgs/{pg_id}/reject")
async def reject_pg(pg_id: str, payload: RejectPGRequest, _: dict = Depends(require_roles(UserRole.ADMIN)), db=Depends(get_database)):
    return await reject_pg_controller(db, pg_id, payload.reason)


@router.delete("/pgs/{pg_id}")
async def force_delete(pg_id: str, _: dict = Depends(require_roles(UserRole.ADMIN)), db=Depends(get_database)):
    return await force_delete_pg_controller(db, pg_id)


@router.get("/users")
async def all_users(
    role: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _: dict = Depends(require_roles(UserRole.ADMIN)),
    db=Depends(get_database),
):
    query = AdminUserQuery(role=role, search=search, page=page, limit=limit)
    return await get_all_users_controller(db, query)


@router.put("/users/{user_id}/approve-owner")
async def approve_owner(user_id: str, admin=Depends(require_roles(UserRole.ADMIN)), db=Depends(get_database)):
    return await approve_owner_controller(db, user_id, admin)


@router.put("/users/{user_id}/block")
async def toggle_block(user_id: str, _: dict = Depends(require_roles(UserRole.ADMIN)), db=Depends(get_database)):
    return await toggle_block_user_controller(db, user_id)


@router.get("/reports")
async def reports(status: str | None = None, _: dict = Depends(require_roles(UserRole.ADMIN)), db=Depends(get_database)):
    return await get_reports_controller(db, status)


@router.put("/reports/{report_id}")
async def update_report(report_id: str, payload: ReportStatusUpdate, _: dict = Depends(require_roles(UserRole.ADMIN)), db=Depends(get_database)):
    return await update_report_controller(db, report_id, payload.status)