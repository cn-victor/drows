"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { startMusic, type MusicHandle } from "@/lib/reader";
import type { PoemStyle } from "@/lib/poem";
import { SOUNDSCAPES, type Music } from "@/lib/sounds";
import { READING_STYLES, VOICES } from "@/lib/voice";

const label = "text-xs font-semibold uppercase tracking-wider text-muted";
const chip = "rounded-full px-3 py-1.5 text-sm ring-1 ring-black/10 transition hover:bg-black/5";
const chipOn = "bg-ink text-paper ring-ink hover:bg-ink";

/** Side panel tab: background sound or music, and the AI reader's voice. */
export default function SoundPanel({ style, onChange, children }: { style: PoemStyle; onChange: (s: PoemStyle) => void; children?: ReactNode }) {
  const music = style.music;
  const setMusic = (m: Music) => onChange({ ...style, music: m });
  const [trying, setTrying] = useState(false);
  const handle = useRef<MusicHandle | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rights, setRights] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const stopTrying = () => {
    handle.current?.stop();
    handle.current = null;
    setTrying(false);
  };
  useEffect(() => () => handle.current?.stop(), []);
  // Restart the preview when the chosen sound changes; follow the volume slider live.
  const musicKey = music.kind === "none" ? "none" : `${music.kind}:${music.id}`;
  useEffect(() => {
    if (!handle.current) return;
    handle.current.stop();
    handle.current = startMusic(music);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicKey]);
  useEffect(() => {
    handle.current?.setVolume(music.volume);
  }, [music.volume]);

  async function upload(file: File) {
    setUploadError("");
    setUploading(true);
    const form = new FormData();
    form.set("file", file);
    form.set("rights", rights ? "yes" : "no");
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMusic({ kind: "upload", id: data.id, name: data.name, volume: music.volume });
    } catch (e) {
      setUploadError(e instanceof Error && e.message ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className={label}>Background sound</h2>
        <div className="flex flex-wrap gap-1.5">
          <button className={`${chip} ${music.kind === "none" ? chipOn : ""}`} onClick={() => { stopTrying(); setMusic({ kind: "none", volume: music.volume }); }}>
            Silence
          </button>
          {SOUNDSCAPES.map((s) => (
            <button
              key={s.id}
              className={`${chip} ${music.kind === "scape" && music.id === s.id ? chipOn : ""}`}
              onClick={() => setMusic({ kind: "scape", id: s.id, volume: music.volume })}
            >
              {s.label}
            </button>
          ))}
          {music.kind === "upload" && <span className={`${chip} ${chipOn}`}>♫ {music.name}</span>}
        </div>

        {music.kind !== "none" && (
          <div className="mt-1 flex items-center gap-3">
            <button
              onClick={() => {
                if (trying) return stopTrying();
                handle.current = startMusic(music);
                setTrying(true);
              }}
              className="rounded-full bg-ink px-3 py-1.5 text-sm text-paper"
            >
              {trying ? "■ Stop" : "▶ Try it"}
            </button>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={music.volume}
              onChange={(e) => setMusic({ ...music, volume: Number(e.target.value) })}
              className="flex-1 accent-[var(--accent)]"
              aria-label="Background volume"
            />
          </div>
        )}

        <details className="mt-2 rounded-xl bg-black/[0.03] p-3 text-sm" open={music.kind === "upload"}>
          <summary className="cursor-pointer font-medium">Use your own music</summary>
          <label className="mt-3 flex items-start gap-2 text-muted">
            <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-1" />
            <span>I made this music, or I have permission to use it. (Songs you don&apos;t own can get the poem taken down.)</span>
          </label>
          <input
            ref={fileInput}
            type="file"
            accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav"
            disabled={!rights || uploading}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            className="mt-3 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-paper disabled:opacity-40"
          />
          <p className="mt-2 text-xs text-muted">{uploading ? "Uploading…" : "MP3, M4A, OGG or WAV, up to 15 MB."}</p>
          {uploadError && <p className="mt-1 text-xs text-red-700">{uploadError}</p>}
        </details>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={label}>Reader voice</h2>
        <select
          value={style.voice}
          onChange={(e) => onChange({ ...style, voice: e.target.value })}
          className="rounded-xl bg-white/70 px-3 py-2 text-sm ring-1 ring-black/10"
        >
          {VOICES.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={label}>Reading style</h2>
        <div className="flex flex-wrap gap-1.5">
          {READING_STYLES.map((r) => (
            <button key={r.id} className={`${chip} ${style.reading === r.id ? chipOn : ""}`} onClick={() => onChange({ ...style, reading: r.id })}>
              {r.label}
            </button>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Set the tone of single lines with the <b>This line</b> bar above your poem: whisper, sad, joyful, a pause, or a sound effect.
        </p>
      </section>

      {children && (
        <section className="flex flex-col gap-2 border-t border-black/10 pt-5">
          <h2 className={label}>Hear it</h2>
          {children}
        </section>
      )}
    </div>
  );
}
