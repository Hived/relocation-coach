import { handler } from "@/lib/api";
import { readText } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Reads jobs/sponsors/targets.csv produced by the Python sponsor scripts. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export const GET = handler(async () => {
  const [targets, jobs] = await Promise.all([readText("jobs/sponsors/targets.csv"), readText("jobs/finder/new_jobs.csv")]);
  const toObjects = (csv: string) => {
    const rows = parseCsv(csv);
    if (rows.length < 2) return [];
    const [head, ...rest] = rows;
    return rest.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
  };
  return { targets: toObjects(targets), jobs: toObjects(jobs) };
});
