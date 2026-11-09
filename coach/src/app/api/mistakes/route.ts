import { body, handler } from "@/lib/api";
import { addMistakes, type NewMistake } from "@/lib/data";
import { readJson, updateJson } from "@/lib/store";
import type { Mistake } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const list = await readJson<Mistake[]>("mistakes", []);
  return list.slice().reverse();
});

export const POST = handler(async (req: Request) => {
  const m = await body<NewMistake>(req);
  return addMistakes([m]);
});

/** PATCH {id, status} — reopen or close manually */
export const PATCH = handler(async (req: Request) => {
  const { id, status } = await body<{ id: string; status: "open" | "closed" }>(req);
  await updateJson<Mistake[]>("mistakes", [], (list) => list.map((m) => (m.id === id ? { ...m, status, streakCorrect: status === "open" ? 0 : m.streakCorrect } : m)));
  return { ok: true };
});
