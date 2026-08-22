from fastapi import APIRouter, Depends, status, HTTPException

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import RoadmapCreate, RoadmapNodeCreate, RoadmapNodeResponse, RoadmapNodeUpdate, RoadmapResponse, RoadmapUpdate
from app.deps import get_current_user, get_owned_roadmap

from app.models.user import User
from app.models.roadmaps import Roadmap, RoadmapNode

router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])

@router.post("", status_code=status.HTTP_201_CREATED)
def create_roadmap(
    req: RoadmapCreate,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
) -> RoadmapResponse:
    roadmap = Roadmap(
        user_id=current_user.id,
        title=req.title,
        description=req.description,
    )

    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    return roadmap

@router.get("")
def get_roadmaps(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
) -> list[RoadmapResponse]:
    roadmaps = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == current_user.id)
        .order_by(Roadmap.created_at.desc())
        .all()
    )
    
    return roadmaps

@router.get("/{roadmap_id}")
def get_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
) -> RoadmapResponse:
    roadmap = get_owned_roadmap(
        roadmap_id=roadmap_id,
        current_user=current_user,
        db=db
    )
    
    return roadmap

@router.patch("/{roadmap_id}")
def update_roadmap(
    roadmap_id: int,
    req: RoadmapUpdate,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
) -> RoadmapResponse:
    roadmap = get_owned_roadmap(
        roadmap_id=roadmap_id,
        current_user=current_user,
        db=db
    )

    data = req.model_dump(exclude_unset=True)

    for field, value in data.items():
        setattr(roadmap, field, value)

    db.commit()
    db.refresh(roadmap)

    return roadmap
    

@router.delete("/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    roadmap = get_owned_roadmap(
        roadmap_id=roadmap_id,
        current_user=current_user,
        db=db
    )

    db.delete(roadmap)
    db.commit()

@router.post("/{roadmap_id}/nodes", status_code=status.HTTP_201_CREATED)
def create_roadmap_node(
    roadmap_id: int,
    req: RoadmapNodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> RoadmapNodeResponse:
    roadmap = get_owned_roadmap(
        roadmap_id=roadmap_id,
        current_user=current_user,
        db=db
    )

    if req.parent_node_id is not None:
        parent = db.get(RoadmapNode, req.parent_node_id)

        if parent is None or parent.roadmap_id != roadmap.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent node not found",
            )

    last_index = (
        db.query(func.max(RoadmapNode.order_index))
        .filter(
            RoadmapNode.roadmap_id == roadmap.id,
            RoadmapNode.parent_node_id == req.parent_node_id,
        )
        .scalar()
    )

    order_index = 0 if last_index is None else last_index + 1

    roadmap_node = RoadmapNode(
        roadmap_id=roadmap.id,
        parent_node_id=req.parent_node_id,
        title=req.title,
        description=req.description,
        order_index=order_index
    )

    db.add(roadmap_node)
    db.commit()
    db.refresh(roadmap_node)

    return roadmap_node

@router.get("/{roadmap_id}/nodes")
def get_roadmap_nodes(
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[RoadmapNodeResponse]:
    roadmap = get_owned_roadmap(
        roadmap_id=roadmap_id,
        current_user=current_user,
        db=db
    )

    return roadmap.nodes

@router.patch("/{roadmap_id}/nodes/{node_id}")
def update_roadmap_node(
    roadmap_id: int,
    node_id: int,
    req: RoadmapNodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> RoadmapNodeResponse:
    roadmap = get_owned_roadmap(
        roadmap_id=roadmap_id,
        current_user=current_user,
        db=db
    )
    
    node = db.get(RoadmapNode, node_id)

    if node is None or node.roadmap_id != roadmap.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap node not found",
        )

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(node, field, value)

    db.commit()
    db.refresh(node)

    return node