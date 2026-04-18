import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// ---------- Types ----------
export type Step = { id: string; label: string; done: boolean; detail?: string };
export type Checklist = { id: string; title: string; description: string; progress: number; steps: Step[] };
export type PastCase = {
  id: string; summary: string; rootCause: string; resolution: string;
  tags: string[]; priority: "Critical" | "High" | "Medium" | "Low"; date: string; team: string;
};
export type Contact = { name: string; team: string; role: string; email: string; initials: string };
export type TR = { id: string; title: string; description: string; status: "Open" | "In Review" | "In Progress" | "Done"; tags: string[] };
export type DocFile = { id: string; name: string; size: string; updated: string; type: string };
export type VideoFile = { id: string; name: string; duration: string; updated: string };
export type PptFile = { id: string; name: string; size: string; updated: string };
export type Attachments = { documents: DocFile[]; videos: VideoFile[]; ppts: PptFile[] };
export type AIPayload = {
  rootCauses: { label: string; confidence: number }[];
  steps: string[];
  similarCases: { id: string; title: string; tag: string }[];
  finalFix: string;
  notes: string;
};
export type OverviewSection = { id: string; iconKey: "workflow" | "lightbulb" | "book"; title: string; body: string };
export type Overview = {
  tagline: string;
  heroLead: string;
  heroBody: string;
  chips: string[];
  stats: { label: string; value: string; trend: string; tone: "success" | "warning" | "info" }[];
  sections: OverviewSection[];
  featuredVideo: { title: string; duration: string; description: string };
};

export type Module = {
  id: string;
  name: string;
  short: string;
  color: string;
  progress: number;
  data: {
    overview: Overview;
    checklists: Checklist[];
    cases: PastCase[];
    contacts: Contact[];
    tracking: TR[];
    attachments: Attachments;
    chatSeed: AIPayload;
    chatGreeting: string;
    chatSuggestions: string[];
  };
};

