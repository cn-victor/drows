"use client";
import { useEffect, useRef, useState } from "react";
import { SpeakerIcon, WaveformIcon } from "./icons";
import { startMusic, type MusicHandle } from "@/lib/reader";
import type { Music } from "@/lib/sounds";

// In a feed, only one poem plays at a time: the one most in view. This remembers who's playing.
let owner: symbol | null = null;
const stoppers = new Map<symbol, () => void>();
const MUTE_KEY = "drows:muted";
const MUTE_EVENT = "drows:mute";

const isMuted = () => localStorage.getItem(MUTE_KEY) === "1";
const hasTapped = () => {
  const a = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return !a || a.hasBeenActive;
};

/** A feed post's sound: plays by itself while the post is on screen (after the reader's first tap
 *  on the site, which phones require), stops when it scrolls away. Shows the sound's name with a
 *  speaker button that mutes every poem (remembered on this device). */
export default function AutoSound({ music, label, color, className = "" }: { music: Music; label: string; color?: string; className?: string }) {
  const me = useRef(Symbol("sound"));
  const handle = useRef<MusicHandle | null>(null);
  const el = useRef<HTMLButtonElement>(null);
  const visible = useRef(false);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const id = me.current;
    const stop = () => {
      handle.current?.stop();
      handle.current = null;
      setPlaying(false);
      if (owner === id) owner = null;
    };
    const play = () => {
      if (isMuted() || !visible.current || handle.current) return;
      if (owner && owner !== id) stoppers.get(owner)?.();
      owner = id;
      handle.current = startMusic(music);
      setPlaying(!!handle.current);
    };
    stoppers.set(id, stop);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(isMuted());

    // The whole post counts, not just this button.
    const post = el.current?.closest("article") ?? el.current;
    if (!post) return;
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        if (e.isIntersecting && hasTapped()) play();
        else if (!e.isIntersecting) stop();
      },
      { threshold: 0.6 },
    );
    io.observe(post);
    const firstTap = () => play(); // phones: sound may only start after a tap
    document.addEventListener("pointerdown", firstTap, { capture: true, once: true });
    const onMute = () => {
      const m = isMuted();
      setMuted(m);
      if (m) stop();
      else play();
    };
    window.addEventListener(MUTE_EVENT, onMute);
    return () => {
      io.disconnect();
      document.removeEventListener("pointerdown", firstTap, { capture: true });
      window.removeEventListener(MUTE_EVENT, onMute);
      stop();
      stoppers.delete(id);
    };
  }, [music]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem(MUTE_KEY, muted ? "0" : "1");
    window.dispatchEvent(new Event(MUTE_EVENT));
  };

  return (
    <button
      ref={el}
      onClick={toggle}
      aria-label={muted ? `Turn sound on (${label})` : `Mute sound (${label})`}
      className={`flex min-w-0 items-center gap-1 rounded-full text-[13px] ${className}`}
      style={{ color, fontFamily: "var(--font-modern)" }}
    >
      <SpeakerIcon size={14} muted={muted} className="shrink-0" />
      {playing ? <WaveformIcon size={10} className="shrink-0 animate-pulse" /> : null}
      <span className="truncate">{label}</span>
    </button>
  );
}
