import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Mail, MessageSquare, Search, Users } from "lucide-react";
import { useState } from "react";
import { useActiveModule } from "@/lib/module-store";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Point of Contact — Rexora" },
      { name: "description", content: "Module experts directory." },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const mod = useActiveModule();
  const contacts = mod.data.contacts;
  const [q, setQ] = useState("");
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.role.toLowerCase().includes(q.toLowerCase()) ||
      c.team.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell title="Point of Contact" subtitle={`Module experts and escalation owners for ${mod.name}.`}>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, team or role…"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-4 focus:ring-[oklch(0.48_0.19_278/0.1)] outline-none text-sm transition-all"
        />
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="mt-3 text-sm font-medium text-foreground">No contacts yet for {mod.name}</div>
          <div className="text-xs text-muted-foreground mt-1">Add module experts so engineers know who to reach.</div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.email} className="group relative rounded-2xl border border-border bg-surface p-5 hover-lift">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.6_0.2_220)] text-primary-foreground flex items-center justify-center text-lg font-semibold shadow-[var(--shadow-elevated)]">
                    {c.initials}
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
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 opacity-100 lg:opacity-60 group-hover:opacity-100 transition-opacity">
                <a href={`mailto:${c.email}`} className="flex-1 h-9 rounded-lg bg-secondary hover:bg-accent text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
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
    </AppShell>
  );
}
