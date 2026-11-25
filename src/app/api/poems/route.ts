// Publish a new poem.
import { currentUser } from "@/server/auth";
import { getBook } from "@/server/books";
import { createPoem } from "@/server/poems";
import { readPoemInput } from "@/server/validate";

/** Publishes a new poem (or a new chapter, when a bookId is sent). */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return Response.json({ error: "Please log in to publish." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const input = readPoemInput(body);
  if ("error" in input) return Response.json({ error: input.error }, { status: 400 });

  let bookId: string | null = null;
  if (typeof body?.bookId === "string" && body.bookId) {
    const book = await getBook(body.bookId);
    if (!book || book.authorId !== me.id) return Response.json({ error: "You can only add chapters to your own books." }, { status: 403 });
    bookId = book.id;
  }
  const id = await createPoem(input, { id: me.id, name: me.name }, bookId);
  return Response.json({ id });
}
