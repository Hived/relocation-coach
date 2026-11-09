import { body, handler } from "@/lib/api";
import { getExercise, runTests } from "@/lib/coding";
import { bumpSkill, recordScore, updateProgress } from "@/lib/data";
import { today, writeJson } from "@/lib/store";

export const dynamic = "force-dynamic";

export const POST = handler(async (req: Request) => {
  const { id } = await body<{ id: string }>(req);
  const ex = await getExercise(id);
  const result = await runTests(ex.testFilter);
  await writeJson(`runs/${id}`, { date: new Date().toISOString(), result });
  if (result.missingDotnet) return result;

  let firstSolve = false;
  if (result.ok) {
    await updateProgress((p) => {
      if (!p.solved[id]) {
        p.solved[id] = today();
        firstSolve = true;
      }
      if (!p.sessions.includes(today())) p.sessions.push(today());
    });
    if (firstSolve) {
      // Fewer hints = better score
      const total = result.passed + result.failed || 1;
      await recordScore("coding", Math.round((result.passed / total) * 10));
      await bumpSkill(ex.lessonId, 8);
    }
  }
  return { ...result, firstSolve };
});
