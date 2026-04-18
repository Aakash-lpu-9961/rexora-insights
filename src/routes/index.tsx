import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import {
  Play,
  ChevronDown,
  BookOpen,
  Workflow,
  Lightbulb,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useActiveModule } from "@/lib/module-store";

export const Route = createFileRoute("/")({
  component: OverviewPage,
});

const ICONS = { workflow: Workflow, lightbulb: Lightbulb, book: BookOpen };
const TONE = {
  success: { icon: CheckCircle2, cls: "text-success bg-success/10" },
  warning: { icon: AlertCircle, cls: "text-warning bg-warning/10" },
  info: { icon: Clock, cls: "text-info bg-info/10" },
} as const;

function OverviewPage() {
  const mod = useActiveModule();
  const ov = mod.data.overview;
  const [open, setOpen] = useState<string | null>(ov.sections[0]?.id ?? null);

  return (
    <AppShell
      title={mod.name}
      subtitle="Module overview, business purpose & how it operates inside Voyager 7S."
      actions={
        <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] flex items-center gap-2 transition-opacity">
          <Play className="h-4 w-4" /> Watch tutorial
        </button>
      }
    >
      {/* Hero intro card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary-soft via-surface to-surface p-8 mb-6">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[oklch(0.7_0.15_220/0.12)] blur-3xl" />
        <div className="relative grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface border border-border text-[11px] font-medium text-muted-foreground mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-[pulse-dot_1.6s_infinite]" />
              {ov.heroLead}
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground leading-tight">
              <span className="gradient-text">{ov.tagline}</span>
            </h2>
            <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
              {ov.heroBody}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {ov.chips.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs text-foreground font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {ov.stats.map((s) => {
              const Icon = TONE[s.tone].icon;
              return (
                <div
                  key={s.label}
                  className="rounded-xl bg-surface border border-border p-4 hover-lift"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center ${TONE[s.tone].cls}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{s.trend}</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Expandable sections */}
        <div className="lg:col-span-2 space-y-3">
          {ov.sections.map((s) => {
            const Icon = ICONS[s.iconKey];
            const isOpen = open === s.id;
            return (
              <div
                key={s.id}
                className="rounded-xl border border-border bg-surface overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-secondary/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold text-foreground">{s.title}</div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 -mt-1 animate-fade-in">
                    <div className="pl-14 text-sm text-muted-foreground leading-relaxed">
                      {s.body}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Video tutorial */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-[oklch(0.25_0.05_265)] to-[oklch(0.18_0.03_265)] flex items-center justify-center group cursor-pointer">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(0.5_0.2_278/0.3),transparent_60%)]" />
            <button className="relative h-16 w-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
            </button>
            <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-medium">
              {ov.featuredVideo.duration}
            </div>
          </div>
          <div className="p-5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Featured tutorial
            </div>
            <div className="mt-1.5 text-[15px] font-semibold text-foreground">
              {ov.featuredVideo.title}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {ov.featuredVideo.description}
            </p>
            <button className="mt-4 text-xs font-medium text-primary hover:underline flex items-center gap-1">
              Open in library <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
