import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { addMistakes, recordScore, updateProgress } from "@/lib/data";
import { FRENCH_TOPICS } from "@/lib/curriculum";
import { PROMPTS, SYS } from "@/lib/prompts";
import { today, writeText } from "@/lib/store";
import type { TriText } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Mcq { q: string; options: string[]; answer: string; skill: string; level: string }
interface Correction { wrong: string; right: string; type: string; rule: TriText }
interface Graded {
  level: string;
  score: number;
  summary: TriText;
  strengths: string[];
  weaknesses: string[];
  corrections: Correction[];
  start_topic_index: number;
}

export const POST = handler(async (req: Request) => {
  const b = await body<{ action: "generate" | "grade"; mcq?: (Mcq & { chosen: string })[]; writing?: string; writingPrompt?: string }>(req);

  if (b.action === "generate") {
    return askClaudeJson("frenchPlacement", SYS.frenchTeacher, PROMPTS.frenchPlacement());
  }

  const results = (b.mcq ?? []).map((m) => `${m.q} | ${m.chosen || "(no answer)"} | ${m.answer}`).join("\n");
  const graded = await askClaudeJson<Graded>("frenchPlacementGrade", SYS.frenchTeacher, PROMPTS.frenchPlacementGrade(results, b.writing ?? ""));

  const startIndex = Math.max(0, Math.min(FRENCH_TOPICS.length - 1, Number(graded.start_topic_index) || 0));
  await updateProgress((p) => {
    p.french = { level: graded.level, placementDone: true, topicIndex: startIndex };
  });
  await recordScore("french", Math.round((graded.score ?? 0) / 10));

  const wrongMcq = (b.mcq ?? []).filter((m) => m.chosen !== m.answer);
  await addMistakes([
    ...wrongMcq.map((m) => ({
      area: "french" as const,
      topic: m.skill || "placement",
      question: m.q,
      myAnswer: m.chosen || "(no answer)",
      correction: m.answer,
      rule: { en: `Correct answer: ${m.answer}` },
    })),
    ...(graded.corrections ?? []).map((c) => ({
      area: "french" as const,
      topic: c.type || "writing",
      question: `Correct this: "${c.wrong}"`,
      myAnswer: c.wrong,
      correction: c.right,
      rule: c.rule,
    })),
  ]);

  await writeText(
    `french/journal/${today()}-placement.md`,
    `# Placement test — ${today()}\n\n**Level:** ${graded.level} (${graded.score}/100)\n\n${graded.summary?.en ?? ""}\n\n## Writing\n\n${b.writingPrompt ?? ""}\n\n> ${(b.writing ?? "").replace(/\n/g, "\n> ")}\n\n## Corrections\n\n${(graded.corrections ?? []).map((c) => `- ❌ ${c.wrong} → ✅ ${c.right} — 📘 ${c.rule?.en ?? ""}`).join("\n")}\n`,
  );

  return { ...graded, start_topic_index: startIndex, startTopic: FRENCH_TOPICS[startIndex] };
});
