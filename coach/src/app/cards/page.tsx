"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, PartyPopper } from "lucide-react";
import clsx from "clsx";
import { api, celebrate } from "@/lib/client";
import type { Card, TriText } from "@/lib/types";
import { Badge, Button, ErrorBox, Field, PageHeader, Panel, SpeakButton, Thinking, TriLang, inputCls } from "@/components/ui";

type DueCard = Card & { preview: Record<"again" | "hard" | "good" | "easy", string> };
const RATINGS = [
  { k: "again", label: "Again", cls: "bg-bad/20 border-bad/50 text-bad" },
  { k: "hard", label: "Hard", cls: "bg-warn/15 border-warn/50 text-warn" },
  { k: "good", label: "Good", cls: "bg-good/15 border-good/50 text-good" },
  { k: "easy", label: "Easy", cls: "bg-accent-2/15 border-accent-2/50 text-accent-2" },
] as const;

export default function CardsPage() {
  const [area, setArea] = useState<"all" | "coding" | "french">("all");
  const [due, setDue] = useState<DueCard[] | null>(null);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const load = useCallback(() => {
    setDue(null);
    api<{ due: DueCard[]; total: number }>(`/api/cards?area=${area}`)
      .then((d) => {
        setDue(d.due);
        setTotal(d.total);
        setDone(0);
        setFlipped(false);
      })
      .catch(setErr);
  }, [area]);
  useEffect(load, [load]);

  const rate = async (rating: string) => {
    if (!due?.length) return;
    const card = due[0];
    setFlipped(false);
    try {
      await api("/api/cards/review", { body: { id: card.id, rating } });
    } catch (e) {
      setErr(e);
    }
    const rest = due.slice(1);
    // "again" cards come back at the end of this session
    setDue(rating === "again" ? [...rest, card] : rest);
    if (rating !== "again") setDone((d) => d + 1);
    if (rest.length === 0 && rating !== "again") celebrate(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (flipped && ["1", "2", "3", "4"].includes(e.key)) rate(RATINGS[Number(e.key) - 1].k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const card = due?.[0];
  const sessionTotal = (due?.length ?? 0) + done;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Flashcards" subtitle={`Spaced repetition (FSRS) · ${total} cards total · Space = flip, 1–4 = rate`}>
        {(["all", "coding", "french"] as const).map((a) => (
          <Button key={a} size="sm" variant={area === a ? "primary" : "ghost"} onClick={() => setArea(a)}>
            {a === "all" ? "All" : a === "coding" ? "💻 Coding" : "🇫🇷 French"}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => setShowAdd((s) => !s)}>
          <Plus size={14} /> Add card
        </Button>
      </PageHeader>
      <ErrorBox error={err} />
      <AnimatePresence>{showAdd && <AddCard onAdded={load} />}</AnimatePresence>

      {!due ? (
        <Thinking label="Loading cards" />
      ) : !card ? (
        <Panel className="text-center py-14">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, 0] }} transition={{ type: "spring" }}>
            <PartyPopper className="mx-auto text-warn" size={48} />
          </motion.div>
          <div className="text-xl font-bold mt-4">All done for now!</div>
          <div className="text-muted mt-1">{done ? `${done} cards reviewed. ` : ""}New cards appear as you do lessons and French exercises.</div>
        </Panel>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-accent to-accent-2" animate={{ width: `${sessionTotal ? (done / sessionTotal) * 100 : 0}%` }} />
            </div>
            <span className="text-sm text-muted">
              {done}/{sessionTotal}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={card.id + done} initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -80, rotate: -4 }} transition={{ duration: 0.28 }} className="flip-card">
              <motion.div className="flip-inner relative h-80 cursor-pointer" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.55, type: "spring", stiffness: 160, damping: 20 }} onClick={() => setFlipped((f) => !f)}>
                <div className="flip-face absolute inset-0 glass rounded-3xl p-8 flex flex-col">
                  <div className="flex gap-2">
                    <Badge tone="accent">{card.area}</Badge>
                    <Badge>{card.topic}</Badge>
                  </div>
                  <div className="flex-1 flex items-center justify-center text-center text-2xl font-semibold">{card.front}</div>
                  <div className="text-center text-sm text-muted">click or Space to flip</div>
                </div>
                <div className="flip-face absolute inset-0 glass rounded-3xl p-8 flex flex-col overflow-y-auto" style={{ transform: "rotateY(180deg)" }}>
                  <div className="text-sm text-muted mb-2 flex items-center gap-2">
                    {card.front} {card.area === "french" && <SpeakButton text={card.front} />}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                    <div className="text-2xl font-semibold">{card.back}</div>
                    {card.extra && (
                      <div className="text-sm text-left w-full">
                        <TriLang text={card.extra as TriText} compact />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {flipped && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-4 gap-3 mt-5">
                {RATINGS.map((r, i) => (
                  <motion.button key={r.k} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => rate(r.k)} className={clsx("rounded-xl border py-3 font-medium", r.cls)}>
                    {r.label}
                    <div className="text-xs opacity-80">
                      {card.preview[r.k]} · {i + 1}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function AddCard({ onAdded }: { onAdded: () => void }) {
  const [area, setArea] = useState<"coding" | "french">("french");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    await api("/api/cards", { body: { area, front, back, topic: topic || (area === "french" ? "vocab" : "custom") } }).catch(() => undefined);
    setFront("");
    setBack("");
    setBusy(false);
    onAdded();
  };
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
      <Panel>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Area">
            <select className={inputCls} value={area} onChange={(e) => setArea(e.target.value as "coding" | "french")}>
              <option value="french">French</option>
              <option value="coding">Coding</option>
            </select>
          </Field>
          <Field label="Topic (optional)">
            <input className={inputCls} value={topic} onChange={(e) => setTopic(e.target.value)} />
          </Field>
          <Field label="Front">
            <input className={inputCls} value={front} onChange={(e) => setFront(e.target.value)} />
          </Field>
          <Field label="Back">
            <input className={inputCls} value={back} onChange={(e) => setBack(e.target.value)} />
          </Field>
        </div>
        <Button className="mt-4" size="sm" onClick={save} loading={busy} disabled={!front || !back}>
          Save card
        </Button>
      </Panel>
    </motion.div>
  );
}
