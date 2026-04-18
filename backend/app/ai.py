from __future__ import annotations

import json
import logging
from typing import Any

from openai import OpenAI

from .config import get_settings
from .models import Case, Checklist, Module
from .schemas import AIResponse, AIRootCause, AISimilarCase

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are Rexora AI, an expert triage assistant for enterprise support engineers \
working on finance / data / integration modules (e.g. Bank Reconciliation, Intercompany, ETL).

Given a user issue and structured context about the active module (past cases, checklists, \
overview), produce a *structured* troubleshooting response.

You MUST respond with a single JSON object that matches this schema:
{
  "rootCauses": [{"label": "<short root cause>", "confidence": <int 0-100>}, ...],
  "steps": ["<imperative troubleshooting step>", ...],
  "similarCases": [{"id": "<case id>", "title": "<short case title>", "tag": "<one tag>"}, ...],
  "finalFix": "<one or two sentences describing the final recommended fix>",
  "notes": "<any important caveats or follow-ups>"
}

Rules:
- Prefer 2-4 root causes sorted by confidence desc. Confidence sums loosely (not strictly 100).
- 4-8 concrete troubleshooting steps.
- Only cite similar cases that appear in the provided context. Use their real IDs.
- finalFix must be actionable and specific. No filler.
- notes: short, practical; surface risks or monitoring suggestions.
- No markdown, no prose outside the JSON object.
"""


def _build_context(module: Module, cases: list[Case], checklists: list[Checklist]) -> str:
    overview_obj: dict[str, Any] = module.overview or {}
    ctx = {
        "module": {
            "id": module.id,
            "name": module.name,
            "overview": {
                "tagline": overview_obj.get("tagline", ""),
                "heroBody": overview_obj.get("heroBody", ""),
                "sections": [
                    {"title": s.get("title", ""), "body": s.get("body", "")}
                    for s in overview_obj.get("sections", [])
                ],
            },
        },
        "pastCases": [
            {
                "id": c.id,
                "summary": c.summary,
                "rootCause": c.root_cause,
                "resolution": c.resolution,
                "tags": c.tags or [],
                "priority": c.priority,
            }
            for c in cases[:20]
        ],
        "checklists": [
            {
                "title": cl.title,
                "description": cl.description,
                "steps": [s.get("label", "") for s in (cl.steps or [])],
            }
            for cl in checklists[:10]
        ],
    }
    return json.dumps(ctx, ensure_ascii=False)


def _stub_response(user_message: str, cases: list[Case]) -> AIResponse:
    """Deterministic fallback when OpenAI isn't configured."""
    similar = [
        AISimilarCase(id=c.id, title=c.summary[:80], tag=(c.tags or ["General"])[0])
        for c in cases[:3]
    ]
    return AIResponse(
        rootCauses=[
            AIRootCause(label="Missing/stale configuration or mapping", confidence=62),
            AIRootCause(label="Upstream data-format or schema drift", confidence=48),
            AIRootCause(label="Resource saturation / timeout in processing engine", confidence=28),
        ],
        steps=[
            "Reproduce the issue with trace logging enabled and capture the exact error payload.",
            "Validate the input contract (file format, schema, tolerances) against the module's expected spec.",
            "Check recent configuration or mapping changes in the last 7 days.",
            "Inspect processing queue depth and worker pool utilization.",
            "Compare the failure signature against the similar past cases and apply the closest resolution.",
        ],
        similarCases=similar,
        finalFix=(
            "Apply the closest matching resolution from similar past cases; if none match, "
            "roll back the most recent configuration change and re-run the failing job with debug tracing. "
            f"(User reported: {user_message[:120]})"
        ),
        notes="OpenAI API key is not configured on the server — this is a heuristic fallback. "
        "Set OPENAI_API_KEY to enable full AI triage.",
    )


def triage(module: Module, cases: list[Case], checklists: list[Checklist], user_message: str) -> AIResponse:
    settings = get_settings()
    if not settings.openai_api_key:
        logger.info("OPENAI_API_KEY not set — returning stub AI response")
        return _stub_response(user_message, cases)

    client = OpenAI(api_key=settings.openai_api_key)
    context = _build_context(module, cases, checklists)

    try:
        completion = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Module context:\n{context}\n\n"
                        f"Engineer's issue:\n{user_message}\n\n"
                        "Respond with the structured JSON described in the system prompt."
                    ),
                },
            ],
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)
        return AIResponse.model_validate(data)
    except Exception:
        logger.exception("OpenAI call failed — falling back to stub response")
        return _stub_response(user_message, cases)
