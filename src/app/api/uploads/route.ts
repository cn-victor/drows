import { randomBytes } from "node:crypto";
import { saveFile, sniffAudio } from "@/server/files";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/** A writer uploads their own background music. */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a music file first." }, { status: 400 });
  if (form?.get("rights") !== "yes") {
    return Response.json({ error: "Please confirm you own this music or have permission to use it." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return Response.json({ error: "That file is too big. The limit is 15 MB." }, { status: 400 });
  const data = Buffer.from(await file.arrayBuffer());
  const ext = sniffAudio(data);
  if (!ext) return Response.json({ error: "That doesn't look like a music file. Use MP3, M4A, OGG or WAV." }, { status: 400 });
  const id = `${randomBytes(12).toString("base64url")}.${ext}`;
  await saveFile("uploads", id, data);
  return Response.json({ id, name: file.name.replace(/\.[^.]+$/, "").slice(0, 80) });
}