// ---------- Seed data ----------
const bankRecon: Module = {
  id: "bank-recon",
  name: "Bank Reconciliation",
  short: "BR",
  color: "oklch(0.55 0.2 278)",
  progress: 67,
  data: {
    overview: {
      tagline: "The reconciliation backbone of Voyager 7S.",
      heroLead: "Production · v7.4.2",
      heroBody:
        "Bank Reconciliation matches millions of bank-side transactions against ledger entries each day, flags anomalies, and proposes AI-driven fixes. This module is the most critical leg of the close cycle.",
      chips: ["Auto-match", "FX-aware", "Multi-currency", "Real-time", "Audit-grade"],
      stats: [
        { label: "Open cases", value: "12", trend: "+2", tone: "warning" },
        { label: "Resolved this week", value: "47", trend: "+18%", tone: "success" },
        { label: "Avg. resolution", value: "38m", trend: "-12m", tone: "info" },
      ],
      sections: [
        { id: "func", iconKey: "workflow", title: "How it works in Voyager 7S",
          body: "Ingests MT940/CAMT.053/BAI2, normalizes to canonical ledger, then runs a multi-pass matching pipeline against GL entries. Unmatched items flow into the triage queue with AI-suggested resolutions." },
        { id: "usage", iconKey: "lightbulb", title: "Real-life usage examples",
          body: "Treasury ops reconciles 14M+ daily transactions across 47 banking partners. Engineers triage import failures, FX mismatches and posting anomalies — typically resolving 3.4x faster than the legacy console." },
        { id: "func2", iconKey: "book", title: "Module functionality",
          body: "Auto-match engine, tolerance configuration per pool, FX snapshot scheduling, idempotent journal posting, unmatched triage workflow, and full audit trail with point-in-time replay." },
      ],
      featuredVideo: { title: "Auto-match Engine Deep Dive", duration: "12:48",
        description: "Walks through how the matching pipeline scores candidate pairs, applies tolerances, and falls back to AI suggestions." },
    },
    checklists: [
      { id: "c1", title: "Bank statement import failure", description: "Standard checks when MT940/CAMT files fail to import", progress: 60, steps: [
        { id: "s1", label: "Verify file format & encoding (UTF-8)", done: true, detail: "Open in a hex editor and confirm BOM is absent." },
        { id: "s2", label: "Check bank profile mapping in Voyager 7S", done: true, detail: "Go to Settings → Bank Profiles." },
        { id: "s3", label: "Validate cut-off date alignment", done: true, detail: "Cut-off must match bank close date." },
        { id: "s4", label: "Re-run import job in debug mode", done: false, detail: "Enable trace logs before retrying." },
        { id: "s5", label: "Inspect ETL queue for stuck records", done: false },
      ]},
      { id: "c2", title: "Unmatched transactions investigation", description: "Diagnose why entries fail auto-matching", progress: 25, steps: [
        { id: "s1", label: "Pull last 24h unmatched batch", done: true },
        { id: "s2", label: "Compare amounts with tolerance settings", done: false },
        { id: "s3", label: "Verify counterparty IDs", done: false },
        { id: "s4", label: "Check FX rate snapshot timing", done: false },
      ]},
      { id: "c3", title: "Reconciliation engine slow / timeout", description: "Performance triage steps for the matching engine", progress: 0, steps: [
        { id: "s1", label: "Check DB connection pool saturation", done: false },
        { id: "s2", label: "Review recent index changes", done: false },
        { id: "s3", label: "Inspect long-running queries", done: false },
      ]},
    ],
    cases: [
      { id: "BR-2041", summary: "MT940 import failing for Citi EMEA accounts after region migration", rootCause: "Bank profile mapping pointed to legacy region code post-migration", resolution: "Updated Bank Profile EMEA mapping to new region code; re-ran import job successfully.", tags: ["Import", "MT940", "Citi", "Regression"], priority: "High", date: "2025-09-12", team: "NY" },
      { id: "BR-2098", summary: "Auto-match rate dropped to 41% overnight on USD pool", rootCause: "FX rate snapshot job ran 30 minutes late, causing tolerance miss", resolution: "Realigned cron + added 1bps tolerance buffer for USD pool only.", tags: ["Matching", "FX", "Performance"], priority: "Critical", date: "2025-10-03", team: "CND" },
      { id: "BR-2114", summary: "Intermittent timeout on reconciliation engine for ledger > 2M rows", rootCause: "Missing composite index on (account_id, value_date)", resolution: "Added index; engine runtime dropped from 14m → 38s.", tags: ["Performance", "DB", "Index"], priority: "High", date: "2025-10-21", team: "TX" },
      { id: "BR-2156", summary: "Duplicate journal entries posted on retry", rootCause: "Idempotency key was reset on engine restart", resolution: "Persisted idempotency keys to Redis with 24h TTL.", tags: ["Posting", "Idempotency", "Duplicates"], priority: "Critical", date: "2025-11-04", team: "NC" },
    ],
    contacts: [
      { name: "Aarav Mehta", team: "Engineering", role: "Tech Lead — Bank Recon", email: "aarav.mehta@rexora.io", initials: "AM" },
      { name: "Priya Shah", team: "Product", role: "Product Manager", email: "priya.shah@rexora.io", initials: "PS" },
      { name: "Diego Alvarez", team: "Support", role: "L3 Support Engineer", email: "diego.alvarez@rexora.io", initials: "DA" },
      { name: "Linh Tran", team: "Engineering", role: "Backend Engineer", email: "linh.tran@rexora.io", initials: "LT" },
      { name: "Marcus O'Connor", team: "Operations", role: "Reconciliation Ops Lead", email: "marcus.oconnor@rexora.io", initials: "MO" },
      { name: "Sara Bensalem", team: "Data", role: "Data Platform Engineer", email: "sara.bensalem@rexora.io", initials: "SB" },
    ],
    tracking: [
      { id: "TR-7821", title: "Add tolerance override per counterparty", description: "Allow per-counterparty tolerance instead of global only.", status: "In Review", tags: ["Enhancement", "Matching"] },
      { id: "TR-7844", title: "Investigate posting lag on EOD batch", description: "EOD posting is taking 12+ minutes for APAC books.", status: "In Progress", tags: ["Bug", "Performance"] },
      { id: "TR-7901", title: "Export unmatched report to Parquet", description: "Data team requested Parquet output for downstream lake.", status: "Open", tags: ["Feature", "Data"] },
      { id: "TR-7912", title: "FX snapshot scheduling UI", description: "Build UI to manage FX snapshot cron windows.", status: "Done", tags: ["UI", "FX"] },
    ],
    attachments: {
      documents: [
        { id: "d1", name: "BankRecon_RuntimeGuide_v3.pdf", size: "2.4 MB", updated: "Nov 12, 2025", type: "PDF" },
        { id: "d2", name: "MT940_Format_Reference.pdf", size: "812 KB", updated: "Oct 28, 2025", type: "PDF" },
        { id: "d3", name: "Voyager7S_BankProfile_Setup.docx", size: "340 KB", updated: "Sep 04, 2025", type: "DOCX" },
      ],
      videos: [
        { id: "v1", name: "Auto-match Engine Deep Dive", duration: "12:48", updated: "Nov 02, 2025" },
        { id: "v2", name: "Onboarding a New Bank Profile", duration: "08:22", updated: "Oct 14, 2025" },
        { id: "v3", name: "Triaging Unmatched Transactions", duration: "15:10", updated: "Sep 30, 2025" },
      ],
      ppts: [
        { id: "p1", name: "Bank Recon — Architecture Overview.pptx", size: "5.1 MB", updated: "Nov 08, 2025" },
        { id: "p2", name: "Q4 Roadmap — Matching Engine.pptx", size: "3.7 MB", updated: "Oct 22, 2025" },
      ],
    },
    chatGreeting: "Hi — I'm Rexora AI for Bank Reconciliation. Describe your issue and I'll triage root causes, suggest fixes, and pull similar past cases.",
    chatSuggestions: [
      "Why is the auto-match rate dropping?",
      "MT940 import failing for Citi EMEA",
      "Reconciliation engine timing out",
    ],
    chatSeed: {
      rootCauses: [
        { label: "Bank profile mapping points to a deprecated region code", confidence: 86 },
        { label: "FX rate snapshot ran outside the matching window", confidence: 9 },
        { label: "Stuck batch in the ETL queue blocking ingestion", confidence: 5 },
      ],
      steps: [
        "Open Settings → Bank Profiles and verify the EMEA mapping uses the post-migration region code.",
        "Re-run the import job for the affected window in debug mode (trace logs enabled).",
        "Confirm the matching engine picked up the new entries (queue depth should drop to 0).",
        "Trigger an ad-hoc reconciliation to validate the fix end-to-end.",
      ],
      similarCases: [
        { id: "BR-2041", title: "Citi EMEA MT940 import failing post-migration", tag: "Same root cause" },
        { id: "BR-2098", title: "Match rate dropped to 41% on USD pool", tag: "Adjacent" },
      ],
      finalFix: "Update the Bank Profile EMEA mapping to the new region code (`EU-WEST-2`) and re-run the import job for the affected 24h window.",
      notes: "Confirmed against 4 historical cases. If failure persists after fix, escalate to Tech Lead — Bank Recon (Aarav Mehta).",
    },
  },
};

