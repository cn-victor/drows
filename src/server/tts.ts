import "server-only";
import { createHash } from "node:crypto";
import { loadFile, saveFile } from "./files";

// The AI reader. Uses OpenAI's speech service, which can be told HOW to read (tone, pace, feeling).
// Set OPENAI_API_KEY in .env.local to switch it on. Without a key the site uses the free browser voice.
// Each recording is saved, so a poem segment is only paid for once, however many people listen.

const MODEL = process.env.TTS_MODEL || "gpt-4o-mini-tts";

export const aiVoiceEnabled = () => !!process.env.OPENAI_API_KEY;

export type SpeechRequest = { text: string; voice: string; instructions: string };

const cacheName = (r: SpeechRequest) =>
  createHash("sha256").update(JSON.stringify([MODEL, r.voice, r.instructions, r.text])).digest("hex").slice(0, 40) + ".mp3";

/** Returns the recording for this text, making (and saving) it if needed. Null when AI voice is off. */
export async function speech(r: SpeechRequest): Promise<Buffer | null> {
  const name = cacheName(r);
  const saved = await loadFile("voice", name);
  if (saved) return saved;
  if (!aiVoiceEnabled()) return null;

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice: r.voice, input: r.text.slice(0, 4000), instructions: r.instructions, response_format: "mp3" }),
  });
  if (!res.ok) {
    console.error("AI voice failed:", res.status, (await res.text()).slice(0, 300));
    throw new Error("AI voice failed");
  }
  const audio = Buffer.from(await res.arrayBuffer());
  await saveFile("voice", name, audio);
  return audio;
}
