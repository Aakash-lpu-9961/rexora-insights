import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Check, ListChecks, Plus, X, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActiveModule, useModuleStore, type Checklist, type Step } from "@/lib/module-store";

export const Route = createFileRoute("/checklists")({
  component: ChecklistsPage,
});

function ChecklistsPage() {
  const mod = useActiveModule();
  const { updateChecklist, deleteChecklist } = useModuleStore();
  const checklists = mod.data.checklists;
  const [open, setOpen] = useState<string | null>(checklists[0]?.id ?? null);
  const [modalOpen, setModalOpen] = useState(false);

  // Collapse state resets when the module changes
  useEffect(() => {
    setOpen(checklists[0]?.id ?? null);
  }, [mod.id, checklists]);

  async function toggle(checklist: Checklist, step: Step) {
    const nextSteps = checklist.steps.map((s) => (s.id === step.id ? { ...s, done: !s.done } : s));
    try {
      await updateChecklist(checklist.id, { steps: nextSteps });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(checklist: Checklist) {
    if (!window.confirm(`Delete checklist "${checklist.title}"?`)) return;
    try {
      await deleteChecklist(checklist.id);
      toast.success("Checklist deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AppShell
      title="Checklist Library"
      subtitle={`Battle-tested troubleshooting workflows for ${mod.name}.`}
      actions={
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] flex items-center gap-2 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Checklist
        </button>
      }
    >
      {checklists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
            <ListChecks className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="mt-3 text-sm font-medium text-foreground">
            No checklists yet for {mod.name}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Create your first reusable troubleshooting workflow.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map((c) => {
            const isOpen = open === c.id;
            const progress = c.progress;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-surface overflow-hidden transition-all hover:border-primary/30 group"
              >
                <div className="flex items-stretch">
                  <button
                    onClick={() => setOpen(isOpen ? null : c.id)}
                    className="flex-1 flex items-center gap-4 p-5 text-left"
                  >
                    <div className="h-11 w-11 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                      <ListChecks className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-foreground">{c.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 max-w-xs h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-[oklch(0.65_0.18_220)] rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {progress}% complete
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="opacity-0 group-hover:opacity-100 px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-l border-border transition-all"
                    title="Delete checklist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-secondary/30 p-5 animate-fade-in">
                    <ul className="space-y-2.5">
                      {c.steps.map((s, idx) => (
                        <li key={s.id} className="group/step">
                          <button
                            onClick={() => toggle(c, s)}
                            className="w-full flex items-start gap-3 p-3 rounded-xl bg-surface border border-border hover:border-primary/40 transition-colors text-left"
                          >
                            <div
                              className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                s.done
                                  ? "bg-primary border-primary"
                                  : "border-border group-hover/step:border-primary/60"
                              }`}
                            >
                              {s.done && (
                                <Check
                                  className="h-3 w-3 text-primary-foreground"
                                  strokeWidth={3}
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <div
                                className={`text-sm font-medium ${s.done ? "text-muted-foreground line-through" : "text-foreground"}`}
                              >
                                Step {idx + 1} · {s.label}
                              </div>
                              {s.detail && (
                                <div className="text-xs text-muted-foreground mt-1">{s.detail}</div>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && <AddChecklistModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}

function AddChecklistModal({ onClose }: { onClose: () => void }) {
  const { createChecklist } = useModuleStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

  function updateStep(idx: number, val: string) {
    setSteps(steps.map((s, i) => (i === idx ? val : s)));
  }
  function addStep() {
    setSteps([...steps, ""]);
  }
  function removeStep(idx: number) {
    setSteps(steps.filter((_, i) => i !== idx));
  }

  async function onSave() {
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (!title.trim() || cleanSteps.length === 0) {
      toast.error("Title and at least one step are required");
      return;
    }
    setSubmitting(true);
    try {
      await createChecklist({
        title: title.trim(),
        description: description.trim(),
        steps: cleanSteps.map((label) => ({ label, done: false })),
      });
      toast.success("Checklist created");
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
      <div className="relative w-full max-w-xl rounded-2xl bg-surface border border-border shadow-[var(--shadow-floating)] animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">New Checklist</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Capture a reusable troubleshooting workflow.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Daily Reconciliation Triage"
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this checklist for?"
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm resize-none"
            />
          </Field>
          <div>
            <div className="text-xs font-medium text-foreground mb-1.5">Steps</div>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                    {i + 1}
                  </div>
                  <input
                    value={s}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                    className="flex-1 h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
                  />
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(i)}
                      className="h-10 w-10 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                      title="Remove step"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addStep}
              className="mt-2 h-9 px-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add step
            </button>
          </div>
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
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save checklist
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
