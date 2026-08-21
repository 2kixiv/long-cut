from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from app.routers import auth, roadmaps
from app.models import User, Roadmap

app = FastAPI()

Base.metadata.create_all(bind=engine)

allowed_origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return { "status" : "ok" }

app.include_router(auth.router)
app.include_router(roadmaps.router)