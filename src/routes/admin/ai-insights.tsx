import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth-context";
import { adminApi, type AIInsight } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/ai-insights")({
  component: AIInsightsPage,
});

function AIInsightsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AIInsight[] | null>(null);
  const [feedback, setFeedback] = useState<"" | "up" | "down">("");
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    try {
      setRows(
        await adminApi.listInsights(
          { token },
          feedback ? { feedback: feedback as "up" | "down", limit: 100 } : { limit: 100 },
        ),
      );
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    if (token) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, feedback]);

  return (
    <AdminShell
      title="AI Insights"
      subtitle="Every AI query logged. Filter by feedback to find weak spots."
    >
      <div className="flex items-center gap-2 mb-4">
        <FilterPill active={feedback === ""} onClick={() => setFeedback("")}>
          All
        </FilterPill>
        <FilterPill active={feedback === "up"} onClick={() => setFeedback("up")}>
          <ThumbsUp className="h-3.5 w-3.5" /> Helpful
        </FilterPill>
        <FilterPill active={feedback === "down"} onClick={() => setFeedback("down")}>
          <ThumbsDown className="h-3.5 w-3.5" /> Not helpful
        </FilterPill>
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
        <div className="text-sm text-muted-foreground">No queries match.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm text-foreground">
                  <span className="font-medium">{r.user_email || "anon"}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {r.module_name || r.module_id || "no module"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {r.feedback === "up" && (
                    <span className="text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> Helpful
                    </span>
                  )}
                  {r.feedback === "down" && (
                    <span className="text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3" /> Not helpful
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-sm text-foreground whitespace-pre-wrap">{r.query}</div>
              {r.feedback_note && (
                <div className="mt-2 text-xs text-muted-foreground bg-secondary/60 rounded-lg p-2">
                  Note: {r.feedback_note}
                </div>
              )}
              <details className="mt-2">
                <summary className="text-[11px] text-muted-foreground cursor-pointer">
                  AI response (JSON)
                </summary>
                <pre className="mt-2 text-[11px] bg-background border border-border rounded-lg p-3 overflow-x-auto">
                  {JSON.stringify(r.response, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface text-foreground border-border hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
