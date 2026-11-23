import "server-only";
import { cleanDoc, cleanStyle, hasWords, LIMITS } from "@/lib/poem";
import type { PoemInput } from "./db";

/** Checks what the browser sent before saving. Returns the cleaned poem or an error message. */
export function readPoemInput(body: unknown): PoemInput | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  if (JSON.stringify(b.doc ?? null).length > LIMITS.docBytes) return { error: "This poem is too long to save." };
  const doc = cleanDoc(b.doc);
  if (!hasWords(doc)) return { error: "Write a few words before publishing." };
  const title = String(b.title ?? "").trim().slice(0, LIMITS.title) || "Untitled";
  const author = String(b.author ?? "").trim().slice(0, LIMITS.author) || "Anonymous";
  return { title, author, doc, style: cleanStyle(b.style) };
}
