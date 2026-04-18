import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { Search, Plus, X, GitPullRequest, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActiveModule, useModuleStore, type TR } from "@/lib/module-store";

export const Route = createFileRoute("/tracking")({
  component: TrackingPage,
});

const STATUSES: TR["status"][] = ["Open", "In Review", "In Progress", "Done"];

const statusStyles: Record<string, string> = {
  Open: "bg-info/10 text-info border-info/20",
  "In Review": "bg-warning/15 text-[oklch(0.45_0.15_75)] border-warning/30",
  "In Progress": "bg-primary-soft text-primary border-primary/20",
  Done: "bg-success/10 text-success border-success/20",
};

function TrackingPage() {
  const mod = useActiveModule();
  const { deleteTR, updateTR } = useModuleStore();
  const trs = mod.data.tracking;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = trs.filter(
    (t) =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.id.toLowerCase().includes(q.toLowerCase()),
  );

  async function onDelete(t: TR) {
    if (!window.confirm(`Delete TR ${t.id}?`)) return;
    try {
      await deleteTR(t.id);
      toast.success(`Deleted ${t.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onChangeStatus(t: TR, status: TR["status"]) {
    try {
      await updateTR(t.id, { status });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AppShell
      title="Tracking Requests"
      subtitle={`Engineering & ops requests under active tracking for ${mod.name}.`}
      actions={
        <button
          onClick={() => setOpen(true)}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] flex items-center gap-2 transition-opacity"
        >
          <Plus className="h-4 w-4" /> New TR
        </button>
      }
    >
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search TRs by title or ID…"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm transition-all"
        />
      </div>

      {trs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
            <GitPullRequest className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="mt-3 text-sm font-medium text-foreground">
            No tracking requests yet for {mod.name}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Open your first TR to start tracking work.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-border bg-surface p-5 hover-lift group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                      {t.id}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusStyles[t.status]}`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold text-foreground">{t.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-secondary text-[11px] text-foreground/80 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <select
                    value={t.status}
                    onChange={(e) => onChangeStatus(t, e.target.value as TR["status"])}
                    className="h-9 px-3 rounded-lg border border-border bg-surface hover:bg-secondary text-foreground text-xs font-medium transition-colors"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onDelete(t)}
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all"
                    title="Delete TR"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <NewTRModal onClose={() => setOpen(false)} />}
    </AppShell>
  );
}

function NewTRModal({ onClose }: { onClose: () => void }) {
  const { createTR } = useModuleStore();
  const [form, setForm] = useState({ id: "", title: "", description: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);

  async function onSave() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      await createTR({
        id: form.id.trim() || undefined,
        title: form.title.trim(),
        description: form.description.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success("TR created");
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
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-[var(--shadow-floating)] animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">New Tracking Request</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <input
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="ID (optional, e.g. TR-9812)"
            className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm font-mono"
          />
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
          />
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm resize-none"
          />
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Tags (comma separated)"
            className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
          />
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border bg-secondary/30">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-border bg-surface text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={submitting}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Create
          </button>
        </div>
      </div>
    </div>
  );
}
