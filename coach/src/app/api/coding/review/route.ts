import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { getExercise } from "@/lib/coding";
import { addMistakes, recordScore } from "@/lib/data";
import { PROMPTS, SYS } from "@/lib/prompts";
import { readJson, readText } from "@/lib/store";

export const dynamic = "force-dynamic";

interface Review {
  score: number;
  summary: { en: string; darija: string };
  good: { en: string; darija: string }[];
  issues: { problem: string; fix: string; topic: string; rule: { en: string; darija: string } }[];
  complexity: string;
}

export const POST = handler(async (req: Request) => {
  const { id } = await body<{ id: string }>(req);
  const ex = await getExercise(id);
  const code = await readText(ex.file);
  const run = await readJson<{ result?: { output: string } } | null>(`runs/${id}`, null);
  const r = await askClaudeJson<Review>(
    "codingReview",
    SYS.codingTeacher,
    PROMPTS.codingReview(`${ex.title}\n${ex.description}`, code, run?.result?.output?.slice(-2500) ?? ""),
  );
  await addMistakes(
    (r.issues ?? []).map((i) => ({
      area: "coding" as const,
      topic: i.topic || ex.lessonId,
      question: `${ex.title}: ${i.problem} — how should it be fixed?`,
      myAnswer: "(my code had this issue)",
      correction: i.fix,
      rule: i.rule,
    })),
  );
  await recordScore("coding", r.score ?? 0);
  return r;
});
