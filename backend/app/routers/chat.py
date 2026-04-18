from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..ai import triage
from ..auth import get_current_user
from ..db import get_db
from ..models import AIQueryLog, Case, Checklist, Module, User
from ..schemas import AIResponse, ChatFeedbackRequest, ChatRequest, ChatResponseWithId

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponseWithId)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChatResponseWithId:
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
    response: AIResponse = triage(module, cases, checklists, payload.message)

    log = AIQueryLog(
        user_id=user.id,
        module_id=payload.module_id,
        query=payload.message,
        response=response.model_dump(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return ChatResponseWithId(log_id=log.id, response=response)


@router.post("/{log_id}/feedback", response_model=dict)
def chat_feedback(
    log_id: int,
    payload: ChatFeedbackRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    log = db.get(AIQueryLog, log_id)
    if not log:
        raise HTTPException(404, "Query log not found")
    # Users can only leave feedback on their own queries; admins can on any.
    if log.user_id and log.user_id != user.id and user.role != "admin":
        raise HTTPException(403, "Cannot modify another user's feedback")
    log.feedback = payload.feedback
    log.feedback_note = payload.note or ""
    db.commit()
    return {"ok": True, "feedback": log.feedback}
