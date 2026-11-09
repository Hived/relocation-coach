"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Flame, Layers, BookX, Code2, Languages, BellRing, Feather, ArrowRight } from "lucide-react";
import { api } from "@/lib/client";
import { Badge, ErrorBox, PageHeader, Panel, Stat, Thinking } from "@/components/ui";

interface Summary {
  streak: number;
  burnout: { light: boolean; reason: string };
  dueCards: number;
  dueByArea: { coding: number; french: number };
  openMistakes: number;
  closedMistakes: number;
  nextLesson: { id: string; week: number; title: string };
  french: { level: string; placementDone: boolean; topic: string; topicIndex: number; totalTopics: number };
  solvedCount: number;
  followUps: { kind: string; label: string; date: string }[];
  weakSpots: [string, number][];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Sbah l-khir";
  if (h < 18) return "Msa l-khir";
  return "Msa l-khir";
}

export default function TodayPage() {
  const [s, setS] = useState<Summary | null>(null);
  const [err, setErr] = useState<unknown>(null);
  useEffect(() => {
    api<Summary>("/api/summary").then(setS).catch(setErr);
  }, []);

  if (err) return <ErrorBox error={err} />;
  if (!s) return <Thinking label="Loading your day" />;

  const steps = [
    {
      done: s.dueCards === 0,
      title: s.dueCards ? `Review ${s.dueCards} due flashcards` : "No reviews due 🎉",
      sub: `${s.dueByArea.coding} coding · ${s.dueByArea.french} French · ~5 min`,
      href: "/cards",
      icon: Layers,
    },
    {
      done: false,
      title: `Coding: ${s.nextLesson.title}`,
      sub: `Week ${s.nextLesson.week} · lesson + exercises · ~${s.burnout.light ? 30 : 60} min`,
      href: `/coding?lesson=${s.nextLesson.id}`,
      icon: Code2,
    },
    {
      done: false,
      title: s.french.placementDone ? `French: ${s.french.topic}` : "French: take the placement test (10 min)",
      sub: s.french.placementDone ? `Level ${s.french.level} · topic ${s.french.topicIndex + 1}/${s.french.totalTopics} · ~30 min` : "Finds your level and where to start",
      href: "/french",
      icon: Languages,
    },
    ...(s.openMistakes && !s.burnout.light
      ? [{ done: false, title: `Redo mistakes (${s.openMistakes} open)`, sub: "Closed after 2 correct answers in a row", href: "/mistakes?redo=1", icon: BookX }]
      : []),
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader title={`${greeting()} 👋`} subtitle={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} />

      {s.burnout.light && (
        <Panel className="mb-6 border-warn/40">
          <div className="flex items-center gap-3">
            <Feather className="text-warn" />
            <div>
              <div className="font-semibold text-warn">Light mode this week</div>
              <div className="text-sm text-muted">{s.burnout.reason}</div>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Day streak" value={s.streak} icon={<Flame />} tone="warn" />
        <Stat label="Cards due" value={s.dueCards} icon={<Layers />} />
        <Stat label="Open mistakes" value={s.openMistakes} sub={`${s.closedMistakes} closed`} icon={<BookX />} tone="bad" />
        <Stat label="Exercises solved" value={s.solvedCount} icon={<Code2 />} tone="good" />
      </div>

      <Panel className="mb-6" delay={0.05}>
        <h2 className="font-semibold mb-4">Today&apos;s plan</h2>
        <div className="flex flex-col gap-3">
          {steps.map((st, i) => (
            <motion.div key={st.title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
              <Link href={st.href} className="group flex items-center gap-4 rounded-xl border border-line bg-ink/40 p-4 hover:border-accent transition-colors">
                <div className="rounded-lg bg-accent/15 p-2.5 text-violet-300">
                  <st.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{st.title}</div>
                  <div className="text-sm text-muted">{st.sub}</div>
                </div>
                <ArrowRight className="text-muted group-hover:text-text group-hover:translate-x-1 transition-transform" size={18} />
              </Link>
            </motion.div>
          ))}
        </div>
      </Panel>

      <div className="grid md:grid-cols-2 gap-6">
        <Panel delay={0.1}>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <BellRing size={18} /> Follow-ups due
          </h2>
          {s.followUps.length === 0 ? (
            <p className="text-sm text-muted">Nothing due. Add applications and referral contacts in Jobs.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {s.followUps.map((f) => (
                <li key={f.label} className="flex justify-between gap-2">
                  <span>{f.label}</span>
                  <Badge tone="warn">{f.date}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel delay={0.15}>
          <h2 className="font-semibold mb-3">Weak spots</h2>
          {s.weakSpots.length === 0 ? (
            <p className="text-sm text-muted">No open mistakes yet. They will show up here as you practise.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {s.weakSpots.map(([t, n]) => (
                <Badge key={t} tone="bad">
                  {t} · {n}
                </Badge>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