const intercompany: Module = {
  id: "intercompany",
  name: "Intercompany",
  short: "IC",
  color: "oklch(0.65 0.16 200)",
  progress: 42,
  data: {
    overview: {
      tagline: "Eliminate intercompany mismatches at scale.",
      heroLead: "Production · v4.2.1",
      heroBody:
        "Intercompany handles bilateral and multilateral netting, eliminations, and FX-aware matching across legal entities — keeping consolidated books clean before close.",
      chips: ["Netting", "Eliminations", "FX-aware", "Multi-entity", "Audit-grade"],
      stats: [
        { label: "Open cases", value: "5", trend: "-1", tone: "warning" },
        { label: "Resolved this week", value: "21", trend: "+9%", tone: "success" },
        { label: "Avg. resolution", value: "52m", trend: "-4m", tone: "info" },
      ],
      sections: [
        { id: "func", iconKey: "workflow", title: "How it works in Voyager 7S",
          body: "Pulls intercompany entries from each entity's GL, applies netting rules, runs FX normalization, then proposes elimination journals for review." },
        { id: "usage", iconKey: "lightbulb", title: "Real-life usage examples",
          body: "Used by 23 group entities to net ~$8B monthly intercompany activity, reducing wire fees and FX exposure." },
        { id: "func2", iconKey: "book", title: "Module functionality",
          body: "Bilateral & multilateral netting, currency normalization, elimination engine, dispute workflow, and audit trail per entity pair." },
      ],
      featuredVideo: { title: "Multilateral Netting Walkthrough", duration: "09:14",
        description: "How to configure netting groups and run a settlement cycle end-to-end." },
    },
    checklists: [
      { id: "c1", title: "Intercompany pair imbalance", description: "Investigate when entity A and B disagree on a balance", progress: 33, steps: [
        { id: "s1", label: "Pull both sides of the pair journal", done: true },
        { id: "s2", label: "Check FX snapshot timing on both books", done: false },
        { id: "s3", label: "Confirm cut-off alignment", done: false },
      ]},
      { id: "c2", title: "Netting cycle did not run", description: "Diagnose missed netting jobs", progress: 0, steps: [
        { id: "s1", label: "Verify cron schedule status", done: false },
        { id: "s2", label: "Check entity participation flags", done: false },
      ]},
    ],
    cases: [
      { id: "IC-1042", summary: "Entity APAC-3 missing from Q3 netting cycle", rootCause: "Participation flag was disabled during onboarding", resolution: "Re-enabled flag; back-ran cycle for Q3.", tags: ["Netting", "Onboarding"], priority: "High", date: "2025-10-08", team: "CND" },
      { id: "IC-1078", summary: "Persistent imbalance between EU-1 and US-2 pair", rootCause: "FX snapshot used mid-day vs end-of-day rate", resolution: "Aligned both entities to EOD snapshot.", tags: ["FX", "Imbalance"], priority: "Critical", date: "2025-11-01", team: "NY" },
    ],
    contacts: [
      { name: "Hiroshi Tanaka", team: "Engineering", role: "Tech Lead — Intercompany", email: "hiroshi.tanaka@rexora.io", initials: "HT" },
      { name: "Elena Volkov", team: "Product", role: "PM — Intercompany", email: "elena.volkov@rexora.io", initials: "EV" },
      { name: "Carlos Mendes", team: "Operations", role: "IC Ops Lead", email: "carlos.mendes@rexora.io", initials: "CM" },
    ],
    tracking: [
      { id: "TR-5510", title: "Add multilateral netting preview", description: "Show what a cycle will produce before running.", status: "In Progress", tags: ["UI", "Netting"] },
      { id: "TR-5544", title: "Dispute SLA reporting", description: "Surface SLA breaches per entity pair.", status: "Open", tags: ["Reporting"] },
    ],
    attachments: {
      documents: [
        { id: "d1", name: "Intercompany_Netting_Spec.pdf", size: "1.8 MB", updated: "Oct 18, 2025", type: "PDF" },
        { id: "d2", name: "Elimination_Rules_v2.docx", size: "412 KB", updated: "Sep 22, 2025", type: "DOCX" },
      ],
      videos: [
        { id: "v1", name: "Multilateral Netting Walkthrough", duration: "09:14", updated: "Oct 30, 2025" },
      ],
      ppts: [
        { id: "p1", name: "IC Architecture Overview.pptx", size: "4.2 MB", updated: "Oct 12, 2025" },
      ],
    },
    chatGreeting: "Hi — I'm Rexora AI for Intercompany. Tell me about a mismatch, missed cycle, or netting issue.",
    chatSuggestions: [
      "Why are EU-1 and US-2 imbalanced?",
      "Netting cycle skipped an entity",
      "Eliminations producing wrong currency",
    ],
    chatSeed: {
      rootCauses: [
        { label: "FX snapshot timing differs between paired entities", confidence: 78 },
        { label: "Cut-off date misalignment between books", confidence: 18 },
        { label: "Manual journal posted after cycle close", confidence: 4 },
      ],
      steps: [
        "Open both entity books and compare FX snapshot timestamps.",
        "Align both entities to the EOD snapshot in IC settings.",
        "Re-run the netting cycle for the affected pair.",
        "Validate the new pair balance is within tolerance.",
      ],
      similarCases: [
        { id: "IC-1078", title: "EU-1 / US-2 imbalance", tag: "Same root cause" },
      ],
      finalFix: "Standardize FX snapshot timing across all participating entities to EOD UTC.",
      notes: "If imbalance persists, escalate to Tech Lead — Intercompany (Hiroshi Tanaka).",
    },
  },
};

