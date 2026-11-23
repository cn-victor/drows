// Splits a poem into "segments" for the reader: runs of lines read in the same tone.
// A new segment starts when the tone changes, a line has a sound effect, or after a stanza / pause.
import { lineText, type DocNode } from "./poem";
import { pauseSeconds } from "./voice";

export type Segment = {
  blocks: number[]; // which lines (data-i) this segment covers, for highlighting
  text: string;
  tone: string | null;
  cue: string | null; // sound effect played as the segment starts
  pauseAfter: number; // seconds of silence after it
};

const MAX_SEGMENTS = 60;
const MAX_CHARS = 700;
const STANZA_PAUSE = 0.8;

export function buildSegments(doc: DocNode): Segment[] {
  const segs: Segment[] = [];
  let open: Segment | null = null;
  const close = (pause = 0) => {
    const last = open ?? segs[segs.length - 1];
    if (last) last.pauseAfter = Math.max(last.pauseAfter, pause);
    open = null;
  };

  (doc.content ?? []).forEach((block, i) => {
    if (block.type === "horizontalRule") return close(1.5);
    const text = lineText(block).trim();
    if (!text) return close(STANZA_PAUSE);

    const tone = (block.attrs?.tone as string) ?? null;
    const cue = (block.attrs?.sound as string) ?? null;
    const sameRun = open && open.tone === tone && !cue && open.text.length + text.length < MAX_CHARS;
    const tooMany = open && segs.length >= MAX_SEGMENTS; // very long poems: keep adding to the last segment
    const fits = sameRun || tooMany;
    if (fits && open) {
      open.blocks.push(i);
      open.text += "\n" + text;
    } else {
      open = { blocks: [i], text, tone, cue, pauseAfter: 0 };
      segs.push(open);
    }
    const pause = pauseSeconds(block.attrs?.pause as string);
    if (pause) close(pause);
  });
  return segs;
}
