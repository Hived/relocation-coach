import { handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { burnoutStatus, computeStreak, getProgress } from "@/lib/data";
import { listFiles, readJson, readText, writeText } from "@/lib/store";
import type { Application, Contact, Mistake } from "@/lib/types";
import { PROMPTS, SYS } from "@/lib/prompts";

export const dynamic = "force-dynamic";

function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

export const GET = handler(async (req: Request) => {
  const file = new URL(req.url).searchParams.get("file");
  if (file) {
    if (!/^[\w.-]+\.md$/.test(file)) throw new Error("Bad file");
    return { file, markdown: await readText(`reports/${file}`) };
  }
  return (await listFiles("reports")).reverse();
});

export const POST = handler(async () => {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const s = since.toISOString().slice(0, 10);
  const [p, mistakes, apps, contacts] = await Promise.all([
    getProgress(),
    readJson<Mistake[]>("mistakes", []),
    readJson<Application[]>("applications", []),
    readJson<Contact[]>("contacts", []),
  ]);
  const week = {
    activeDays: p.sessions.filter((d) => d >= s).length,
    streak: computeStreak(p.sessions),
    burnout: burnoutStatus(p),
    scores: p.scores.filter((x) => x.date >= s),
    newMistakes: mistakes.filter((m) => m.date >= s).map((m) => `${m.area}/${m.topic}: ${m.myAnswer} → ${m.correction}`),
    openMistakesByTopic: mistakes.filter((m) => m.status === "open").reduce<Record<string, number>>((a, m) => ((a[m.topic] = (a[m.topic] ?? 0) + 1), a), {}),
    closedThisWeek: mistakes.filter((m) => m.status === "closed" && m.history.some((h) => h.date >= s)).length,
    solvedExercises: Object.entries(p.solved).filter(([, d]) => d >= s).map(([id]) => id),
    skills: p.skills,
    french: p.french,
    applicationsThisWeek: apps.filter((a) => a.createdAt >= s).map((a) => `${a.company} (${a.status})`),
    contactsMessaged: contacts.filter((c) => (c.messagedOn ?? "") >= s).length,
  };
  const r = await askClaudeJson<{ markdown: string }>("weeklyReport", SYS.careerCoach, PROMPTS.weeklyReport(JSON.stringify(week, null, 1)));
  const file = `${isoWeek()}.md`;
  await writeText(`reports/${file}`, r.markdown);
  return { file, markdown: r.markdown };
});
