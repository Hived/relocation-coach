import { handler } from "@/lib/api";
import { askClaudeJson, isMock } from "@/lib/claude";
import { PROMPTS, SYS } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const started = Date.now();
  const res = await askClaudeJson<{ ok: boolean; message: string }>("ping", SYS.careerCoach, PROMPTS.ping());
  return { ...res, mock: isMock(), ms: Date.now() - started };
});
