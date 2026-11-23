import { connection } from "next/server";
import { buildSegments } from "@/lib/segments";
import { readingOf, toneOf } from "@/lib/voice";
import { getPoem } from "@/server/db";
import { audioResponse } from "@/server/files";
import { speech } from "@/server/tts";

/** The AI recording of one part of a published poem.
 *  Only text from saved poems can be read, so nobody can use this to voice anything else. */
export async function GET(req: Request, ctx: RouteContext<"/api/poems/[id]/voice/[seg]">) {
  await connection();
  const { id, seg } = await ctx.params;
  const poem = await getPoem(id);
  const part = poem ? buildSegments(poem.doc)[Number(seg)] : undefined;
  if (!poem || !part) return Response.json({ error: "Not found" }, { status: 404 });

  const instructions = [readingOf(poem.style.reading).instruction, toneOf(part.tone)?.instruction, "This is a poem: respect line breaks as small breaths."]
    .filter(Boolean)
    .join(" ");
  try {
    const audio = await speech({ text: part.text, voice: poem.style.voice, instructions });
    if (!audio) return Response.json({ error: "ai-voice-off" }, { status: 501 });
    return audioResponse(audio, "audio/mpeg", req, "public, max-age=3600");
  } catch {
    return Response.json({ error: "ai-voice-failed" }, { status: 502 });
  }
}
