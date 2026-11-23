import "server-only";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

// Where uploaded music and generated voice recordings are kept on this computer.
// (When the site goes online these move to cloud file storage.)
const ROOT = process.env.FILES_DIR || path.join(process.cwd(), "data");

export async function saveFile(folder: string, name: string, data: Buffer) {
  const dir = path.join(ROOT, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), data);
}

export async function loadFile(folder: string, name: string): Promise<Buffer | null> {
  if (name.includes("/") || name.includes("\\") || name.includes("..")) return null;
  try {
    return await readFile(path.join(ROOT, folder, name));
  } catch {
    return null;
  }
}

export async function fileExists(folder: string, name: string) {
  try {
    await stat(path.join(ROOT, folder, name));
    return true;
  } catch {
    return false;
  }
}

export const AUDIO_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

/** Works out the audio format from the file's first bytes (not its name, which can lie). */
export function sniffAudio(b: Buffer): keyof typeof AUDIO_TYPES | null {
  const ascii = (s: number, e: number) => b.subarray(s, e).toString("latin1");
  if (ascii(0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return "mp3";
  if (ascii(0, 4) === "OggS") return "ogg";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return "wav";
  if (ascii(4, 8) === "ftyp") return "m4a";
  return null;
}

/** Sends audio with support for skipping ahead (range requests), which audio players expect. */
export function audioResponse(data: Buffer, type: string, req: Request, cache = "public, max-age=31536000, immutable") {
  const size = data.length;
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": cache };
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Length": String(size) } });
}
