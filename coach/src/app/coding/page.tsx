"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, CheckCircle2, CircleDashed, Lightbulb, Play, Save, Sparkles, XCircle, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { api, celebrate } from "@/lib/client";
import { Badge, Button, ErrorBox, Md, PageHeader, Panel, ScoreRing, Thinking, TriLang } from "@/components/ui";
import { CheckQuestion } from "@/components/CheckQuestion";

// Monaco is served locally from /public/monaco (copied by `npm install`), so no CDN/internet is needed.
const Editor = dynamic(
  async () => {
    const mod = await import("@monaco-editor/react");
    mod.loader.config({ paths: { vs: "/monaco/vs" } });
    return mod.default;
  },
  { ssr: false, loading: () => <Thinking label="Loading editor" /> },
);

interface Duo { en: string; darija: string }
interface LessonMeta { id: string; week: number; title: string; points: string; skill: number }
interface Exercise { id: string; week: number; title: string; lessonId: string; difficulty: string; file: string; description: string; solved: string | null; hints: number[] }
interface Lesson {
  title: string;
  explanation: Duo;
  code_example: string;
  key_points: Duo[];
  common_mistakes: Duo[];
  check_questions: { q: string; answer: string }[];
}
interface TestRun {
  ok: boolean;
  passed: number;
  failed: number;
  tests: { name: string; outcome: string; message?: string }[];
  compileErrors: string[];
  output: string;
  missingDotnet?: boolean;
  firstSolve?: boolean;
}
interface Review {
  score: number;
  summary: Duo;
  good: Duo[];
  issues: { problem: string; fix: string; topic: string; rule: Duo }[];
  complexity: string;
}

function CodingInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [err, setErr] = useState<unknown>(null);
  const selLesson = params.get("lesson");
  const selEx = params.get("ex");

  const load = useCallback(() => {
    api<{ lessons: LessonMeta[]; exercises: Exercise[] }>("/api/coding/exercises")
      .then((d) => {
        setLessons(d.lessons);
        setExercises(d.exercises);
      })
      .catch(setErr);
  }, []);
  useEffect(load, [load]);

  const select = (q: string) => router.push(`/coding?${q}`);
  const weeks = Array.from(new Set(lessons.map((l) => l.week)));
  const activeLesson = lessons.find((l) => l.id === selLesson) ?? (!selEx ? lessons.find((l) => l.skill < 70) ?? lessons[0] : undefined);
  const activeEx = exercises.find((e) => e.id === selEx);

  return (
    <div>
      <PageHeader title="Coding Studio" subtitle="Lessons in English + Darija · exercises with real tests · AI writes nothing for you" />
      <ErrorBox error={err} />
      <div className="grid xl:grid-cols-[280px_1fr] gap-6">
        <Panel className="h-fit xl:sticky xl:top-6 max-h-[80vh] overflow-y-auto">
          {weeks.map((w) => (
            <div key={w} className="mb-4">
              <div className="text-xs uppercase tracking-wide text-muted mb-2">Week {w}</div>
              {lessons
                .filter((l) => l.week === w)
                .map((l) => (
                  <button
                    key={l.id}
                    onClick={() => select(`lesson=${l.id}`)}
                    className={clsx("w-full text-left rounded-lg px-2 py-1.5 text-sm flex items-center gap-2 hover:bg-panel-2", activeLesson?.id === l.id && "bg-accent/15 text-white")}
                  >
                    <BookOpen size={14} className="shrink-0 text-muted" />
                    <span className="flex-1">{l.title}</span>
                    <span className="w-10 h-1.5 rounded-full bg-line overflow-hidden">
                      <motion.span className="block h-full bg-gradient-to-r from-accent to-accent-2" initial={{ width: 0 }} animate={{ width: `${l.skill}%` }} />
                    </span>
                  </button>
                ))}
              {exercises
                .filter((e) => e.week === w)
                .map((e) => (
                  <button
                    key={e.id}
                    onClick={() => select(`ex=${e.id}`)}
                    className={clsx("w-full text-left rounded-lg px-2 py-1.5 text-sm flex items-center gap-2 hover:bg-panel-2", activeEx?.id === e.id && "bg-accent/15 text-white")}
                  >
                    {e.solved ? <CheckCircle2 size={14} className="text-good shrink-0" /> : <CircleDashed size={14} className="text-muted shrink-0" />}
                    <span className="flex-1">{e.title}</span>
                    <Badge tone={e.difficulty === "easy" ? "good" : e.difficulty === "medium" ? "warn" : "bad"}>{e.difficulty}</Badge>
                  </button>
                ))}
            </div>
          ))}
        </Panel>
        <div className="min-w-0">
          {activeEx ? (
            <ExerciseView key={activeEx.id} ex={activeEx} onSolved={load} />
          ) : activeLesson ? (
            <LessonView key={activeLesson.id} meta={activeLesson} exercises={exercises.filter((e) => e.lessonId === activeLesson.id)} onOpenEx={(id) => select(`ex=${id}`)} />
          ) : (
            <Thinking label="Loading" />
          )}
        </div>
      </div>
    </div>
  );
}

