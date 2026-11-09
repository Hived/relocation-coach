import "server-only";
import { NextResponse } from "next/server";
import { ClaudeError } from "./claude";

/** Wrap a route handler: JSON errors with a friendly hint. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  return async (...args: A) => {
    try {
      const out = await fn(...args);
      return out instanceof Response ? out : NextResponse.json(out ?? { ok: true });
    } catch (e) {
      const err = e as Error;
      const hint = e instanceof ClaudeError ? e.hint : undefined;
      console.error("[coach]", err);
      return NextResponse.json({ error: err.message || "Something went wrong", hint }, { status: 500 });
    }
  };
}

export async function body<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
