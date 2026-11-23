// The AI reader: which voice reads the poem, its overall style, and the tone a line can be read in.
// `instruction` is what we tell the AI voice; `rate`/`pitch` are used by the free browser voice.

export const VOICES = [
  { id: "sage", label: "Sage (calm, soft)" },
  { id: "ballad", label: "Ballad (warm, expressive)" },
  { id: "coral", label: "Coral (bright, gentle)" },
  { id: "shimmer", label: "Shimmer (light, airy)" },
  { id: "nova", label: "Nova (clear, young)" },
  { id: "fable", label: "Fable (storyteller)" },
  { id: "ash", label: "Ash (deep, steady)" },
  { id: "onyx", label: "Onyx (deep, rich)" },
  { id: "verse", label: "Verse (lively)" },
  { id: "echo", label: "Echo (plain)" },
] as const;

export const READING_STYLES = [
  { id: "gentle", label: "Gentle", instruction: "Read this poem gently and intimately, as if to one person, with natural pauses at line ends." },
  { id: "storyteller", label: "Storyteller", instruction: "Read like a warm storyteller by a fire, unhurried, letting images land." },
  { id: "dramatic", label: "Dramatic", instruction: "Read with theatrical feeling and strong dynamics, as a poet performing on stage." },
  { id: "spoken", label: "Spoken word", instruction: "Read as spoken-word poetry: rhythmic, confident, with emphasis on key words and beats." },
  { id: "plain", label: "Plain", instruction: "Read clearly and simply, without extra drama." },
] as const;

export const TONES = [
  { id: "soft", label: "Soft", instruction: "Speak softly and tenderly.", rate: 0.9, pitch: 1 },
  { id: "whisper", label: "Whisper", instruction: "Whisper these lines, close and secret.", rate: 0.85, pitch: 1.05 },
  { id: "slow", label: "Slow", instruction: "Read these lines very slowly, with long pauses between phrases.", rate: 0.7, pitch: 1 },
  { id: "sad", label: "Sad", instruction: "Read with deep sadness and a heavy, breaking voice.", rate: 0.8, pitch: 0.9 },
  { id: "joyful", label: "Joyful", instruction: "Read with joy and a smile in the voice.", rate: 1.05, pitch: 1.15 },
  { id: "angry", label: "Angry", instruction: "Read with controlled anger and force.", rate: 1.05, pitch: 0.9 },
  { id: "hopeful", label: "Hopeful", instruction: "Read with rising hope and warmth.", rate: 0.95, pitch: 1.1 },
  { id: "loud", label: "Loud", instruction: "Read loudly and boldly, almost calling out.", rate: 1, pitch: 1 },
  { id: "dreamy", label: "Dreamy", instruction: "Read dreamily, floating and far away.", rate: 0.85, pitch: 1.05 },
] as const;

export const PAUSES = [
  { id: "short", label: "Short pause", seconds: 1 },
  { id: "long", label: "Long pause", seconds: 2.5 },
  { id: "silence", label: "Long silence", seconds: 5 },
] as const;

export const VOICE_IDS = new Set<string>(VOICES.map((v) => v.id));
export const READING_IDS = new Set<string>(READING_STYLES.map((r) => r.id));
export const TONE_IDS = new Set<string>(TONES.map((t) => t.id));
export const PAUSE_IDS = new Set<string>(PAUSES.map((p) => p.id));

export const toneOf = (id?: string | null) => TONES.find((t) => t.id === id);
export const pauseSeconds = (id?: string | null) => PAUSES.find((p) => p.id === id)?.seconds ?? 0;
export const readingOf = (id?: string | null) => READING_STYLES.find((r) => r.id === id) ?? READING_STYLES[0];
