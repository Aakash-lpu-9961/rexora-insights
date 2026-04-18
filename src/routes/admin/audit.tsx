import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth-context";
import { adminApi, type AuditEntry } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/audit")({
  component: AuditPage,
});

function AuditPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    try {
      setRows(
        await adminApi.listAudit(
          { token },
          {
            entity: entity || undefined,
            action: action || undefined,
            limit: 200,
          },
        ),
      );
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    if (token) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, entity, action]);

  return (
    <AdminShell title="Audit Log" subtitle="Who did what, when.">
      <div className="flex items-center gap-3 mb-4">
        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="h-9 px-3 rounded-xl bg-background border border-border text-sm"
        >
          <option value="">All entities</option>
          {[
            "module",
            "checklist",
            "case",
            "template",
            "user",
            "contact",
            "tracking",
            "attachment",
          ].map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-9 px-3 rounded-xl bg-background border border-border text-sm"
        >
          <option value="">All actions</option>
          {["create", "update", "delete"].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      {err ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      ) : !rows ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No audit entries.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">When</th>
                <th className="text-left px-4 py-3 font-semibold">Actor</th>
                <th className="text-left px-4 py-3 font-semibold">Action</th>
                <th className="text-left px-4 py-3 font-semibold">Entity</th>
                <th className="text-left px-4 py-3 font-semibold">Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3 whitespace-nowrap text-[11px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-foreground">{a.actor_email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold rounded-md px-2 py-0.5 bg-secondary text-foreground">
                      {a.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="font-mono text-[11px]">{a.entity}</span>
                    {a.entity_id && (
                      <span className="ml-1 font-mono text-[11px] text-foreground">
                        #{a.entity_id}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
