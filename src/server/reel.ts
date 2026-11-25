// Prepares poems for the full-screen swipe viewer: each poem's slides as HTML, its reading parts,
// counts, and whether the viewer already follows the writer.
import "server-only";
import { renderSlides, type Poem } from "@/lib/poem";
import { buildSegments } from "@/lib/segments";
import { all } from "./db";

export type ReelPoem = Omit<Poem, "doc"> & {
  slides: string[];
  segments: ReturnType<typeof buildSegments>;
  following: boolean;
};

export async function toReel(poems: Poem[], viewerId: string | null): Promise<ReelPoem[]> {
  const authorIds = [...new Set(poems.map((p) => p.authorId).filter(Boolean))] as string[];
  let followed = new Set<string>();
  if (viewerId && authorIds.length) {
    const rows = await all(
      `SELECT followee_id FROM follows WHERE follower_id = ? AND followee_id IN (${authorIds.map(() => "?").join(",")})`,
      [viewerId, ...authorIds],
    );
    followed = new Set(rows.map((r) => String(r.followee_id)));
  }
  return poems.map(({ doc, ...p }) => ({
    ...p,
    slides: renderSlides(doc, p.style),
    segments: buildSegments(doc),
    following: !!p.authorId && followed.has(p.authorId),
  }));
}
