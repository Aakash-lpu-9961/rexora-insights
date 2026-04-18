import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Paperclip,
  ListChecks,
  History,
  Users,
  GitPullRequest,
  Bot,
  Sparkles,
  Settings as SettingsIcon,
} from "lucide-react";
import { useModuleStore } from "@/lib/module-store";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; highlight?: boolean };
const nav: NavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/attachments", label: "Attachments", icon: Paperclip },
  { to: "/checklists", label: "Checklist Library", icon: ListChecks },
  { to: "/cases", label: "Past Cases", icon: History },
  { to: "/contacts", label: "Point of Contact", icon: Users },
  { to: "/tracking", label: "Tracking Requests", icon: GitPullRequest },
  { to: "/chat", label: "AI Chatbot", icon: Bot, highlight: true },
];

export function Sidebar() {
  const location = useLocation();
  const path = location.pathname;
  const { selected } = useModuleStore();

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Active module banner */}
      <div className="p-4">
        <div className="rounded-xl border border-sidebar-border bg-gradient-to-br from-primary-soft to-transparent p-3.5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            <Sparkles className="h-3 w-3" />
            Active module
          </div>
          <div className="mt-1.5 text-sm font-semibold text-sidebar-foreground truncate">
            {selected.name}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-sidebar-border overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${selected.progress}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {selected.progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Workspace
        </div>
        {nav.map((item) => {
          const active = path === item.to;
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
              {item.highlight && !active && (
                <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings + Footer */}
      <div className="px-3 pb-2">
        <Link
          to="/settings"
          className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
            path === "/settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          }`}
        >
          {path === "/settings" && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary" />
          )}
          <SettingsIcon
            className={`h-4 w-4 ${path === "/settings" ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"} transition-colors`}
          />
          <span>Settings</span>
        </Link>
      </div>

      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-xl bg-gradient-to-br from-primary to-[oklch(0.4_0.2_278)] p-3.5 text-primary-foreground relative overflow-hidden">
          <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10 blur-xl" />
          <Bot className="h-5 w-5 mb-2 relative" />
          <div className="text-sm font-semibold relative">Need help?</div>
          <div className="text-[11px] opacity-80 mt-0.5 relative">
            Ask Rexora AI to triage your issue.
          </div>
        </div>
      </div>
    </aside>
  );
}
