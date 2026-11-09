import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { bumpSkill, recordScore } from "@/lib/data";
import { PROMPTS, SYS } from "@/lib/prompts";
import { readJson, today, updateJson } from "@/lib/store";
import type { Mistake, TriText } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Re-ask an old mistake. Closed after 2 correct answers in a row. */
export const POST = handler(async (req: Request) => {
  const { id, answer } = await body<{ id: string; answer: string }>(req);
  const m = (await readJson<Mistake[]>("mistakes", [])).find((x) => x.id === id);
  if (!m) throw new Error("Mistake not found");

  const verdict = await askClaudeJson<{ correct: boolean; feedback: TriText }>(
    "judge",
    SYS.judge,
    PROMPTS.judge(m.question, m.correction, answer, m.area === "french" ? "french" : "coding"),
  );

  let updated: Mistake | undefined;
  await updateJson<Mistake[]>("mistakes", [], (list) =>
    list.map((x) => {
      if (x.id !== id) return x;
      const streak = verdict.correct ? x.streakCorrect + 1 : 0;
      updated = {
        ...x,
        streakCorrect: streak,
        status: streak >= 2 ? "closed" : "open",
        history: [...x.history, { date: today(), answer, correct: verdict.correct }],
      };
      return updated;
    }),
  );
  await recordScore(m.area, verdict.correct ? 10 : 3);
  await bumpSkill(m.topic, verdict.correct ? 3 : -2);
  return { ...verdict, mistake: updated };
});
