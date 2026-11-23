import { connection } from "next/server";
import { UPLOAD_ID } from "@/lib/sounds";
import { AUDIO_TYPES, audioResponse, loadFile } from "@/server/files";

export async function GET(req: Request, ctx: RouteContext<"/api/uploads/[file]">) {
  await connection();
  const { file } = await ctx.params;
  if (!UPLOAD_ID.test(file)) return new Response("Not found", { status: 404 });
  const data = await loadFile("uploads", file);
  if (!data) return new Response("Not found", { status: 404 });
  return audioResponse(data, AUDIO_TYPES[file.split(".").pop()!], req);
}
