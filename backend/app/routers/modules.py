from __future__ import annotations

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Module, User
from ..schemas import ModuleCreate, ModuleOut, ModuleUpdate

router = APIRouter(prefix="/api/modules", tags=["modules"])


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
    return slug or uuid.uuid4().hex[:8]


def _short(name: str) -> str:
    parts = [p for p in re.split(r"\s+", name.strip()) if p]
    if not parts:
        return "MOD"
    if len(parts) == 1:
        return parts[0][:3].upper()
    return "".join(p[0] for p in parts[:3]).upper()


def _to_out(m: Module) -> ModuleOut:
    return ModuleOut.model_validate(
        {
            "id": m.id,
            "name": m.name,
            "short": m.short,
            "color": m.color,
            "progress": m.progress,
            "overview": m.overview or {},
            "chatGreeting": m.chat_greeting,
            "chatSuggestions": m.chat_suggestions or [],
        }
    )


@router.get("", response_model=list[ModuleOut])
def list_modules(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[ModuleOut]:
    mods = db.query(Module).order_by(Module.sort_order, Module.created_at).all()
    return [_to_out(m) for m in mods]


@router.post("", response_model=ModuleOut, status_code=status.HTTP_201_CREATED)
def create_module(
    payload: ModuleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ModuleOut:
    mid = payload.id or _slugify(payload.name)
    # ensure uniqueness
    if db.get(Module, mid):
        mid = f"{mid}-{uuid.uuid4().hex[:4]}"
    max_sort = db.query(func.coalesce(func.max(Module.sort_order), 0)).scalar() or 0
    mod = Module(
        id=mid,
        name=payload.name,
        short=payload.short or _short(payload.name),
        color=payload.color,
        progress=payload.progress,
        overview=payload.overview.model_dump(),
        chat_greeting=payload.chatGreeting,
        chat_suggestions=payload.chatSuggestions,
        sort_order=int(max_sort) + 1,
    )
    db.add(mod)
    db.commit()
    db.refresh(mod)
    return _to_out(mod)


@router.get("/{module_id}", response_model=ModuleOut)
def get_module(
    module_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> ModuleOut:
    m = db.get(Module, module_id)
    if not m:
        raise HTTPException(404, "Module not found")
    return _to_out(m)


@router.patch("/{module_id}", response_model=ModuleOut)
def update_module(
    module_id: str,
    payload: ModuleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ModuleOut:
    m = db.get(Module, module_id)
    if not m:
        raise HTTPException(404, "Module not found")
    data = payload.model_dump(exclude_unset=True)
    if "overview" in data and data["overview"] is not None:
        m.overview = data.pop("overview")
    if "chatGreeting" in data:
        m.chat_greeting = data.pop("chatGreeting") or ""
    if "chatSuggestions" in data:
        m.chat_suggestions = data.pop("chatSuggestions") or []
    for k, v in data.items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return _to_out(m)


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> None:
    m = db.get(Module, module_id)
    if not m:
        raise HTTPException(404, "Module not found")
    db.delete(m)
    db.commit()
