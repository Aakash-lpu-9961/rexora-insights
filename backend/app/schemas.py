from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(default="", max_length=200)


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    name: str


# ---------- Shared JSON shapes ----------
class OverviewStat(BaseModel):
    label: str
    value: str
    trend: str = ""
    tone: Literal["success", "warning", "info"] = "info"


class OverviewSection(BaseModel):
    id: str
    iconKey: Literal["workflow", "lightbulb", "book"] = "workflow"
    title: str
    body: str


class OverviewFeaturedVideo(BaseModel):
    title: str = ""
    duration: str = ""
    description: str = ""


class Overview(BaseModel):
    tagline: str = ""
    heroLead: str = ""
    heroBody: str = ""
    chips: list[str] = Field(default_factory=list)
    stats: list[OverviewStat] = Field(default_factory=list)
    sections: list[OverviewSection] = Field(default_factory=list)
    featuredVideo: OverviewFeaturedVideo = Field(default_factory=OverviewFeaturedVideo)


class Step(BaseModel):
    id: str
    label: str
    done: bool = False
    detail: str | None = None


# ---------- Modules ----------
class ModuleBase(BaseModel):
    name: str
    short: str = ""
    color: str = "oklch(0.55 0.2 278)"
    progress: int = 0
    overview: Overview = Field(default_factory=Overview)
    chatGreeting: str = ""
    chatSuggestions: list[str] = Field(default_factory=list)


class ModuleCreate(ModuleBase):
    id: str | None = None


class ModuleUpdate(BaseModel):
    name: str | None = None
    short: str | None = None
    color: str | None = None
    progress: int | None = None
    overview: Overview | None = None
    chatGreeting: str | None = None
    chatSuggestions: list[str] | None = None


class ModuleOut(ModuleBase):
    model_config = ConfigDict(from_attributes=True)
    id: str


# ---------- Checklists ----------
class ChecklistBase(BaseModel):
    title: str
    description: str = ""
    steps: list[Step] = Field(default_factory=list)


class ChecklistCreate(ChecklistBase):
    pass


class ChecklistUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    steps: list[Step] | None = None


class ChecklistOut(ChecklistBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    module_id: str
    progress: int = 0

    @classmethod
    def from_orm_checklist(cls, c) -> "ChecklistOut":  # noqa: ANN001
        steps = [Step(**s) if isinstance(s, dict) else s for s in (c.steps or [])]
        total = len(steps)
        done = sum(1 for s in steps if s.done)
        progress = int(round(100 * done / total)) if total else 0
        return cls(
            id=c.id,
            module_id=c.module_id,
            title=c.title,
            description=c.description,
            steps=steps,
            progress=progress,
        )


# ---------- Cases ----------
class CaseBase(BaseModel):
    summary: str
    root_cause: str = ""
    resolution: str = ""
    tags: list[str] = Field(default_factory=list)
    priority: Literal["Critical", "High", "Medium", "Low"] = "Medium"
    case_date: str = ""
    team: str = ""
    client_id: str = ""


class CaseCreate(CaseBase):
    id: str | None = None


class CaseUpdate(BaseModel):
    summary: str | None = None
    root_cause: str | None = None
    resolution: str | None = None
    tags: list[str] | None = None
    priority: Literal["Critical", "High", "Medium", "Low"] | None = None
    case_date: str | None = None
    team: str | None = None
    client_id: str | None = None


class CaseOut(CaseBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    module_id: str


# ---------- Contacts ----------
class ContactBase(BaseModel):
    name: str
    team: str = ""
    role: str = ""
    email: str = ""
    initials: str = ""


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    name: str | None = None
    team: str | None = None
    role: str | None = None
    email: str | None = None
    initials: str | None = None


class ContactOut(ContactBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    module_id: str


# ---------- Tracking Requests ----------
class TRBase(BaseModel):
    title: str
    description: str = ""
    status: Literal["Open", "In Review", "In Progress", "Done"] = "Open"
    tags: list[str] = Field(default_factory=list)


class TRCreate(TRBase):
    id: str | None = None


class TRUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: Literal["Open", "In Review", "In Progress", "Done"] | None = None
    tags: list[str] | None = None


class TROut(TRBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    module_id: str


# ---------- Attachments ----------
class AttachmentBase(BaseModel):
    kind: Literal["document", "video", "ppt"]
    name: str
    size: str = ""
    duration: str = ""
    file_type: str = ""
    url: str = ""
    updated: str = ""


class AttachmentCreate(AttachmentBase):
    id: str | None = None


class AttachmentUpdate(BaseModel):
    kind: Literal["document", "video", "ppt"] | None = None
    name: str | None = None
    size: str | None = None
    duration: str | None = None
    file_type: str | None = None
    url: str | None = None
    updated: str | None = None


class AttachmentOut(AttachmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    module_id: str


# ---------- AI ----------
class ChatRequest(BaseModel):
    module_id: str
    message: str


class AIRootCause(BaseModel):
    label: str
    confidence: int = Field(ge=0, le=100)


class AISimilarCase(BaseModel):
    id: str
    title: str
    tag: str = ""


class AIResponse(BaseModel):
    rootCauses: list[AIRootCause]
    steps: list[str]
    similarCases: list[AISimilarCase]
    finalFix: str
    notes: str


TokenResponse.model_rebuild()
