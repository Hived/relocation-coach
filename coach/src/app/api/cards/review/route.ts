import { body, handler } from "@/lib/api";
import { bumpSkill, recordScore } from "@/lib/data";
import { review, type RatingName } from "@/lib/fsrs";
import { updateJson } from "@/lib/store";
import type { Card } from "@/lib/types";

export const dynamic = "force-dynamic";

const SCORE: Record<RatingName, number> = { again: 2, hard: 6, good: 8, easy: 10 };

export const POST = handler(async (req: Request) => {
  const { id, rating } = await body<{ id: string; rating: RatingName }>(req);
  let card: Card | undefined;
  await updateJson<Card[]>("cards", [], (list) =>
    list.map((c) => {
      if (c.id !== id) return c;
      card = { ...c, fsrs: review(c.fsrs, rating) };
      return card;
    }),
  );
  if (!card) throw new Error("Card not found");
  await recordScore(card.area, SCORE[rating]);
  await bumpSkill(card.topic, rating === "again" ? -1 : 1);
  return card;
});
