import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { getExercise } from "@/lib/coding";
import { updateProgress } from "@/lib/data";
import { PROMPTS, SYS } from "@/lib/prompts";
import { readJson, readText } from "@/lib/store";

export const dynamic = "force-dynamic";

export const POST = handler(async (req: Request) => {
  const { id, level } = await body<{ id: string; level: 1 | 2 | 3 }>(req);
  const ex = await getExercise(id);
  const code = await readText(ex.file);
  const run = await readJson<{ result?: { output: string } } | null>(`runs/${id}`, null);
  const res = await askClaudeJson<{ hint: { en: string; darija: string } }>(
    "codingHint",
    SYS.codingTeacher,
    PROMPTS.codingHint(`${ex.title}\n${ex.description}`, code, level, run?.result?.output?.slice(-2500) ?? ""),
  );
  await updateProgress((p) => {
    p.hints[id] = [...(p.hints[id] ?? []), level];
  });
  return res;
});
