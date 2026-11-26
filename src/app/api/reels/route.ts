// More poems for the Reels screen as the reader swipes up.
import { currentUser } from "@/server/auth";
import { reelPoems } from "@/server/poems";
import { toReel } from "@/server/reels";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") === "friends" ? "friends" : "reels";
  const before = Number(url.searchParams.get("before")) || Date.now() + 1;
  const exclude = url.searchParams.get("exclude") ?? "";
  const me = await currentUser();
  if (tab === "friends" && !me) return Response.json({ items: [], login: true });
  const poems = await reelPoems(me?.id ?? null, tab, before, exclude);
  return Response.json({ items: poems.map(toReel) });
}
