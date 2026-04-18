import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { Plus, Pencil, Trash2, FileText, Video, Presentation, UploadCloud, Play, MoreHorizontal, Download } from "lucide-react";
import { useActiveModule } from "@/lib/module-store";

export const Route = createFileRoute("/attachments")({
  head: () => ({
    meta: [
      { title: "Attachments — Rexora" },
      { name: "description", content: "Manage docs, videos and presentations for the active module." },
    ],
  }),
  component: AttachmentsPage,
});

function AttachmentsPage() {
  const mod = useActiveModule();
  const att = mod.data.attachments;
  const tabs = [
    { id: "documents" as const, label: "Documents", icon: FileText, count: att.documents.length },
    { id: "videos" as const, label: "Videos", icon: Video, count: att.videos.length },
    { id: "ppts" as const, label: "Presentations", icon: Presentation, count: att.ppts.length },
  ];
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("documents");
  const [drag, setDrag] = useState(false);

  const empty = att.documents.length + att.videos.length + att.ppts.length === 0;

  return (
    <AppShell
      title="Attachments"
      subtitle={`Library of documentation, recordings and decks for ${mod.name}.`}
      actions={
        <div className="flex items-center gap-2">
          <button className="h-10 px-3.5 rounded-xl bg-surface border border-border text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-2 transition-colors">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button className="h-10 px-3.5 rounded-xl bg-surface border border-border text-sm font-medium text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] flex items-center gap-2 transition-opacity">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="inline-flex p-1 rounded-xl bg-secondary border border-border mb-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 h-9 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                active ? "bg-surface text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${active ? "bg-primary-soft text-primary" : "bg-surface text-muted-foreground"}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); }}
        className={`mb-6 rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          drag ? "border-primary bg-primary-soft/40" : "border-border bg-surface/50 hover:border-primary/40"
        }`}
      >
        <div className="mx-auto h-12 w-12 rounded-2xl bg-primary-soft flex items-center justify-center">
          <UploadCloud className="h-6 w-6 text-primary" />
        </div>
        <div className="mt-3 text-sm font-medium text-foreground">Drag & drop files here, or click to browse</div>
        <div className="text-xs text-muted-foreground mt-1">PDF, DOCX, MP4, PPTX · up to 200MB</div>
      </div>

      {/* Grid */}
      {empty ? (
        <EmptyState moduleName={mod.name} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tab === "documents" && att.documents.map((d) => (
            <FileCard key={d.id} title={d.name} meta={`${d.type} · ${d.size} · ${d.updated}`} icon={<FileText className="h-5 w-5" />} accent="oklch(0.65 0.14 235)" />
          ))}
          {tab === "videos" && att.videos.map((v) => (
            <VideoCard key={v.id} title={v.name} duration={v.duration} updated={v.updated} />
          ))}
          {tab === "ppts" && att.ppts.map((p) => (
            <FileCard key={p.id} title={p.name} meta={`PPTX · ${p.size} · ${p.updated}`} icon={<Presentation className="h-5 w-5" />} accent="oklch(0.62 0.2 25)" />
          ))}
          {((tab === "documents" && att.documents.length === 0) ||
            (tab === "videos" && att.videos.length === 0) ||
            (tab === "ppts" && att.ppts.length === 0)) && (
            <div className="col-span-full text-sm text-muted-foreground text-center py-10">
              No {tab === "ppts" ? "presentations" : tab} yet for {mod.name}.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function EmptyState({ moduleName }: { moduleName: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="mt-3 text-sm font-medium text-foreground">No attachments yet for {moduleName}</div>
      <div className="text-xs text-muted-foreground mt-1">Upload your first document, video, or deck to get started.</div>
    </div>
  );
}

function FileCard({ title, meta, icon, accent }: { title: string; meta: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-surface p-4 hover-lift">
      <div className="flex items-start gap-3">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 60%, black))` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{meta}</div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-opacity">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
        <button className="flex-1 h-8 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
          <Download className="h-3.5 w-3.5" /> Download
        </button>
        <button className="h-8 px-3 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-secondary transition-colors">Open</button>
      </div>
    </div>
  );
}

function VideoCard({ title, duration, updated }: { title: string; duration: string; updated: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-surface overflow-hidden hover-lift">
      <div className="relative aspect-video bg-gradient-to-br from-[oklch(0.3_0.08_278)] to-[oklch(0.18_0.03_265)] flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(0.5_0.2_278/0.4),transparent_60%)]" />
        <div className="relative h-12 w-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="h-5 w-5 text-primary ml-0.5" fill="currentColor" />
        </div>
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold">{duration}</div>
      </div>
      <div className="p-4">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground mt-1">Updated {updated}</div>
      </div>
    </div>
  );
}
