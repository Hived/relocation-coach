import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { getProgress, updateProgress } from "@/lib/data";
import { FRENCH_TOPICS } from "@/lib/curriculum";
import { PROMPTS, SYS } from "@/lib/prompts";
import { readJson, today, writeJson } from "@/lib/store";
import type { Mistake } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET: today's cached task (if any). POST {refresh?, move?: -1|1}: new task. */
export const GET = handler(async () => {
  const cached = await readJson<{ date: string; topicIndex: number; task: unknown } | null>("french-task", null);
  const p = await getProgress();
  return {
    task: cached && cached.date === today() && cached.topicIndex === p.french.topicIndex ? cached.task : null,
    topicIndex: p.french.topicIndex,
    topic: FRENCH_TOPICS[p.french.topicIndex],
    topics: FRENCH_TOPICS,
    level: p.french.level,
    placementDone: p.french.placementDone,
  };
});

export const POST = handler(async (req: Request) => {
  const { move, setIndex } = await body<{ move?: number; setIndex?: number }>(req);
  if (move || setIndex !== undefined) {
    await updateProgress((p) => {
      const target = setIndex !== undefined ? setIndex : p.french.topicIndex + (move ?? 0);
      p.french.topicIndex = Math.max(0, Math.min(FRENCH_TOPICS.length - 1, target));
    });
  }
  const p = await getProgress();
  const topic = FRENCH_TOPICS[p.french.topicIndex];
  const mistakes = (await readJson<Mistake[]>("mistakes", []))
    .filter((m) => m.area === "french" && m.status === "open")
    .slice(-8)
    .map((m) => `${m.myAnswer} → ${m.correction} (${m.topic})`)
    .join("; ");
  const task = await askClaudeJson("frenchTask", SYS.frenchTeacher, PROMPTS.frenchTask(topic, p.french.level, mistakes));
  await writeJson("french-task", { date: today(), topicIndex: p.french.topicIndex, task });
  return { task, topicIndex: p.french.topicIndex, topic };
});
