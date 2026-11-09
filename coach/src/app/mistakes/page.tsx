"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, Search, CheckCircle2, Circle, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { api, celebrate } from "@/lib/client";
import type { Mistake, TriText } from "@/lib/types";
import { Badge, Button, ErrorBox, PageHeader, Panel, Thinking, TriLang, inputCls } from "@/components/ui";

function MistakesInner() {
  const params = useSearchParams();
  const [list, setList] = useState<Mistake[] | null>(null);
  const [area, setArea] = useState("all");
  const [status, setStatus] = useState<"open" | "closed" | "all">("open");
  const [q, setQ] = useState("");
  const [redo, setRedo] = useState(params.get("redo") === "1");
  const [err, setErr] = useState<unknown>(null);

  const load = useCallback(() => {
    api<Mistake[]>("/api/mistakes").then(setList).catch(setErr);
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(
    () =>
      (list ?? []).filter(
        (m) =>
          (area === "all" || m.area === area) &&
          (status === "all" || m.status === status) &&
          (!q || `${m.topic} ${m.question} ${m.myAnswer} ${m.correction}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [list, area, status, q],
  );
  const byDate = useMemo(() => {
    const g: Record<string, Mistake[]> = {};
    for (const m of filtered) (g[m.date] ??= []).push(m);
    return Object.entries(g);
  }, [filtered]);

  return (
    <div className="max-w-4xl">
      <PageHeader title="Mistake Journal" subtitle="Everything you got wrong, with the correction and the rule. Redo until correct twice in a row.">
        <Button onClick={() => setRedo((r) => !r)} variant={redo ? "outline" : "primary"}>
          <RotateCcw size={16} /> {redo ? "Back to journal" : `Redo mistakes (${(list ?? []).filter((m) => m.status === "open").length})`}
        </Button>
      </PageHeader>
      <ErrorBox error={err} />
      {!list ? (
        <Thinking label="Loading" />
      ) : redo ? (
        <Redo
          items={filtered.filter((m) => m.status === "open")}
          onFinish={() => {
            setRedo(false);
            load();
          }}
        />
      ) : (
        <>
          <Panel className="mb-6 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className={clsx(inputCls, "w-full pl-9")} placeholder="Search topic, answer, correction…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className={inputCls} value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="all">All areas</option>
              <option value="coding">Coding</option>
              <option value="french">French</option>
              <option value="interview">Interview</option>
            </select>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as "open" | "closed" | "all")}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
          </Panel>
          {byDate.length === 0 && <Panel className="text-muted">No mistakes here. 🎉</Panel>}
          <div className="relative pl-6 border-l border-line">
            {byDate.map(([date, items], gi) => (
              <div key={date} className="mb-8">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: gi * 0.05 }} className="absolute -left-[7px] w-3.5 h-3.5 rounded-full bg-accent mt-1" />
                <div className="text-sm text-muted mb-3">{new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
                <div className="flex flex-col gap-3">
                  {items.map((m) => (
                    <MistakeRow key={m.id} m={m} onChange={load} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MistakeRow({ m, onChange }: { m: Mistake; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const toggle = async () => {
    await api("/api/mistakes", { method: "PATCH", body: { id: m.id, status: m.status === "open" ? "closed" : "open" } });
    onChange();
  };
  return (
    <motion.div layout className="glass rounded-xl p-4">
      <button className="w-full text-left flex items-start gap-3" onClick={() => setOpen((o) => !o)}>
        {m.status === "closed" ? <CheckCircle2 className="text-good shrink-0" size={18} /> : <Circle className="text-bad shrink-0" size={18} />}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-1">
            <Badge tone="accent">{m.area}</Badge>
            <Badge>{m.topic}</Badge>
            {m.streakCorrect > 0 && <Badge tone="good">{m.streakCorrect}/2 correct</Badge>}
          </div>
          <div className="text-sm">{m.question}</div>
        </div>
        <ChevronDown size={16} className={clsx("text-muted transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pl-8 flex flex-col gap-2 text-sm">
              <div>
                ❌ <span className="text-bad">{m.myAnswer}</span>
              </div>
              <div>
                ✅ <span className="text-good">{m.correction}</span>
              </div>
              <div className="text-muted">
                <TriLang text={m.rule} compact />
              </div>
              {m.history.length > 0 && (
                <div className="text-xs text-muted">
                  Redo history: {m.history.map((h) => `${h.date} ${h.correct ? "✓" : "✗"}`).join(" · ")}
                </div>
              )}
              <div>
                <Button size="sm" variant="ghost" onClick={toggle}>
                  {m.status === "open" ? "Mark as learned" : "Reopen"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Redo({ items, onFinish }: { items: Mistake[]; onFinish: () => void }) {
  const [queue] = useState(() => items.slice(0, 15));
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ correct: boolean; feedback: TriText; mistake?: Mistake } | null>(null);
  const [score, setScore] = useState(0);
  const [err, setErr] = useState<unknown>(null);
  const m = queue[i];

  if (!queue.length) return <Panel className="text-muted">No open mistakes. 🎉</Panel>;
  if (!m)
    return (
      <Panel className="text-center py-10">
        <div className="text-3xl font-bold gradient-text">
          {score}/{queue.length}
        </div>
        <div className="text-muted mt-2">correct this round</div>
        <Button className="mt-6" onClick={onFinish}>
          Back to journal
        </Button>
      </Panel>
    );

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ correct: boolean; feedback: TriText; mistake?: Mistake }>("/api/mistakes/redo", { body: { id: m.id, answer } });
      setRes(r);
      if (r.correct) {
        setScore((s) => s + 1);
        celebrate(r.mistake?.status === "closed");
      }
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };
  const next = () => {
    setRes(null);
    setAnswer("");
    setI((x) => x + 1);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div key={m.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
        <Panel>
          <div className="flex items-center justify-between mb-4">
            <Badge tone="accent">
              {i + 1} / {queue.length}
            </Badge>
            <div className="flex gap-2">
              <Badge>{m.area}</Badge>
              <Badge>{m.topic}</Badge>
              <Badge tone="good">{m.streakCorrect}/2</Badge>
            </div>
          </div>
          <div className="text-lg font-medium mb-4">{m.question}</div>
          <textarea className={clsx(inputCls, "w-full min-h-28")} value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!!res} placeholder="Your answer…" />
          <div className="mt-3 flex gap-2">
            {!res ? (
              <>
                <Button onClick={submit} loading={busy} disabled={!answer.trim()}>
                  Check
                </Button>
                <Button variant="ghost" onClick={next}>
                  Skip
                </Button>
              </>
            ) : (
              <Button onClick={next}>Next →</Button>
            )}
          </div>
          {busy && <Thinking label="Checking" />}
          <ErrorBox error={err} />
          <AnimatePresence>
            {res && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={clsx("mt-4 rounded-xl border p-4", res.correct ? "border-good/40 bg-good/5" : "border-bad/40 bg-bad/5")}>
                <div className={clsx("font-semibold", res.correct ? "text-good" : "text-bad")}>
                  {res.correct ? (res.mistake?.status === "closed" ? "Correct — mistake closed! 🎉" : "Correct! One more time later to close it.") : "Not yet."}
                </div>
                <div className="mt-2 text-sm">
                  <TriLang text={res.feedback} compact />
                </div>
                <div className="mt-2 text-sm">
                  ✅ <span className="text-good">{m.correction}</span>
                </div>
                <div className="mt-2 text-sm text-muted">
                  <TriLang text={m.rule} compact />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
      </motion.div>
    </AnimatePresence>
  );
}

export default function MistakesPage() {
  return (
    <Suspense fallback={<Thinking label="Loading" />}>
      <MistakesInner />
    </Suspense>
  );
}
