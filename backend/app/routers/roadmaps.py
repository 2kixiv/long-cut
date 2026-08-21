from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import RoadmapResponse
from app.models.user import User
from app.deps import get_current_user


router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])

@router.post("/")
def create_roadmap(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
) -> RoadmapResponse:
    pass

@router.get("/")
def get_roadmaps(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
) -> list[RoadmapResponse]:
    pass

@router.get("/{id}")
def get_roadmap(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
) -> RoadmapResponse:
    pass

@router.patch("/{id}")
def update_roadmap(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    pass

@router.delete("/{id}")
def delete_roadmap(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    pass