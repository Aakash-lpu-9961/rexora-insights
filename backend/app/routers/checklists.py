from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Checklist, Module, User
from ..schemas import ChecklistCreate, ChecklistOut, ChecklistUpdate

router = APIRouter(prefix="/api/modules/{module_id}/checklists", tags=["checklists"])


def _require_module(db: Session, module_id: str) -> Module:
    m = db.get(Module, module_id)
    if not m:
        raise HTTPException(404, "Module not found")
    return m


@router.get("", response_model=list[ChecklistOut])
def list_checklists(
    module_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> list[ChecklistOut]:
    _require_module(db, module_id)
    rows = (
        db.query(Checklist)
        .filter(Checklist.module_id == module_id)
        .order_by(Checklist.sort_order, Checklist.created_at)
        .all()
    )
    return [ChecklistOut.from_orm_checklist(c) for c in rows]


@router.post("", response_model=ChecklistOut, status_code=status.HTTP_201_CREATED)
def create_checklist(
    module_id: str,
    payload: ChecklistCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ChecklistOut:
    _require_module(db, module_id)
    max_sort = (
        db.query(func.coalesce(func.max(Checklist.sort_order), 0))
        .filter(Checklist.module_id == module_id)
        .scalar()
        or 0
    )
    c = Checklist(
        id=f"c_{uuid.uuid4().hex[:8]}",
        module_id=module_id,
        title=payload.title,
        description=payload.description,
        steps=[s.model_dump() for s in payload.steps],
        sort_order=int(max_sort) + 1,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return ChecklistOut.from_orm_checklist(c)


@router.patch("/{checklist_id}", response_model=ChecklistOut)
def update_checklist(
    module_id: str,
    checklist_id: str,
    payload: ChecklistUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ChecklistOut:
    c = db.get(Checklist, checklist_id)
    if not c or c.module_id != module_id:
        raise HTTPException(404, "Checklist not found")
    data = payload.model_dump(exclude_unset=True)
    if "steps" in data and data["steps"] is not None:
        c.steps = [s if isinstance(s, dict) else s.model_dump() for s in data.pop("steps")]
    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return ChecklistOut.from_orm_checklist(c)


@router.delete("/{checklist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist(
    module_id: str,
    checklist_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    c = db.get(Checklist, checklist_id)
    if not c or c.module_id != module_id:
        raise HTTPException(404, "Checklist not found")
    db.delete(c)
    db.commit()