function LessonView({ meta, exercises, onOpenEx }: { meta: LessonMeta; exercises: Exercise[]; onOpenEx: (id: string) => void }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => {
    api<{ lesson: Lesson | null }>(`/api/coding/lesson?id=${meta.id}`).then((d) => setLesson(d.lesson)).catch(setErr);
  }, [meta.id]);

  const generate = async (refresh = false) => {
    setBusy(true);
    setErr(null);
    try {
      setLesson((await api<{ lesson: Lesson }>("/api/coding/lesson", { body: { id: meta.id, refresh } })).lesson);
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge tone="accent">Week {meta.week} · lesson</Badge>
            <h2 className="text-xl font-bold mt-2">{meta.title}</h2>
            <p className="text-sm text-muted mt-1">{meta.points}</p>
          </div>
          {lesson ? (
            <Button variant="outline" size="sm" onClick={() => generate(true)} loading={busy}>
              <RefreshCw size={14} /> Explain differently
            </Button>
          ) : (
            <Button onClick={() => generate()} loading={busy}>
              <Sparkles size={16} /> Teach me this
            </Button>
          )}
        </div>
        {busy && <Thinking label="Claude is preparing your lesson" />}
        <ErrorBox error={err} />
      </Panel>

      {lesson && (
        <>
          <Panel delay={0.05}>
            <TriLang text={lesson.explanation} only={["en", "darija"]} />
          </Panel>
          <Panel delay={0.1}>
            <h3 className="font-semibold mb-2">Example</h3>
            <Md>{"```csharp\n" + lesson.code_example + "\n```"}</Md>
          </Panel>
          <div className="grid md:grid-cols-2 gap-6">
            <Panel delay={0.15}>
              <h3 className="font-semibold mb-3">🔑 Key points</h3>
              <div className="flex flex-col gap-3">
                {lesson.key_points.map((k, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="border-l-2 border-accent pl-3">
                    <TriLang text={k} compact only={["en", "darija"]} />
                  </motion.div>
                ))}
              </div>
            </Panel>
            <Panel delay={0.2}>
              <h3 className="font-semibold mb-3">⚠️ Common mistakes</h3>
              <div className="flex flex-col gap-3">
                {lesson.common_mistakes.map((k, i) => (
                  <div key={i} className="border-l-2 border-bad pl-3">
                    <TriLang text={k} compact only={["en", "darija"]} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <Panel delay={0.25}>
            <h3 className="font-semibold mb-1">✅ Check yourself (no AI, no Google)</h3>
            <p className="text-sm text-muted mb-4">Wrong answers go to your mistake journal so you can redo them later.</p>
            <div className="flex flex-col gap-4">
              {lesson.check_questions.map((q, i) => (
                <CheckQuestion key={i} q={q.q} expected={q.answer} topic={meta.id} area="coding" />
              ))}
            </div>
          </Panel>
          {exercises.length > 0 && (
            <Panel delay={0.3}>
              <h3 className="font-semibold mb-3">🏋️ Practice</h3>
              <div className="flex flex-wrap gap-2">
                {exercises.map((e) => (
                  <Button key={e.id} variant="ghost" onClick={() => onOpenEx(e.id)}>
                    {e.solved ? <CheckCircle2 size={16} className="text-good" /> : <Play size={16} />} {e.title}
                  </Button>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

function ExerciseView({ ex, onSolved }: { ex: Exercise; onSolved: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState<TestRun | null>(null);
  const [hints, setHints] = useState<{ level: number; hint: Duo }[]>([]);
  const [hintBusy, setHintBusy] = useState<number | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const codeRef = useRef("");

  useEffect(() => {
    api<{ code: string }>(`/api/coding/file?id=${ex.id}`)
      .then((d) => {
        setCode(d.code);
        codeRef.current = d.code;
      })
      .catch(setErr);
  }, [ex.id]);

  const save = useCallback(async () => {
    await api("/api/coding/file", { method: "PUT", body: { id: ex.id, code: codeRef.current } });
    setDirty(false);
  }, [ex.id]);

  const runTests = async () => {
    setRunning(true);
    setErr(null);
    try {
      await save();
      const r = await api<TestRun>("/api/coding/test", { body: { id: ex.id } });
      setRun(r);
      if (r.ok) {
        celebrate(true);
        onSolved();
      }
    } catch (e) {
      setErr(e);
    } finally {
      setRunning(false);
    }
  };

  const askHint = async (level: number) => {
    setHintBusy(level);
    setErr(null);
    try {
      await save();
      const r = await api<{ hint: Duo }>("/api/coding/hint", { body: { id: ex.id, level } });
      setHints((h) => [...h, { level, hint: r.hint }]);
    } catch (e) {
      setErr(e);
    } finally {
      setHintBusy(null);
    }
  };

  const askReview = async () => {
    setReviewBusy(true);
    setErr(null);
    try {
      await save();
      setReview(await api<Review>("/api/coding/review", { body: { id: ex.id } }));
    } catch (e) {
      setErr(e);
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge tone="accent">Week {ex.week}</Badge>
          <Badge tone={ex.difficulty === "easy" ? "good" : ex.difficulty === "medium" ? "warn" : "bad"}>{ex.difficulty}</Badge>
          {ex.solved && <Badge tone="good">Solved {ex.solved}</Badge>}
          {ex.hints.length > 0 && <Badge>{ex.hints.length} hint(s) used</Badge>}
        </div>
        <h2 className="text-xl font-bold">{ex.title}</h2>
        <Md className="mt-2 text-sm">{ex.description}</Md>
      </Panel>

      <Panel className="p-0 overflow-hidden" delay={0.05}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-line">
          <span className="text-sm text-muted font-mono">{dirty ? "● unsaved" : "saved"} · Ctrl+S to save</span>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={save} disabled={!dirty}>
              <Save size={14} /> Save
            </Button>
            <Button size="sm" onClick={runTests} loading={running}>
              <Play size={14} /> Run tests
            </Button>
          </div>
        </div>
        {code === null ? (
          <Thinking label="Loading code" />
        ) : (
          <Editor
            height="420px"
            defaultLanguage="csharp"
            theme="vs-dark"
            defaultValue={code}
            onChange={(v) => {
              codeRef.current = v ?? "";
              setDirty(true);
            }}
            onMount={(editor, monaco) => {
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => save());
            }}
            options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 }, quickSuggestions: false, suggestOnTriggerCharacters: false, inlineSuggest: { enabled: false } }}
          />
        )}
      </Panel>

      <ErrorBox error={err} />
      {running && <Thinking label="Building and running your tests (first run can take ~30s)" />}

      <AnimatePresence>
        {run && !running && (
          <Panel>
            {run.missingDotnet ? (
              <p className="text-bad">{run.output}</p>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-semibold">Test results</h3>
                  <Badge tone="good">{run.passed} passed</Badge>
                  {run.failed > 0 && <Badge tone="bad">{run.failed} failed</Badge>}
                  {run.ok && <Badge tone="good">All green 🎉</Badge>}
                </div>
                {run.compileErrors.length > 0 && (
                  <div className="mb-3">
                    <div className="text-bad font-medium mb-1">Compile errors</div>
                    {run.compileErrors.some((e) => !e.replace(/\\/g, "/").includes(ex.file.replace(/^coding\//, ""))) && (
                      <div className="text-sm text-warn mb-2">
                        ⚠️ The error is in <b>another exercise file</b>. All exercises build together, so one broken file blocks every test — open that exercise and fix it (or put back the starter code).
                      </div>
                    )}
                    <pre className="text-xs bg-ink/70 border border-line rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{run.compileErrors.join("\n")}</pre>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {run.tests.map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="rounded-lg border border-line bg-ink/40 p-3">
                      <div className="flex items-center gap-2">
                        {t.outcome === "Passed" ? <CheckCircle2 className="text-good" size={18} /> : <XCircle className="text-bad" size={18} />}
                        <span className="text-sm">{t.name}</span>
                      </div>
                      {t.message && <pre className="mt-2 text-xs text-muted whitespace-pre-wrap">{t.message}</pre>}
                    </motion.div>
                  ))}
                </div>
                {run.tests.length === 0 && run.compileErrors.length === 0 && <pre className="text-xs text-muted whitespace-pre-wrap max-h-64 overflow-auto">{run.output}</pre>}
              </>
            )}
          </Panel>
        )}
      </AnimatePresence>

      <Panel delay={0.1}>
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <Lightbulb size={18} className="text-warn" /> Stuck? Hints get stronger — each one is logged
        </h3>
        <div className="flex flex-wrap gap-2 mt-3">
          {[1, 2, 3].map((l) => (
            <Button key={l} size="sm" variant={l === 3 ? "outline" : "ghost"} onClick={() => askHint(l)} loading={hintBusy === l}>
              Hint {l} {l === 1 ? "· nudge" : l === 2 ? "· approach" : "· almost code"}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={askReview} loading={reviewBusy}>
            <Sparkles size={14} /> Review my code
          </Button>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          {hints.map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-warn/30 bg-warn/5 p-3">
              <Badge tone="warn">Hint {h.level}</Badge>
              <div className="mt-2 text-sm">
                <TriLang text={h.hint} only={["en", "darija"]} />
              </div>
            </motion.div>
          ))}
        </div>
        {reviewBusy && <Thinking label="Senior engineer is reviewing your code" />}
        {review && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid md:grid-cols-[auto_1fr] gap-5 items-start">
            <ScoreRing score={review.score} label="review" />
            <div className="flex flex-col gap-3 text-sm">
              <TriLang text={review.summary} only={["en", "darija"]} />
              {review.complexity && <Badge>{review.complexity}</Badge>}
              {review.good.map((g, i) => (
                <div key={i} className="border-l-2 border-good pl-3">
                  <TriLang text={g} compact only={["en", "darija"]} />
                </div>
              ))}
              {review.issues.map((x, i) => (
                <div key={i} className="rounded-lg border border-bad/30 bg-bad/5 p-3">
                  <div className="font-medium text-bad">❌ {x.problem}</div>
                  <div className="mt-1">✅ {x.fix}</div>
                  <div className="mt-2 text-muted">
                    <TriLang text={x.rule} compact only={["en", "darija"]} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </Panel>
    </div>
  );
}

export default function CodingPage() {
  return (
    <Suspense fallback={<Thinking label="Loading" />}>
      <CodingInner />
    </Suspense>
  );
}
