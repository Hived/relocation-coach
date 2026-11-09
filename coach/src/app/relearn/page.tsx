"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { RotateCcw, Sparkles } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/client";
import type { Mistake } from "@/lib/types";
import { Badge, Button, ErrorBox, Md, PageHeader, Panel, Thinking, TriLang } from "@/components/ui";
import { CheckQuestion } from "@/components/CheckQuestion";

interface Item { file: string; area: string; title: string }

export default function RelearnPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [card, setCard] = useState<{ content: string; mistakes: Mistake[] } | null>(null);
  const [checks, setChecks] = useState<{ q: string; answer: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => {
    api<Item[]>("/api/relearn").then(setItems).catch(setErr);
  }, []);

  const open = async (file: string) => {
    setSel(file);
    setCard(null);
    setChecks(null);
    try {
      setCard(await api(`/api/relearn?file=${encodeURIComponent(file)}`));
    } catch (e) {
      setErr(e);
    }
  };
  const genChecks = async () => {
    if (!sel) return;
    setBusy(true);
    try {
      setChecks((await api<{ questions: { q: string; answer: string }[] }>("/api/relearn", { body: { file: sel } })).questions);
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  const topic = sel?.split("/")[1]?.replace(/\.md$/, "") ?? "";
  const area = (sel?.split("/")[0] ?? "coding") as "coding" | "french";

  return (
    <div>
      <PageHeader title="Relearn" subtitle="Forgot something after months? Read the 1-page card, see your old mistakes, answer 3 checks. ~15 min." />
      <ErrorBox error={err} />
      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <Panel className="h-fit">
          {!items ? (
            <Thinking label="Loading" />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted">Cards are created automatically when you study a lesson in the Coding Studio. Claude Code sessions can also add French cards in <code>relearn/french/</code>.</p>
          ) : (
            (["coding", "french"] as const).map((a) => (
              <div key={a} className="mb-4">
                <div className="text-xs uppercase tracking-wide text-muted mb-2">{a === "coding" ? "💻 Coding" : "🇫🇷 French"}</div>
                {items
                  .filter((i) => i.area === a)
                  .map((i) => (
                    <button key={i.file} onClick={() => open(i.file)} className={clsx("w-full text-left rounded-lg px-2 py-1.5 text-sm hover:bg-panel-2 flex items-center gap-2", sel === i.file && "bg-accent/15 text-white")}>
                      <RotateCcw size={14} className="text-muted" /> {i.title}
                    </button>
                  ))}
              </div>
            ))
          )}
        </Panel>
        <div className="flex flex-col gap-6 min-w-0">
          {!sel && <Panel className="text-muted">Pick a card on the left.</Panel>}
          {sel && !card && <Thinking label="Loading card" />}
          {card && (
            <>
              <Panel>
                <Md>{card.content}</Md>
              </Panel>
              {card.mistakes.length > 0 && (
                <Panel delay={0.05}>
                  <h3 className="font-semibold mb-3">Your past mistakes on this topic ({card.mistakes.length})</h3>
                  <div className="flex flex-col gap-3">
                    {card.mistakes.map((m) => (
                      <div key={m.id} className="rounded-lg border border-line bg-ink/40 p-3 text-sm">
                        <div className="flex gap-2 mb-1">
                          <Badge tone={m.status === "open" ? "bad" : "good"}>{m.status}</Badge>
                          <span className="text-muted">{m.date}</span>
                        </div>
                        <div>{m.question}</div>
                        <div className="mt-1">
                          ❌ <span className="text-bad">{m.myAnswer}</span> → ✅ <span className="text-good">{m.correction}</span>
                        </div>
                        <div className="text-muted mt-1">
                          <TriLang text={m.rule} compact />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
              <Panel delay={0.1}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Quick check</h3>
                  <Button size="sm" onClick={genChecks} loading={busy}>
                    <Sparkles size={14} /> {checks ? "New questions" : "Give me 3 questions"}
                  </Button>
                </div>
                {busy && <Thinking />}
                {checks && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 mt-4">
                    {checks.map((c, i) => (
                      <CheckQuestion key={`${sel}-${i}-${c.q}`} q={c.q} expected={c.answer} topic={topic} area={area} />
                    ))}
                  </motion.div>
                )}
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
