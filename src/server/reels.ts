// What the Reels screen needs for each poem (sent to the browser as plain data).
import "server-only";
import { renderDoc, renderSlides, type Poem } from "@/lib/poem";
import type { ReelPoem } from "@/lib/reel";
import { buildSegments } from "@/lib/segments";

export function toReel(p: Poem): ReelPoem {
  const slides = p.style.layout === "slides";
  return {
    id: p.id,
    title: p.title,
    author: p.author,
    authorId: p.authorId,
    username: p.username,
    caption: p.caption,
    createdAt: p.createdAt,
    style: p.style,
    likes: p.likes,
    reposts: p.reposts,
    gifts: p.gifts,
    comments: p.comments,
    liked: p.liked,
    reposted: p.reposted,
    saved: !!p.saved,
    authorHasWallet: !!p.authorHasWallet,
    slides: slides ? renderSlides(p.doc, p.style) : null,
    pageHtml: slides ? "" : renderDoc(p.doc),
    segments: buildSegments(p.doc),
  };
}
