"use client";
import { useEffect, useRef, useState } from "react";
import { createReader, startMusic, type MusicHandle } from "@/lib/reader";
import type { Segment } from "@/lib/segments";
import { SOUNDSCAPES, type Music } from "@/lib/sounds";

/** The "Listen" button on a published poem: music + AI reader, highlighting each line as it's read. */
export default function PoemPlayer({ poemId, segments, music, align }: { poemId: string; segments: Segment[]; music: Music; align: string }) {
  const [mode, setMode] = useState<"idle" | "reading" | "music">("idle");
  const [voice, setVoice] = useState<"ai" | "browser" | null>(null);
  const reader = useRef<ReturnType<typeof createReader> | null>(null);
  const musicOnly = useRef<MusicHandle | null>(null);

  const stopAll = () => {
    reader.current?.stop();
    reader.current = null;
    musicOnly.current?.stop();
    musicOnly.current = null;
    setMode("idle");
  };
  useEffect(() => () => stopAll(), []); // stop sound when leaving the page

  const highlight = (blocks: number[] | null) => {
    const root = document.querySelector("[data-poem]");
    root?.querySelectorAll(".reading-now").forEach((el) => el.classList.remove("reading-now"));
    blocks?.forEach((i) => root?.querySelector(`[data-i="${i}"]`)?.classList.add("reading-now"));
    const first = blocks?.length ? root?.querySelector(`[data-i="${blocks[0]}"]`) : null;
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  function listen() {
    if (mode !== "idle") return stopAll();
    setMode("reading");
    reader.current = createReader({
      segments,
      music,
      aiUrl: (k) => `/api/poems/${poemId}/voice/${k}`,
      onLine: highlight,
      onVoice: setVoice,
      onDone: () => setMode("idle"),
    });
  }

  function playMusicOnly() {
    if (mode !== "idle") return stopAll();
    musicOnly.current = startMusic(music);
    setMode("music");
  }

  const musicName = music.kind === "scape" ? SOUNDSCAPES.find((s) => s.id === music.id)?.label : music.kind === "upload" ? music.name : null;
  const justify = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  const pill = "rounded-full px-4 py-2 text-sm font-medium transition";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${justify}`}>
      <button onClick={listen} className={`${pill} hover:opacity-90`} style={{ background: "var(--poem-accent)", color: "var(--poem-on-accent)" }}>
        {mode === "reading" ? "■ Stop" : "▶ Listen"}
      </button>
      {musicName && mode !== "reading" && (
        <button onClick={playMusicOnly} className={`${pill} ring-1 ring-current/30 hover:bg-white/10`}>
          {mode === "music" ? "■ Stop music" : `♫ ${musicName}`}
        </button>
      )}
      {mode === "reading" && voice && (
        <span className="text-xs" style={{ color: "var(--poem-muted)" }}>
          {voice === "ai" ? "AI voice" : "Browser voice (AI voice not switched on yet)"}
        </span>
      )}
    </div>
  );
}
