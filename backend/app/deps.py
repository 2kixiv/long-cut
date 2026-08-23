from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.models.roadmaps import Roadmap, RoadmapNode
from app.models.notes import Note
from app.auth import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

Db = Annotated[Session, Depends(get_db)]

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증이 필요합니다."
    )

    try:
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM]
        )
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise credentials_error

    user = db.get(User, user_id)
    if user is None:
        raise credentials_error

    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

def get_owned_roadmap(
    roadmap_id: int,
    current_user: CurrentUser,
    db: Db
) -> Roadmap:
    roadmap = db.get(Roadmap, roadmap_id)
        
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found",
        )

    return roadmap

OwnedRoadmap = Annotated[Roadmap, Depends(get_owned_roadmap)]

def get_owned_roadmap_node(
    node_id: int,
    roadmap: OwnedRoadmap,
    db: Db
) -> RoadmapNode:
    node = db.get(RoadmapNode, node_id)

    if node is None or node.roadmap_id != roadmap.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap node not found",
        )

    return node

OwnedRoadmapNode = Annotated[RoadmapNode, Depends(get_owned_roadmap_node)]

def get_owned_note(
    note_id: int,
    roadmap_node: OwnedRoadmapNode,
    db: Db
) -> Note:
    note = db.get(Note, note_id)

    if note is None or note.node_id != roadmap_node.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    return note

OwnedNote = Annotated[Note, Depends(get_owned_note)]