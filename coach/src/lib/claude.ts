import "server-only";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readJson } from "./store";
import { DEFAULT_SETTINGS, type Settings } from "./types";
import { mockFor } from "./mock";

/**
 * Talks to the Claude Code CLI installed on this PC, in headless mode.
 * Uses the user's own Claude subscription (no API key).
 *   claude -p --output-format json --system-prompt-file <f> --tools "" --no-session-persistence
 * The user prompt is sent on stdin. Set COACH_MOCK=1 to use canned answers (for testing).
 */

export class ClaudeError extends Error {
  constructor(message: string, public hint?: string) {
    super(message);
  }
}

const TIMEOUT_MS = 240_000;

export function isMock() {
  return process.env.COACH_MOCK === "1";
}

async function runCli(system: string, prompt: string, model: string): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "coach-"));
  const sysFile = path.join(tmp, "system.txt");
  await fs.writeFile(sysFile, system, "utf8");

  const args = [
    "-p",
    "--output-format",
    "json",
    "--system-prompt-file",
    sysFile,
    "--tools",
    "",
    "--no-session-persistence",
  ];
  if (model) args.push("--model", model);

  const bin = process.env.CLAUDE_BIN || "claude";
  const isWin = process.platform === "win32";

  try {
    return await new Promise<string>((resolve, reject) => {
      const child = spawn(isWin ? `"${bin}"` : bin, isWin ? args.map((a) => (a === "" ? '""' : `"${a}"`)) : args, {
        shell: isWin, // claude.cmd on Windows needs a shell
        cwd: tmp, // keep Claude away from the repo files
        env: process.env,
      });
      let out = "";
      let err = "";
      const timer = setTimeout(() => {
        child.kill();
        reject(new ClaudeError("Claude took too long to answer (4 min).", "Try again, or pick a faster model in Settings."));
      }, TIMEOUT_MS);
      child.stdout.on("data", (d) => (out += d));
      child.stderr.on("data", (d) => (err += d));
      child.on("error", (e: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        if (e.code === "ENOENT")
          reject(new ClaudeError("Claude Code was not found on this PC.", "Install Claude Code and run `claude` once to log in."));
        else reject(new ClaudeError(e.message));
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code !== 0 && !out.trim()) {
          const msg = err.trim() || `claude exited with code ${code}`;
          const hint = /log ?in|auth|credential/i.test(msg) ? "Open a terminal, run `claude`, and log in." : undefined;
          reject(new ClaudeError(msg.slice(0, 500), hint));
        } else resolve(out);
      });
      child.stdin.write(prompt);
      child.stdin.end();
    });
  } finally {
    fs.rm(tmp, { recursive: true, force: true }).catch(() => undefined);
  }
}

function extractResultText(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if (parsed.is_error) throw new ClaudeError(String(parsed.result || "Claude returned an error"));
      if (typeof parsed.result === "string") return parsed.result;
    }
  } catch (e) {
    if (e instanceof ClaudeError) throw e;
  }
  return raw;
}

/** Pull the first JSON object/array out of a text answer (handles ```json fences). */
export function parseJsonLoose<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new ClaudeError("Claude's answer had no JSON in it.", "Try again.");
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1)) as T;
    }
  }
  throw new ClaudeError("Claude's JSON answer was cut off.", "Try again.");
}

export async function askClaudeText(kind: string, system: string, prompt: string): Promise<string> {
  if (isMock()) return JSON.stringify(mockFor(kind, prompt));
  const settings = { ...DEFAULT_SETTINGS, ...(await readJson<Partial<Settings>>("settings", {})) };
  const raw = await runCli(system, prompt, settings.model);
  return extractResultText(raw);
}

export async function askClaudeJson<T>(kind: string, system: string, prompt: string): Promise<T> {
  if (isMock()) return mockFor(kind, prompt) as T;
  const text = await askClaudeText(kind, system, prompt);
  try {
    return parseJsonLoose<T>(text);
  } catch (e) {
    // One retry asking for JSON only.
    const retry = await askClaudeText(kind, system, `${prompt}\n\nIMPORTANT: Reply with ONLY the JSON object, nothing else.`);
    try {
      return parseJsonLoose<T>(retry);
    } catch {
      throw e;
    }
  }
}
