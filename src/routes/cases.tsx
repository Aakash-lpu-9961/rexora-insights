import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState, type ReactNode } from "react";
import {
  Search,
  Plus,
  X,
  Calendar as CalendarIcon,
  Tag,
  History,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useActiveModule, useModuleStore, type PastCase } from "@/lib/module-store";

export const Route = createFileRoute("/cases")({
  component: CasesPage,
});

const priorityColor: Record<string, string> = {
  Critical: "bg-destructive/10 text-destructive border-destructive/20",
  High: "bg-warning/15 text-[oklch(0.45_0.15_75)] border-warning/30",
  Medium: "bg-info/10 text-info border-info/20",
  Low: "bg-success/10 text-success border-success/20",
};

const TEAMS = ["CND", "NY", "TX", "NC", "SB"] as const;

function CasesPage() {
  const mod = useActiveModule();
  const { deleteCase } = useModuleStore();
  const cases = mod.data.cases;
  const [filter, setFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = cases.filter(
    (c) =>
      c.summary.toLowerCase().includes(filter.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase())) ||
      c.id.toLowerCase().includes(filter.toLowerCase()),
  );

  async function onDelete(c: PastCase) {
    if (!window.confirm(`Delete case ${c.id}? This cannot be undone.`)) return;
    try {
      await deleteCase(c.id);
      toast.success(`Deleted case ${c.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AppShell
      title="Past Cases"
      subtitle={`Searchable archive of resolved incidents for ${mod.name}.`}
      actions={
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] flex items-center gap-2 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Case
        </button>
      }
    >
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
      </div>

      {cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
            <History className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="mt-3 text-sm font-medium text-foreground">
            No past cases yet for {mod.name}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Document your first resolved incident to seed the knowledge base.
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-border bg-surface p-5 hover-lift group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                    {c.id}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityColor[c.priority]}`}
                  >
                    {c.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {c.date} · {c.team}
                  </span>
                  <button
                    onClick={() => onDelete(c)}
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all"
                    title="Delete case"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="text-[15px] font-semibold text-foreground leading-snug">
                {c.summary}
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Root Cause
                  </div>
                  <div className="text-foreground/90">{c.rootCause}</div>
                </div>
                <div className="rounded-xl bg-success/5 border border-success/20 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-success font-semibold mb-1">
                    Resolution
                  </div>
                  <div className="text-foreground/90 text-sm">{c.resolution}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-secondary text-[11px] text-foreground/80 font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <AddCaseModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}

function AddCaseModal({ onClose }: { onClose: () => void }) {
  const { createCase } = useModuleStore();
  const [form, setForm] = useState({
    summary: "",
    date: new Date().toISOString().slice(0, 10),
    priority: "Medium" as PastCase["priority"],
    id: "",
    clientId: "",
    tags: "",
    team: "CND",
    rootCause: "",
    resolution: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function onSave() {
    if (!form.summary.trim() || !form.resolution.trim()) {
      toast.error("Summary and resolution are required");
      return;
    }
    setSubmitting(true);
    try {
      await createCase({
        id: form.id.trim() || undefined,
        summary: form.summary.trim(),
        rootCause: form.rootCause.trim(),
        resolution: form.resolution.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        priority: form.priority,
        date: form.date,
        team: form.team,
        clientId: form.clientId.trim(),
      });
      toast.success("Case added");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface border border-border shadow-[var(--shadow-floating)] animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">New Case</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Document a resolved or in-progress case for the knowledge base.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Description">
            <textarea
              rows={3}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="What happened?"
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm resize-none transition-all"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
                />
              </div>
            </Field>
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as PastCase["priority"] })
                }
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </Field>
            <Field label="Case ID (optional)">
              <input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="BR-2200"
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm font-mono"
              />
            </Field>
            <Field label="Client ID">
              <input
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                placeholder="CL-00482"
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm font-mono"
              />
            </Field>
            <Field label="Tags (comma-separated)">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="matching, fx"
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
                />
              </div>
            </Field>
            <Field label="Case Team">
              <select
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
              >
                {TEAMS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Root Cause">
            <textarea
              rows={2}
              value={form.rootCause}
              onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
              placeholder="Why did it happen?"
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm resize-none transition-all"
            />
          </Field>
          <Field label="Resolution">
            <textarea
              rows={3}
              value={form.resolution}
              onChange={(e) => setForm({ ...form, resolution: e.target.value })}
              placeholder="What fixed it?"
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm resize-none transition-all"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border bg-secondary/30">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-border bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={submitting}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save Case
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
