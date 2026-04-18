import { Search, Bell, ChevronDown, Sparkles, Command, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useModuleStore } from "@/lib/module-store";

export function TopBar() {
  const { modules, selected, setSelectedId } = useModuleStore();
  const [moduleOpen, setModuleOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border glass">
      <div className="flex h-full items-center gap-4 px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 min-w-[260px]">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-[oklch(0.6_0.2_220)] flex items-center justify-center shadow-[var(--shadow-elevated)]">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-surface" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-foreground">Rexora</div>
            <div className="text-[11px] text-muted-foreground">Resolve Faster. Work Smarter.</div>
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 flex items-center gap-3 max-w-3xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search modules, cases, checklists, contacts…"
              className="w-full h-10 pl-10 pr-20 rounded-xl bg-secondary/70 border border-transparent hover:border-border focus:border-primary focus:bg-surface focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" /> K
            </kbd>
          </div>

          {/* Module switcher */}
          <div className="relative">
            <button
              onClick={() => setModuleOpen((v) => !v)}
              className="h-10 px-3 rounded-xl bg-surface border border-border hover:border-primary/40 flex items-center gap-2 text-sm font-medium text-foreground transition-colors"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: selected.color }} />
              <span className="hidden sm:inline max-w-[160px] truncate">{selected.name}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {moduleOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setModuleOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-popover shadow-[var(--shadow-floating)] p-1.5 animate-scale-in origin-top-right z-50">
                  <div className="px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Switch module</div>
                  <div className="max-h-72 overflow-y-auto scrollbar-thin">
                    {modules.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedId(m.id);
                          setModuleOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-accent transition-colors ${
                          m.id === selected.id ? "bg-accent text-accent-foreground" : "text-foreground"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: m.color }} />
                        <span className="font-medium truncate">{m.name}</span>
                        <span className="ml-auto text-[10px] font-mono text-muted-foreground">{m.short}</span>
                      </button>
                    ))}
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setModuleOpen(false)}
                    className="mt-1 flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary-soft transition-colors border-t border-border"
                  >
                    <Plus className="h-4 w-4" /> Manage modules
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="relative h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-surface" />
          </button>
          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="h-10 pl-1 pr-3 rounded-xl hover:bg-secondary flex items-center gap-2 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.6_0.2_220)] to-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                AM
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-xs font-medium text-foreground">Aakash Kumar</div>
                <div className="text-[10px] text-muted-foreground">Tech Lead</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover shadow-[var(--shadow-floating)] p-1.5 animate-scale-in origin-top-right z-50">
                {["Profile", "Preferences", "Keyboard shortcuts", "Sign out"].map((item) => (
                  <button key={item} className="w-full text-left px-2.5 py-2 rounded-lg text-sm hover:bg-accent text-foreground transition-colors">
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
