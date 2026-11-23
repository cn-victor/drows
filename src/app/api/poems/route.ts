import { createPoem } from "@/server/db";
import { readPoemInput } from "@/server/validate";

export async function POST(req: Request) {
  const input = readPoemInput(await req.json().catch(() => null));
  if ("error" in input) return Response.json({ error: input.error }, { status: 400 });
  return Response.json(await createPoem(input));
}
