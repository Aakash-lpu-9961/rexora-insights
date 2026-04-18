import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth-context";
import { adminApi, type AdminChecklist } from "@/lib/admin-api";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/checklists")({
  component: ChecklistsAdmin,
});

type Mod = { id: string; name: string };

function ChecklistsAdmin() {
  const { token } = useAuth();
  const [modules, setModules] = useState<Mod[]>([]);
  const [filterModule, setFilterModule] = useState<string>("");
  const [rows, setRows] = useState<AdminChecklist[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    try {
      setRows(await adminApi.listChecklists({ token }, filterModule || undefined));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    if (!token) return;
    apiRequest<Mod[]>("/api/modules", { token })
      .then(setModules)
      .catch((e: Error) => setErr(e.message));
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterModule]);

  async function del(id: string) {
    if (!confirm("Delete this checklist?")) return;
    try {
      await adminApi.deleteChecklist({ token }, id);
      await reload();
      toast.success("Deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AdminShell title="Checklists" subtitle="All checklists across modules.">
      <div className="rounded-2xl border border-border bg-surface">
        <div className="p-4 flex items-center gap-3">
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="h-9 px-3 rounded-xl bg-background border border-border text-sm"
          >
            <option value="">All modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        {err ? (
          <div className="p-4 text-sm text-destructive">{err}</div>
        ) : !rows ? (
          <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No checklists.</div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((c) => (
              <div key={c.id} className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{c.title}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {c.module_id} · {c.steps.length} steps
                  </div>
                  {c.description && (
                    <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void del(c.id)}
                  className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive inline-flex items-center justify-center transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
