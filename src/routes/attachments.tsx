import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState, type ReactNode } from "react";
import {
  Plus,
  Trash2,
  FileText,
  Video,
  Presentation,
  UploadCloud,
  Play,
  MoreHorizontal,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useActiveModule, useModuleStore } from "@/lib/module-store";

export const Route = createFileRoute("/attachments")({
  component: AttachmentsPage,
});

type Kind = "document" | "video" | "ppt";

function AttachmentsPage() {
  const mod = useActiveModule();
  const { deleteAttachment } = useModuleStore();
  const att = mod.data.attachments;
  const tabs = [
    {
      id: "documents" as const,
      kind: "document" as Kind,
      label: "Documents",
      icon: FileText,
      count: att.documents.length,
    },
    {
      id: "videos" as const,
      kind: "video" as Kind,
      label: "Videos",
      icon: Video,
      count: att.videos.length,
    },
    {
      id: "ppts" as const,
      kind: "ppt" as Kind,
      label: "Presentations",
      icon: Presentation,
      count: att.ppts.length,
    },
  ];
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("documents");
  const [modalKind, setModalKind] = useState<Kind | null>(null);

  const empty = att.documents.length + att.videos.length + att.ppts.length === 0;
  const activeKind = tabs.find((t) => t.id === tab)!.kind;

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteAttachment(id);
      toast.success("Deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AppShell
      title="Attachments"
      subtitle={`Library of documentation, recordings and decks for ${mod.name}.`}
      actions={
        <button
          onClick={() => setModalKind(activeKind)}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] flex items-center gap-2 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add{" "}
          {activeKind === "document"
            ? "Document"
            : activeKind === "video"
              ? "Video"
              : "Presentation"}
        </button>
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
                active
                  ? "bg-surface text-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${active ? "bg-primary-soft text-primary" : "bg-surface text-muted-foreground"}`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {empty ? (
        <EmptyState moduleName={mod.name} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tab === "documents" &&
            att.documents.map((d) => (
              <FileCard
                key={d.id}
                title={d.name}
                meta={`${d.type} · ${d.size} · ${d.updated}`}
                icon={<FileText className="h-5 w-5" />}
                accent="oklch(0.65 0.14 235)"
                onDelete={() => onDelete(d.id, d.name)}
              />
            ))}
          {tab === "videos" &&
            att.videos.map((v) => (
              <VideoCard
                key={v.id}
                title={v.name}
                duration={v.duration}
                updated={v.updated}
                onDelete={() => onDelete(v.id, v.name)}
              />
            ))}
          {tab === "ppts" &&
            att.ppts.map((p) => (
              <FileCard
                key={p.id}
                title={p.name}
                meta={`PPTX · ${p.size} · ${p.updated}`}
                icon={<Presentation className="h-5 w-5" />}
                accent="oklch(0.62 0.2 25)"
                onDelete={() => onDelete(p.id, p.name)}
              />
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

      {modalKind && <AddAttachmentModal kind={modalKind} onClose={() => setModalKind(null)} />}
    </AppShell>
  );
}

function EmptyState({ moduleName }: { moduleName: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="mt-3 text-sm font-medium text-foreground">
        No attachments yet for {moduleName}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Add your first document, video, or deck to get started.
      </div>
    </div>
  );
}

function FileCard({
  title,
  meta,
  icon,
  accent,
  onDelete,
}: {
  title: string;
  meta: string;
  icon: ReactNode;
  accent: string;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-surface p-4 hover-lift">
      <div className="flex items-start gap-3">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 60%, black))`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{meta}</div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all"
          title="Delete attachment"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
        <button className="flex-1 h-8 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
          <MoreHorizontal className="h-3.5 w-3.5" /> Preview
        </button>
      </div>
    </div>
  );
}

function VideoCard({
  title,
  duration,
  updated,
  onDelete,
}: {
  title: string;
  duration: string;
  updated: string;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-surface overflow-hidden hover-lift relative">
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg bg-black/60 text-white hover:bg-destructive flex items-center justify-center transition-all"
        title="Delete video"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <div className="relative aspect-video bg-gradient-to-br from-[oklch(0.3_0.08_278)] to-[oklch(0.18_0.03_265)] flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(0.5_0.2_278/0.4),transparent_60%)]" />
        <div className="relative h-12 w-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="h-5 w-5 text-primary ml-0.5" fill="currentColor" />
        </div>
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold">
          {duration}
        </div>
      </div>
      <div className="p-4">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground mt-1">Updated {updated}</div>
      </div>
    </div>
  );
}

function AddAttachmentModal({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const { createAttachment } = useModuleStore();
  const [form, setForm] = useState({ name: "", size: "", duration: "", fileType: "PDF", url: "" });
  const [submitting, setSubmitting] = useState(false);

  const label = kind === "document" ? "Document" : kind === "video" ? "Video" : "Presentation";

  async function onSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      await createAttachment({
        kind,
        name: form.name.trim(),
        size: form.size.trim(),
        duration: form.duration.trim(),
        fileType: form.fileType.trim(),
        url: form.url.trim(),
      });
      toast.success(`${label} added`);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-[var(--shadow-floating)] animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Add {label}</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={kind === "video" ? "Intro walkthrough" : "Runbook v2"}
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
            />
          </Field>
          {kind === "video" ? (
            <Field label="Duration">
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="12:30"
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
              />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Size">
                <input
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="2.4 MB"
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
                />
              </Field>
              {kind === "document" && (
                <Field label="Type">
                  <input
                    value={form.fileType}
                    onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                    placeholder="PDF"
                    className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
                  />
                </Field>
              )}
            </div>
          )}
          <Field label="Link (optional)">
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://…"
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
            />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border bg-secondary/30">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-border bg-surface text-sm font-medium hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={submitting}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Add
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
