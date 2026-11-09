import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { addMistakes, recordScore } from "@/lib/data";
import { PROMPTS, SYS } from "@/lib/prompts";
import { today, writeText } from "@/lib/store";

export const dynamic = "force-dynamic";

const MODES: Record<string, string> = {
  dotnet: "Technical .NET / C# interview (language fundamentals, OOP, collections, LINQ, async, DI, ASP.NET Core, EF Core, testing)",
  "system-design": "System design interview for a mid-level backend engineer (APIs, databases, caching, queues, scaling, trade-offs)",
  behavioral: "Behavioral interview using STAR (teamwork, conflict, failure, ownership, why Ireland/UK, why this company)",
  negotiation: "Salary negotiation call with an HR person after an offer for a sponsored .NET role in Dublin or London (the candidate practices negotiating)",
};

interface Msg { role: "interviewer" | "candidate"; text: string }

export const POST = handler(async (req: Request) => {
  const { action, mode, messages } = await body<{ action: "turn" | "feedback"; mode: string; messages: Msg[] }>(req);
  const modeText = MODES[mode] ?? MODES.dotnet;
  const transcript = (messages ?? []).map((m) => `${m.role === "interviewer" ? "I" : "C"}: ${m.text}`).join("\n");

  if (action === "turn") {
    return askClaudeJson<{ message: string; done: boolean }>("interviewTurn", SYS.interviewer, PROMPTS.interviewTurn(modeText, transcript));
  }

  const fb = await askClaudeJson<{
    score: number;
    verdict: string;
    summary: { en: string; darija: string };
    strengths: string[];
    improvements: { question: string; issue: string; better_answer: string }[];
  }>("interviewFeedback", SYS.interviewer, PROMPTS.interviewFeedback(modeText, transcript));

  await recordScore("interview", fb.score ?? 0);
  await addMistakes(
    (fb.improvements ?? []).map((i) => ({
      area: "interview" as const,
      topic: `interview: ${mode}`,
      question: i.question,
      myAnswer: i.issue,
      correction: i.better_answer,
      rule: { en: i.issue },
    })),
  );
  const stamp = new Date().toISOString().slice(11, 16).replace(":", "");
  await writeText(
    `interviews/logs/${today()}-${stamp}-${mode}.md`,
    `# Mock interview — ${mode} — ${today()}\n\n**Score:** ${fb.score}/10 · **Verdict:** ${fb.verdict}\n\n${fb.summary?.en ?? ""}\n\n## Transcript\n\n${(messages ?? []).map((m) => `**${m.role === "interviewer" ? "Interviewer" : "Me"}:** ${m.text}`).join("\n\n")}\n\n## Improvements\n\n${(fb.improvements ?? []).map((i) => `### ${i.question}\n- Issue: ${i.issue}\n- Better: ${i.better_answer}`).join("\n\n")}\n`,
  );
  return fb;
});
