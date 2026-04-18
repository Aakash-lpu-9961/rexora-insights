import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { Plus, Trash2, Layers, Check, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useModuleStore } from "@/lib/module-store";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { modules, selectedId, setSelectedId, addModule, deleteModule } = useModuleStore();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Module name is required.");
      return;
    }
    if (modules.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("A module with that name already exists.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await addModule(trimmed);
      if (created) {
        setName("");
        toast.success(`Module "${created.name}" created`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteModule(id);
      setConfirmId(null);
      toast.success("Module deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <AppShell title="Settings" subtitle="Manage your Rexora workspace and modules.">
      <div className="grid lg:grid-cols-[420px_1fr] gap-6">
        {/* Add module card */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-foreground">Add new module</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Spin up a fresh workspace with empty data.
              </div>
            </div>
          </div>

          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Module name
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Treasury Operations"
                className="w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm transition-all"
              />
              {error && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" /> {error}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}{" "}
              Add module
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-gradient-to-br from-primary-soft to-transparent border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="text-xs font-semibold text-foreground">What gets created?</div>
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
              <li>• Empty Overview, Checklists, Cases, Contacts, Attachments & Tracking</li>
              <li>• AI Chatbot pre-seeded with onboarding guidance</li>
              <li>• Auto-color & short code generated from the name</li>
              <li>• Saved locally — survives page reloads</li>
            </ul>
          </div>
        </div>

        {/* Module list */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <Layers className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-foreground">Module library</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {modules.length} module{modules.length === 1 ? "" : "s"} available
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {modules.map((m) => {
              const active = m.id === selectedId;
              const isLast = modules.length <= 1;
              const confirming = confirmId === m.id;
              const stats = m.data;
              return (
                <div
                  key={m.id}
                  className="p-5 flex items-center gap-4 hover:bg-secondary/40 transition-colors"
                >
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-[var(--shadow-soft)]"
                    style={{
                      background: `linear-gradient(135deg, ${m.color}, color-mix(in oklab, ${m.color} 60%, black))`,
                    }}
                  >
                    {m.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-foreground truncate">{m.name}</div>
                      {active && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-success/15 text-success">
                          <Check className="h-3 w-3" /> Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>{stats.cases.length} cases</span>
                      <span>{stats.checklists.length} checklists</span>
                      <span>{stats.contacts.length} contacts</span>
                      <span>{stats.tracking.length} TRs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!active && (
                      <button
                        onClick={() => setSelectedId(m.id)}
                        className="h-9 px-3 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-secondary transition-colors"
                      >
                        Switch to
                      </button>
                    )}
                    {confirming ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-destructive/10 border border-destructive/20">
                        <span className="text-[11px] font-medium text-destructive">Delete?</span>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="h-7 px-2 rounded-md bg-destructive text-destructive-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="h-7 px-2 rounded-md bg-surface border border-border text-foreground text-[11px] font-semibold hover:bg-secondary transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(m.id)}
                        disabled={isLast}
                        title={isLast ? "At least one module is required" : "Delete module"}
                        className="h-9 w-9 rounded-lg border border-border text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
