"use client";

export class ApiError extends Error {
  constructor(message: string, public hint?: string) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data && typeof data === "object" && "error" in data && data.error)) {
    throw new ApiError((data as { error?: string }).error || `Request failed (${res.status})`, (data as { hint?: string }).hint);
  }
  return data as T;
}

export async function celebrate(big = false) {
  const confetti = (await import("canvas-confetti")).default;
  confetti({ particleCount: big ? 180 : 70, spread: big ? 100 : 60, origin: { y: 0.7 }, colors: ["#8b5cf6", "#22d3ee", "#34d399", "#fbbf24"] });
}
