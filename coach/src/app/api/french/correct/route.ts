import fs from "node:fs/promises";
import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { addCards, addMistakes, bumpSkill, getProgress, recordScore } from "@/lib/data";
import { FRENCH_TOPICS } from "@/lib/curriculum";
import { PROMPTS, SYS } from "@/lib/prompts";
import { rootPath, today } from "@/lib/store";
import type { TriText } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Correction { wrong: string; right: string; type: string; rule: TriText }
interface Vocab { fr: string; en: string; darija: string; example?: string }
interface Result {
  score: number;
  corrected_text: string;
  praise: TriText;
  corrections: Correction[];
  vocab: Vocab[];
  next_tip: TriText;
}

export const POST = handler(async (req: Request) => {
  const { task, answer } = await body<{ task: string; answer: string }>(req);
  if (!answer?.trim()) throw new Error("Write (or say) something first.");
  const p = await getProgress();
  const topic = FRENCH_TOPICS[p.french.topicIndex];

  const r = await askClaudeJson<Result>("frenchCorrect", SYS.frenchTeacher, PROMPTS.frenchCorrect(task, answer));
  const corrections = r.corrections ?? [];

  await addMistakes(
    corrections.map((c) => ({
      area: "french" as const,
      topic: c.type || topic,
      question: `Correct this: "${c.wrong}"`,
      myAnswer: c.wrong,
      correction: c.right,
      rule: c.rule,
    })),
  );
  const newCards = await addCards(
    (r.vocab ?? []).map((v) => ({
      area: "french" as const,
      topic,
      front: v.fr,
      back: v.en,
      extra: { en: v.example ? `Example: ${v.example}` : v.en, darija: v.darija },
    })),
  );
  await recordScore("french", r.score ?? 0);
  await bumpSkill(`fr: ${topic}`, (r.score ?? 0) >= 8 ? 6 : (r.score ?? 0) >= 5 ? 3 : 1);

  // Human-readable journal in the repo (git-friendly, Claude Code sessions can read it)
  const file = rootPath(`french/journal/${today()}.md`);
  await fs.mkdir(rootPath("french/journal"), { recursive: true });
  const entry = `\n## ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} — ${topic} — ${r.score}/10\n\n**Task:** ${task}\n\n**My answer:**\n> ${answer.replace(/\n/g, "\n> ")}\n\n**Corrected:**\n> ${(r.corrected_text ?? "").replace(/\n/g, "\n> ")}\n\n${corrections.map((c) => `- ❌ ${c.wrong} → ✅ ${c.right} — 📘 ${c.rule?.en ?? ""}${c.rule?.darija ? ` · 🇲🇦 ${c.rule.darija}` : ""}`).join("\n")}\n`;
  await fs.appendFile(file, entry, "utf8");

  return { ...r, cardsAdded: newCards.length };
});
