import { body, handler } from "@/lib/api";
import { readJson, updateJson } from "@/lib/store";

export const dynamic = "force-dynamic";

/** State of the relocation checklists: { "<itemId>": "YYYY-MM-DD done date" } */
export const GET = handler(async () => readJson<Record<string, string>>("checklist", {}));

export const PUT = handler(async (req: Request) => {
  const { id, done } = await body<{ id: string; done: boolean }>(req);
  return updateJson<Record<string, string>>("checklist", {}, (s) => {
    const next = { ...s };
    if (done) next[id] = new Date().toISOString().slice(0, 10);
    else delete next[id];
    return next;
  });
});
