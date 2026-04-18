import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

export function AppShell({ children, title, subtitle, actions }: { children: ReactNode; title?: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="max-w-[1400px] mx-auto px-8 py-8">
            {(title || actions) && (
              <div className="flex items-end justify-between gap-4 mb-7 animate-fade-in">
                <div>
                  {title && <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>}
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
  );
}
