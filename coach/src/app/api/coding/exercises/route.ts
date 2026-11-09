import { handler } from "@/lib/api";
import { loadExercises } from "@/lib/coding";
import { CODING_LESSONS } from "@/lib/curriculum";
import { getProgress } from "@/lib/data";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const [exercises, p] = await Promise.all([loadExercises(), getProgress()]);
  return {
    exercises: exercises.map((e) => ({ ...e, solved: p.solved[e.id] ?? null, hints: p.hints[e.id] ?? [] })),
    lessons: CODING_LESSONS.map((l) => ({ ...l, skill: p.skills[l.id] ?? 0 })),
  };
});
