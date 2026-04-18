from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Case, Module, User
from ..schemas import CaseCreate, CaseOut, CaseUpdate

router = APIRouter(prefix="/api/modules/{module_id}/cases", tags=["cases"])


def _require_module(db: Session, module_id: str) -> Module:
    m = db.get(Module, module_id)
    if not m:
        raise HTTPException(404, "Module not found")
    return m


@router.get("", response_model=list[CaseOut])
def list_cases(
    module_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> list[CaseOut]:
    _require_module(db, module_id)
    rows = (
        db.query(Case).filter(Case.module_id == module_id).order_by(Case.created_at.desc()).all()
    )
    return [CaseOut.model_validate(c) for c in rows]


@router.post("", response_model=CaseOut, status_code=status.HTTP_201_CREATED)
def create_case(
    module_id: str,
    payload: CaseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CaseOut:
    _require_module(db, module_id)
    cid = payload.id or f"CASE-{uuid.uuid4().hex[:6].upper()}"
    if db.get(Case, cid):
        cid = f"CASE-{uuid.uuid4().hex[:6].upper()}"
    data = payload.model_dump(exclude={"id"})
    c = Case(id=cid, module_id=module_id, **data)
    db.add(c)
    db.commit()
    db.refresh(c)
    return CaseOut.model_validate(c)


@router.patch("/{case_id}", response_model=CaseOut)
def update_case(
    module_id: str,
    case_id: str,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CaseOut:
    c = db.get(Case, case_id)
    if not c or c.module_id != module_id:
        raise HTTPException(404, "Case not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return CaseOut.model_validate(c)


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(
    module_id: str,
    case_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    c = db.get(Case, case_id)
    if not c or c.module_id != module_id:
        raise HTTPException(404, "Case not found")
    db.delete(c)
    db.commit()
