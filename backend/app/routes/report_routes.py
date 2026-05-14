from fastapi import APIRouter, Depends

from app.config.db import get_database
from app.controllers.report_controller import report_pg_controller
from app.core.dependencies import get_current_user
from app.schemas.report import ReportCreateRequest

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/{pg_id}")
async def report_pg(pg_id: str, payload: ReportCreateRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    return await report_pg_controller(db, pg_id, payload, current_user)