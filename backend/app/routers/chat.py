from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..ai import triage
from ..auth import get_current_user
from ..db import get_db
from ..models import Case, Checklist, Module, User
from ..schemas import AIResponse, ChatRequest

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=AIResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AIResponse:
    module = db.get(Module, payload.module_id)
    if not module:
        raise HTTPException(404, "Module not found")
    cases = (
        db.query(Case)
        .filter(Case.module_id == payload.module_id)
        .order_by(Case.created_at.desc())
        .limit(20)
        .all()
    )
    checklists = (
        db.query(Checklist)
        .filter(Checklist.module_id == payload.module_id)
        .order_by(Checklist.sort_order, Checklist.created_at)
        .limit(10)
        .all()
    )
    return triage(module, cases, checklists, payload.message)
