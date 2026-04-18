import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth-context";
import { adminApi, type ModuleTemplate } from "@/lib/admin-api";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/modules")({
  component: ModulesAdmin,
});

type Mod = {
  id: string;
  name: string;
  short: string;
  color: string;
  progress: number;
};

function ModulesAdmin() {
  const { token } = useAuth();
  const [modules, setModules] = useState<Mod[] | null>(null);
  const [templates, setTemplates] = useState<ModuleTemplate[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [instName, setInstName] = useState("");
  const [instTemplateId, setInstTemplateId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const [mods, tmps] = await Promise.all([
        apiRequest<Mod[]>("/api/modules", { token }),
        adminApi.listTemplates({ token }),
      ]);
      setModules(mods);
      setTemplates(tmps);
      if (!instTemplateId && tmps[0]) setInstTemplateId(tmps[0].id);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    if (token) void reload();
  }, [token]);

  async function instantiate() {
    if (!instName.trim() || !instTemplateId) return;
    setBusy(true);
    try {
      await adminApi.instantiateModule(
        { token },
        { name: instName.trim(), template_id: instTemplateId },
      );
      toast.success(`Module "${instName}" created from template`);
      setInstName("");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteModule(id: string) {
    if (!confirm(`Delete module "${id}" and all its data?`)) return;
    try {
      await apiRequest(`/api/admin/modules/${id}`, { method: "DELETE", token });
      toast.success("Module deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm(`Delete template "${id}"? (Existing modules keep their data.)`)) return;
    try {
      await adminApi.deleteTemplate({ token }, id);
      toast.success("Template deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const tmplOptions = useMemo(
    () =>
      (templates ?? []).map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      )),
    [templates],
  );

  return (
    <AdminShell title="Modules & Templates" subtitle="Create modules from reusable templates.">
      {err ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      ) : !modules || !templates ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <Panel title="Modules">
              <div className="space-y-2">
                {modules.length === 0 && (
                  <div className="text-sm text-muted-foreground">No modules yet.</div>
                )}
                {modules.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: m.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">
                        {m.id} · {m.short}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteModule(m.id)}
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                      title="Delete module"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Templates">
              <div className="space-y-2">
                {templates.length === 0 && (
                  <div className="text-sm text-muted-foreground">No templates yet.</div>
                )}
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-border bg-surface p-3 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">
                        {t.id}
                      </div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                        <span className="rounded bg-secondary/70 px-1.5 py-0.5">
                          {t.checklists.length} checklists
                        </span>
                        <span className="rounded bg-secondary/70 px-1.5 py-0.5">
                          {t.cases.length} cases
                        </span>
                        <span className="rounded bg-secondary/70 px-1.5 py-0.5">
                          {t.contacts.length} contacts
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteTemplate(t.id)}
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <aside className="space-y-4">
            <Panel title="Instantiate from template">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Module name
                  </label>
                  <input
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    placeholder="e.g. General Ledger"
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Template
                  </label>
                  <select
                    value={instTemplateId}
                    onChange={(e) => setInstTemplateId(e.target.value)}
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                  >
                    {templates.length === 0 && <option value="">No templates available</option>}
                    {tmplOptions}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={busy || !instName.trim() || !instTemplateId}
                  onClick={() => void instantiate()}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Create module
                </button>
              </div>
            </Panel>
            <Panel title="Add new template">
              <CreateTemplate onCreated={() => void reload()} token={token} />
            </Panel>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}

function CreateTemplate({ onCreated, token }: { onCreated: () => void; token: string | null }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await adminApi.createTemplate({ token }, { name: name.trim(), description });
      toast.success("Template created");
      setName("");
      setDescription("");
      onCreated();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Template name"
        className="w-full h-9 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full px-3 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm resize-none"
      />
      <button
        type="button"
        disabled={busy || !name.trim()}
        onClick={() => void submit()}
        className="w-full h-9 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Plus className="h-4 w-4" /> Create template
      </button>
      <p className="text-[11px] text-muted-foreground">
        Creates a blank template. To seed checklists/cases/contacts, use the API or edit via OpenAPI
        docs.
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">{title}</h2>
      {children}
    </div>
  );
}
