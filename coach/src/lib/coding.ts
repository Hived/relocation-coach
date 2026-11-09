import "server-only";
import { spawn } from "node:child_process";
import { readText, rootPath } from "./store";

export interface Exercise {
  id: string;
  week: number;
  title: string;
  lessonId: string;
  difficulty: "easy" | "medium" | "hard";
  file: string; // relative to repo root, e.g. coding/Exercises/Week01/SumOfArray.cs
  testFilter: string; // e.g. Week01.SumOfArrayTests
  description: string; // markdown
}

export async function loadExercises(): Promise<Exercise[]> {
  const raw = await readText("coding/exercises.json", "[]");
  return JSON.parse(raw) as Exercise[];
}

export async function getExercise(id: string) {
  const ex = (await loadExercises()).find((e) => e.id === id);
  if (!ex) throw new Error(`Unknown exercise ${id}`);
  if (!ex.file.startsWith("coding/") || ex.file.includes("..")) throw new Error("Bad exercise path");
  return ex;
}

export interface TestResult {
  ok: boolean;
  passed: number;
  failed: number;
  tests: { name: string; outcome: "Passed" | "Failed" | "Skipped"; message?: string }[];
  compileErrors: string[];
  output: string;
  missingDotnet?: boolean;
}

export function runTests(filter: string): Promise<TestResult> {
  return new Promise((resolve) => {
    const args = [
      "test",
      rootPath("coding/Exercises.Tests"),
      "--filter",
      `FullyQualifiedName~${filter}`,
      "--logger",
      "console;verbosity=normal",
      "--nologo",
    ];
    const child = spawn("dotnet", args, { cwd: rootPath("coding"), shell: process.platform === "win32", env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: "1", DOTNET_NOLOGO: "1" } });
    let out = "";
    const timer = setTimeout(() => child.kill(), 300_000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("error", (e: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        passed: 0,
        failed: 0,
        tests: [],
        compileErrors: [],
        output: e.code === "ENOENT" ? "The .NET SDK (dotnet) was not found. Install .NET 8 SDK or newer." : e.message,
        missingDotnet: e.code === "ENOENT",
      });
    });
    child.on("close", () => {
      clearTimeout(timer);
      resolve(parse(out));
    });
  });
}

function parse(out: string): TestResult {
  const lines = out.split(/\r?\n/);
  const tests: TestResult["tests"] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(Passed|Failed|Skipped)\s+([\w.<>`+\-[\](), ="']+?)(?:\s+\[[^\]]*\])?\s*$/);
    if (!m) continue;
    const outcome = m[1] as "Passed" | "Failed" | "Skipped";
    const name = m[2].split(".").slice(-1)[0].replace(/_/g, " ");
    let message: string | undefined;
    if (outcome === "Failed") {
      const msg: string[] = [];
      for (let j = i + 1; j < Math.min(lines.length, i + 14); j++) {
        if (/^\s*(Passed|Failed|Skipped)\s/.test(lines[j]) || /Stack Trace:/i.test(lines[j])) break;
        if (lines[j].trim() && !/Error Message:/i.test(lines[j])) msg.push(lines[j].trim());
      }
      message = msg.join("\n");
    }
    tests.push({ name, outcome, message });
  }
  const compileErrors = Array.from(
    new Set(
      lines
        .filter((l) => /error CS\d+/.test(l))
        .map((l) => l.replace(/\[.*?\.csproj\]\s*$/, "").replace(/^.*?coding[\\/]/, "").trim()),
    ),
  ).slice(0, 15);
  const passed = tests.filter((t) => t.outcome === "Passed").length;
  const failed = tests.filter((t) => t.outcome === "Failed").length;
  return {
    ok: compileErrors.length === 0 && failed === 0 && passed > 0,
    passed,
    failed,
    tests,
    compileErrors,
    output: out.split(/\r?\n/).slice(-60).join("\n"),
  };
}
