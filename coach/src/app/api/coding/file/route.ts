import { body, handler } from "@/lib/api";
import { getExercise } from "@/lib/coding";
import { touchSession } from "@/lib/data";
import { readText, writeText } from "@/lib/store";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  const ex = await getExercise(new URL(req.url).searchParams.get("id") ?? "");
  return { code: await readText(ex.file, "") };
});

export const PUT = handler(async (req: Request) => {
  const { id, code } = await body<{ id: string; code: string }>(req);
  const ex = await getExercise(id);
  await writeText(ex.file, code);
  await touchSession();
  return { ok: true };
});
