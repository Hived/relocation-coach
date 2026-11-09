import { body, handler } from "@/lib/api";
import { askClaudeJson } from "@/lib/claude";
import { PROMPTS, SYS } from "@/lib/prompts";
import { listFiles, readJson, readText } from "@/lib/store";
import type { Mistake } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET → list of relearn cards. GET ?file=coding/x.md → content + past mistakes on that topic. */
export const GET = handler(async (req: Request) => {
  const file = new URL(req.url).searchParams.get("file");
  if (file) {
    if (!/^(coding|french)\/[\w.-]+\.md$/.test(file)) throw new Error("Bad file");
    const content = await readText(`relearn/${file}`);
    const topic = file.split("/")[1].replace(/\.md$/, "");
    const mistakes = (await readJson<Mistake[]>("mistakes", [])).filter((m) => m.topic === topic);
    return { file, content, mistakes };
  }
  const [coding, french] = await Promise.all([listFiles("relearn/coding"), listFiles("relearn/french")]);
  const withTitles = async (area: string, files: string[]) =>
    Promise.all(
      files.map(async (f) => {
        const first = (await readText(`relearn/${area}/${f}`)).split("\n").find((l) => l.startsWith("# "));
        return { file: `${area}/${f}`, area, title: first ? first.slice(2) : f.replace(/\.md$/, "") };
      }),
    );
  return [...(await withTitles("coding", coding)), ...(await withTitles("french", french))];
});

/** POST {file} → 3 quick check questions generated from the card. */
export const POST = handler(async (req: Request) => {
  const { file } = await body<{ file: string }>(req);
  if (!/^(coding|french)\/[\w.-]+\.md$/.test(file)) throw new Error("Bad file");
  const content = await readText(`relearn/${file}`);
  return askClaudeJson("relearnChecks", SYS.judge, PROMPTS.relearnChecks(content.slice(0, 6000)));
});
