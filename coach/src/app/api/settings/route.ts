import { body, handler } from "@/lib/api";
import { getSettings } from "@/lib/data";
import { writeJson } from "@/lib/store";
import type { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handler(async () => getSettings());

export const PUT = handler(async (req: Request) => {
  const patch = await body<Partial<Settings>>(req);
  const next = { ...(await getSettings()), ...patch };
  await writeJson("settings", next);
  return next;
});
