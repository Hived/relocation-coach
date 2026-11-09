import { createEmptyCard, fsrs, generatorParameters, Rating, type Card as FsrsCard, type Grade } from "ts-fsrs";
import type { CardState } from "./types";

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, maximum_interval: 365 }));

function toFsrs(s: CardState): FsrsCard {
  return {
    ...s,
    due: new Date(s.due),
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  } as FsrsCard;
}

function fromFsrs(c: FsrsCard): CardState {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: (c as FsrsCard & { learning_steps?: number }).learning_steps ?? 0,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? new Date(c.last_review).toISOString() : undefined,
  };
}

export function newCardState(): CardState {
  return fromFsrs(createEmptyCard(new Date()));
}

export type RatingName = "again" | "hard" | "good" | "easy";
const RATINGS: Record<RatingName, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export function review(state: CardState, rating: RatingName): CardState {
  const result = scheduler.next(toFsrs(state), new Date(), RATINGS[rating]);
  return fromFsrs(result.card);
}

/** Preview the next interval for each button, e.g. { again: "10m", good: "3d" } */
export function previewIntervals(state: CardState): Record<RatingName, string> {
  const now = new Date();
  const out = {} as Record<RatingName, string>;
  for (const [name, grade] of Object.entries(RATINGS) as [RatingName, Grade][]) {
    const due = scheduler.next(toFsrs(state), now, grade).card.due;
    out[name] = humanize(due.getTime() - now.getTime());
  }
  return out;
}

function humanize(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d}d`;
  return `${Math.round(d / 30)}mo`;
}

export function isDue(state: CardState, at = new Date()) {
  return new Date(state.due).getTime() <= at.getTime();
}
