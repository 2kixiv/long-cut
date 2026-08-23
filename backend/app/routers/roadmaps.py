from fastapi import APIRouter, Depends, status, HTTPException

from sqlalchemy import func

from app.schemas import NoteCreate, NoteResponse, NoteUpdate, RoadmapCreate, RoadmapNodeCreate, RoadmapNodeResponse, RoadmapNodeUpdate, RoadmapResponse, RoadmapUpdate
from app.deps import CurrentUser, Db, OwnedNote, OwnedRoadmap, OwnedRoadmapNode, get_current_user, get_owned_roadmap, get_owned_roadmap_node

from app.models.roadmaps import Roadmap, RoadmapNode
from app.models.notes import Note

router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])

@router.post("", status_code=status.HTTP_201_CREATED)
def create_roadmap(
    req: RoadmapCreate,
    current_user: CurrentUser, 
    db: Db
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
    current_user: CurrentUser, 
    db: Db
) -> list[RoadmapResponse]:
    roadmaps = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == current_user.id)
        .order_by(Roadmap.created_at.desc())
        .all()
    )
    
    return roadmaps

@router.get("/{roadmap_id}")
def get_roadmap(roadmap: OwnedRoadmap) -> RoadmapResponse:
    return roadmap

@router.patch("/{roadmap_id}")
def update_roadmap(
    req: RoadmapUpdate,
    roadmap: OwnedRoadmap,
    db: Db
) -> RoadmapResponse:
    data = req.model_dump(exclude_unset=True)

    for field, value in data.items():
        setattr(roadmap, field, value)

    db.commit()
    db.refresh(roadmap)

    return roadmap
    

@router.delete("/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_roadmap(
    roadmap: OwnedRoadmap,
    db: Db
):
    db.delete(roadmap)
    db.commit()

@router.post("/{roadmap_id}/nodes", status_code=status.HTTP_201_CREATED)
def create_roadmap_node(
    req: RoadmapNodeCreate,
    roadmap: OwnedRoadmap,
    db: Db
) -> RoadmapNodeResponse:
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
def get_roadmap_nodes(roadmap: OwnedRoadmap) -> list[RoadmapNodeResponse]:
    return roadmap.nodes

@router.patch("/{roadmap_id}/nodes/{node_id}")
def update_roadmap_node(
    req: RoadmapNodeUpdate,
    roadmap_node: OwnedRoadmapNode,
    db: Db
) -> RoadmapNodeResponse:
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(roadmap_node, field, value)

    db.commit()
    db.refresh(roadmap_node)

    return roadmap_node

@router.post("/{roadmap_id}/nodes/{node_id}/notes", status_code=status.HTTP_201_CREATED)
def create_note(
    req: NoteCreate,
    roadmap_node: OwnedRoadmapNode,
    db: Db
) -> NoteResponse:
    note = Note(
        node_id=roadmap_node.id,
        title=req.title,
        content=req.content
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note

@router.get("/{roadmap_id}/nodes/{node_id}/notes")
def get_notes(roadmap_node: OwnedRoadmapNode, db: Db) -> list[NoteResponse]:
    notes = (
        db.query(Note)
        .filter(Note.node_id == roadmap_node.id)
        .order_by(Note.created_at.desc())
        .all()
    )

    return notes

@router.get("/{roadmap_id}/nodes/{node_id}/notes/{note_id}")
def get_note(note: OwnedNote) -> NoteResponse:
    return note

@router.patch("/{roadmap_id}/nodes/{node_id}/notes/{note_id}")
def update_note(req: NoteUpdate, note: OwnedNote, db: Db) -> NoteResponse:
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(note, field, value)

    db.commit()
    db.refresh(note)

    return note

@router.delete("/{roadmap_id}/nodes/{node_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note: OwnedNote, db: Db):
    db.delete(note)
    db.commit()