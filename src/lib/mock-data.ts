export const modules = [
  { id: "bank-recon", name: "Bank Reconciliation", short: "BR", color: "oklch(0.55 0.2 278)" },
  { id: "intercompany", name: "Intercompany", short: "IC", color: "oklch(0.65 0.16 200)" },
  { id: "etl", name: "ETL", short: "ETL", color: "oklch(0.7 0.15 155)" },
  { id: "gl", name: "General Ledger", short: "GL", color: "oklch(0.75 0.16 75)" },
  { id: "ap", name: "Accounts Payable", short: "AP", color: "oklch(0.62 0.2 25)" },
];

export const checklists = [
  {
    id: "c1",
    title: "Bank statement import failure",
    description: "Standard checks when MT940/CAMT files fail to import",
    progress: 60,
    steps: [
      {
        id: "s1",
        label: "Verify file format & encoding (UTF-8)",
        done: true,
        detail: "Open in a hex editor and confirm BOM is absent.",
      },
      {
        id: "s2",
        label: "Check bank profile mapping in Voyager 7S",
        done: true,
        detail: "Go to Settings → Bank Profiles.",
      },
      {
        id: "s3",
        label: "Validate cut-off date alignment",
        done: true,
        detail: "Cut-off must match bank close date.",
      },
      {
        id: "s4",
        label: "Re-run import job in debug mode",
        done: false,
        detail: "Enable trace logs before retrying.",
      },
      { id: "s5", label: "Inspect ETL queue for stuck records", done: false },
    ],
  },
  {
    id: "c2",
    title: "Unmatched transactions investigation",
    description: "Diagnose why entries fail auto-matching",
    progress: 25,
    steps: [
      { id: "s1", label: "Pull last 24h unmatched batch", done: true },
      { id: "s2", label: "Compare amounts with tolerance settings", done: false },
      { id: "s3", label: "Verify counterparty IDs", done: false },
      { id: "s4", label: "Check FX rate snapshot timing", done: false },
    ],
  },
  {
    id: "c3",
    title: "Reconciliation engine slow / timeout",
    description: "Performance triage steps for the matching engine",
    progress: 0,
    steps: [
      { id: "s1", label: "Check DB connection pool saturation", done: false },
      { id: "s2", label: "Review recent index changes", done: false },
      { id: "s3", label: "Inspect long-running queries", done: false },
    ],
  },
];

export const pastCases = [
  {
    id: "BR-2041",
    summary: "MT940 import failing for Citi EMEA accounts after region migration",
    rootCause: "Bank profile mapping pointed to legacy region code post-migration",
    resolution:
      "Updated Bank Profile EMEA mapping to new region code; re-ran import job successfully.",
    tags: ["Import", "MT940", "Citi", "Regression"],
    priority: "High",
    date: "2025-09-12",
    team: "NY",
  },
  {
    id: "BR-2098",
    summary: "Auto-match rate dropped to 41% overnight on USD pool",
    rootCause: "FX rate snapshot job ran 30 minutes late, causing tolerance miss",
    resolution: "Realigned cron + added 1bps tolerance buffer for USD pool only.",
    tags: ["Matching", "FX", "Performance"],
    priority: "Critical",
    date: "2025-10-03",
    team: "CND",
  },
  {
    id: "BR-2114",
    summary: "Intermittent timeout on reconciliation engine for ledger > 2M rows",
    rootCause: "Missing composite index on (account_id, value_date)",
    resolution: "Added index; engine runtime dropped from 14m → 38s.",
    tags: ["Performance", "DB", "Index"],
    priority: "High",
    date: "2025-10-21",
    team: "TX",
  },
  {
    id: "BR-2156",
    summary: "Duplicate journal entries posted on retry",
    rootCause: "Idempotency key was reset on engine restart",
    resolution: "Persisted idempotency keys to Redis with 24h TTL.",
    tags: ["Posting", "Idempotency", "Duplicates"],
    priority: "Critical",
    date: "2025-11-04",
    team: "NC",
  },
];

export const contacts = [
  {
    name: "Aarav Mehta",
    team: "Engineering",
    role: "Tech Lead — Bank Recon",
    email: "aarav.mehta@rexora.io",
    initials: "AM",
  },
  {
    name: "Priya Shah",
    team: "Product",
    role: "Product Manager",
    email: "priya.shah@rexora.io",
    initials: "PS",
  },
  {
    name: "Diego Alvarez",
    team: "Support",
    role: "L3 Support Engineer",
    email: "diego.alvarez@rexora.io",
    initials: "DA",
  },
  {
    name: "Linh Tran",
    team: "Engineering",
    role: "Backend Engineer",
    email: "linh.tran@rexora.io",
    initials: "LT",
  },
  {
    name: "Marcus O'Connor",
    team: "Operations",
    role: "Reconciliation Ops Lead",
    email: "marcus.oconnor@rexora.io",
    initials: "MO",
  },
  {
    name: "Sara Bensalem",
    team: "Data",
    role: "Data Platform Engineer",
    email: "sara.bensalem@rexora.io",
    initials: "SB",
  },
];

export const trackingRequests = [
  {
    id: "TR-7821",
    title: "Add tolerance override per counterparty",
    description: "Allow per-counterparty tolerance instead of global only.",
    status: "In Review",
    tags: ["Enhancement", "Matching"],
  },
  {
    id: "TR-7844",
    title: "Investigate posting lag on EOD batch",
    description: "EOD posting is taking 12+ minutes for APAC books.",
    status: "In Progress",
    tags: ["Bug", "Performance"],
  },
  {
    id: "TR-7901",
    title: "Export unmatched report to Parquet",
    description: "Data team requested Parquet output for downstream lake.",
    status: "Open",
    tags: ["Feature", "Data"],
  },
  {
    id: "TR-7912",
    title: "FX snapshot scheduling UI",
    description: "Build UI to manage FX snapshot cron windows.",
    status: "Done",
    tags: ["UI", "FX"],
  },
];

export const attachments = {
  documents: [
    {
      id: "d1",
      name: "BankRecon_RuntimeGuide_v3.pdf",
      size: "2.4 MB",
      updated: "Nov 12, 2025",
      type: "PDF",
    },
    {
      id: "d2",
      name: "MT940_Format_Reference.pdf",
      size: "812 KB",
      updated: "Oct 28, 2025",
      type: "PDF",
    },
    {
      id: "d3",
      name: "Voyager7S_BankProfile_Setup.docx",
      size: "340 KB",
      updated: "Sep 04, 2025",
      type: "DOCX",
    },
  ],
  videos: [
    { id: "v1", name: "Auto-match Engine Deep Dive", duration: "12:48", updated: "Nov 02, 2025" },
    { id: "v2", name: "Onboarding a New Bank Profile", duration: "08:22", updated: "Oct 14, 2025" },
    {
      id: "v3",
      name: "Triaging Unmatched Transactions",
      duration: "15:10",
      updated: "Sep 30, 2025",
    },
  ],
  ppts: [
    {
      id: "p1",
      name: "Bank Recon — Architecture Overview.pptx",
      size: "5.1 MB",
      updated: "Nov 08, 2025",
    },
    {
      id: "p2",
      name: "Q4 Roadmap — Matching Engine.pptx",
      size: "3.7 MB",
      updated: "Oct 22, 2025",
    },
  ],
};
