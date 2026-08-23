from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import backref, relationship

from app.database import Base


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    nodes = relationship("RoadmapNode", back_populates="roadmap", cascade="all, delete-orphan")

class RoadmapNode(Base):
    __tablename__ = "roadmap_nodes"

    id = Column(Integer, primary_key=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"), nullable=False)
    parent_node_id = Column(Integer, ForeignKey("roadmap_nodes.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="not_started")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    roadmap = relationship("Roadmap", back_populates="nodes")
    notes = relationship("Note", back_populates="node", cascade="all, delete-orphan")
    children = relationship(
        "RoadmapNode",
        cascade="all, delete-orphan",
        backref=backref("parent", remote_side=[id]),
    )