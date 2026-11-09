import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { addMistakes, bumpSkill, recordScore } from "@/lib/data";
import { PROMPTS, SYS } from "@/lib/prompts";
import type { Area, TriText } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Judge one answer to a check question; wrong answers go to the mistake journal. */
export const POST = handler(async (req: Request) => {
  const { question, expected, answer, area, topic } = await body<{ question: string; expected: string; answer: string; area: Area; topic: string }>(req);
  const verdict = await askClaudeJson<{ correct: boolean; feedback: TriText }>(
    "judge",
    SYS.judge,
    PROMPTS.judge(question, expected, answer, area === "french" ? "french" : "coding"),
  );
  if (!verdict.correct) {
    await addMistakes([{ area, topic, question, myAnswer: answer || "(empty)", correction: expected, rule: verdict.feedback }]);
  }
  await recordScore(area, verdict.correct ? 10 : 3);
  await bumpSkill(topic, verdict.correct ? 4 : -2);
  return verdict;
});
