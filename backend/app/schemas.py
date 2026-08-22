from typing import Literal

from pydantic import BaseModel, EmailStr

from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: EmailStr

class RoadmapCreate(BaseModel):
    title: str
    description: str | None = None

class RoadmapUpdate(BaseModel):
    title: str | None = None
    description: str | None = None

class RoadmapResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class RoadmapNodeCreate(BaseModel):
    title: str
    description: str | None = None
    parent_node_id: int | None = None

class RoadmapNodeUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: Literal["not_started", "in_progress", "done"] | None = None

class RoadmapNodeResponse(BaseModel):
    id: int
    roadmap_id: int
    parent_node_id: int | None = None
    title: str
    description: str | None = None
    order_index: int
    status: Literal["not_started", "in_progress", "done"]
    created_at: datetime

    class Config:
        from_attributes = True