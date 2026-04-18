import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { trackingRequests } from "@/lib/mock-data";

export const Route = createFileRoute("/tracking")({
  head: () => ({
    meta: [
      { title: "Tracking Requests — Rexora" },
      { name: "description", content: "Active TRs and feature requests for this module." },
    ],
  }),
  component: TrackingPage,
});

const statusStyles: Record<string, string> = {
  Open: "bg-info/10 text-info border-info/20",
  "In Review": "bg-warning/15 text-[oklch(0.45_0.15_75)] border-warning/30",
  "In Progress": "bg-primary-soft text-primary border-primary/20",
  Done: "bg-success/10 text-success border-success/20",
};

function TrackingPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = trackingRequests.filter(
    (t) =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.id.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell
      title="Tracking Requests"
      subtitle="Engineering & ops requests under active tracking."
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
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search TRs by title or ID…"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm transition-all"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-surface p-5 hover-lift">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-mono font-semibold text-muted-foreground">{t.id}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusStyles[t.status]}`}>
                    {t.status}
                  </span>
                </div>
                <div className="text-[15px] font-semibold text-foreground">{t.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-secondary text-[11px] text-foreground/80 font-medium">{tag}</span>
                  ))}
                </div>
              </div>
              <button className="h-9 px-3 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-medium transition-colors">View</button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-[var(--shadow-floating)] animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">New Tracking Request</h3>
              <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input placeholder="Title" className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm" />
              <textarea rows={4} placeholder="Description" className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm resize-none" />
              <input placeholder="Tags (comma separated)" className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm" />
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-border bg-secondary/30">
              <button onClick={() => setOpen(false)} className="h-10 px-4 rounded-xl border border-border bg-surface text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Create</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
