import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth-context";
import { adminApi, type AdminUser } from "@/lib/admin-api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: UsersAdmin,
});

function UsersAdmin() {
  const { token, auth } = useAuth();
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    try {
      setRows(await adminApi.listUsers({ token }));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    if (token) void reload();
  }, [token]);

  async function patch(id: number, patch: Partial<Pick<AdminUser, "role" | "is_active">>) {
    try {
      const next = await adminApi.updateUser({ token }, id, patch);
      setRows((r) => (r ? r.map((u) => (u.id === next.id ? next : u)) : r));
      toast.success("Updated");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AdminShell title="Users" subtitle="Promote, demote, or deactivate users.">
      {err ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      ) : !rows ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const isSelf = u.id === auth?.user.id;
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        title={isSelf ? "You can't change your own role." : undefined}
                        onChange={(e) =>
                          void patch(u.id, { role: e.target.value as "admin" | "user" })
                        }
                        className="h-8 px-2 rounded-lg border border-border bg-background text-xs"
                      >
                        <option value="admin">admin</option>
                        <option value="user">user</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => void patch(u.id, { is_active: !u.is_active })}
                        className={`h-7 px-2.5 rounded-lg text-xs font-medium border transition-colors ${
                          u.is_active
                            ? "border-success/30 bg-success/10 text-success hover:bg-success/15"
                            : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {u.is_active
                          ? "Active · click to deactivate"
                          : "Inactive · click to activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
