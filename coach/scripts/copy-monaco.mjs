// Copies Monaco (the VS Code editor) into public/ so the Coding Studio works offline, without a CDN.
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules", "monaco-editor", "min", "vs");
const dest = path.join(root, "public", "monaco", "vs");
if (!existsSync(src)) {
  console.warn("[copy-monaco] monaco-editor not installed yet, skipping");
  process.exit(0);
}
rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log("[copy-monaco] Monaco copied to public/monaco/vs");
