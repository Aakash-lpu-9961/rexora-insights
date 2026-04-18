from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Module, TrackingRequest, User
from ..schemas import TRCreate, TROut, TRUpdate

router = APIRouter(prefix="/api/modules/{module_id}/tracking", tags=["tracking"])


def _require_module(db: Session, module_id: str) -> Module:
    m = db.get(Module, module_id)
    if not m:
        raise HTTPException(404, "Module not found")
    return m


@router.get("", response_model=list[TROut])
def list_trs(
    module_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> list[TROut]:
    _require_module(db, module_id)
    rows = (
        db.query(TrackingRequest)
        .filter(TrackingRequest.module_id == module_id)
        .order_by(TrackingRequest.sort_order, TrackingRequest.created_at)
        .all()
    )
    return [TROut.model_validate(c) for c in rows]


@router.post("", response_model=TROut, status_code=status.HTTP_201_CREATED)
def create_tr(
    module_id: str,
    payload: TRCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> TROut:
    _require_module(db, module_id)
    tid = payload.id or f"TR-{uuid.uuid4().hex[:4].upper()}"
    if db.get(TrackingRequest, tid):
        tid = f"TR-{uuid.uuid4().hex[:4].upper()}"
    max_sort = (
        db.query(func.coalesce(func.max(TrackingRequest.sort_order), 0))
        .filter(TrackingRequest.module_id == module_id)
        .scalar()
        or 0
    )
    data = payload.model_dump(exclude={"id"})
    tr = TrackingRequest(id=tid, module_id=module_id, sort_order=int(max_sort) + 1, **data)
    db.add(tr)
    db.commit()
    db.refresh(tr)
    return TROut.model_validate(tr)


@router.patch("/{tr_id}", response_model=TROut)
def update_tr(
    module_id: str,
    tr_id: str,
    payload: TRUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> TROut:
    tr = db.get(TrackingRequest, tr_id)
    if not tr or tr.module_id != module_id:
        raise HTTPException(404, "Tracking request not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(tr, k, v)
    db.commit()
    db.refresh(tr)
    return TROut.model_validate(tr)


@router.delete("/{tr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tr(
    module_id: str,
    tr_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    tr = db.get(TrackingRequest, tr_id)
    if not tr or tr.module_id != module_id:
        raise HTTPException(404, "Tracking request not found")
    db.delete(tr)
    db.commit()
