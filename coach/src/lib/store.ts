import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

/** Repo root = parent of the coach/ app folder (override with COACH_ROOT). */
export const ROOT = process.env.COACH_ROOT
  ? path.resolve(process.env.COACH_ROOT)
  : path.resolve(process.cwd(), "..");

export const DATA_DIR = path.join(ROOT, "data");

export function rootPath(...parts: string[]) {
  const p = path.resolve(ROOT, ...parts);
  if (!p.startsWith(ROOT)) throw new Error("Path escapes repo root");
  return p;
}

// Serialize writes per file so two quick requests never corrupt a JSON file.
const queues = new Map<string, Promise<unknown>>();
function enqueue<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const prev = queues.get(file) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  queues.set(file, next.catch(() => undefined));
  return next;
}

export async function readJson<T>(name: string, fallback: T): Promise<T> {
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(name: string, value: T): Promise<void> {
  const file = path.join(DATA_DIR, `${name}.json`);
  await enqueue(file, async () => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2) + "\n", "utf8");
    await fs.rename(tmp, file);
  });
}

/** Read-modify-write under the same per-file lock. */
export async function updateJson<T>(name: string, fallback: T, fn: (v: T) => T | Promise<T>): Promise<T> {
  const file = path.join(DATA_DIR, `${name}.json`);
  return enqueue(file, async () => {
    let cur: T;
    try {
      cur = JSON.parse(await fs.readFile(file, "utf8")) as T;
    } catch {
      cur = fallback;
    }
    const next = await fn(cur);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 2) + "\n", "utf8");
    await fs.rename(tmp, file);
    return next;
  });
}

export async function readText(rel: string, fallback = ""): Promise<string> {
  try {
    return await fs.readFile(rootPath(rel), "utf8");
  } catch {
    return fallback;
  }
}

export async function writeText(rel: string, content: string): Promise<void> {
  const file = rootPath(rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, "utf8");
}

export async function listFiles(relDir: string, ext = ".md"): Promise<string[]> {
  try {
    const entries = await fs.readdir(rootPath(relDir));
    return entries.filter((e) => e.endsWith(ext)).sort();
  } catch {
    return [];
  }
}

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
