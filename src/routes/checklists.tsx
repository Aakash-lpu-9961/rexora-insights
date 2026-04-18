import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { ChevronDown, Check, Wand2, ListChecks } from "lucide-react";
import { checklists } from "@/lib/mock-data";

export const Route = createFileRoute("/checklists")({
  head: () => ({
    meta: [
      { title: "Checklist Library — Rexora" },
      { name: "description", content: "Reusable troubleshooting checklists for engineers." },
    ],
  }),
  component: ChecklistsPage,
});

function ChecklistsPage() {
  const [open, setOpen] = useState<string | null>("c1");
  const [checks, setChecks] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {};
    for (const c of checklists) {
      init[c.id] = {};
      for (const s of c.steps) init[c.id][s.id] = s.done;
    }
    return init;
  });

  const toggle = (cid: string, sid: string) =>
    setChecks((p) => ({ ...p, [cid]: { ...p[cid], [sid]: !p[cid][sid] } }));

  const progressOf = (cid: string) => {
    const m = checks[cid] ?? {};
    const total = Object.keys(m).length || 1;
    const done = Object.values(m).filter(Boolean).length;
    return Math.round((done / total) * 100);
  };

  return (
    <AppShell
      title="Checklist Library"
      subtitle="Battle-tested, reusable troubleshooting workflows. Click a checklist to expand."
    >
      <div className="space-y-4">
        {checklists.map((c) => {
          const isOpen = open === c.id;
          const progress = progressOf(c.id);
          return (
            <div key={c.id} className="rounded-2xl border border-border bg-surface overflow-hidden transition-all hover:border-primary/30">
              <button
                onClick={() => setOpen(isOpen ? null : c.id)}
                className="w-full flex items-center gap-4 p-5 text-left"
              >
                <div className="h-11 w-11 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                  <ListChecks className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-foreground">{c.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 max-w-xs h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-[oklch(0.65_0.18_220)] rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{progress}% complete</span>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="border-t border-border bg-secondary/30 p-5 animate-fade-in">
                  <ul className="space-y-2.5">
                    {c.steps.map((s, idx) => {
                      const done = checks[c.id]?.[s.id];
                      return (
                        <li key={s.id} className="group">
                          <button
                            onClick={() => toggle(c.id, s.id)}
                            className="w-full flex items-start gap-3 p-3 rounded-xl bg-surface border border-border hover:border-primary/40 transition-colors text-left"
                          >
                            <div
                              className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                done ? "bg-primary border-primary" : "border-border group-hover:border-primary/60"
                              }`}
                            >
                              {done && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                            </div>
                            <div className="flex-1">
                              <div className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                Step {idx + 1} · {s.label}
                              </div>
                              {s.detail && (
                                <div className="text-xs text-muted-foreground mt-1">{s.detail}</div>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-4 flex justify-end">
                    <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-[var(--shadow-elevated)] transition-opacity">
                      <Wand2 className="h-4 w-4" /> Reuse in Troubleshooting
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