const etl: Module = {
  id: "etl",
  name: "ETL",
  short: "ETL",
  color: "oklch(0.7 0.15 155)",
  progress: 88,
  data: {
    overview: {
      tagline: "Reliable data pipelines for the entire platform.",
      heroLead: "Production · v9.1.0",
      heroBody:
        "ETL ingests, transforms, and lands data from 200+ sources into the canonical Voyager 7S warehouse — with backfills, replays, and lineage out of the box.",
      chips: ["Streaming", "Batch", "Backfill", "Lineage", "Schema-aware"],
      stats: [
        { label: "Open cases", value: "3", trend: "0", tone: "warning" },
        { label: "Resolved this week", value: "62", trend: "+22%", tone: "success" },
        { label: "Avg. resolution", value: "24m", trend: "-8m", tone: "info" },
      ],
      sections: [
        { id: "func", iconKey: "workflow", title: "How it works in Voyager 7S",
          body: "Source connectors → staging → schema validation → transformation DAG → landing zone, with full per-job lineage." },
        { id: "usage", iconKey: "lightbulb", title: "Real-life usage examples",
          body: "Powers nightly recon feeds, reporting marts, and the GL closeout pipeline. ~3.2B rows/day at peak." },
        { id: "func2", iconKey: "book", title: "Module functionality",
          body: "Schema drift detection, retry policies, replay-by-window, lineage graph, and DAG pause/resume." },
      ],
      featuredVideo: { title: "Backfill & Replay Patterns", duration: "11:02",
        description: "Best practices for replaying a window without double-loading downstream tables." },
    },
    checklists: [
      { id: "c1", title: "Pipeline stuck in 'running' state", description: "Resolve hung DAGs", progress: 50, steps: [
        { id: "s1", label: "Check worker pool saturation", done: true },
        { id: "s2", label: "Inspect last heartbeat timestamp", done: false },
      ]},
      { id: "c2", title: "Schema drift detected", description: "Handle upstream schema changes safely", progress: 0, steps: [
        { id: "s1", label: "Diff source schema vs target", done: false },
        { id: "s2", label: "Decide: pause, evolve, or alert", done: false },
      ]},
    ],
    cases: [
      { id: "ETL-3301", summary: "Nightly recon feed missed SLA by 47 minutes", rootCause: "Worker pool was undersized for new source volume", resolution: "Scaled worker pool from 8 → 16; added autoscale policy.", tags: ["SLA", "Scaling"], priority: "High", date: "2025-10-19", team: "TX" },
      { id: "ETL-3344", summary: "Schema drift broke downstream GL pipeline", rootCause: "Upstream added column without notice", resolution: "Enabled schema drift alerts; pinned schema version.", tags: ["Schema", "Drift"], priority: "Critical", date: "2025-11-02", team: "NC" },
    ],
    contacts: [
      { name: "Sara Bensalem", team: "Data", role: "Tech Lead — ETL", email: "sara.bensalem@rexora.io", initials: "SB" },
      { name: "Tom Whitfield", team: "Data", role: "Senior Data Engineer", email: "tom.whitfield@rexora.io", initials: "TW" },
    ],
    tracking: [
      { id: "TR-9012", title: "Add Parquet sink option", description: "Land transformed data as Parquet in addition to Iceberg.", status: "In Review", tags: ["Feature", "Sink"] },
      { id: "TR-9088", title: "DAG visualizer overhaul", description: "Faster rendering for DAGs > 500 nodes.", status: "Open", tags: ["UI", "Performance"] },
    ],
    attachments: {
      documents: [
        { id: "d1", name: "ETL_Operator_Runbook.pdf", size: "3.1 MB", updated: "Nov 04, 2025", type: "PDF" },
      ],
      videos: [
        { id: "v1", name: "Backfill & Replay Patterns", duration: "11:02", updated: "Oct 25, 2025" },
      ],
      ppts: [
        { id: "p1", name: "ETL Platform Roadmap.pptx", size: "2.9 MB", updated: "Oct 30, 2025" },
      ],
    },
    chatGreeting: "Hi — I'm Rexora AI for ETL. Describe a pipeline failure, schema drift, or SLA issue.",
    chatSuggestions: [
      "Pipeline stuck in running state",
      "Schema drift broke GL feed",
      "Why did nightly job miss SLA?",
    ],
    chatSeed: {
      rootCauses: [
        { label: "Worker pool saturation due to volume spike", confidence: 72 },
        { label: "Upstream schema drift not yet propagated", confidence: 21 },
        { label: "Dependency DAG blocked by upstream failure", confidence: 7 },
      ],
      steps: [
        "Check worker pool utilization and queue depth.",
        "Scale worker pool or enable autoscale policy.",
        "Re-trigger the failed window and monitor lineage.",
        "Confirm downstream marts received the data.",
      ],
      similarCases: [
        { id: "ETL-3301", title: "Nightly recon feed missed SLA", tag: "Same root cause" },
      ],
      finalFix: "Increase worker pool minimum to handle peak volume; enable autoscale.",
      notes: "Persistent saturation should trigger a capacity review with the Data Platform team.",
    },
  },
};

