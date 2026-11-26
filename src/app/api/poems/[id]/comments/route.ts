// The replies under a poem (for the Reels screen's replies sheet).
import { commentsOn } from "@/server/social";

export async function GET(_req: Request, ctx: RouteContext<"/api/poems/[id]/comments">) {
  const { id } = await ctx.params;
  return Response.json({ comments: await commentsOn(id) });
}
