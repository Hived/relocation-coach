"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Sparkles, Send, RotateCcw, ClipboardCheck } from "lucide-react";
import clsx from "clsx";
import { api, celebrate } from "@/lib/client";
import type { TriText } from "@/lib/types";
import { Badge, Button, ErrorBox, MicButton, PageHeader, Panel, ScoreRing, SpeakButton, Thinking, TriLang, inputCls } from "@/components/ui";

interface Word { fr: string; en: string; darija: string; example?: string }
interface Task {
  title: string;
  lesson: TriText;
  examples: { fr: string; en: string; darija: string }[];
  task_fr: string;
  task: TriText;
  useful_words: Word[];
  expected_sentences: number;
}
interface Correction { wrong: string; right: string; type: string; rule: TriText }
interface Result {
  score: number;
  corrected_text: string;
  praise: TriText;
  corrections: Correction[];
  vocab: Word[];
  next_tip: TriText;
  cardsAdded: number;
}
interface State { task: Task | null; topicIndex: number; topic: string; topics: string[]; level: string; placementDone: boolean }

export default function FrenchPage() {
  const [st, setSt] = useState<State | null>(null);
  const [placement, setPlacement] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const load = () => api<State>("/api/french/task").then((s) => {
    setSt(s);
    if (!s.placementDone) setPlacement(true);
  }).catch(setErr);
  useEffect(() => {
    load();
  }, []);

  if (err) return <ErrorBox error={err} />;
  if (!st) return <Thinking label="Loading" />;

  return (
    <div className="max-w-4xl">
      <PageHeader title="French Studio" subtitle="🇬🇧 English · 🇸🇦 العربية · 🇲🇦 Darija — write or speak, get corrected">
        {st.placementDone && (
          <Button variant="outline" size="sm" onClick={() => setPlacement((p) => !p)}>
            <ClipboardCheck size={14} /> {placement ? "Back to practice" : "Retake placement test"}
          </Button>
        )}
      </PageHeader>
      {placement ? (
        <Placement
          onDone={() => {
            setPlacement(false);
            load();
          }}
        />
      ) : (
        <Practice st={st} reload={load} />
      )}
    </div>
  );
}

/* ----------------------------- Placement test ----------------------------- */

interface Mcq { q: string; options: string[]; answer: string; skill: string; level: string }
interface PlacementTest { mcq: Mcq[]; writing_prompt: TriText & { fr: string } }
interface PlacementResult { level: string; score: number; summary: TriText; strengths: string[]; weaknesses: string[]; corrections: Correction[]; startTopic: string }