const gl: Module = {
  id: "gl",
  name: "General Ledger",
  short: "GL",
  color: "oklch(0.75 0.16 75)",
  progress: 54,
  data: {
    overview: {
      tagline: "The single source of truth for the books.",
      heroLead: "Production · v6.0.3",
      heroBody:
        "General Ledger persists every posted journal with full audit lineage, supports multi-book accounting, and powers consolidation, reporting, and close.",
      chips: ["Multi-book", "Multi-currency", "Audit", "Period close", "Reporting"],
      stats: [
        { label: "Open cases", value: "8", trend: "+1", tone: "warning" },
        { label: "Resolved this week", value: "29", trend: "+5%", tone: "success" },
        { label: "Avg. resolution", value: "44m", trend: "-3m", tone: "info" },
      ],
      sections: [
        { id: "func", iconKey: "workflow", title: "How it works in Voyager 7S",
          body: "Receives journals from sub-ledgers, validates against COA + period state, posts atomically, and emits events for downstream consumers." },
        { id: "usage", iconKey: "lightbulb", title: "Real-life usage examples",
          body: "Every booking — from AR/AP, payroll, treasury, and intercompany — eventually lands here. ~600M journal lines per quarter." },
        { id: "func2", iconKey: "book", title: "Module functionality",
          body: "COA management, period open/close, journal entry workflow, reversal & accrual support, and trial balance generation." },
      ],
      featuredVideo: { title: "Period Close Best Practices", duration: "14:30",
        description: "Step-by-step playbook for a clean monthly close in Voyager 7S." },
    },
    checklists: [
      { id: "c1", title: "Period won't close", description: "Diagnose blockers preventing period close", progress: 25, steps: [
        { id: "s1", label: "Check for unposted journals", done: true },
        { id: "s2", label: "Verify all sub-ledger feeds completed", done: false },
        { id: "s3", label: "Confirm reconciliations are signed off", done: false },
        { id: "s4", label: "Run pre-close validation report", done: false },
      ]},
    ],
    cases: [
      { id: "GL-4012", summary: "Period close blocked by stale AR feed", rootCause: "AR sub-ledger feed failed silently overnight", resolution: "Re-ran AR feed; added monitoring alert for missing feeds.", tags: ["Close", "Feeds"], priority: "Critical", date: "2025-10-31", team: "NY" },
    ],
    contacts: [
      { name: "Margaret Chen", team: "Engineering", role: "Tech Lead — GL", email: "margaret.chen@rexora.io", initials: "MC" },
      { name: "Roberto Silva", team: "Finance", role: "Controller", email: "roberto.silva@rexora.io", initials: "RS" },
    ],
    tracking: [
      { id: "TR-3301", title: "Soft-close support", description: "Allow soft-close with override controls for specific accounts.", status: "Open", tags: ["Feature", "Close"] },
    ],
    attachments: {
      documents: [
        { id: "d1", name: "GL_Period_Close_Runbook.pdf", size: "2.0 MB", updated: "Oct 28, 2025", type: "PDF" },
      ],
      videos: [
        { id: "v1", name: "Period Close Best Practices", duration: "14:30", updated: "Sep 20, 2025" },
      ],
      ppts: [
        { id: "p1", name: "GL Architecture.pptx", size: "3.4 MB", updated: "Oct 02, 2025" },
      ],
    },
    chatGreeting: "Hi — I'm Rexora AI for General Ledger. Tell me about a posting issue, period close blocker, or trial balance discrepancy.",
    chatSuggestions: [
      "Period close blocked",
      "Trial balance off by a small amount",
      "Journal failed validation",
    ],
    chatSeed: {
      rootCauses: [
        { label: "Sub-ledger feed missed cut-off", confidence: 64 },
        { label: "Unposted journals in queue", confidence: 28 },
        { label: "Period state inconsistent across books", confidence: 8 },
      ],
      steps: [
        "Run the pre-close validation report.",
        "Identify the blocking sub-ledger or journal.",
        "Resolve the blocker (re-run feed or post journal).",
        "Re-attempt period close.",
      ],
      similarCases: [
        { id: "GL-4012", title: "Period close blocked by stale AR feed", tag: "Same root cause" },
      ],
      finalFix: "Re-run the failed sub-ledger feed and ensure all reconciliations are signed off.",
      notes: "Add a monitoring alert for any sub-ledger feed that misses its scheduled window.",
    },
  },
};

