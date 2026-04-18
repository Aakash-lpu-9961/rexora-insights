import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Bot, User, Search, ListChecks, FileText, Lightbulb, StickyNote } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot — Rexora" },
      { name: "description", content: "Conversational AI to triage and resolve issues fast." },
    ],
  }),
  component: ChatPage,
});

type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "ai"; loading?: boolean; payload?: AIPayload };

type AIPayload = {
  rootCauses: { label: string; confidence: number }[];
  steps: string[];
  similarCases: { id: string; title: string; tag: string }[];
  finalFix: string;
  notes: string;
};

const samplePayload: AIPayload = {
  rootCauses: [
    { label: "Bank profile mapping points to a deprecated region code", confidence: 86 },
    { label: "FX rate snapshot ran outside the matching window", confidence: 9 },
    { label: "Stuck batch in the ETL queue blocking ingestion", confidence: 5 },
  ],
  steps: [
    "Open Settings → Bank Profiles and verify the EMEA mapping uses the post-migration region code.",
    "Re-run the import job for the affected window in debug mode (trace logs enabled).",
    "Confirm the matching engine picked up the new entries (queue depth should drop to 0).",
    "Trigger an ad-hoc reconciliation to validate the fix end-to-end.",
  ],
  similarCases: [
    { id: "BR-2041", title: "Citi EMEA MT940 import failing post-migration", tag: "Same root cause" },
    { id: "BR-2098", title: "Match rate dropped to 41% on USD pool", tag: "Adjacent" },
  ],
  finalFix:
    "Update the Bank Profile EMEA mapping to the new region code (`EU-WEST-2`) and re-run the import job for the affected 24h window.",
  notes:
    "Confirmed against 4 historical cases. If failure persists after fix, escalate to Tech Lead — Bank Recon (Aarav Mehta).",
};

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "m0",
      role: "ai",
      payload: {
        rootCauses: [],
        steps: [],
        similarCases: [],
        finalFix: "",
        notes: "Hi — I'm Rexora AI. Describe your issue and I'll triage root causes, suggest fixes, and pull similar past cases.",
      },
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userId = `u${Date.now()}`;
    const aiId = `a${Date.now()}`;
    setMessages((m) => [...m, { id: userId, role: "user", text }, { id: aiId, role: "ai", loading: true }]);
    setInput("");

    setTimeout(() => {
      setMessages((m) => m.map((x) => (x.id === aiId ? { id: aiId, role: "ai", payload: samplePayload } : x)));
    }, 1600);
  };

  return (
    <AppShell title="AI Chatbot" subtitle="Describe an issue. Rexora will analyze, suggest fixes, and surface relevant cases.">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="rounded-2xl border border-border bg-surface flex flex-col h-[calc(100vh-220px)] overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-5">
            {messages.map((m) =>
              m.role === "user" ? <UserBubble key={m.id} text={m.text} /> : <AIBubble key={m.id} loading={m.loading} payload={m.payload} />
            )}
          </div>
          <div className="border-t border-border p-4 bg-surface">
            <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-background focus-within:border-primary focus-within:ring-4 focus-within:ring-[oklch(0.48_0.19_278/0.1)] transition-all p-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                rows={1}
                placeholder="Describe your issue…"
                className="flex-1 resize-none bg-transparent px-3 py-2 outline-none text-sm placeholder:text-muted-foreground max-h-32"
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 px-1 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> Rexora AI · finance-domain tuned</span>
              <span className="ml-auto">Press Enter to send · Shift+Enter for newline</span>
            </div>
          </div>
        </div>

        {/* Side helper */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Try asking</div>
            <div className="mt-3 space-y-2">
              {[
                "Why is the auto-match rate dropping?",
                "MT940 import failing for Citi EMEA",
                "Reconciliation engine timing out",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="w-full text-left text-sm text-foreground px-3 py-2.5 rounded-xl bg-secondary/60 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary-soft to-transparent p-5">
            <Sparkles className="h-5 w-5 text-primary" />
            <div className="mt-2 text-sm font-semibold text-foreground">Powered by your data</div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Rexora cross-references your checklists, past cases, and runtime telemetry to ground every answer.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 justify-end animate-fade-in-up">
      <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm shadow-[var(--shadow-soft)]">
        {text}
      </div>
      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[oklch(0.6_0.2_220)] to-primary text-primary-foreground flex items-center justify-center shrink-0">
        <User className="h-4 w-4" />
      </div>
    </div>
  );
}

function AIBubble({ loading, payload }: { loading?: boolean; payload?: AIPayload }) {
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-[oklch(0.4_0.2_278)] text-primary-foreground flex items-center justify-center shrink-0 shadow-[var(--shadow-elevated)]">
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[85%] flex-1">
        {loading ? (
          <div className="rounded-2xl rounded-tl-sm bg-secondary border border-border px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Analyzing</span>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        ) : payload && payload.rootCauses.length === 0 && !payload.finalFix ? (
          <div className="rounded-2xl rounded-tl-sm bg-secondary border border-border px-4 py-2.5 text-sm text-foreground">
            {payload.notes}
          </div>
        ) : payload ? (
          <div className="space-y-3">
            <Section icon={<Search className="h-4 w-4" />} title="Root Causes" delay={0}>
              <div className="space-y-2">
                {payload.rootCauses.map((rc, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="text-sm font-medium text-foreground">{rc.label}</div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        rc.confidence > 70 ? "bg-success/15 text-success" : rc.confidence > 30 ? "bg-warning/15 text-[oklch(0.45_0.15_75)]" : "bg-secondary text-muted-foreground"
                      }`}>
                        {rc.confidence}% confidence
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-[oklch(0.65_0.18_220)] rounded-full" style={{ width: `${rc.confidence}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon={<ListChecks className="h-4 w-4" />} title="Step-by-step Troubleshooting" delay={120}>
              <ol className="space-y-2">
                {payload.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 rounded-xl bg-surface border border-border p-3">
                    <span className="h-6 w-6 rounded-lg bg-primary-soft text-primary text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-sm text-foreground">{s}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section icon={<FileText className="h-4 w-4" />} title="Similar Past Cases" delay={240}>
              <div className="grid sm:grid-cols-2 gap-2">
                {payload.similarCases.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border bg-surface p-3 hover-lift cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono font-semibold text-muted-foreground">{c.id}</span>
                      <span className="text-[10px] font-semibold text-primary bg-primary-soft px-1.5 py-0.5 rounded-md">{c.tag}</span>
                    </div>
                    <div className="text-sm font-medium text-foreground">{c.title}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon={<Lightbulb className="h-4 w-4" />} title="Final Fix" delay={360} highlight>
              <div className="rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/30 p-4">
                <div className="text-sm text-foreground leading-relaxed">{payload.finalFix}</div>
              </div>
            </Section>

            <Section icon={<StickyNote className="h-4 w-4" />} title="Notes" delay={480}>
              <div className="rounded-xl bg-secondary/60 border border-border p-3 text-sm text-muted-foreground leading-relaxed">
                {payload.notes}
              </div>
            </Section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Section({ icon, title, children, delay = 0, highlight }: { icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number; highlight?: boolean }) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${highlight ? "bg-success/15 text-success" : "bg-primary-soft text-primary"}`}>
          {icon}
        </div>
        <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</div>
      </div>
      {children}
    </div>
  );
}