function Placement({ onDone }: { onDone: () => void }) {
  const [test, setTest] = useState<PlacementTest | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [step, setStep] = useState(0);
  const [writing, setWriting] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<PlacementResult | null>(null);
  const [err, setErr] = useState<unknown>(null);

  const start = async () => {
    setBusy(true);
    setErr(null);
    try {
      setTest(await api<PlacementTest>("/api/french/placement", { body: { action: "generate" } }));
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    if (!test) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api<PlacementResult>("/api/french/placement", {
        body: { action: "grade", mcq: test.mcq.map((m, i) => ({ ...m, chosen: answers[i] ?? "" })), writing, writingPrompt: test.writing_prompt.fr },
      });
      setRes(r);
      celebrate(true);
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  if (res)
    return (
      <Panel>
        <div className="flex flex-wrap items-center gap-6">
          <ScoreRing score={res.score} max={100} size={130} label="placement" />
          <div>
            <div className="text-sm text-muted">Your level</div>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }} className="text-5xl font-black gradient-text">
              {res.level}
            </motion.div>
            <div className="text-sm text-muted mt-1">Starting topic: {res.startTopic}</div>
          </div>
        </div>
        <div className="mt-5">
          <TriLang text={res.summary} />
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-5 text-sm">
          <div>
            <div className="font-semibold text-good mb-1">Strengths</div>
            <ul className="list-disc pl-5">{res.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div>
            <div className="font-semibold text-bad mb-1">To work on</div>
            <ul className="list-disc pl-5">{res.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </div>
        <Corrections list={res.corrections} />
        <Button className="mt-6" onClick={onDone}>
          Start learning <ChevronRight size={16} />
        </Button>
      </Panel>
    );

  if (!test)
    return (
      <Panel>
        <h2 className="text-xl font-bold">Placement test · ~10 minutes</h2>
        <p className="text-muted mt-2">12 quick questions from easy to hard, then 5–6 sentences of writing. No dictionary, no translator: it&apos;s only to find where you should start.</p>
        <TriLang text={{ en: "Don't stress — wrong answers just tell us what to teach first.", ar: "لا تقلق، الأخطاء تساعدنا على معرفة ما يجب أن نبدأ به.", darija: "Matkhafch — l-ghalat kay-3awnna n3erfo mnin nbdaw." }} />
        <Button className="mt-4" onClick={start} loading={busy}>
          <Sparkles size={16} /> Start the test
        </Button>
        {busy && <Thinking label="Claude is writing your test" />}
        <ErrorBox error={err} />
      </Panel>
    );

  const total = test.mcq.length + 1;
  const isWriting = step >= test.mcq.length;
  const m = test.mcq[step];
  return (
    <Panel>
      <div className="flex items-center justify-between mb-4">
        <Badge tone="accent">
          {Math.min(step + 1, total)} / {total}
        </Badge>
        <div className="flex-1 mx-4 h-2 rounded-full bg-line overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-accent to-accent-2" animate={{ width: `${(step / total) * 100}%` }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
          {!isWriting ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge>{m.skill}</Badge>
                <Badge>{m.level}</Badge>
              </div>
              <div className="text-xl font-semibold my-4">{m.q}</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {m.options.map((o) => (
                  <motion.button
                    key={o}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setAnswers((a) => ({ ...a, [step]: o }));
                      setTimeout(() => setStep((s) => s + 1), 220);
                    }}
                    className={clsx("rounded-xl border p-4 text-left", answers[step] === o ? "border-accent bg-accent/15" : "border-line bg-ink/40 hover:border-accent/60")}
                  >
                    {o}
                  </motion.button>
                ))}
              </div>
              <button className="mt-4 text-sm text-muted underline" onClick={() => setStep((s) => s + 1)}>
                I don&apos;t know — skip
              </button>
            </div>
          ) : (
            <div>
              <div className="text-lg font-semibold mb-2">{test.writing_prompt.fr}</div>
              <TriLang text={test.writing_prompt} compact />
              <textarea className={clsx(inputCls, "w-full min-h-40 mt-4 text-lg")} value={writing} onChange={(e) => setWriting(e.target.value)} placeholder="Écrivez ici…" />
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <MicButton lang="fr-FR" onText={(t) => setWriting((w) => (w ? `${w} ${t}` : t))} />
                <Button onClick={submit} loading={busy} disabled={!writing.trim()}>
                  <Send size={16} /> Finish the test
                </Button>
              </div>
              {busy && <Thinking label="Claude is grading your test" />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {step > 0 && !busy && (
        <button className="mt-6 text-sm text-muted inline-flex items-center gap-1" onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft size={14} /> Back
        </button>
      )}
      <ErrorBox error={err} />
    </Panel>
  );
}

/* ------------------------------- Daily practice ------------------------------ */

function Practice({ st, reload }: { st: State; reload: () => void }) {
  const [task, setTask] = useState<Task | null>(st.task);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<unknown>(null);

  const newTask = async (move?: number) => {
    setBusy(true);
    setErr(null);
    setRes(null);
    setAnswer("");
    try {
      const r = await api<{ task: Task }>("/api/french/task", { body: { move } });
      setTask(r.task);
      if (move) reload();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    if (!task) return;
    setChecking(true);
    setErr(null);
    try {
      const r = await api<Result>("/api/french/correct", { body: { task: task.task_fr, answer } });
      setRes(r);
      if (r.score >= 8) celebrate(r.score === 10);
    } catch (e) {
      setErr(e);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex gap-2">
              <Badge tone="accent">Level {st.level}</Badge>
              <Badge>
                Topic {st.topicIndex + 1}/{st.topics.length}
              </Badge>
            </div>
            <h2 className="text-xl font-bold mt-2">{st.topic}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => newTask(-1)} disabled={st.topicIndex === 0 || busy}>
              <ChevronLeft size={14} /> Previous topic
            </Button>
            <Button variant="ghost" size="sm" onClick={() => newTask(1)} disabled={busy}>
              Next topic <ChevronRight size={14} />
            </Button>
          </div>
        </div>
        {!task && !busy && (
          <Button className="mt-4" onClick={() => newTask()}>
            <Sparkles size={16} /> Start today&apos;s lesson
          </Button>
        )}
        {busy && <Thinking label="Claude is preparing your lesson" />}
        <ErrorBox error={err} />
      </Panel>

      {task && !busy && (
        <>
          <Panel delay={0.05}>
            <h3 className="text-lg font-semibold mb-3">📘 {task.title}</h3>
            <TriLang text={task.lesson} />
          </Panel>
          <Panel delay={0.1}>
            <h3 className="font-semibold mb-3">Examples</h3>
            <div className="flex flex-col gap-3">
              {task.examples.map((ex, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="rounded-xl border border-line bg-ink/40 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium">{ex.fr}</span>
                    <SpeakButton text={ex.fr} />
                  </div>
                  <div className="text-sm text-muted mt-1">🇬🇧 {ex.en}</div>
                  <div className="text-sm text-muted">🇲🇦 {ex.darija}</div>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {task.useful_words.map((w) => (
                <span key={w.fr} title={`${w.en} · ${w.darija}`} className="group rounded-full border border-line bg-panel-2 px-3 py-1 text-sm cursor-help">
                  {w.fr} <span className="text-muted group-hover:text-text">· {w.en}</span>
                </span>
              ))}
            </div>
          </Panel>
          <Panel delay={0.15}>
            <h3 className="font-semibold mb-1">✍️ Your turn</h3>
            <div className="text-lg mb-2 flex items-center gap-2">
              {task.task_fr} <SpeakButton text={task.task_fr} />
            </div>
            <TriLang text={task.task} compact />
            <textarea
              className={clsx(inputCls, "w-full min-h-36 mt-4 text-lg")}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={`Écrivez ${task.expected_sentences} phrases… (or press Speak)`}
              disabled={!!res}
            />
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {!res && <MicButton lang="fr-FR" onText={(t) => setAnswer((a) => (a ? `${a} ${t}` : t))} />}
              {!res ? (
                <Button onClick={check} loading={checking} disabled={!answer.trim()}>
                  <Send size={16} /> Correct me
                </Button>
              ) : (
                <Button variant="outline" onClick={() => newTask()}>
                  <RotateCcw size={16} /> Another exercise
                </Button>
              )}
            </div>
            {checking && <Thinking label="Claude is correcting" />}
          </Panel>
          <AnimatePresence>{res && <ResultView res={res} />}</AnimatePresence>
        </>
      )}
    </div>
  );
}

function ResultView({ res }: { res: Result }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <Panel>
        <div className="flex flex-wrap items-center gap-6">
          <ScoreRing score={res.score} label="score" />
          <div className="flex-1 min-w-60">
            <TriLang text={res.praise} />
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-good/30 bg-good/5 p-4">
          <div className="flex items-center gap-2 text-sm text-good mb-1">
            ✅ Corrected version <SpeakButton text={res.corrected_text} label="Listen" />
          </div>
          <div className="text-lg">{res.corrected_text}</div>
        </div>
      </Panel>
      <Corrections list={res.corrections} />
      {res.vocab.length > 0 && (
        <Panel>
          <h3 className="font-semibold mb-3">🃏 New words → added to your flashcards ({res.cardsAdded})</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {res.vocab.map((v) => (
              <div key={v.fr} className="rounded-xl border border-line bg-ink/40 p-3">
                <div className="flex items-center gap-2 font-medium">
                  {v.fr} <SpeakButton text={v.fr} />
                </div>
                <div className="text-sm text-muted">
                  🇬🇧 {v.en} · 🇲🇦 {v.darija}
                </div>
                {v.example && <div className="text-sm italic mt-1">{v.example}</div>}
              </div>
            ))}
          </div>
        </Panel>
      )}
      <Panel>
        <h3 className="font-semibold mb-2">💡 Tip for next time</h3>
        <TriLang text={res.next_tip} />
      </Panel>
    </motion.div>
  );
}

function Corrections({ list }: { list: Correction[] }) {
  if (!list?.length) return <Panel><div className="text-good">No mistakes — parfait ! 🎉</div></Panel>;
  return (
    <Panel>
      <h3 className="font-semibold mb-3">Mistakes ({list.length}) → saved to your journal</h3>
      <div className="flex flex-col gap-3">
        {list.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="rounded-xl border border-line bg-ink/40 p-4">
            <div className="flex flex-wrap items-center gap-2 text-lg">
              <span className="line-through decoration-bad decoration-2 text-bad/90">{c.wrong}</span>
              <ChevronRight size={16} className="text-muted" />
              <span className="text-good font-medium">{c.right}</span>
              <SpeakButton text={c.right} />
              <Badge>{c.type}</Badge>
            </div>
            <div className="mt-2 text-sm">
              <TriLang text={c.rule} compact />
            </div>
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}
