from fastapi import APIRouter, Depends

from app.config.db import get_database
from app.controllers.review_controller import add_review_controller, delete_review_controller, get_pg_reviews_controller
from app.core.dependencies import get_current_user
from app.schemas.review import ReviewCreateRequest

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.get("/{pg_id}")
async def get_reviews(pg_id: str, db=Depends(get_database)):
    return await get_pg_reviews_controller(db, pg_id)


@router.post("/{pg_id}")
async def add_review(pg_id: str, payload: ReviewCreateRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    return await add_review_controller(db, pg_id, payload, current_user)


@router.delete("/{review_id}")
async def delete_review(review_id: str, current_user=Depends(get_current_user), db=Depends(get_database)):
    return await delete_review_controller(db, review_id, current_user)