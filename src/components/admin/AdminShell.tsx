import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Boxes,
  ListChecks,
  History,
  Bot,
  ScrollText,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth-context";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };
const nav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/modules", label: "Modules & Templates", icon: Boxes },
  { to: "/admin/cases", label: "Cases (CSV import)", icon: History },
  { to: "/admin/checklists", label: "Checklists", icon: ListChecks },
  { to: "/admin/ai-insights", label: "AI Insights", icon: Bot },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

export function AdminShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <RequireAuth>
      <AdminGate>
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-40 h-14 border-b border-border glass">
            <div className="flex h-full items-center gap-4 px-6">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to workspace</span>
              </Link>
              <div className="ml-2 flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-[oklch(0.4_0.2_278)] flex items-center justify-center shadow-[var(--shadow-soft)]">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="leading-tight">
                  <div className="text-[13px] font-semibold tracking-tight text-foreground">
                    Rexora Admin
                  </div>
                  <div className="text-[10px] text-muted-foreground">Control plane</div>
                </div>
              </div>
              <div className="ml-auto text-[11px] uppercase tracking-wider font-semibold text-primary bg-primary-soft px-2 py-1 rounded-md">
                Admin
              </div>
            </div>
          </header>
          <div className="flex">
            <AdminSidebar />
            <main className="flex-1 min-w-0">
              <div className="max-w-[1400px] mx-auto px-8 py-8">
                {(title || actions) && (
                  <div className="flex items-end justify-between gap-4 mb-7 animate-fade-in">
                    <div>
                      {title && (
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                          {title}
                        </h1>
                      )}
                      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                  </div>
                )}
                <div className="animate-fade-in-up">{children}</div>
              </div>
            </main>
          </div>
        </div>
      </AdminGate>
    </RequireAuth>
  );
}

function AdminSidebar() {
  const location = useLocation();
  const path = location.pathname;
  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Admin
        </div>
        {nav.map((item) => {
          const active = path === item.to || (item.to !== "/admin" && path.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary" />
              )}
              <Icon
                className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"} transition-colors`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit admin</span>
        </Link>
      </div>
    </aside>
  );
}

function AdminGate({ children }: { children: ReactNode }) {
  const { auth, initializing } = useAuth();
  if (initializing) return null;
  if (auth && auth.user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-foreground">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You're signed in as {auth.user.email}, which isn't an admin account. Ask a system
            administrator to promote your account if you need access.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to workspace
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
