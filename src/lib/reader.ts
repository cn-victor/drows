"use client";
// Plays a poem: background music, then each segment in turn (sound effect → voice → pause),
// telling the page which lines to highlight. Uses the AI voice when available, otherwise the
// browser's own free voice.
import { playCue, startScape, unlockAudio } from "./audioEngine";
import type { Segment } from "./segments";
import type { Music } from "./sounds";
import { toneOf } from "./voice";

export type MusicHandle = { stop: () => void; setVolume: (v: number) => void };

/** Starts a poem's background sound (generated soundscape or the writer's uploaded music). */
export function startMusic(m: Music): MusicHandle | null {
  if (m.kind === "scape") return startScape(m.id, m.volume);
  if (m.kind === "upload") {
    const a = new Audio(`/api/uploads/${m.id}`);
    a.loop = true;
    a.volume = 0;
    void a.play().catch(() => {});
    let target = m.volume;
    const fade = window.setInterval(() => {
      a.volume = Math.min(target, a.volume + 0.04);
      if (a.volume >= target) window.clearInterval(fade);
    }, 80);
    return {
      setVolume: (v) => {
        target = v;
        a.volume = v;
      },
      stop: () => {
        window.clearInterval(fade);
        const out = window.setInterval(() => {
          a.volume = Math.max(0, a.volume - 0.05);
          if (a.volume <= 0) {
            window.clearInterval(out);
            a.pause();
          }
        }, 80);
      },
    };
  }
  return null;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  return voices.find((v) => /natural|online/i.test(v.name)) ?? voices.find((v) => /google|microsoft/i.test(v.name)) ?? voices[0];
}

export type ReaderOptions = {
  segments: Segment[];
  music: Music;
  /** Address of the AI recording for segment k; leave out to use the browser voice only. */
  aiUrl?: (k: number) => string;
  onLine: (blocks: number[] | null) => void;
  onVoice?: (kind: "ai" | "browser") => void;
  onDone: () => void;
};

export function createReader(o: ReaderOptions) {
  unlockAudio(); // must happen during the click that started reading
  let stopped = false;
  const wakers = new Set<() => void>();
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      const t = window.setTimeout(done, ms);
      function done() {
        window.clearTimeout(t);
        wakers.delete(done);
        resolve();
      }
      wakers.add(done);
    });

  const music = startMusic(o.music);
  let useAI = !!o.aiUrl;
  let current: HTMLAudioElement | null = null;
  const loads = new Map<number, Promise<string | null>>();

  // Fetches an AI recording (and remembers it so the next part can load while this one plays).
  const loadAI = (k: number) => {
    if (!o.aiUrl || k >= o.segments.length) return Promise.resolve(null);
    if (!loads.has(k)) {
      loads.set(
        k,
        fetch(o.aiUrl(k))
          .then(async (r) => {
            if (r.status === 501) useAI = false; // AI voice not switched on: use the browser voice
            return r.ok ? URL.createObjectURL(await r.blob()) : null;
          })
          .catch(() => null),
      );
    }
    return loads.get(k)!;
  };

  const playUrl = (url: string) =>
    new Promise<void>((resolve) => {
      const a = new Audio(url);
      current = a;
      const finish = () => {
        wakers.delete(finish);
        current = null;
        resolve();
      };
      a.onended = finish;
      a.onerror = finish;
      wakers.add(finish);
      void a.play().catch(finish);
    });

  const speak = async (seg: Segment) => {
    const tone = toneOf(seg.tone);
    for (const line of seg.text.split("\n")) {
      if (stopped || !line.trim()) continue;
      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance(line);
        u.voice = pickVoice() ?? null;
        u.rate = (tone?.rate ?? 0.92) * 0.95;
        u.pitch = tone?.pitch ?? 1;
        u.volume = seg.tone === "whisper" || seg.tone === "soft" ? 0.7 : 1;
        // Some browsers forget to say "finished"; don't wait forever.
        const guard = window.setTimeout(finish, 4000 + line.length * 150);
        function finish() {
          window.clearTimeout(guard);
          wakers.delete(finish);
          resolve();
        }
        u.onend = finish;
        u.onerror = finish;
        wakers.add(finish);
        speechSynthesis.speak(u);
      });
      if (!stopped) await sleep(250); // breath between lines
    }
  };

  const run = async () => {
    await sleep(music ? 1800 : 300); // let the music rise first
    for (let k = 0; k < o.segments.length && !stopped; k++) {
      const seg = o.segments[k];
      o.onLine(seg.blocks);
      if (seg.cue) {
        playCue(seg.cue);
        await sleep(700);
      }
      const url = useAI ? await loadAI(k) : null;
      void loadAI(k + 1);
      if (stopped) break;
      o.onVoice?.(url ? "ai" : "browser");
      if (url) await playUrl(url);
      else await speak(seg);
      if (seg.pauseAfter && !stopped) await sleep(seg.pauseAfter * 1000);
    }
    o.onLine(null);
    if (!stopped) await sleep(1500);
    music?.stop();
    loads.forEach((p) => p.then((u) => u && URL.revokeObjectURL(u)));
    if (!stopped) o.onDone();
  };
  void run();

  return {
    stop() {
      stopped = true;
      speechSynthesis.cancel();
      current?.pause();
      wakers.forEach((w) => w());
      music?.stop();
      o.onLine(null);
    },
  };
}
