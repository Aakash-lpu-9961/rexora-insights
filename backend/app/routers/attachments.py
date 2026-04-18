from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Attachment, Module, User
from ..schemas import AttachmentCreate, AttachmentOut, AttachmentUpdate

router = APIRouter(prefix="/api/modules/{module_id}/attachments", tags=["attachments"])


def _require_module(db: Session, module_id: str) -> Module:
    m = db.get(Module, module_id)
    if not m:
        raise HTTPException(404, "Module not found")
    return m


@router.get("", response_model=list[AttachmentOut])
def list_attachments(
    module_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> list[AttachmentOut]:
    _require_module(db, module_id)
    rows = (
        db.query(Attachment)
        .filter(Attachment.module_id == module_id)
        .order_by(Attachment.kind, Attachment.sort_order, Attachment.id)
        .all()
    )
    return [AttachmentOut.model_validate(a) for a in rows]


@router.post("", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
def create_attachment(
    module_id: str,
    payload: AttachmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AttachmentOut:
    _require_module(db, module_id)
    aid = payload.id or f"att_{uuid.uuid4().hex[:8]}"
    if db.get(Attachment, aid):
        aid = f"att_{uuid.uuid4().hex[:8]}"
    max_sort = (
        db.query(func.coalesce(func.max(Attachment.sort_order), 0))
        .filter(Attachment.module_id == module_id, Attachment.kind == payload.kind)
        .scalar()
        or 0
    )
    data = payload.model_dump(exclude={"id"})
    a = Attachment(id=aid, module_id=module_id, sort_order=int(max_sort) + 1, **data)
    db.add(a)
    db.commit()
    db.refresh(a)
    return AttachmentOut.model_validate(a)


@router.patch("/{attachment_id}", response_model=AttachmentOut)
def update_attachment(
    module_id: str,
    attachment_id: str,
    payload: AttachmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AttachmentOut:
    a = db.get(Attachment, attachment_id)
    if not a or a.module_id != module_id:
        raise HTTPException(404, "Attachment not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return AttachmentOut.model_validate(a)


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    module_id: str,
    attachment_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    a = db.get(Attachment, attachment_id)
    if not a or a.module_id != module_id:
        raise HTTPException(404, "Attachment not found")
    db.delete(a)
    db.commit()
