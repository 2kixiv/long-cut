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