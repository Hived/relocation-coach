"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, Send } from "lucide-react";
import clsx from "clsx";
import { api, celebrate } from "@/lib/client";
import { Button, ErrorBox, Field, MicButton, PageHeader, Panel, ScoreRing, Thinking, TriLang, inputCls } from "@/components/ui";

interface Duo { en: string; darija: string }
interface Grade {
  accuracy: number;
  completeness: number;
  clarity: number;
  overall: number;
  feedback: Duo;
  gaps: { gap: string; correction: string; rule: Duo }[];
  model_explanation: { en: string };
}
interface LessonMeta { id: string; title: string; week: number }

export default function TeachPage() {
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [topicId, setTopicId] = useState("");
  const [custom, setCustom] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [g, setG] = useState<Grade | null>(null);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => {
    api<{ lessons: LessonMeta[] }>("/api/coding/exercises")
      .then((d) => {
        setLessons(d.lessons);
        setTopicId(d.lessons[0]?.id ?? "");
      })
      .catch(setErr);
  }, []);

  const topic = topicId === "custom" ? custom : lessons.find((l) => l.id === topicId)?.title ?? "";

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<Grade>("/api/teach", { body: { topic, topicId: topicId === "custom" ? undefined : topicId, explanation: text } });
      setG(r);
      if (r.overall >= 8) celebrate(true);
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="Teach-back" subtitle="Explain a concept as if I'm a junior developer. If you can teach it, you know it. (Feynman technique)" />
      <Panel>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Topic">
            <select className={inputCls} value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  W{l.week} · {l.title}
                </option>
              ))}
              <option value="custom">Other topic…</option>
            </select>
          </Field>
          {topicId === "custom" && (
            <Field label="Your topic">
              <input className={inputCls} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. EF Core change tracking" />
            </Field>
          )}
        </div>
        <textarea
          className={clsx(inputCls, "w-full min-h-48 mt-4")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Explain "${topic || "the topic"}" in your own words. What is it, why does it exist, how does it work, a small example, a common mistake…`}
        />
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <MicButton lang="en-GB" onText={(t) => setText((x) => (x ? `${x} ${t}` : t))} />
          <Button onClick={submit} loading={busy} disabled={!text.trim() || !topic}>
            <Send size={16} /> Grade my explanation
          </Button>
        </div>
        {busy && <Thinking label="Claude is grading" />}
        <ErrorBox error={err} />
      </Panel>

      <AnimatePresence>
        {g && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 mt-6">
            <Panel>
              <div className="flex flex-wrap justify-around gap-4">
                <ScoreRing score={g.overall} label="overall" size={130} />
                <ScoreRing score={g.accuracy} label="accuracy" />
                <ScoreRing score={g.completeness} label="complete" />
                <ScoreRing score={g.clarity} label="clarity" />
              </div>
              <div className="mt-5">
                <TriLang text={g.feedback} only={["en", "darija"]} />
              </div>
            </Panel>
            {g.gaps.length > 0 && (
              <Panel>
                <h3 className="font-semibold mb-3">Gaps → saved to your mistake journal</h3>
                <div className="flex flex-col gap-3">
                  {g.gaps.map((x, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="rounded-xl border border-line bg-ink/40 p-3 text-sm">
                      <div className="text-bad">❌ {x.gap}</div>
                      <div className="text-good mt-1">✅ {x.correction}</div>
                      <div className="text-muted mt-2">
                        <TriLang text={x.rule} compact only={["en", "darija"]} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Panel>
            )}
            <Panel>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <GraduationCap size={18} /> How a senior would explain it
              </h3>
              <TriLang text={g.model_explanation} only={["en"]} />
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
