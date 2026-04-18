import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Mail, MessageSquare, Search, Users, Plus, X, Trash2, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useActiveModule, useModuleStore, type Contact } from "@/lib/module-store";

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
});

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function ContactsPage() {
  const mod = useActiveModule();
  const { deleteContact } = useModuleStore();
  const contacts = mod.data.contacts;
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.role.toLowerCase().includes(q.toLowerCase()) ||
      c.team.toLowerCase().includes(q.toLowerCase()),
  );

  async function onDelete(c: Contact) {
    if (c.id == null) return;
    if (!window.confirm(`Remove ${c.name} from contacts?`)) return;
    try {
      await deleteContact(c.id);
      toast.success(`Removed ${c.name}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AppShell
      title="Point of Contact"
      subtitle={`Module experts and escalation owners for ${mod.name}.`}
      actions={
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elevated)] flex items-center gap-2 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Contact
        </button>
      }
    >
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, team or role…"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm transition-all"
        />
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="mt-3 text-sm font-medium text-foreground">
            No contacts yet for {mod.name}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Add module experts so engineers know who to reach.
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id ?? c.email}
              className="group relative rounded-2xl border border-border bg-surface p-5 hover-lift"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.6_0.2_220)] text-primary-foreground flex items-center justify-center text-lg font-semibold shadow-[var(--shadow-elevated)]">
                    {c.initials || initialsFor(c.name)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-surface" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-foreground truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.role}</div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-primary-soft text-primary text-[10px] font-semibold">
                    {c.team}
                  </span>
                </div>
                <button
                  onClick={() => onDelete(c)}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all"
                  title="Remove contact"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 opacity-100 lg:opacity-60 group-hover:opacity-100 transition-opacity">
                <a
                  href={`mailto:${c.email}`}
                  className="flex-1 h-9 rounded-lg bg-secondary hover:bg-accent text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
                <button className="flex-1 h-9 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <AddContactModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}

function AddContactModal({ onClose }: { onClose: () => void }) {
  const { createContact } = useModuleStore();
  const [form, setForm] = useState({ name: "", role: "", team: "CND", email: "" });
  const [submitting, setSubmitting] = useState(false);

  async function onSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      await createContact({
        name: form.name.trim(),
        role: form.role.trim(),
        team: form.team,
        email: form.email.trim(),
        initials: initialsFor(form.name),
      });
      toast.success(`Added ${form.name}`);
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
          <h3 className="text-lg font-semibold text-foreground">Add Contact</h3>
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
              placeholder="Aakash Kumar"
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="aakash@company.com"
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Senior Engineer"
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
              />
            </Field>
            <Field label="Team">
              <select
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
              >
                <option>CND</option>
                <option>NY</option>
                <option>TX</option>
                <option>NC</option>
                <option>SB</option>
              </select>
            </Field>
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
