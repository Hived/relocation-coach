import { handler } from "@/lib/api";
import { burnoutStatus, computeStreak, getProgress } from "@/lib/data";
import { isDue } from "@/lib/fsrs";
import { readJson } from "@/lib/store";
import { CODING_LESSONS, FRENCH_TOPICS } from "@/lib/curriculum";
import type { Application, Card, Contact, Mistake } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const [progress, cards, mistakes, apps, contacts] = await Promise.all([
    getProgress(),
    readJson<Card[]>("cards", []),
    readJson<Mistake[]>("mistakes", []),
    readJson<Application[]>("applications", []),
    readJson<Contact[]>("contacts", []),
  ]);
  const now = new Date();
  const dueCards = cards.filter((c) => isDue(c.fsrs, now));
  const open = mistakes.filter((m) => m.status === "open");
  const todayStr = now.toISOString().slice(0, 10);

  // Current coding lesson = first lesson whose skill < 70
  const nextLesson = CODING_LESSONS.find((l) => (progress.skills[l.id] ?? 0) < 70) ?? CODING_LESSONS[CODING_LESSONS.length - 1];

  const followUps = [
    ...apps.filter((a) => a.nextDate && a.nextDate <= todayStr).map((a) => ({ kind: "application", label: `${a.company} — ${a.nextAction || "follow up"}`, date: a.nextDate })),
    ...contacts
      .filter((c) => c.followUpOn && c.followUpOn <= todayStr && c.status !== "referred")
      .map((c) => ({ kind: "contact", label: `Follow up with ${c.name} (${c.company})`, date: c.followUpOn })),
  ];

  // Last 84 days activity for heatmap
  const activity = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (83 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, active: progress.sessions.includes(key), scores: progress.scores.filter((s) => s.date === key).length };
  });

  const mistakesByTopic: Record<string, number> = {};
  for (const m of open) mistakesByTopic[m.topic] = (mistakesByTopic[m.topic] ?? 0) + 1;

  return {
    streak: computeStreak(progress.sessions),
    burnout: burnoutStatus(progress),
    dueCards: dueCards.length,
    dueByArea: { coding: dueCards.filter((c) => c.area === "coding").length, french: dueCards.filter((c) => c.area === "french").length },
    totalCards: cards.length,
    openMistakes: open.length,
    closedMistakes: mistakes.length - open.length,
    weakSpots: Object.entries(mistakesByTopic).sort((a, b) => b[1] - a[1]).slice(0, 6),
    nextLesson,
    lessons: CODING_LESSONS.map((l) => ({ ...l, skill: progress.skills[l.id] ?? 0 })),
    french: { ...progress.french, topic: FRENCH_TOPICS[progress.french.topicIndex] ?? FRENCH_TOPICS[0], totalTopics: FRENCH_TOPICS.length },
    solvedCount: Object.keys(progress.solved).length,
    scores: progress.scores.slice(-60),
    activity,
    followUps,
    jobs: {
      total: apps.length,
      byStatus: apps.reduce<Record<string, number>>((acc, a) => ((acc[a.status] = (acc[a.status] ?? 0) + 1), acc), {}),
      contacts: contacts.length,
      referred: contacts.filter((c) => c.status === "referred").length,
    },
  };
});
