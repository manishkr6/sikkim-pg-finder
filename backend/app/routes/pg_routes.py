from fastapi import APIRouter, Depends, Query

from app.config.db import get_database
from app.controllers.pg_controller import get_approved_pgs_controller, get_pg_by_id_controller
from app.schemas.pg import PGListQuery

router = APIRouter(prefix="/api/pgs", tags=["pgs"])


@router.get("")
async def list_pgs(
    city: str | None = None,
    minPrice: float | None = None,
    maxPrice: float | None = None,
    roomType: str | None = None,
    gender: str | None = None,
    amenities: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(9, ge=1),
    sort: str = "newest",
    db=Depends(get_database),
):
    query = PGListQuery(
        city=city,
        minPrice=minPrice,
        maxPrice=maxPrice,
        roomType=roomType,
        gender=gender,
        amenities=amenities,
        page=page,
        limit=limit,
        sort=sort,
    )
    return await get_approved_pgs_controller(db, query)


@router.get("/{pg_id}")
async def get_pg(pg_id: str, db=Depends(get_database)):
    return await get_pg_by_id_controller(db, pg_id)