import "server-only";
import { readJson, updateJson, newId, today } from "./store";
import { newCardState } from "./fsrs";
import {
  DEFAULT_PROGRESS,
  DEFAULT_SETTINGS,
  type Area,
  type Card,
  type Mistake,
  type Progress,
  type Settings,
  type TriText,
} from "./types";

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await readJson<Partial<Settings>>("settings", {})) };
}

export async function getProgress(): Promise<Progress> {
  const p = await readJson<Partial<Progress>>("progress", {});
  return { ...DEFAULT_PROGRESS, ...p, french: { ...DEFAULT_PROGRESS.french, ...(p.french ?? {}) } };
}

export async function updateProgress(fn: (p: Progress) => void) {
  return updateJson<Progress>("progress", DEFAULT_PROGRESS, (p) => {
    const full: Progress = { ...DEFAULT_PROGRESS, ...p, french: { ...DEFAULT_PROGRESS.french, ...(p.french ?? {}) } };
    fn(full);
    return full;
  });
}

/** Mark today as an active day (for streaks + burnout guard). */
export async function touchSession() {
  const d = today();
  await updateProgress((p) => {
    if (!p.sessions.includes(d)) p.sessions.push(d);
  });
}

export async function recordScore(area: Area, score: number) {
  await updateProgress((p) => {
    p.scores.push({ date: today(), area, score });
    if (!p.sessions.includes(today())) p.sessions.push(today());
  });
}

/** Nudge a skill level up/down (0..100). */
export async function bumpSkill(topic: string, delta: number) {
  await updateProgress((p) => {
    const cur = p.skills[topic] ?? 0;
    p.skills[topic] = Math.max(0, Math.min(100, Math.round(cur + delta)));
  });
}

export interface NewMistake {
  area: Area;
  topic: string;
  question: string;
  myAnswer: string;
  correction: string;
  rule: TriText;
}

export async function addMistakes(items: NewMistake[]) {
  if (!items.length) return [];
  const created: Mistake[] = items.map((m) => ({
    ...m,
    id: newId("m"),
    date: today(),
    streakCorrect: 0,
    status: "open",
    history: [],
  }));
  await updateJson<Mistake[]>("mistakes", [], (list) => [...list, ...created]);
  return created;
}

export interface NewCard {
  area: "coding" | "french";
  topic: string;
  front: string;
  back: string;
  extra?: TriText;
}

export async function addCards(items: NewCard[]) {
  if (!items.length) return [];
  let created: Card[] = [];
  await updateJson<Card[]>("cards", [], (list) => {
    const existing = new Set(list.map((c) => c.front.trim().toLowerCase()));
    created = items
      .filter((c) => c.front && !existing.has(c.front.trim().toLowerCase()))
      .map((c) => ({ ...c, id: newId("c"), createdAt: today(), fsrs: newCardState() }));
    return [...list, ...created];
  });
  return created;
}

/** Streak = consecutive active days ending today or yesterday. */
export function computeStreak(sessions: string[]): number {
  const set = new Set(sessions);
  const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Burnout guard: light mode when ≥3 missed days in the last 7, or recent scores dropping. */
export function burnoutStatus(p: Progress): { light: boolean; reason: string } {
  const set = new Set(p.sessions);
  const first = p.sessions.slice().sort()[0];
  let missed = 0;
  const d = new Date();
  for (let i = 1; i <= 7; i++) {
    d.setDate(d.getDate() - 1);
    const key = d.toISOString().slice(0, 10);
    if (first && key >= first && !set.has(key)) missed++;
  }
  // Only judge after you've actually been using the app for a few days
  if (missed >= 3)
    return { light: true, reason: `You missed ${missed} of the last 7 days — light week: reviews + one lesson only. No guilt, just restart.` };
  const recent = p.scores.slice(-10).map((s) => s.score);
  if (recent.length >= 6) {
    const a = recent.slice(0, recent.length / 2);
    const b = recent.slice(recent.length / 2);
    const avg = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;
    if (avg(b) < avg(a) - 1.5) return { light: true, reason: "Your scores dropped recently — light mode to consolidate before new topics." };
  }
  return { light: false, reason: "Normal load." };
}
