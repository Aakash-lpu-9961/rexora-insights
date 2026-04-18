"""Admin-only endpoints for the Rexora internal admin panel.

All routes require `role == "admin"`. Covers:
- User management (list, update role/active)
- Module templates (CRUD + instantiate into a real module)
- Global CRUD over modules/checklists/cases/contacts/tracking/attachments
- CSV bulk import for cases
- AI query insights (with feedback)
- Analytics overview
- Audit log
"""

from __future__ import annotations

import csv
import io
import re
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..audit import log_audit
from ..auth import require_admin
from ..db import get_db
from ..models import (
    AIQueryLog,
    Attachment,
    AuditLog,
    Case,
    Checklist,
    Contact,
    Module,
    ModuleTemplate,
    TrackingRequest,
    User,
)
from ..schemas import (
    AdminUserUpdate,
    AIQueryLogOut,
    AnalyticsActivityItem,
    AnalyticsModuleStat,
    AnalyticsOverview,
    AnalyticsTagCount,
    AttachmentOut,
    AuditLogOut,
    CaseOut,
    CaseUpdate,
    ChecklistOut,
    ChecklistUpdate,
    ContactOut,
    ContactUpdate,
    CSVImportResult,
    InstantiateModuleRequest,
    ModuleOut,
    ModuleTemplateCreate,
    ModuleTemplateOut,
    ModuleTemplateUpdate,
    ModuleUpdate,
    TROut,
    TRUpdate,
    UserOut,
)

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


# ---------- helpers ----------
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


def _module_out(m: Module) -> ModuleOut:
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


def _template_out(t: ModuleTemplate) -> ModuleTemplateOut:
    return ModuleTemplateOut.model_validate(
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "short": t.short,
            "color": t.color,
            "overview": t.overview or {},
            "chatGreeting": t.chat_greeting,
            "chatSuggestions": t.chat_suggestions or [],
            "checklists": t.checklists or [],
            "cases": t.cases or [],
            "contacts": t.contacts or [],
        }
    )


# ======================================================================
# USERS
# ======================================================================
@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[UserOut]:
    users = db.query(User).order_by(User.created_at).all()
    return [UserOut.model_validate(u) for u in users]


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> UserOut:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    data = payload.model_dump(exclude_unset=True)
    # Prevent admin from demoting/disabling themselves in a way that locks everyone out.
    if user.id == admin.id:
        if "role" in data and data["role"] != "admin":
            raise HTTPException(400, "You cannot demote your own admin account")
        if "is_active" in data and not data["is_active"]:
            raise HTTPException(400, "You cannot deactivate your own account")
    for k, v in data.items():
        setattr(user, k, v)
    log_audit(
        db,
        actor=admin,
        action="update",
        entity="user",
        entity_id=str(user.id),
        summary=f"Updated user {user.email}",
        meta=data,
    )
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


# ======================================================================
# MODULE TEMPLATES
# ======================================================================
@router.get("/templates", response_model=list[ModuleTemplateOut])
def list_templates(db: Session = Depends(get_db)) -> list[ModuleTemplateOut]:
    items = db.query(ModuleTemplate).order_by(ModuleTemplate.created_at).all()
    return [_template_out(t) for t in items]


