import { handler } from "@/lib/api";
import { askClaudeJson, findClaude, isMock } from "@/lib/claude";
import { getSettings } from "@/lib/data";
import { PROMPTS, SYS } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const started = Date.now();
  const res = await askClaudeJson<{ ok: boolean; message: string }>("ping", SYS.careerCoach, PROMPTS.ping());
  const found = await findClaude((await getSettings()).claudePath);
  return { ...res, mock: isMock(), ms: Date.now() - started, bin: found.bin, source: found.source };
});
