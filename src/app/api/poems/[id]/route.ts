import { deletePoem, updatePoem } from "@/server/db";
import { readPoemInput } from "@/server/validate";

export async function PUT(req: Request, ctx: RouteContext<"/api/poems/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const input = readPoemInput(body);
  if ("error" in input) return Response.json({ error: input.error }, { status: 400 });
  const ok = await updatePoem(id, String(body?.editKey ?? ""), input);
  if (!ok) return Response.json({ error: "You can only edit poems you wrote on this device." }, { status: 403 });
  return Response.json({ id });
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/poems/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const ok = await deletePoem(id, String(body?.editKey ?? ""));
  if (!ok) return Response.json({ error: "You can only delete poems you wrote on this device." }, { status: 403 });
  return Response.json({ ok: true });
}
