"""Lightweight audit logging helper.

Call `log_audit(db, actor, action, entity, entity_id, summary, meta)` from routers
to capture a human-readable trail of create/update/delete events.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from .models import AuditLog, User

logger = logging.getLogger(__name__)


def log_audit(
    db: Session,
    *,
    actor: User | None,
    action: str,
    entity: str,
    entity_id: str,
    summary: str = "",
    meta: dict | None = None,
) -> None:
    try:
        entry = AuditLog(
            actor_id=actor.id if actor else None,
            actor_email=actor.email if actor else "",
            action=action,
            entity=entity,
            entity_id=str(entity_id or ""),
            summary=summary,
            meta=meta or {},
        )
        db.add(entry)
        # Let the caller commit; we just flush so subsequent queries see it.
        db.flush()
    except Exception:  # pragma: no cover - never block on audit
        logger.exception("failed to record audit log entry")
