import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { CODING_LESSONS } from "@/lib/curriculum";
import { addCards, bumpSkill, touchSession } from "@/lib/data";
import { PROMPTS, SYS } from "@/lib/prompts";
import { readJson, writeJson, writeText } from "@/lib/store";

export const dynamic = "force-dynamic";

interface Duo { en: string; darija: string }
interface Lesson {
  title: string;
  explanation: Duo;
  code_example: string;
  key_points: Duo[];
  common_mistakes: Duo[];
  flashcards: { front: string; back: string }[];
  check_questions: { q: string; answer: string }[];
}

/** GET ?id → cached lesson or null. POST {id, refresh?} → generate (cached in data/lessons). */
export const GET = handler(async (req: Request) => {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  return { lesson: await readJson<Lesson | null>(`lessons/${id}`, null) };
});

export const POST = handler(async (req: Request) => {
  const { id, refresh } = await body<{ id: string; refresh?: boolean }>(req);
  const meta = CODING_LESSONS.find((l) => l.id === id);
  if (!meta) throw new Error("Unknown lesson");
  const cached = await readJson<Lesson | null>(`lessons/${id}`, null);
  if (cached && !refresh) return { lesson: cached };

  const lesson = await askClaudeJson<Lesson>("codingLesson", SYS.codingTeacher, PROMPTS.codingLesson(meta.title, meta.points));
  await writeJson(`lessons/${id}`, lesson);
  await addCards((lesson.flashcards ?? []).map((f) => ({ area: "coding" as const, topic: id, front: f.front, back: f.back })));
  await bumpSkill(id, 5);
  await touchSession();

  // Relearn card (markdown) so the topic can be re-learned fast months later
  const md = `# ${meta.title}\n\n_Week ${meta.week} · lesson id: ${id}_\n\n${lesson.explanation.en}\n\n## Darija\n\n${lesson.explanation.darija}\n\n## Key points\n\n${lesson.key_points.map((k) => `- ${k.en}\n  - 🇲🇦 ${k.darija}`).join("\n")}\n\n## Example\n\n\`\`\`csharp\n${lesson.code_example}\n\`\`\`\n\n## Common mistakes\n\n${lesson.common_mistakes.map((k) => `- ${k.en}`).join("\n")}\n`;
  await writeText(`relearn/coding/${id}.md`, md);
  return { lesson };
});
