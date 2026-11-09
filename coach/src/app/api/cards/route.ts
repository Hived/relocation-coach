import { body, handler } from "@/lib/api";
import { addCards, type NewCard } from "@/lib/data";
import { isDue, previewIntervals } from "@/lib/fsrs";
import { readJson, updateJson } from "@/lib/store";
import type { Card } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const area = url.searchParams.get("area");
  const cards = (await readJson<Card[]>("cards", [])).filter((c) => !area || area === "all" || c.area === area);
  const due = cards
    .filter((c) => isDue(c.fsrs))
    .sort((a, b) => a.fsrs.due.localeCompare(b.fsrs.due))
    .map((c) => ({ ...c, preview: previewIntervals(c.fsrs) }));
  return { due, total: cards.length, all: cards };
});

export const POST = handler(async (req: Request) => {
  const card = await body<NewCard>(req);
  if (!card.front || !card.back) throw new Error("A card needs a front and a back.");
  return addCards([card]);
});

export const DELETE = handler(async (req: Request) => {
  const id = new URL(req.url).searchParams.get("id");
  await updateJson<Card[]>("cards", [], (list) => list.filter((c) => c.id !== id));
  return { ok: true };
});
