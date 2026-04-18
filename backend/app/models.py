from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    short: Mapped[str] = mapped_column(String(16), nullable=False, default="")
    color: Mapped[str] = mapped_column(String(64), nullable=False, default="oklch(0.55 0.2 278)")
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Overview stored as JSON for flexibility (see schemas.Overview)
    overview: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    chat_greeting: Mapped[str] = mapped_column(Text, nullable=False, default="")
    chat_suggestions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    checklists: Mapped[list[Checklist]] = relationship(
        back_populates="module", cascade="all, delete-orphan", order_by="Checklist.sort_order"
    )
    cases: Mapped[list[Case]] = relationship(
        back_populates="module", cascade="all, delete-orphan", order_by="Case.created_at.desc()"
    )
    contacts: Mapped[list[Contact]] = relationship(
        back_populates="module", cascade="all, delete-orphan", order_by="Contact.sort_order"
    )
    tracking_requests: Mapped[list[TrackingRequest]] = relationship(
        back_populates="module", cascade="all, delete-orphan", order_by="TrackingRequest.sort_order"
    )
    attachments: Mapped[list[Attachment]] = relationship(
        back_populates="module", cascade="all, delete-orphan", order_by="Attachment.sort_order"
    )


class Checklist(Base):
    __tablename__ = "checklists"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module_id: Mapped[str] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # Steps stored as JSON array: [{id, label, done, detail?}]
    steps: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    module: Mapped[Module] = relationship(back_populates="checklists")


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module_id: Mapped[str] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    root_cause: Mapped[str] = mapped_column(Text, nullable=False, default="")
    resolution: Mapped[str] = mapped_column(Text, nullable=False, default="")
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    priority: Mapped[str] = mapped_column(String(16), nullable=False, default="Medium")
    case_date: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    team: Mapped[str] = mapped_column(String(16), nullable=False, default="")
    client_id: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    module: Mapped[Module] = relationship(back_populates="cases")


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    module_id: Mapped[str] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    team: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    role: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    initials: Mapped[str] = mapped_column(String(8), nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    module: Mapped[Module] = relationship(back_populates="contacts")


class TrackingRequest(Base):
    __tablename__ = "tracking_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module_id: Mapped[str] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="Open")
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    module: Mapped[Module] = relationship(back_populates="tracking_requests")


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module_id: Mapped[str] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)  # document | video | ppt
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    size: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    duration: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    file_type: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    url: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    updated: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    module: Mapped[Module] = relationship(back_populates="attachments")
