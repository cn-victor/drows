import type { PoemStyle } from "./poem";
import type { Segment } from "./segments";

/** One poem on the Reels screen. */
export type ReelPoem = {
  id: string;
  title: string;
  author: string;
  authorId: string | null;
  username: string | null;
  caption: string;
  createdAt: number;
  style: PoemStyle;
  likes: number;
  reposts: number;
  gifts: number;
  comments: number;
  liked: boolean;
  reposted: boolean;
  saved: boolean;
  authorHasWallet: boolean;
  slides: string[] | null; // picture cards, or null for a single-page poem
  pageHtml: string; // the whole poem (single-page poems)
  segments: Segment[];
};

export type ReelViewer = { id: string; username: string; name: string; walletAddress: string | null } | null;
