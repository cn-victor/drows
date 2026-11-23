"use client";
import { useEffect, useRef, useState } from "react";
import { createReader } from "@/lib/reader";
import type { DocNode, PoemStyle } from "@/lib/poem";
import { buildSegments } from "@/lib/segments";

/** In the editor: plays the poem with its music, effects and pauses, using the free browser voice.
 *  (The AI voice plays on the published page, where each recording is saved once.) */
export default function PreviewReader({ getDoc, style }: { getDoc: () => DocNode; style: PoemStyle }) {
  const [playing, setPlaying] = useState(false);
  const reader = useRef<ReturnType<typeof createReader> | null>(null);

  useEffect(() => () => reader.current?.stop(), []);

  // The editor undoes outside changes to its lines, so the highlight is a separate layer drawn over them.
  const highlight = (blocks: number[] | null) => {
    const wrap = document.querySelector<HTMLElement>(".poem-body");
    const root = wrap?.querySelector(".ProseMirror");
    if (!wrap || !root) return;
    let layer = wrap.querySelector<HTMLElement>(":scope > .reading-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "reading-layer reading-now";
      wrap.style.position = "relative";
      wrap.prepend(layer);
    }
    const els = (blocks ?? []).map((i) => root.children[i]).filter(Boolean);
    if (!els.length) {
      layer.style.opacity = "0";
      return;
    }
    const box = wrap.getBoundingClientRect();
    const first = els[0].getBoundingClientRect();
    const last = els[els.length - 1].getBoundingClientRect();
    Object.assign(layer.style, {
      position: "absolute",
      pointerEvents: "none",
      left: "0",
      right: "0",
      top: `${first.top - box.top}px`,
      height: `${last.bottom - first.top}px`,
      opacity: "1",
      transition: "top .4s, height .4s, opacity .4s",
    });
    els[0].scrollIntoView({ behavior: "smooth", block: "center" });
  };

  function toggle() {
    if (playing) {
      reader.current?.stop();
      reader.current = null;
      return setPlaying(false);
    }
    setPlaying(true);
    reader.current = createReader({
      segments: buildSegments(getDoc()),
      music: style.music,
      onLine: highlight,
      onDone: () => setPlaying(false),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={toggle} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90">
        {playing ? "■ Stop" : "▶ Preview the reading"}
      </button>
      <p className="text-xs leading-relaxed text-muted">
        The preview uses your browser&apos;s free voice. Readers of your published poem hear the AI voice you picked, with its tones.
      </p>
    </div>
  );
}