@router.post("/templates", response_model=ModuleTemplateOut, status_code=201)
def create_template(
    payload: ModuleTemplateCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> ModuleTemplateOut:
    tid = payload.id or _slugify(payload.name)
    if db.get(ModuleTemplate, tid):
        tid = f"{tid}-{uuid.uuid4().hex[:4]}"
    t = ModuleTemplate(
        id=tid,
        name=payload.name,
        description=payload.description,
        short=payload.short or _short(payload.name),
        color=payload.color,
        overview=payload.overview.model_dump(),
        chat_greeting=payload.chatGreeting,
        chat_suggestions=payload.chatSuggestions,
        checklists=[c.model_dump() for c in payload.checklists],
        cases=[c.model_dump() for c in payload.cases],
        contacts=[c.model_dump() for c in payload.contacts],
    )
    db.add(t)
    log_audit(db, actor=admin, action="create", entity="template", entity_id=tid, summary=f"Created template {t.name}")
    db.commit()
    db.refresh(t)
    return _template_out(t)


@router.patch("/templates/{template_id}", response_model=ModuleTemplateOut)
def update_template(
    template_id: str,
    payload: ModuleTemplateUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> ModuleTemplateOut:
    t = db.get(ModuleTemplate, template_id)
    if not t:
        raise HTTPException(404, "Template not found")
    data = payload.model_dump(exclude_unset=True)
    if "overview" in data and data["overview"] is not None:
        t.overview = data.pop("overview")
    if "chatGreeting" in data:
        t.chat_greeting = data.pop("chatGreeting") or ""
    if "chatSuggestions" in data:
        t.chat_suggestions = data.pop("chatSuggestions") or []
    if "checklists" in data and data["checklists"] is not None:
        t.checklists = [c if isinstance(c, dict) else c.model_dump() for c in data.pop("checklists")]
    if "cases" in data and data["cases"] is not None:
        t.cases = [c if isinstance(c, dict) else c.model_dump() for c in data.pop("cases")]
    if "contacts" in data and data["contacts"] is not None:
        t.contacts = [c if isinstance(c, dict) else c.model_dump() for c in data.pop("contacts")]
    for k, v in data.items():
        setattr(t, k, v)
    log_audit(db, actor=admin, action="update", entity="template", entity_id=t.id, summary=f"Updated template {t.name}")
    db.commit()
    db.refresh(t)
    return _template_out(t)


@router.delete("/templates/{template_id}", status_code=204)
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    t = db.get(ModuleTemplate, template_id)
    if not t:
        raise HTTPException(404, "Template not found")
    name = t.name
    db.delete(t)
    log_audit(db, actor=admin, action="delete", entity="template", entity_id=template_id, summary=f"Deleted template {name}")
    db.commit()


@router.post("/modules/instantiate", response_model=ModuleOut, status_code=201)
def instantiate_module(
    payload: InstantiateModuleRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> ModuleOut:
    template = db.get(ModuleTemplate, payload.template_id)
    if not template:
        raise HTTPException(404, "Template not found")
    mid = payload.id or _slugify(payload.name)
    if db.get(Module, mid):
        mid = f"{mid}-{uuid.uuid4().hex[:4]}"
    max_sort = db.query(func.coalesce(func.max(Module.sort_order), 0)).scalar() or 0
    mod = Module(
        id=mid,
        name=payload.name,
        short=template.short or _short(payload.name),
        color=template.color,
        progress=0,
        overview=template.overview or {},
        chat_greeting=template.chat_greeting,
        chat_suggestions=template.chat_suggestions or [],
        sort_order=int(max_sort) + 1,
    )
    db.add(mod)
    db.flush()
    # seed checklists
    for i, c in enumerate(template.checklists or []):
        cid = f"{mid}-cl-{uuid.uuid4().hex[:6]}"
        db.add(
            Checklist(
                id=cid,
                module_id=mid,
                title=c.get("title", "Checklist"),
                description=c.get("description", ""),
                steps=c.get("steps", []),
                sort_order=i,
            )
        )
    for c in template.cases or []:
        cid = f"{mid}-case-{uuid.uuid4().hex[:6]}"
        db.add(
            Case(
                id=cid,
                module_id=mid,
                summary=c.get("summary", ""),
                root_cause=c.get("root_cause", ""),
                resolution=c.get("resolution", ""),
                tags=c.get("tags", []),
                priority=c.get("priority", "Medium"),
                case_date=c.get("case_date", ""),
                team=c.get("team", ""),
                client_id=c.get("client_id", ""),
            )
        )
    for i, c in enumerate(template.contacts or []):
        db.add(
            Contact(
                module_id=mid,
                name=c.get("name", "Contact"),
                team=c.get("team", ""),
                role=c.get("role", ""),
                email=c.get("email", ""),
                initials=c.get("initials", ""),
                sort_order=i,
            )
        )
    log_audit(
        db,
        actor=admin,
        action="create",
        entity="module",
        entity_id=mid,
        summary=f"Instantiated module {mod.name} from template {template.name}",
        meta={"template_id": template.id},
    )
    db.commit()
    db.refresh(mod)
    return _module_out(mod)


# ======================================================================
# MODULES (admin-level rename / delete — kept separate from /api/modules)
# ======================================================================
@router.patch("/modules/{module_id}", response_model=ModuleOut)
def admin_update_module(
    module_id: str,
    payload: ModuleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
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
    log_audit(db, actor=admin, action="update", entity="module", entity_id=m.id, summary=f"Renamed/edited module {m.name}")
    db.commit()
    db.refresh(m)
    return _module_out(m)


@router.delete("/modules/{module_id}", status_code=204)
def admin_delete_module(
    module_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    m = db.get(Module, module_id)
    if not m:
        raise HTTPException(404, "Module not found")
    name = m.name
    db.delete(m)
    log_audit(db, actor=admin, action="delete", entity="module", entity_id=module_id, summary=f"Deleted module {name}")
    db.commit()


# ======================================================================
# GLOBAL RESOURCE LISTINGS
# ======================================================================
@router.get("/checklists", response_model=list[ChecklistOut])
def admin_list_checklists(
    module_id: str | None = None, db: Session = Depends(get_db)
) -> list[ChecklistOut]:
    q = db.query(Checklist)
    if module_id:
        q = q.filter(Checklist.module_id == module_id)
    items = q.order_by(Checklist.module_id, Checklist.sort_order).all()
    return [ChecklistOut.from_orm_checklist(c) for c in items]


@router.patch("/checklists/{checklist_id}", response_model=ChecklistOut)
def admin_update_checklist(
    checklist_id: str,
    payload: ChecklistUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> ChecklistOut:
    c = db.get(Checklist, checklist_id)
    if not c:
        raise HTTPException(404, "Checklist not found")
    data = payload.model_dump(exclude_unset=True)
    if "steps" in data and data["steps"] is not None:
        data["steps"] = [s if isinstance(s, dict) else s.model_dump() for s in data["steps"]]
    for k, v in data.items():
        setattr(c, k, v)
    log_audit(db, actor=admin, action="update", entity="checklist", entity_id=c.id, summary=f"Updated checklist {c.title}")
    db.commit()
    db.refresh(c)
    return ChecklistOut.from_orm_checklist(c)


@router.delete("/checklists/{checklist_id}", status_code=204)
def admin_delete_checklist(
    checklist_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    c = db.get(Checklist, checklist_id)
    if not c:
        raise HTTPException(404, "Checklist not found")
    title = c.title
    db.delete(c)
    log_audit(db, actor=admin, action="delete", entity="checklist", entity_id=checklist_id, summary=f"Deleted checklist {title}")
    db.commit()


@router.get("/cases", response_model=list[CaseOut])
def admin_list_cases(
    module_id: str | None = None,
    priority: str | None = None,
    tag: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
) -> list[CaseOut]:
    query = db.query(Case)
    if module_id:
        query = query.filter(Case.module_id == module_id)
    if priority:
        query = query.filter(Case.priority == priority)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Case.summary.ilike(like))
            | (Case.root_cause.ilike(like))
            | (Case.resolution.ilike(like))
            | (Case.client_id.ilike(like))
        )
    items = query.order_by(Case.created_at.desc()).all()
    if tag:
        items = [c for c in items if tag in (c.tags or [])]
    return [CaseOut.model_validate(c) for c in items]


@router.patch("/cases/{case_id}", response_model=CaseOut)
def admin_update_case(
    case_id: str,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> CaseOut:
    c = db.get(Case, case_id)
    if not c:
        raise HTTPException(404, "Case not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)
    log_audit(db, actor=admin, action="update", entity="case", entity_id=c.id, summary=f"Updated case {c.id}")
    db.commit()
    db.refresh(c)
    return CaseOut.model_validate(c)


@router.delete("/cases/{case_id}", status_code=204)
def admin_delete_case(
    case_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    c = db.get(Case, case_id)
    if not c:
        raise HTTPException(404, "Case not found")
    summary = c.summary
    db.delete(c)
    log_audit(db, actor=admin, action="delete", entity="case", entity_id=case_id, summary=f"Deleted case {summary[:80]}")
    db.commit()


@router.post("/cases/bulk-import", response_model=CSVImportResult)
async def admin_import_cases_csv(
    module_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> CSVImportResult:
    mod = db.get(Module, module_id)
    if not mod:
        raise HTTPException(404, "Module not found")
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file")
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    required = {"summary"}
    fieldnames = {(h or "").strip().lower() for h in (reader.fieldnames or [])}
    if not required.issubset(fieldnames):
        raise HTTPException(400, f"CSV missing required columns: {', '.join(sorted(required))}")

    created = 0
    skipped = 0
    errors: list[str] = []
    for i, row in enumerate(reader, start=2):  # header is line 1
        try:
            row_l = { (k or "").strip().lower(): (v or "").strip() for k, v in row.items() }
            summary = row_l.get("summary", "")
            if not summary:
                skipped += 1
                continue
            tags_raw = row_l.get("tags", "")
            tags = [t.strip() for t in tags_raw.split("|") if t.strip()] if tags_raw else []
            priority = row_l.get("priority") or "Medium"
            if priority not in {"Critical", "High", "Medium", "Low"}:
                priority = "Medium"
            cid = row_l.get("id") or f"{module_id}-case-{uuid.uuid4().hex[:6]}"
            if db.get(Case, cid):
                skipped += 1
                continue
            db.add(
                Case(
                    id=cid,
                    module_id=module_id,
                    summary=summary,
                    root_cause=row_l.get("root_cause", ""),
                    resolution=row_l.get("resolution", ""),
                    tags=tags,
                    priority=priority,
                    case_date=row_l.get("case_date", ""),
                    team=row_l.get("team", ""),
                    client_id=row_l.get("client_id", ""),
                )
            )
            created += 1
        except Exception as exc:  # noqa: BLE001
            errors.append(f"row {i}: {exc}")
            skipped += 1
    log_audit(
        db,
        actor=admin,
        action="create",
        entity="case",
        entity_id=module_id,
        summary=f"Bulk-imported {created} cases into {mod.name}",
        meta={"created": created, "skipped": skipped},
    )
    db.commit()
    return CSVImportResult(created=created, skipped=skipped, errors=errors)


@router.get("/contacts", response_model=list[ContactOut])
def admin_list_contacts(
    module_id: str | None = None, db: Session = Depends(get_db)
) -> list[ContactOut]:
    q = db.query(Contact)
    if module_id:
        q = q.filter(Contact.module_id == module_id)
    items = q.order_by(Contact.module_id, Contact.sort_order).all()
    return [ContactOut.model_validate(c) for c in items]


@router.patch("/contacts/{contact_id}", response_model=ContactOut)
def admin_update_contact(
    contact_id: int,
    payload: ContactUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> ContactOut:
    c = db.get(Contact, contact_id)
    if not c:
        raise HTTPException(404, "Contact not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)
    log_audit(db, actor=admin, action="update", entity="contact", entity_id=str(c.id), summary=f"Updated contact {c.name}")
    db.commit()
    db.refresh(c)
    return ContactOut.model_validate(c)


@router.delete("/contacts/{contact_id}", status_code=204)
def admin_delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    c = db.get(Contact, contact_id)
    if not c:
        raise HTTPException(404, "Contact not found")
    name = c.name
    db.delete(c)
    log_audit(db, actor=admin, action="delete", entity="contact", entity_id=str(contact_id), summary=f"Deleted contact {name}")
    db.commit()


@router.get("/tracking", response_model=list[TROut])
def admin_list_tracking(
    module_id: str | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
) -> list[TROut]:
    q = db.query(TrackingRequest)
    if module_id:
        q = q.filter(TrackingRequest.module_id == module_id)
    if status_filter:
        q = q.filter(TrackingRequest.status == status_filter)
    items = q.order_by(TrackingRequest.module_id, TrackingRequest.sort_order).all()
    return [TROut.model_validate(t) for t in items]


@router.patch("/tracking/{tracking_id}", response_model=TROut)
def admin_update_tr(
    tracking_id: str,
    payload: TRUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> TROut:
    t = db.get(TrackingRequest, tracking_id)
    if not t:
        raise HTTPException(404, "Tracking request not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(t, k, v)
    log_audit(db, actor=admin, action="update", entity="tracking", entity_id=t.id, summary=f"Updated tracking {t.title}")
    db.commit()
    db.refresh(t)
    return TROut.model_validate(t)


@router.delete("/tracking/{tracking_id}", status_code=204)
def admin_delete_tr(
    tracking_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    t = db.get(TrackingRequest, tracking_id)
    if not t:
        raise HTTPException(404, "Tracking request not found")
    title = t.title
    db.delete(t)
    log_audit(db, actor=admin, action="delete", entity="tracking", entity_id=tracking_id, summary=f"Deleted tracking {title}")
    db.commit()


@router.get("/attachments", response_model=list[AttachmentOut])
def admin_list_attachments(
    module_id: str | None = None, db: Session = Depends(get_db)
) -> list[AttachmentOut]:
    q = db.query(Attachment)
    if module_id:
        q = q.filter(Attachment.module_id == module_id)
    items = q.order_by(Attachment.module_id, Attachment.sort_order).all()
    return [AttachmentOut.model_validate(a) for a in items]


@router.delete("/attachments/{attachment_id}", status_code=204)
def admin_delete_attachment(
    attachment_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    a = db.get(Attachment, attachment_id)
    if not a:
        raise HTTPException(404, "Attachment not found")
    name = a.name
    db.delete(a)
    log_audit(db, actor=admin, action="delete", entity="attachment", entity_id=attachment_id, summary=f"Deleted attachment {name}")
    db.commit()


# ======================================================================
# AI INSIGHTS
# ======================================================================
@router.get("/ai/insights", response_model=list[AIQueryLogOut])
def admin_list_ai_insights(
    feedback: str | None = None,
    module_id: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[AIQueryLogOut]:
    q = db.query(AIQueryLog)
    if feedback in {"up", "down"}:
        q = q.filter(AIQueryLog.feedback == feedback)
    if module_id:
        q = q.filter(AIQueryLog.module_id == module_id)
    items = q.order_by(AIQueryLog.created_at.desc()).limit(max(1, min(limit, 500))).all()
    out: list[AIQueryLogOut] = []
    for log in items:
        user = db.get(User, log.user_id) if log.user_id else None
        mod = db.get(Module, log.module_id) if log.module_id else None
        out.append(
            AIQueryLogOut(
                id=log.id,
                user_id=log.user_id,
                user_email=(user.email if user else ""),
                module_id=log.module_id,
                module_name=(mod.name if mod else ""),
                query=log.query,
                response=log.response or {},
                feedback=log.feedback if log.feedback in {"up", "down"} else None,
                feedback_note=log.feedback_note or "",
                created_at=log.created_at,
            )
        )
    return out


# ======================================================================
# AUDIT LOG
# ======================================================================
@router.get("/audit", response_model=list[AuditLogOut])
def admin_list_audit(
    entity: str | None = None,
    action: str | None = None,
    limit: int = 200,
    db: Session = Depends(get_db),
) -> list[AuditLogOut]:
    q = db.query(AuditLog)
    if entity:
        q = q.filter(AuditLog.entity == entity)
    if action:
        q = q.filter(AuditLog.action == action)
    items = q.order_by(AuditLog.created_at.desc()).limit(max(1, min(limit, 1000))).all()
    return [AuditLogOut.model_validate(a) for a in items]


# ======================================================================
# ANALYTICS OVERVIEW
# ======================================================================
@router.get("/analytics/overview", response_model=AnalyticsOverview)
def admin_analytics_overview(db: Session = Depends(get_db)) -> AnalyticsOverview:
    since = datetime.now(timezone.utc) - timedelta(days=7)
    modules = db.query(Module).all()

    cases_per_module: list[AnalyticsModuleStat] = []
    total_cases = 0
    total_checklists = 0
    for m in modules:
        cc = db.query(func.count(Case.id)).filter(Case.module_id == m.id).scalar() or 0
        cl = db.query(func.count(Checklist.id)).filter(Checklist.module_id == m.id).scalar() or 0
        total_cases += cc
        total_checklists += cl
        cases_per_module.append(
            AnalyticsModuleStat(
                module_id=m.id, module_name=m.name, case_count=int(cc), checklist_count=int(cl)
            )
        )

    # Top tags across all cases (SQLite JSON can't LIKE-search portably, so compute in Python).
    tag_counts: dict[str, int] = {}
    for c in db.query(Case).all():
        for tag in c.tags or []:
            if not isinstance(tag, str):
                continue
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    top_tags = [
        AnalyticsTagCount(tag=t, count=n)
        for t, n in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    ]

    recent = (
        db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(15).all()
    )
    recent_activity = [
        AnalyticsActivityItem(
            id=r.id,
            actor_email=r.actor_email or "",
            action=r.action,
            entity=r.entity,
            entity_id=r.entity_id,
            summary=r.summary,
            created_at=r.created_at,
        )
        for r in recent
    ]

    return AnalyticsOverview(
        total_modules=len(modules),
        total_cases=total_cases,
        total_checklists=total_checklists,
        total_contacts=db.query(func.count(Contact.id)).scalar() or 0,
        total_tracking=db.query(func.count(TrackingRequest.id)).scalar() or 0,
        total_attachments=db.query(func.count(Attachment.id)).scalar() or 0,
        total_users=db.query(func.count(User.id)).scalar() or 0,
        total_admins=db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0,
        ai_queries_total=db.query(func.count(AIQueryLog.id)).scalar() or 0,
        ai_queries_last_7d=db.query(func.count(AIQueryLog.id))
        .filter(AIQueryLog.created_at >= since)
        .scalar()
        or 0,
        ai_feedback_up=db.query(func.count(AIQueryLog.id)).filter(AIQueryLog.feedback == "up").scalar() or 0,
        ai_feedback_down=db.query(func.count(AIQueryLog.id)).filter(AIQueryLog.feedback == "down").scalar() or 0,
        cases_per_module=cases_per_module,
        top_tags=top_tags,
        recent_activity=recent_activity,
    )


# silence unused-import warnings for status
_ = status
