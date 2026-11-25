// Edit or delete one poem.
import { currentUser } from "@/server/auth";
import { deletePoem, updatePoem } from "@/server/poems";
import { readPoemInput } from "@/server/validate";

export async function PUT(req: Request, ctx: RouteContext<"/api/poems/[id]">) {
  const me = await currentUser();
  if (!me) return Response.json({ error: "Please log in again." }, { status: 401 });
  const { id } = await ctx.params;
  const input = readPoemInput(await req.json().catch(() => null));
  if ("error" in input) return Response.json({ error: input.error }, { status: 400 });
  if (!(await updatePoem(id, me.id, input))) return Response.json({ error: "You can only edit your own poems." }, { status: 403 });
  return Response.json({ id });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/poems/[id]">) {
  const me = await currentUser();
  if (!me) return Response.json({ error: "Please log in again." }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await deletePoem(id, me.id))) return Response.json({ error: "You can only delete your own poems." }, { status: 403 });
  return Response.json({ ok: true });
}
