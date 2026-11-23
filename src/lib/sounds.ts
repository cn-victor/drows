// Sounds the platform makes itself (no recordings, so no copyright worries).
// Background "soundscapes" loop behind a poem; "cues" are short effects attached to a line.

export const SOUNDSCAPES = [
  { id: "rain", label: "Rain" },
  { id: "ocean", label: "Ocean waves" },
  { id: "wind", label: "Wind" },
  { id: "fire", label: "Crackling fire" },
  { id: "night", label: "Night crickets" },
  { id: "dream", label: "Dreamy pads (music)" },
  { id: "musicbox", label: "Music box (music)" },
  { id: "piano", label: "Slow piano (music)" },
] as const;

export const CUES = [
  { id: "chime", label: "Chime" },
  { id: "bell", label: "Church bell" },
  { id: "heartbeat", label: "Heartbeat" },
  { id: "thunder", label: "Thunder" },
  { id: "whoosh", label: "Whoosh" },
  { id: "birds", label: "Birdsong" },
  { id: "clock", label: "Clock ticking" },
  { id: "page", label: "Page turn" },
] as const;

export type ScapeId = (typeof SOUNDSCAPES)[number]["id"];
export type CueId = (typeof CUES)[number]["id"];

export const SCAPE_IDS = new Set<string>(SOUNDSCAPES.map((s) => s.id));
export const CUE_IDS = new Set<string>(CUES.map((c) => c.id));

/** Background sound for a poem. "upload" means the writer's own music file. */
export type Music =
  | { kind: "none"; volume: number }
  | { kind: "scape"; id: ScapeId; volume: number }
  | { kind: "upload"; id: string; name: string; volume: number };

export const UPLOAD_ID = /^[A-Za-z0-9_-]{8,40}\.(mp3|m4a|ogg|wav)$/;
