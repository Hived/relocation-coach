import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { addMistakes, bumpSkill, recordScore } from "@/lib/data";
import { PROMPTS, SYS } from "@/lib/prompts";
import { today, updateJson } from "@/lib/store";

export const dynamic = "force-dynamic";

interface Grade {
  accuracy: number;
  completeness: number;
  clarity: number;
  overall: number;
  feedback: { en: string; darija: string };
  gaps: { gap: string; correction: string; rule: { en: string; darija: string } }[];
  model_explanation: { en: string };
}

export const POST = handler(async (req: Request) => {
  const { topic, topicId, explanation } = await body<{ topic: string; topicId?: string; explanation: string }>(req);
  if (!explanation?.trim()) throw new Error("Explain the topic first.");
  const g = await askClaudeJson<Grade>("teachGrade", SYS.codingTeacher, PROMPTS.teachGrade(topic, explanation));
  await addMistakes(
    (g.gaps ?? []).map((x) => ({
      area: "coding" as const,
      topic: topicId || topic,
      question: `Teach-back "${topic}": ${x.gap}`,
      myAnswer: "(missing or wrong in my explanation)",
      correction: x.correction,
      rule: x.rule,
    })),
  );
  await recordScore("coding", g.overall ?? 0);
  await bumpSkill(topicId || topic, (g.overall ?? 0) >= 8 ? 10 : (g.overall ?? 0) >= 5 ? 4 : 0);
  await updateJson<unknown[]>("teachbacks", [], (l) => [...l, { date: today(), topic, explanation, grade: g }]);
  return g;
});
