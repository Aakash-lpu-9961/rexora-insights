import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { Search, Plus, X, Calendar as CalendarIcon, Tag } from "lucide-react";
import { pastCases } from "@/lib/mock-data";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "Past Cases — Rexora" },
      { name: "description", content: "Knowledge base of resolved support cases." },
    ],
  }),
  component: CasesPage,
});

const priorityColor: Record<string, string> = {
  Critical: "bg-destructive/10 text-destructive border-destructive/20",
  High: "bg-warning/15 text-[oklch(0.45_0.15_75)] border-warning/30",
  Medium: "bg-info/10 text-info border-info/20",
  Low: "bg-success/10 text-success border-success/20",
};

function CasesPage() {
  const [filter, setFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = pastCases.filter(
    (c) =>
      c.summary.toLowerCase().includes(filter.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase())) ||
      c.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <AppShell
      title="Past Cases"
      subtitle="Searchable archive of resolved incidents — root cause and resolution included."
      actions={
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] flex items-center gap-2 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Case
        </button>
      }
    >
      {/* Search & filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search cases, root causes, tags…"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm transition-all"
          />
        </div>
        {["All Issues", "All Root Causes", "All Tags"].map((label) => (
          <button key={label} className="h-10 px-3.5 rounded-xl bg-surface border border-border text-sm text-foreground hover:bg-secondary flex items-center gap-2 transition-colors">
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-surface p-5 hover-lift">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold text-muted-foreground">{c.id}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityColor[c.priority]}`}>
                  {c.priority}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">{c.date} · {c.team}</span>
            </div>
            <h3 className="text-[15px] font-semibold text-foreground leading-snug">{c.summary}</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Root Cause</div>
                <div className="text-foreground/90">{c.rootCause}</div>
              </div>
              <div className="rounded-xl bg-success/5 border border-success/20 p-3">
                <div className="text-[10px] uppercase tracking-wider text-success font-semibold mb-1">Resolution</div>
                <div className="text-foreground/90 text-sm">{c.resolution}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {c.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-md bg-secondary text-[11px] text-foreground/80 font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {modalOpen && <AddCaseModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}

function AddCaseModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface border border-border shadow-[var(--shadow-floating)] animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">New Case</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Document a resolved or in-progress case for the knowledge base.</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Description">
            <textarea rows={3} placeholder="What happened?" className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm resize-none transition-all" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="date" className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm" />
              </div>
            </Field>
            <Field label="Priority">
              <select className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm">
                <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
              </select>
            </Field>
            <Field label="Case ID"><input placeholder="BR-2200" className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm font-mono" /></Field>
            <Field label="Client ID"><input placeholder="CL-00482" className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm font-mono" /></Field>
            <Field label="Tags">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input placeholder="matching, fx…" className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm" />
              </div>
            </Field>
            <Field label="Case Team">
              <select className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm">
                <option>CND</option><option>NY</option><option>TX</option><option>NC</option><option>SB</option>
              </select>
            </Field>
          </div>
          <Field label="Resolution">
            <textarea rows={3} placeholder="What fixed it?" className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm resize-none transition-all" />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border bg-secondary/30">
          <button onClick={onClose} className="h-10 px-4 rounded-xl border border-border bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancel</button>
          <button className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] transition-opacity">Save Case</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
