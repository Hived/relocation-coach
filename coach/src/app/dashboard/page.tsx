"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { FileText, Sparkles, Flame } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/client";
import { Badge, Button, ErrorBox, Md, PageHeader, Panel, Thinking } from "@/components/ui";

interface Summary {
  streak: number;
  burnout: { light: boolean; reason: string };
  totalCards: number;
  openMistakes: number;
  closedMistakes: number;
  lessons: { id: string; week: number; title: string; skill: number }[];
  scores: { date: string; area: string; score: number }[];
  activity: { date: string; active: boolean; scores: number }[];
  french: { level: string; topicIndex: number; totalTopics: number; topic: string };
  solvedCount: number;
  jobs: { total: number; byStatus: Record<string, number>; contacts: number; referred: number };
  weakSpots: [string, number][];
}

const AREA_COLORS: Record<string, string> = { coding: "#8b5cf6", french: "#22d3ee", interview: "#fbbf24" };

export default function DashboardPage() {
  const [s, setS] = useState<Summary | null>(null);
  const [reports, setReports] = useState<string[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => {
    api<Summary>("/api/summary").then(setS).catch(setErr);
    api<string[]>("/api/report").then(setReports).catch(() => undefined);
  }, []);

  const chart = useMemo(() => {
    if (!s) return [];
    const byDate: Record<string, Record<string, number[]>> = {};
    for (const x of s.scores) ((byDate[x.date] ??= {})[x.area] ??= []).push(x.score);
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, areas]) => ({
        date: date.slice(5),
        ...Object.fromEntries(Object.entries(areas).map(([a, v]) => [a, Math.round((v.reduce((p, c) => p + c, 0) / v.length) * 10) / 10])),
      }));
  }, [s]);

  const gen = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ file: string; markdown: string }>("/api/report", { body: {} });
      setReport(r.markdown);
      setReports((l) => [r.file, ...l.filter((f) => f !== r.file)]);
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  if (err && !s) return <ErrorBox error={err} />;
  if (!s) return <Thinking label="Loading" />;

  const funnel = ["saved", "applied", "interview", "offer"].map((k) => ({ k, n: s.jobs.byStatus[k] ?? 0 }));
  const funnelMax = Math.max(1, ...funnel.map((f) => f.n));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your progress at a glance">
        <Button onClick={gen} loading={busy}>
          <Sparkles size={16} /> Generate weekly report
        </Button>
      </PageHeader>
      <ErrorBox error={err} />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="text-warn" />
            <span className="font-semibold">{s.streak}-day streak</span>
            {s.burnout.light && <Badge tone="warn">light mode</Badge>}
          </div>
          <div className="grid grid-cols-12 gap-1">
            {s.activity.map((d, i) => (
              <motion.div
                key={d.date}
                title={`${d.date}${d.active ? ` · ${d.scores} graded activities` : ""}`}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.004 }}
                className={clsx("aspect-square rounded-[4px]", !d.active ? "bg-line/60" : d.scores >= 6 ? "bg-good" : d.scores >= 3 ? "bg-good/70" : "bg-good/40")}
              />
            ))}
          </div>
          <div className="text-xs text-muted mt-2">Last 12 weeks</div>
        </Panel>
        <Panel delay={0.05}>
          <div className="font-semibold mb-3">Overview</div>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted">French level</span>
            <span className="text-right font-semibold">{s.french.level}</span>
            <span className="text-muted">French topic</span>
            <span className="text-right">
              {s.french.topicIndex + 1}/{s.french.totalTopics}
            </span>
            <span className="text-muted">Exercises solved</span>
            <span className="text-right">{s.solvedCount}</span>
            <span className="text-muted">Flashcards</span>
            <span className="text-right">{s.totalCards}</span>
            <span className="text-muted">Mistakes open / closed</span>
            <span className="text-right">
              <span className="text-bad">{s.openMistakes}</span> / <span className="text-good">{s.closedMistakes}</span>
            </span>
            <span className="text-muted">Referral contacts</span>
            <span className="text-right">
              {s.jobs.contacts} ({s.jobs.referred} referred)
            </span>
          </div>
        </Panel>
        <Panel delay={0.1}>
          <div className="font-semibold mb-3">Job funnel</div>
          <div className="flex flex-col gap-2">
            {funnel.map((f, i) => (
              <div key={f.k} className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="capitalize text-muted">{f.k}</span>
                  <span>{f.n}</span>
                </div>
                <div className="h-2 rounded-full bg-line overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-accent to-accent-2" initial={{ width: 0 }} animate={{ width: `${(f.n / funnelMax) * 100}%` }} transition={{ delay: 0.2 + i * 0.1 }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mb-6" delay={0.15}>
        <div className="font-semibold mb-3">Scores over time (daily average /10)</div>
        {chart.length < 2 ? (
          <div className="text-sm text-muted">Do a few graded exercises to see your curve.</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                <CartesianGrid stroke="#263152" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#8b96b8" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="#8b96b8" fontSize={12} />
                <Tooltip contentStyle={{ background: "#121829", border: "1px solid #263152", borderRadius: 12 }} />
                <Legend />
                {Object.keys(AREA_COLORS).map((a) => (
                  <Line key={a} type="monotone" dataKey={a} stroke={AREA_COLORS[a]} strokeWidth={2.5} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel delay={0.2}>
          <div className="font-semibold mb-3">Coding skills</div>
          <div className="flex flex-col gap-2">
            {s.lessons.map((l, i) => (
              <div key={l.id} className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>
                    <span className="text-muted">W{l.week}</span> {l.title}
                  </span>
                  <span className="text-muted">{l.skill}%</span>
                </div>
                <div className="h-2 rounded-full bg-line overflow-hidden">
                  <motion.div
                    className={clsx("h-full", l.skill >= 70 ? "bg-good" : l.skill >= 35 ? "bg-warn" : "bg-accent")}
                    initial={{ width: 0 }}
                    animate={{ width: `${l.skill}%` }}
                    transition={{ delay: 0.2 + i * 0.03 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel delay={0.25}>
          <div className="font-semibold mb-3">Weekly reports</div>
          {busy && <Thinking label="Writing your weekly report" />}
          {report && !busy && <Md>{report}</Md>}
          {!report && !busy && (
            <div className="flex flex-col gap-1">
              {reports.length === 0 && <div className="text-sm text-muted">No reports yet — generate one on Sunday.</div>}
              {reports.map((f) => (
                <button
                  key={f}
                  onClick={async () => setReport((await api<{ markdown: string }>(`/api/report?file=${f}`)).markdown)}
                  className="text-left text-sm rounded-lg px-2 py-1.5 hover:bg-panel-2 flex items-center gap-2"
                >
                  <FileText size={14} className="text-muted" /> {f.replace(/\.md$/, "")}
                </button>
              ))}
            </div>
          )}
          {report && (
            <Button size="sm" variant="ghost" className="mt-3" onClick={() => setReport(null)}>
              All reports
            </Button>
          )}
        </Panel>
      </div>
    </div>
  );
}
