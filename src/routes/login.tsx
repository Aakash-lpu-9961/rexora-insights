import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search.redirect === "string" ? search.redirect : "/";
    // Only allow internal paths that don't bounce back through /login, to
    // prevent redirect chains like /login?redirect=/login?redirect=/…
    const safe =
      raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/login")
        ? raw
        : "/";
    return { redirect: safe };
  },
});

function LoginPage() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@rexora.io");
  const [password, setPassword] = useState("rexora-demo");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: redirect || "/" });
    }
  }, [isAuthenticated, redirect, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name || email.split("@")[0]);
      void navigate({ to: redirect || "/" });
    } catch (err) {
      setError((err as Error).message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left hero */}
      <div className="hidden lg:flex relative flex-col justify-between bg-gradient-to-br from-primary to-[oklch(0.55_0.2_220)] text-primary-foreground p-12 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center font-bold tracking-tight">
            R
          </div>
          <div className="text-lg font-semibold tracking-tight">Rexora</div>
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Resolve Faster. Work Smarter.
          </div>
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            AI-assisted triage for your
            <br />
            finance-module support team.
          </h1>
          <p className="text-base text-white/80 max-w-md">
            Structured checklists, searchable past cases, and an LLM copilot that cites similar
            incidents — built for Bank Reconciliation, Intercompany, ETL and more.
          </p>
        </div>
        <div className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} Rexora
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
              R
            </div>
            <div className="text-lg font-semibold tracking-tight text-foreground">Rexora</div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === "login" ? "Sign in to Rexora" : "Create your Rexora account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Use your credentials to access your modules and cases."
              : "Spin up a new account to start triaging issues."}
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)]"
                  placeholder="Aakash Kumar"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)]"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Need an account?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="font-medium text-primary hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Demo credentials</div>
            <div className="mt-1">
              <span className="font-mono">demo@rexora.io</span> /{" "}
              <span className="font-mono">rexora-demo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
