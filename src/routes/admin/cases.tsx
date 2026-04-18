import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth-context";
import { adminApi, type AdminCase, type CSVImportResult } from "@/lib/admin-api";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cases")({
  component: CasesAdmin,
});

type Mod = { id: string; name: string };

function CasesAdmin() {
  const { token } = useAuth();
  const [modules, setModules] = useState<Mod[]>([]);
  const [rows, setRows] = useState<AdminCase[] | null>(null);
  const [filterModule, setFilterModule] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [query, setQuery] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // CSV import
  const [importModule, setImportModule] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);

  async function reload() {
    try {
      const params: Record<string, string | undefined> = {};
      if (filterModule) params.module_id = filterModule;
      if (filterPriority) params.priority = filterPriority;
      if (query) params.q = query;
      setRows(await adminApi.listCases({ token }, params));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    if (!token) return;
    apiRequest<Mod[]>("/api/modules", { token })
      .then((ms) => {
        setModules(ms);
        if (!importModule && ms[0]) setImportModule(ms[0].id);
      })
      .catch((e: Error) => setErr(e.message));
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterModule, filterPriority, query]);

  async function doImport() {
    if (!file || !importModule) return;
    setImporting(true);
    setResult(null);
    try {
      const r = await adminApi.importCasesCSV({ token }, importModule, file);
      setResult(r);
      toast.success(`Imported ${r.created} cases (${r.skipped} skipped)`);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  async function del(id: string) {
    if (!confirm(`Delete case ${id}?`)) return;
    try {
      await adminApi.deleteCase({ token }, id);
      await reload();
      toast.success("Deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AdminShell title="Cases" subtitle="Global case table with CSV bulk import.">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Bulk import (CSV)</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Expected columns (case-insensitive):{" "}
            <code>
              summary, root_cause, resolution, priority, tags, case_date, team, client_id, case_id
            </code>
            . Only <code>summary</code> is required.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px]">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Module
              </label>
              <select
                value={importModule}
                onChange={(e) => setImportModule(e.target.value)}
                className="mt-1 h-10 px-3 rounded-xl bg-background border border-border text-sm w-full"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[260px]">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                CSV file
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-sm file:text-foreground"
              />
            </div>
            <button
              type="button"
              disabled={!file || !importModule || importing}
              onClick={() => void doImport()}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import
            </button>
          </div>
          {result && (
            <div className="mt-3 rounded-xl border border-border bg-background p-3 text-xs">
              <div className="flex gap-4 text-muted-foreground">
                <span>
                  Created: <span className="font-semibold text-success">{result.created}</span>
                </span>
                <span>
                  Skipped: <span className="font-semibold">{result.skipped}</span>
                </span>
                <span>
                  Errors:{" "}
                  <span className="font-semibold text-destructive">{result.errors.length}</span>
                </span>
              </div>
              {result.errors.length > 0 && (
                <ul className="mt-2 list-disc pl-4 space-y-0.5 text-destructive">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface">
          <div className="p-4 flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search summary, root cause, resolution…"
              className="h-9 px-3 rounded-xl bg-background border border-border text-sm flex-1 min-w-[240px]"
            />
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
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="h-9 px-3 rounded-xl bg-background border border-border text-sm"
            >
              <option value="">All priorities</option>
              {["Critical", "High", "Medium", "Low"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          {err ? (
            <div className="p-4 text-sm text-destructive">{err}</div>
          ) : !rows ? (
            <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading cases…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No cases match.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Summary</th>
                    <th className="text-left px-4 py-3 font-semibold">Module</th>
                    <th className="text-left px-4 py-3 font-semibold">Priority</th>
                    <th className="text-left px-4 py-3 font-semibold">Tags</th>
                    <th className="text-right px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-t border-border align-top">
                      <td className="px-4 py-3 max-w-[420px]">
                        <div className="font-medium text-foreground">{c.summary}</div>
                        {c.root_cause && (
                          <div className="text-xs text-muted-foreground truncate">
                            {c.root_cause}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {c.module_id}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityPill p={c.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] rounded-md bg-primary-soft text-primary px-1.5 py-0.5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void del(c.id)}
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive inline-flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function PriorityPill({ p }: { p: AdminCase["priority"] }) {
  const styles: Record<AdminCase["priority"], string> = {
    Critical: "bg-destructive/15 text-destructive",
    High: "bg-warning/15 text-[oklch(0.45_0.15_75)]",
    Medium: "bg-primary-soft text-primary",
    Low: "bg-secondary text-muted-foreground",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${styles[p] ?? styles.Low}`}>
      {p}
    </span>
  );
}