const ap: Module = {
  id: "ap",
  name: "Accounts Payable",
  short: "AP",
  color: "oklch(0.62 0.2 25)",
  progress: 31,
  data: {
    overview: {
      tagline: "Pay vendors accurately, on time, every time.",
      heroLead: "Production · v3.7.2",
      heroBody:
        "Accounts Payable manages the full procure-to-pay lifecycle: invoice capture, 3-way match, approval workflow, and payment execution.",
      chips: ["3-way match", "OCR", "Approval flow", "Payment runs", "Multi-currency"],
      stats: [
        { label: "Open cases", value: "16", trend: "+4", tone: "warning" },
        { label: "Resolved this week", value: "33", trend: "+12%", tone: "success" },
        { label: "Avg. resolution", value: "1h 12m", trend: "-6m", tone: "info" },
      ],
      sections: [
        { id: "func", iconKey: "workflow", title: "How it works in Voyager 7S",
          body: "Invoices are captured (OCR or EDI), matched against POs and receipts, routed for approval, then released to the payment engine." },
        { id: "usage", iconKey: "lightbulb", title: "Real-life usage examples",
          body: "Processes 1.2M invoices/year across 18,000 vendors. AI-assisted coding cuts manual touch time by 40%." },
        { id: "func2", iconKey: "book", title: "Module functionality",
          body: "OCR ingestion, 3-way match, multi-step approval, duplicate detection, payment scheduling, and vendor self-service portal." },
      ],
      featuredVideo: { title: "Setting Up an Approval Workflow", duration: "07:48",
        description: "Configure multi-tier approvals based on amount, vendor, and GL coding." },
    },
    checklists: [
      { id: "c1", title: "Invoice stuck in approval", description: "Resolve approval routing issues", progress: 0, steps: [
        { id: "s1", label: "Check approver delegation", done: false },
        { id: "s2", label: "Verify approval threshold", done: false },
        { id: "s3", label: "Inspect routing rule order", done: false },
      ]},
      { id: "c2", title: "3-way match failure", description: "PO, receipt, and invoice don't reconcile", progress: 50, steps: [
        { id: "s1", label: "Compare quantities across PO/receipt/invoice", done: true },
        { id: "s2", label: "Check unit prices and tax", done: true },
        { id: "s3", label: "Verify currency and FX", done: false },
      ]},
    ],
    cases: [
      { id: "AP-5012", summary: "Duplicate payment to vendor V-2230", rootCause: "Duplicate detection rule excluded credit memos", resolution: "Updated rule to consider all document types.", tags: ["Duplicate", "Payment"], priority: "Critical", date: "2025-10-15", team: "NC" },
      { id: "AP-5077", summary: "Approval routing stuck on terminated employee", rootCause: "Delegation chain not updated post-offboarding", resolution: "Auto-delegate on HR offboarding event added.", tags: ["Approval", "Routing"], priority: "High", date: "2025-11-06", team: "TX" },
    ],
    contacts: [
      { name: "Nadia Petrov", team: "Engineering", role: "Tech Lead — AP", email: "nadia.petrov@rexora.io", initials: "NP" },
      { name: "James Park", team: "Finance", role: "AP Manager", email: "james.park@rexora.io", initials: "JP" },
    ],
    tracking: [
      { id: "TR-2210", title: "Vendor portal MFA", description: "Enable MFA for vendor self-service portal.", status: "In Progress", tags: ["Security", "Portal"] },
      { id: "TR-2255", title: "Bulk invoice upload", description: "Allow CSV bulk upload for high-volume vendors.", status: "Open", tags: ["Feature", "Ingestion"] },
    ],
    attachments: {
      documents: [
        { id: "d1", name: "AP_Three_Way_Match_Guide.pdf", size: "1.4 MB", updated: "Sep 30, 2025", type: "PDF" },
      ],
      videos: [
        { id: "v1", name: "Setting Up an Approval Workflow", duration: "07:48", updated: "Oct 18, 2025" },
      ],
      ppts: [
        { id: "p1", name: "AP Process Overview.pptx", size: "2.1 MB", updated: "Sep 28, 2025" },
      ],
    },
    chatGreeting: "Hi — I'm Rexora AI for Accounts Payable. Describe an invoice, approval, or payment issue.",
    chatSuggestions: [
      "Invoice stuck in approval",
      "3-way match failing",
      "Duplicate payment risk",
    ],
    chatSeed: {
      rootCauses: [
        { label: "Approver no longer active and delegation missing", confidence: 70 },
        { label: "Routing rule order matches wrong tier", confidence: 22 },
        { label: "Threshold misconfigured for vendor class", confidence: 8 },
      ],
      steps: [
        "Check the approver's HR status and delegation chain.",
        "If terminated, set up an auto-delegation rule.",
        "Re-trigger the approval workflow.",
        "Confirm the invoice progresses to the next tier.",
      ],
      similarCases: [
        { id: "AP-5077", title: "Approval routing stuck on terminated employee", tag: "Same root cause" },
      ],
      finalFix: "Add auto-delegation triggered on the HR offboarding event for any in-flight approvals.",
      notes: "Recommend a monthly audit of delegation chains to catch stale routes early.",
    },
  },
};

