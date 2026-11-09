"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import { api, celebrate } from "@/lib/client";
import type { TriText } from "@/lib/types";
import { Badge, Button, ErrorBox, TriLang, inputCls } from "./ui";

type Duo = TriText;

export function CheckQuestion({ q, expected, topic, area }: { q: string; expected: string; topic: string; area: "coding" | "french" }) {
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ correct: boolean; feedback: Duo } | null>(null);
  const [err, setErr] = useState<unknown>(null);
  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ correct: boolean; feedback: Duo }>("/api/check", { body: { question: q, expected, answer, area, topic } });
      setRes(r);
      if (r.correct) celebrate();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-line bg-ink/40 p-4">
      <div className="font-medium mb-2">{q}</div>
      <textarea className={clsx(inputCls, "w-full min-h-20")} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer, in your own words…" disabled={!!res} />
      <div className="mt-2 flex items-center gap-3">
        {!res && (
          <Button size="sm" onClick={submit} loading={busy} disabled={!answer.trim()}>
            Check
          </Button>
        )}
        <AnimatePresence>
          {res && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1">
              <Badge tone={res.correct ? "good" : "bad"}>{res.correct ? "Correct ✓" : "Not quite — saved to mistakes"}</Badge>
              <div className="mt-2 text-sm">
                <TriLang text={res.feedback} compact />
              </div>
              {!res.correct && (
                <div className="mt-2 text-sm text-muted">
                  <b>Expected:</b> {expected}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ErrorBox error={err} />
    </div>
  );
}

