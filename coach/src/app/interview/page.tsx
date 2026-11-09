"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Code2, Network, Users, HandCoins, Send, Square, Timer } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/client";
import { Badge, Button, ErrorBox, MicButton, PageHeader, Panel, ScoreRing, SpeakButton, Thinking, TriLang, inputCls } from "@/components/ui";

const MODES = [
  { id: "dotnet", title: "Technical .NET", desc: "C#, OOP, LINQ, async, DI, ASP.NET Core, EF Core", icon: Code2 },
  { id: "system-design", title: "System design", desc: "APIs, databases, caching, queues, trade-offs", icon: Network },
  { id: "behavioral", title: "Behavioral (STAR)", desc: "Teamwork, conflict, failure, why Ireland/UK", icon: Users },
  { id: "negotiation", title: "Salary negotiation", desc: "Practise negotiating a sponsored offer", icon: HandCoins },
];

interface Msg { role: "interviewer" | "candidate"; text: string }
interface Feedback {
  score: number;
  verdict: string;
  summary: { en: string; darija: string };
  strengths: string[];
  improvements: { question: string; issue: string; better_answer: string }[];
}

export default function InterviewPage() {
  const [mode, setMode] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [fb, setFb] = useState<Feedback | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [err, setErr] = useState<unknown>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mode || fb) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [mode, fb]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  const turn = async (history: Msg[], m = mode) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ message: string; done: boolean }>("/api/interview", { body: { action: "turn", mode: m, messages: history } });
      setMsgs([...history, { role: "interviewer", text: r.message }]);
      if (r.done) setDone(true);
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };
  const start = (m: string) => {
    setMode(m);
    setMsgs([]);
    setFb(null);
    setDone(false);
    setSeconds(0);
    turn([], m);
  };
  const send = () => {
    if (!input.trim()) return;
    const h = [...msgs, { role: "candidate" as const, text: input.trim() }];
    setMsgs(h);
    setInput("");
    turn(h);
  };
  const finish = async () => {
    setBusy(true);
    setErr(null);
    try {
      setFb(await api<Feedback>("/api/interview", { body: { action: "feedback", mode, messages: msgs } }));
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  if (!mode)
    return (
      <div className="max-w-4xl">
        <PageHeader title="Mock Interview" subtitle="Realistic Dublin/London interviewer. Type or speak (English). Feedback + better answers at the end." />
        <div className="grid sm:grid-cols-2 gap-4">
          {MODES.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              onClick={() => start(m.id)}
              className="glass rounded-2xl p-5 text-left hover:border-accent"
            >
              <m.icon className="text-violet-300 mb-3" />
              <div className="font-semibold">{m.title}</div>
              <div className="text-sm text-muted mt-1">{m.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>
    );

  const mm = MODES.find((x) => x.id === mode)!;
  return (
    <div className="max-w-4xl">
      <PageHeader title={mm.title} subtitle="Answer like in a real interview: structured, specific, with numbers.">
        <Badge tone="accent">
          <Timer size={12} /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </Badge>
        <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
          Change type
        </Button>
        {!fb && msgs.some((m) => m.role === "candidate") && (
          <Button size="sm" variant="outline" onClick={finish} loading={busy && done}>
            <Square size={14} /> End & get feedback
          </Button>
        )}
      </PageHeader>
      <ErrorBox error={err} />

      {!fb && (
        <Panel className="flex flex-col gap-4 min-h-[420px]">
          <div className="flex-1 flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {msgs.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={clsx("max-w-[85%] rounded-2xl px-4 py-3", m.role === "interviewer" ? "self-start bg-panel-2 border border-line" : "self-end bg-gradient-to-r from-accent/80 to-indigo-500/80 text-white")}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.role === "interviewer" && (
                    <div className="mt-2">
                      <SpeakButton text={m.text} lang="en-GB" label="Listen" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {busy && <Thinking label="Interviewer is typing" />}
            <div ref={endRef} />
          </div>
          {done ? (
            <Button onClick={finish} loading={busy}>
              Interview finished — get my feedback
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                className={clsx(inputCls, "w-full min-h-24")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
                }}
                placeholder="Your answer… (Ctrl+Enter to send)"
                disabled={busy}
              />
              <div className="flex gap-2">
                <MicButton lang="en-GB" onText={(t) => setInput((x) => (x ? `${x} ${t}` : t))} />
                <Button onClick={send} disabled={busy || !input.trim()}>
                  <Send size={16} /> Send
                </Button>
              </div>
            </div>
          )}
        </Panel>
      )}

      {fb && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
          <Panel>
            <div className="flex flex-wrap items-center gap-6">
              <ScoreRing score={fb.score} label="score" size={130} />
              <div className="flex-1 min-w-60">
                <Badge tone={/hire/.test(fb.verdict) && !/no/.test(fb.verdict) ? "good" : "warn"}>{fb.verdict}</Badge>
                <div className="mt-3">
                  <TriLang text={fb.summary} only={["en", "darija"]} />
                </div>
              </div>
            </div>
            {fb.strengths.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {fb.strengths.map((s) => (
                  <Badge key={s} tone="good">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </Panel>
          {fb.improvements.map((x, i) => (
            <Panel key={i} delay={i * 0.06}>
              <div className="font-medium">{x.question}</div>
              <div className="text-bad text-sm mt-2">❌ {x.issue}</div>
              <div className="text-sm mt-2 rounded-lg border border-good/30 bg-good/5 p-3">✅ {x.better_answer}</div>
            </Panel>
          ))}
          <Button onClick={() => start(mode)}>Another interview</Button>
        </motion.div>
      )}
    </div>
  );
}
