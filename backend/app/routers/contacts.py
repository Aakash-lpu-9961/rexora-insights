from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Contact, Module, User
from ..schemas import ContactCreate, ContactOut, ContactUpdate

router = APIRouter(prefix="/api/modules/{module_id}/contacts", tags=["contacts"])


def _require_module(db: Session, module_id: str) -> Module:
    m = db.get(Module, module_id)
    if not m:
        raise HTTPException(404, "Module not found")
    return m


def _initials(name: str) -> str:
    parts = [p for p in name.split() if p]
    if not parts:
        return "??"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


@router.get("", response_model=list[ContactOut])
def list_contacts(
    module_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> list[ContactOut]:
    _require_module(db, module_id)
    rows = (
        db.query(Contact)
        .filter(Contact.module_id == module_id)
        .order_by(Contact.sort_order, Contact.id)
        .all()
    )
    return [ContactOut.model_validate(c) for c in rows]


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(
    module_id: str,
    payload: ContactCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ContactOut:
    _require_module(db, module_id)
    max_sort = (
        db.query(func.coalesce(func.max(Contact.sort_order), 0))
        .filter(Contact.module_id == module_id)
        .scalar()
        or 0
    )
    c = Contact(
        module_id=module_id,
        name=payload.name,
        team=payload.team,
        role=payload.role,
        email=payload.email,
        initials=payload.initials or _initials(payload.name),
        sort_order=int(max_sort) + 1,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return ContactOut.model_validate(c)


@router.patch("/{contact_id}", response_model=ContactOut)
def update_contact(
    module_id: str,
    contact_id: int,
    payload: ContactUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ContactOut:
    c = db.get(Contact, contact_id)
    if not c or c.module_id != module_id:
        raise HTTPException(404, "Contact not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return ContactOut.model_validate(c)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    module_id: str,
    contact_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    c = db.get(Contact, contact_id)
    if not c or c.module_id != module_id:
        raise HTTPException(404, "Contact not found")
    db.delete(c)
    db.commit()