const SEED_MODULES: Module[] = [bankRecon, intercompany, etl, gl, ap];

// ---------- Empty template for user-created modules ----------
function emptyModule(name: string): Module {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `mod-${Date.now()}`;
  const short = name
    .split(/\s+/).filter(Boolean).slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "M";
  // Deterministic-ish hue from name
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const color = `oklch(0.65 0.17 ${h})`;
  return {
    id, name, short, color, progress: 0,
    data: {
      overview: {
        tagline: `${name} — your new workspace.`,
        heroLead: "Newly created · v0.1",
        heroBody: `${name} is a freshly added module. Start by uploading attachments, building checklists, or capturing your first past case.`,
        chips: ["New", "Configurable"],
        stats: [
          { label: "Open cases", value: "0", trend: "0", tone: "warning" },
          { label: "Resolved this week", value: "0", trend: "0", tone: "success" },
          { label: "Avg. resolution", value: "—", trend: "—", tone: "info" },
        ],
        sections: [
          { id: "func", iconKey: "workflow", title: "How it works in Voyager 7S",
            body: `Describe how the ${name} module operates inside Voyager 7S.` },
          { id: "usage", iconKey: "lightbulb", title: "Real-life usage examples",
            body: `Add real-life examples of how teams use ${name}.` },
          { id: "func2", iconKey: "book", title: "Module functionality",
            body: `Outline the core capabilities exposed by ${name}.` },
        ],
        featuredVideo: { title: `${name} — Getting Started`, duration: "00:00", description: "Add a tutorial video for new engineers." },
      },
      checklists: [],
      cases: [],
      contacts: [],
      tracking: [],
      attachments: { documents: [], videos: [], ppts: [] },
      chatGreeting: `Hi — I'm Rexora AI for ${name}. There's no domain knowledge yet for this module. Add past cases and checklists to teach me.`,
      chatSuggestions: [
        `Common ${name} failures`,
        `How is ${name} configured?`,
        `Onboarding to ${name}`,
      ],
      chatSeed: {
        rootCauses: [
          { label: `No prior ${name} cases indexed yet`, confidence: 100 },
        ],
        steps: [
          `Capture your first past case under ${name}.`,
          "Add a troubleshooting checklist describing the standard triage steps.",
          "Invite a domain expert to the Point of Contact directory.",
        ],
        similarCases: [],
        finalFix: `Bootstrap ${name} by adding initial documentation and at least one historical case.`,
        notes: "AI accuracy improves significantly after the first 5–10 cases are added to the knowledge base.",
      },
    },
  };
}

