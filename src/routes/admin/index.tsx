import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Boxes,
  Users,
  History,
  ListChecks,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Paperclip,
  GitPullRequest,
  Loader2,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth-context";
import { adminApi, type AnalyticsOverview } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    adminApi
      .analytics({ token })
      .then(setData)
      .catch((e: Error) => setErr(e.message));
  }, [token]);

  return (
    <AdminShell title="Dashboard" subtitle="Live view of Rexora usage, cases, and AI quality.">
      {err ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      ) : !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading analytics…
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={<Boxes className="h-4 w-4" />} label="Modules" value={data.total_modules} />
            <Stat icon={<History className="h-4 w-4" />} label="Cases" value={data.total_cases} />
            <Stat
              icon={<ListChecks className="h-4 w-4" />}
              label="Checklists"
              value={data.total_checklists}
            />
            <Stat icon={<Users className="h-4 w-4" />} label="Users" value={data.total_users} />
            <Stat
              icon={<Bot className="h-4 w-4" />}
              label="AI queries"
              value={data.ai_queries_total}
              hint={`${data.ai_queries_last_7d} last 7d`}
            />
            <Stat
              icon={<ThumbsUp className="h-4 w-4" />}
              label="Helpful"
              value={data.ai_feedback_up}
              tone="success"
            />
            <Stat
              icon={<ThumbsDown className="h-4 w-4" />}
              label="Not helpful"
              value={data.ai_feedback_down}
              tone="warning"
            />
            <Stat
              icon={<Paperclip className="h-4 w-4" />}
              label="Attachments"
              value={data.total_attachments}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title="Cases per module">
              <div className="space-y-2">
                {data.cases_per_module.length === 0 && (
                  <div className="text-sm text-muted-foreground">No modules yet.</div>
                )}
                {data.cases_per_module.map((m) => (
                  <div
                    key={m.module_id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {m.module_name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">
                        {m.module_id}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        <span className="font-semibold text-foreground">{m.case_count}</span> cases
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">{m.checklist_count}</span>{" "}
                        checklists
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Top tags">
              <div className="flex flex-wrap gap-2">
                {data.top_tags.length === 0 && (
                  <div className="text-sm text-muted-foreground">No tags yet.</div>
                )}
                {data.top_tags.map((t) => (
                  <span
                    key={t.tag}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft text-primary px-2.5 py-1 text-xs font-medium"
                  >
                    {t.tag}
                    <span className="text-[10px] text-primary/70">×{t.count}</span>
                  </span>
                ))}
              </div>
            </Panel>

            <Panel title="Recent activity" className="lg:col-span-2">
              <div className="space-y-1.5">
                {data.recent_activity.length === 0 && (
                  <div className="text-sm text-muted-foreground">No activity yet.</div>
                )}
                {data.recent_activity.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 py-2 border-b border-border last:border-b-0"
                  >
                    <Activity className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 text-sm">
                      <span className="font-medium text-foreground">{a.actor_email}</span>{" "}
                      <span className="text-muted-foreground">
                        {a.action}d {a.entity} {a.entity_id && <code>{a.entity_id}</code>}
                      </span>
                      {a.summary && (
                        <div className="text-xs text-muted-foreground truncate">{a.summary}</div>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="System totals">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Def label="Contacts" value={data.total_contacts} />
                <Def
                  label="Tracking requests"
                  value={data.total_tracking}
                  icon={<GitPullRequest className="h-3.5 w-3.5" />}
                />
                <Def label="Admins" value={data.total_admins} />
                <Def label="Helpful rate" value={feedbackRate(data)} />
              </dl>
            </Panel>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function feedbackRate(d: AnalyticsOverview): string {
  const total = d.ai_feedback_up + d.ai_feedback_down;
  if (total === 0) return "—";
  return `${Math.round((d.ai_feedback_up / total) * 100)}%`;
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-success bg-success/10"
      : tone === "warning"
        ? "text-[oklch(0.45_0.15_75)] bg-warning/15"
        : "text-primary bg-primary-soft";
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${toneClass}`}>
          {icon}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </div>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-foreground mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Def({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
      <dt className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
