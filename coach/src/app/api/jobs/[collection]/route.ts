import { body, handler } from "@/lib/api";
import { newId, readJson, today, updateJson } from "@/lib/store";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["applications", "contacts"]);
type Item = { id: string } & Record<string, unknown>;
type Ctx = { params: Promise<{ collection: string }> };

async function name(ctx: Ctx) {
  const { collection } = await ctx.params;
  if (!ALLOWED.has(collection)) throw new Error("Unknown collection");
  return collection;
}

export const GET = handler(async (_req: Request, ctx: Ctx) => readJson<Item[]>(await name(ctx), []));

export const POST = handler(async (req: Request, ctx: Ctx) => {
  const col = await name(ctx);
  const item = { ...(await body<Record<string, unknown>>(req)), id: newId(col.slice(0, 3)), createdAt: today(), updatedAt: today() } as Item;
  await updateJson<Item[]>(col, [], (l) => [...l, item]);
  return item;
});

export const PUT = handler(async (req: Request, ctx: Ctx) => {
  const col = await name(ctx);
  const patch = await body<Item>(req);
  let out: Item | undefined;
  await updateJson<Item[]>(col, [], (l) =>
    l.map((x) => {
      if (x.id !== patch.id) return x;
      out = { ...x, ...patch, updatedAt: today() };
      return out;
    }),
  );
  return out ?? { error: "not found" };
});

export const DELETE = handler(async (req: Request, ctx: Ctx) => {
  const col = await name(ctx);
  const id = new URL(req.url).searchParams.get("id");
  await updateJson<Item[]>(col, [], (l) => l.filter((x) => x.id !== id));
  return { ok: true };
});