// ---------- Context ----------
type StoreShape = {
  modules: Module[];
  selectedId: string;
  selected: Module;
  setSelectedId: (id: string) => void;
  addModule: (name: string) => Module | null;
  deleteModule: (id: string) => void;
};

const ModuleCtx = createContext<StoreShape | null>(null);
const STORAGE_KEY = "rexora.modules.v1";

type Persisted = { modules: Module[]; selectedId: string };

function loadPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed?.modules?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(state: Persisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<Module[]>(SEED_MODULES);
  const [selectedId, setSelectedIdState] = useState<string>(SEED_MODULES[0].id);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const p = loadPersisted();
    if (p) {
      setModules(p.modules);
      setSelectedIdState(p.modules.find((m) => m.id === p.selectedId) ? p.selectedId : p.modules[0].id);
    }
  }, []);

  useEffect(() => { persist({ modules, selectedId }); }, [modules, selectedId]);

  const selected = useMemo(
    () => modules.find((m) => m.id === selectedId) ?? modules[0],
    [modules, selectedId],
  );

  const value: StoreShape = useMemo(() => ({
    modules,
    selectedId,
    selected,
    setSelectedId: (id) => setSelectedIdState(id),
    addModule: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const m = emptyModule(trimmed);
      // Avoid duplicate ids
      if (modules.some((x) => x.id === m.id)) {
        m.id = `${m.id}-${Date.now()}`;
      }
      setModules((prev) => [...prev, m]);
      setSelectedIdState(m.id);
      return m;
    },
    deleteModule: (id) => {
      setModules((prev) => {
        if (prev.length <= 1) return prev; // keep at least one
        const next = prev.filter((m) => m.id !== id);
        if (id === selectedId) setSelectedIdState(next[0].id);
        return next;
      });
    },
  }), [modules, selected, selectedId]);

  return <ModuleCtx.Provider value={value}>{children}</ModuleCtx.Provider>;
}

export function useModuleStore(): StoreShape {
  const ctx = useContext(ModuleCtx);
  if (!ctx) throw new Error("useModuleStore must be used inside <ModuleProvider>");
  return ctx;
}

// Convenience hook returning the active module's data
export function useActiveModule() {
  const { selected } = useModuleStore();
  return selected;
}
