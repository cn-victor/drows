"use client";
import { useEffect, useRef, useState } from "react";
import { SpeakerIcon } from "./icons";
import { createReader, startMusic, type MusicHandle } from "@/lib/reader";
import type { Segment } from "@/lib/segments";
import { SOUNDSCAPES, type Music } from "@/lib/sounds";

/** The "Listen" button on a published poem: music + AI reader, highlighting each line as it's read.
 *  With `autoMusic`, the poem's sound starts by itself when the poem is on screen. Phones and browsers
 *  only allow sound after the reader has tapped the site once, so until then it waits for that tap.
 *  The speaker button mutes it, and the choice is remembered on this device. */
type Props = {
  poemId: string;
  segments: Segment[];
  music: Music;
  align: string;
  /** Where the poem's lines are (for highlighting). Defaults to the page's poem. */
  rootSelector?: string;
  /** When this turns false (e.g. the reader swiped away), any sound stops. */
  active?: boolean;
  /** Start the poem's sound automatically. */
  autoMusic?: boolean;
  /** Light text on a dark screen (the full-screen phone view). */
  onDark?: boolean;
};

const MUTE_KEY = "drows:muted";

export default function PoemPlayer({ poemId, segments, music, align, rootSelector = "[data-poem]", active = true, autoMusic = false, onDark = false }: Props) {
  const [mode, setMode] = useState<"idle" | "reading" | "music">("idle");
  const [voice, setVoice] = useState<"ai" | "browser" | null>(null);
  const [muted, setMuted] = useState(false);
  const reader = useRef<ReturnType<typeof createReader> | null>(null);
  const musicOnly = useRef<MusicHandle | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const hasMusic = music.kind !== "none";

  const stopAll = () => {
    reader.current?.stop();
    reader.current = null;
    musicOnly.current?.stop();
    musicOnly.current = null;
    setMode("idle");
  };
  const startSound = () => {
    if (musicOnly.current || reader.current) return;
    musicOnly.current = startMusic(music);
    if (musicOnly.current) setMode("music");
  };

  useEffect(() => () => stopAll(), []); // stop sound when leaving the page
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!active) stopAll();
  }, [active]);

  // Play the sound by itself when the poem is showing (only the copy of the player that's on screen).
  useEffect(() => {
    if (!autoMusic || !hasMusic || !active) return;
    const isMuted = localStorage.getItem(MUTE_KEY) === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(isMuted);
    if (isMuted || !box.current?.offsetParent) return;
    const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (!activation || activation.hasBeenActive) {
      startSound();
      return;
    }
    // Not tapped yet: start on the first tap or key press anywhere.
    const cleanup = () => {
      document.removeEventListener("pointerdown", once, true);
      document.removeEventListener("keydown", once, true);
    };
    function once() {
      if (localStorage.getItem(MUTE_KEY) !== "1") startSound();
      cleanup();
    }
    document.addEventListener("pointerdown", once, true);
    document.addEventListener("keydown", once, true);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMusic, hasMusic, active]);

  const highlight = (blocks: number[] | null) => {
    const root = document.querySelector(rootSelector);
    root?.querySelectorAll(".reading-now").forEach((el) => el.classList.remove("reading-now"));
    blocks?.forEach((i) => root?.querySelector(`[data-i="${i}"]`)?.classList.add("reading-now"));
    const first = blocks?.length ? root?.querySelector(`[data-i="${blocks[0]}"]`) : null;
    // "nearest" keeps the page still; on cards this brings the right card into view
    first?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  function listen() {
    if (mode === "reading") {
      stopAll();
      if (autoMusic && !muted) startSound();
      return;
    }
    stopAll(); // the reader brings its own music
    setMode("reading");
    reader.current = createReader({
      segments,
      music: muted ? { kind: "none", volume: 0 } : music,
      aiUrl: (k) => `/api/poems/${poemId}/voice/${k}`,
      onLine: highlight,
      onVoice: setVoice,
      onDone: () => {
        reader.current = null;
        setMode("idle");
        if (autoMusic && !muted) startSound();
      },
    });
  }

  function toggleMusic() {
    if (autoMusic) {
      const next = !muted;
      setMuted(next);
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      if (next) {
        if (mode === "music") stopAll();
      } else if (mode === "idle") startSound();
      return;
    }
    if (mode !== "idle") return stopAll();
    startSound();
  }

  const musicName = music.kind === "scape" ? SOUNDSCAPES.find((s) => s.id === music.id)?.label : music.kind === "upload" ? music.name : null;
  const justify = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  const pill = "rounded-full px-4 py-2 text-sm font-medium transition";
  const soundOn = mode === "music";

  return (
    <div ref={box} className={`flex flex-wrap items-center gap-2 ${justify}`}>
      <button
        onClick={listen}
        className={`${pill} hover:opacity-90`}
        style={onDark ? { background: "rgba(255,255,255,0.16)", color: "#fff" } : { background: "var(--poem-accent)", color: "var(--poem-on-accent)" }}
      >
        {mode === "reading" ? "■ Stop" : "▶ Listen"}
      </button>
      {musicName && mode !== "reading" && (
        <button
          onClick={toggleMusic}
          aria-label={autoMusic ? (muted ? "Turn sound on" : "Mute sound") : soundOn ? "Stop music" : "Play music"}
          className={`${pill} flex min-w-0 items-center gap-1.5 ring-1 ${onDark ? "text-white ring-white/30" : "ring-current/30"} hover:bg-white/10`}
        >
          {autoMusic ? (
            <>
              <SpeakerIcon size={18} muted={muted} />
              <span className="truncate">♫ {musicName}</span>
            </>
          ) : soundOn ? (
            "■ Stop music"
          ) : (
            `♫ ${musicName}`
          )}
        </button>
      )}
      {mode === "reading" && voice && (
        <span className="text-xs" style={{ color: onDark ? "rgba(255,255,255,0.7)" : "var(--poem-muted)" }}>
          {voice === "ai" ? "AI voice" : "Browser voice (AI voice not switched on yet)"}
        </span>
      )}
    </div>
  );
}
