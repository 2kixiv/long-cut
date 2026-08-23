import os
import pathlib
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.deps import Db, OwnedNote
from app.schemas import AttachmentResponse
from app.models.attachments import Attachment

MAX_SIZE = 10 * 1024 * 1024 # 10MB
UPLOAD_DIR = pathlib.Path(os.environ.get("UPLOAD_DIR", "uploads"))

router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])

@router.post(
    "/{roadmap_id}/nodes/{node_id}/notes/{note_id}/attachments",
    status_code=status.HTTP_201_CREATED
)
async def upload_attachments(
    file: UploadFile,
    note: OwnedNote,
    db: Db
) -> AttachmentResponse:
    
    data = await file.read()

    if len(data) > MAX_SIZE:
        raise HTTPException(
            status.HTTP_413_CONTENT_TOO_LARGE,
            "Too large (MAX 10MB)"
        )

    stored_name = uuid.uuid4().hex
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / stored_name).write_bytes(data)

    attachment = Attachment(
        note_id=note.id,
        filename=file.filename,
        content_type=file.content_type,
        size=len(data),
        stored_name=stored_name
    )

    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment

@router.get("/{roadmap_id}/nodes/{node_id}/notes/{note_id}/attachments")
def get_attachments(
    note: OwnedNote,
    db: Db
) -> list[AttachmentResponse]:
    attachments = (
        db.query(Attachment)
        .filter(Attachment.note_id == note.id)
        .order_by(Attachment.created_at.desc())
        .all()
    )

    return attachments

@router.get("/{roadmap_id}/nodes/{node_id}/notes/{note_id}/attachments/{attachment_id}")
def download_attachment(
    attachment_id: int,
    note: OwnedNote,
    db: Db
) -> FileResponse:
    attachment = db.get(Attachment, attachment_id)

    if attachment is None or attachment.note_id != note.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )

    path = UPLOAD_DIR / attachment.stored_name

    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return FileResponse(
        path=path,
        media_type=attachment.content_type,
        filename=attachment.filename
    )



@router.delete(
    "/{roadmap_id}/nodes/{node_id}/notes/{note_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_attachment(attachment_id: int, note: OwnedNote, db: Db) -> None:
    attachment = db.get(Attachment, attachment_id)
    if attachment is None or attachment.note_id != note.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )

    db.delete(attachment)
    db.commit()

    (UPLOAD_DIR / attachment.stored_name).unlink(missing_ok=True)