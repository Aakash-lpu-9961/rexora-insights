"""Seed the database with the demo user and the Bank Reconciliation module.

Runs automatically on startup when the target tables are empty.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from .auth import hash_password
from .config import get_settings
from .models import (
    Attachment,
    Case,
    Checklist,
    Contact,
    Module,
    TrackingRequest,
    User,
)

logger = logging.getLogger(__name__)


def seed_if_empty(db: Session) -> None:
    settings = get_settings()

    # --- Demo user ---
    if not db.query(User).first():
        demo = User(
            email=settings.seed_demo_user_email,
            name=settings.seed_demo_user_name,
            hashed_password=hash_password(settings.seed_demo_user_password),
        )
        db.add(demo)
        logger.info("Seeded demo user %s", settings.seed_demo_user_email)

    # --- Modules ---
    if db.query(Module).first():
        db.commit()
        return

    bank_recon = Module(
        id="bank-recon",
        name="Bank Reconciliation",
        short="BR",
        color="oklch(0.55 0.2 278)",
        progress=67,
        sort_order=1,
        overview={
            "tagline": "The reconciliation backbone of Voyager 7S.",
            "heroLead": "Production · v7.4.2",
            "heroBody": (
                "Bank Reconciliation matches millions of bank-side transactions against ledger "
                "entries each day, flags anomalies, and proposes AI-driven fixes. This module is "
                "the most critical leg of the close cycle."
            ),
            "chips": ["Auto-match", "FX-aware", "Multi-currency", "Real-time", "Audit-grade"],
            "stats": [
                {"label": "Open cases", "value": "12", "trend": "+2", "tone": "warning"},
                {"label": "Resolved this week", "value": "47", "trend": "+18%", "tone": "success"},
                {"label": "Avg. resolution", "value": "38m", "trend": "-12m", "tone": "info"},
            ],
            "sections": [
                {
                    "id": "func",
                    "iconKey": "workflow",
                    "title": "How it works in Voyager 7S",
                    "body": (
                        "Ingests MT940/CAMT.053/BAI2, normalizes to canonical ledger, then runs "
                        "a multi-pass matching pipeline against GL entries. Unmatched items flow "
                        "into the triage queue with AI-suggested resolutions."
                    ),
                },
                {
                    "id": "usage",
                    "iconKey": "lightbulb",
                    "title": "Real-life usage examples",
                    "body": (
                        "Treasury ops reconciles 14M+ daily transactions across 47 banking partners. "
                        "Engineers triage import failures, FX mismatches and posting anomalies — "
                        "typically resolving 3.4x faster than the legacy console."
                    ),
                },
                {
                    "id": "func2",
                    "iconKey": "book",
                    "title": "Module functionality",
                    "body": (
                        "Auto-match engine, tolerance configuration per pool, FX snapshot scheduling, "
                        "idempotent journal posting, unmatched triage workflow, and full audit trail "
                        "with point-in-time replay."
                    ),
                },
            ],
            "featuredVideo": {
                "title": "Auto-match Engine Deep Dive",
                "duration": "12:48",
                "description": (
                    "Walks through how the matching pipeline scores candidate pairs, applies "
                    "tolerances, and falls back to AI suggestions."
                ),
            },
        },
        chat_greeting=(
            "Hi — I'm Rexora AI for Bank Reconciliation. Describe your issue and I'll triage "
            "root causes, suggest fixes, and pull similar past cases."
        ),
        chat_suggestions=[
            "Auto-match rate dropped overnight on the USD pool.",
            "MT940 import failing with encoding error.",
            "Reconciliation engine timing out on large ledgers.",
            "Duplicate journal entries posted on retry.",
        ],
    )
    intercompany = Module(
        id="intercompany",
        name="Intercompany",
        short="IC",
        color="oklch(0.65 0.16 200)",
        progress=34,
        sort_order=2,
        overview={
            "tagline": "Cross-entity balances, netted and auditable.",
            "heroLead": "Production · v7.4.2",
            "heroBody": (
                "Intercompany keeps affiliate balances aligned by netting IC invoices, settling "
                "variances, and generating elimination entries for consolidation."
            ),
            "chips": ["Netting", "Elimination", "Multi-entity"],
            "stats": [
                {"label": "Open cases", "value": "5", "trend": "+1", "tone": "warning"},
                {"label": "Resolved this week", "value": "18", "trend": "+9%", "tone": "success"},
                {"label": "Avg. resolution", "value": "1h 4m", "trend": "-6m", "tone": "info"},
            ],
            "sections": [],
        },
        chat_greeting="Hi — I'm Rexora AI for Intercompany. How can I help?",
        chat_suggestions=[
            "Netting batch failed for APAC entities.",
            "Elimination JE not posting to consolidation.",
        ],
    )
    etl = Module(
        id="etl",
        name="ETL",
        short="ETL",
        color="oklch(0.7 0.15 155)",
        progress=52,
        sort_order=3,
        overview={
            "tagline": "Ingestion pipelines that never sleep.",
            "heroLead": "Production · v7.4.2",
            "heroBody": "ETL ingests bank statements, ERP exports, and market data into the canonical ledger.",
            "chips": ["Batch", "Streaming", "Schema drift"],
            "stats": [
                {"label": "Open cases", "value": "9", "trend": "0", "tone": "info"},
                {"label": "Resolved this week", "value": "31", "trend": "+6%", "tone": "success"},
                {"label": "Avg. resolution", "value": "46m", "trend": "-2m", "tone": "info"},
            ],
            "sections": [],
        },
        chat_greeting="Hi — I'm Rexora AI for ETL. How can I help?",
        chat_suggestions=[
            "Schema drift on vendor feed.",
            "Stream consumer lagging behind.",
        ],
    )

    db.add_all([bank_recon, intercompany, etl])
    db.flush()

    # Checklists
    checklists = [
        Checklist(
            id="c1",
            module_id="bank-recon",
            title="Bank statement import failure",
            description="Standard checks when MT940/CAMT files fail to import",
            sort_order=1,
            steps=[
                {"id": "s1", "label": "Verify file format & encoding (UTF-8)", "done": True,
                 "detail": "Open in a hex editor and confirm BOM is absent."},
                {"id": "s2", "label": "Check bank profile mapping in Voyager 7S", "done": True,
                 "detail": "Go to Settings → Bank Profiles."},
                {"id": "s3", "label": "Validate cut-off date alignment", "done": True,
                 "detail": "Cut-off must match bank close date."},
                {"id": "s4", "label": "Re-run import job in debug mode", "done": False,
                 "detail": "Enable trace logs before retrying."},
                {"id": "s5", "label": "Inspect ETL queue for stuck records", "done": False},
            ],
        ),
        Checklist(
            id="c2",
            module_id="bank-recon",
            title="Unmatched transactions investigation",
            description="Diagnose why entries fail auto-matching",
            sort_order=2,
            steps=[
                {"id": "s1", "label": "Pull last 24h unmatched batch", "done": True},
                {"id": "s2", "label": "Compare amounts with tolerance settings", "done": False},
                {"id": "s3", "label": "Verify counterparty IDs", "done": False},
                {"id": "s4", "label": "Check FX rate snapshot timing", "done": False},
            ],
        ),
        Checklist(
            id="c3",
            module_id="bank-recon",
            title="Reconciliation engine slow / timeout",
            description="Performance triage steps for the matching engine",
            sort_order=3,
            steps=[
                {"id": "s1", "label": "Check DB connection pool saturation", "done": False},
                {"id": "s2", "label": "Review recent index changes", "done": False},
                {"id": "s3", "label": "Inspect long-running queries", "done": False},
            ],
        ),
    ]
    db.add_all(checklists)

    cases = [
        Case(
            id="BR-2041",
            module_id="bank-recon",
            summary="MT940 import failing for Citi EMEA accounts after region migration",
            root_cause="Bank profile mapping pointed to legacy region code post-migration",
            resolution="Updated Bank Profile EMEA mapping to new region code; re-ran import job successfully.",
            tags=["Import", "MT940", "Citi", "Regression"],
            priority="High",
            case_date="2025-09-12",
            team="NY",
            client_id="ACME-001",
        ),
        Case(
            id="BR-2098",
            module_id="bank-recon",
            summary="Auto-match rate dropped to 41% overnight on USD pool",
            root_cause="FX rate snapshot job ran 30 minutes late, causing tolerance miss",
            resolution="Realigned cron + added 1bps tolerance buffer for USD pool only.",
            tags=["Matching", "FX", "Performance"],
            priority="Critical",
            case_date="2025-10-03",
            team="CND",
            client_id="GLOBEX-014",
        ),
        Case(
            id="BR-2114",
            module_id="bank-recon",
            summary="Intermittent timeout on reconciliation engine for ledger > 2M rows",
            root_cause="Missing composite index on (account_id, value_date)",
            resolution="Added index; engine runtime dropped from 14m → 38s.",
            tags=["Performance", "DB", "Index"],
            priority="High",
            case_date="2025-10-21",
            team="TX",
            client_id="SOYLENT-077",
        ),
        Case(
            id="BR-2156",
            module_id="bank-recon",
            summary="Duplicate journal entries posted on retry",
            root_cause="Idempotency key was reset on engine restart",
            resolution="Persisted idempotency keys to Redis with 24h TTL.",
            tags=["Posting", "Idempotency", "Duplicates"],
            priority="Critical",
            case_date="2025-11-04",
            team="NC",
            client_id="INITECH-042",
        ),
    ]
    db.add_all(cases)

    contacts = [
        Contact(module_id="bank-recon", name="Aarav Mehta", team="Engineering",
                role="Tech Lead — Bank Recon", email="aarav.mehta@rexora.io", initials="AM", sort_order=1),
        Contact(module_id="bank-recon", name="Priya Shah", team="Product",
                role="Product Manager", email="priya.shah@rexora.io", initials="PS", sort_order=2),
        Contact(module_id="bank-recon", name="Diego Alvarez", team="Support",
                role="L3 Support Engineer", email="diego.alvarez@rexora.io", initials="DA", sort_order=3),
        Contact(module_id="bank-recon", name="Linh Tran", team="Engineering",
                role="Backend Engineer", email="linh.tran@rexora.io", initials="LT", sort_order=4),
        Contact(module_id="bank-recon", name="Marcus O'Connor", team="Operations",
                role="Reconciliation Ops Lead", email="marcus.oconnor@rexora.io", initials="MO", sort_order=5),
        Contact(module_id="bank-recon", name="Sara Bensalem", team="Data",
                role="Data Platform Engineer", email="sara.bensalem@rexora.io", initials="SB", sort_order=6),
    ]
    db.add_all(contacts)

    trs = [
        TrackingRequest(id="TR-7821", module_id="bank-recon",
                        title="Add tolerance override per counterparty",
                        description="Allow per-counterparty tolerance instead of global only.",
                        status="In Review", tags=["Enhancement", "Matching"], sort_order=1),
        TrackingRequest(id="TR-7844", module_id="bank-recon",
                        title="Investigate posting lag on EOD batch",
                        description="EOD posting is taking 12+ minutes for APAC books.",
                        status="In Progress", tags=["Bug", "Performance"], sort_order=2),
        TrackingRequest(id="TR-7901", module_id="bank-recon",
                        title="Export unmatched report to Parquet",
                        description="Data team requested Parquet output for downstream lake.",
                        status="Open", tags=["Feature", "Data"], sort_order=3),
        TrackingRequest(id="TR-7912", module_id="bank-recon",
                        title="FX snapshot scheduling UI",
                        description="Build UI to manage FX snapshot cron windows.",
                        status="Done", tags=["UI", "FX"], sort_order=4),
    ]
    db.add_all(trs)

    attachments = [
        Attachment(id="d1", module_id="bank-recon", kind="document",
                   name="BankRecon_RuntimeGuide_v3.pdf", size="2.4 MB", updated="Nov 12, 2025",
                   file_type="PDF", sort_order=1),
        Attachment(id="d2", module_id="bank-recon", kind="document",
                   name="MT940_Format_Reference.pdf", size="812 KB", updated="Oct 28, 2025",
                   file_type="PDF", sort_order=2),
        Attachment(id="d3", module_id="bank-recon", kind="document",
                   name="Voyager7S_BankProfile_Setup.docx", size="340 KB", updated="Sep 04, 2025",
                   file_type="DOCX", sort_order=3),
        Attachment(id="v1", module_id="bank-recon", kind="video",
                   name="Auto-match Engine Deep Dive", duration="12:48", updated="Nov 02, 2025",
                   sort_order=1),
        Attachment(id="v2", module_id="bank-recon", kind="video",
                   name="Onboarding a New Bank Profile", duration="08:22", updated="Oct 14, 2025",
                   sort_order=2),
        Attachment(id="v3", module_id="bank-recon", kind="video",
                   name="Triaging Unmatched Transactions", duration="15:10", updated="Sep 30, 2025",
                   sort_order=3),
        Attachment(id="p1", module_id="bank-recon", kind="ppt",
                   name="Bank Recon — Architecture Overview.pptx", size="5.1 MB", updated="Nov 08, 2025",
                   sort_order=1),
        Attachment(id="p2", module_id="bank-recon", kind="ppt",
                   name="Q4 Roadmap — Matching Engine.pptx", size="3.7 MB", updated="Oct 22, 2025",
                   sort_order=2),
    ]
    db.add_all(attachments)

    db.commit()
    logger.info("Seeded Rexora demo data (modules, checklists, cases, contacts, TRs, attachments)")
