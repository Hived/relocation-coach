import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { PROMPTS, SYS } from "@/lib/prompts";
import { listFiles, readText, today, writeText } from "@/lib/store";

export const dynamic = "force-dynamic";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const GET = handler(async (req: Request) => {
  const file = new URL(req.url).searchParams.get("file");
  if (file) {
    if (!/^[\w.-]+\.md$/.test(file)) throw new Error("Bad file");
    return { file, markdown: await readText(`jobs/briefs/${file}`) };
  }
  return listFiles("jobs/briefs");
});

export const POST = handler(async (req: Request) => {
  const { company, role, notes } = await body<{ company: string; role?: string; notes?: string }>(req);
  if (!company?.trim()) throw new Error("Company name is required.");
  const r = await askClaudeJson<{ markdown: string }>("companyBrief", SYS.careerCoach, PROMPTS.companyBrief(company, role ?? "", notes ?? ""));
  const file = `${slug(company)}.md`;
  await writeText(`jobs/briefs/${file}`, `${r.markdown}\n\n_Generated ${today()} — verify facts on the company site and official sources._\n`);
  return { file, markdown: r.markdown };
});
