// Books: a title, description and cover theme, with poems as chapters.
import "server-only";
import { getTheme } from "@/lib/themes";
import { all, newId, one, run, type Row } from "./db";

export type Book = {
  id: string;
  authorId: string;
  username: string;
  author: string;
  title: string;
  description: string;
  theme: string;
  chapters: number;
  createdAt: number;
  updatedAt: number;
};

const SELECT = `SELECT b.*, u.username, u.display_name, (SELECT COUNT(*) FROM poems WHERE book_id = b.id) AS chapter_count
  FROM books b JOIN users u ON u.id = b.author_id`;

const toBook = (r: Row): Book => ({
  id: String(r.id),
  authorId: String(r.author_id),
  username: String(r.username),
  author: String(r.display_name),
  title: String(r.title),
  description: String(r.description),
  theme: String(r.theme),
  chapters: Number(r.chapter_count),
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
});

export async function getBook(id: string): Promise<Book | null> {
  const r = await one(`${SELECT} WHERE b.id = ?`, [id]);
  return r ? toBook(r) : null;
}

export async function booksBy(userId: string): Promise<Book[]> {
  return (await all(`${SELECT} WHERE b.author_id = ? ORDER BY b.updated_at DESC`, [userId])).map(toBook);
}

export async function latestBooks(limit = 12): Promise<Book[]> {
  return (await all(`${SELECT} WHERE EXISTS (SELECT 1 FROM poems WHERE book_id = b.id) ORDER BY b.updated_at DESC LIMIT ?`, [limit])).map(toBook);
}

type BookInput = { title: string; description: string; theme: string };
const clean = (b: BookInput) => ({
  title: b.title.trim().slice(0, 120) || "Untitled book",
  description: b.description.trim().slice(0, 1000),
  theme: getTheme(b.theme).id,
});

export async function createBook(authorId: string, input: BookInput): Promise<string> {
  const b = clean(input);
  const id = newId();
  const now = Date.now();
  await run("INSERT INTO books (id, author_id, title, description, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    id, authorId, b.title, b.description, b.theme, now, now,
  ]);
  return id;
}

export async function updateBook(id: string, authorId: string, input: BookInput): Promise<boolean> {
  const b = clean(input);
  return (await run("UPDATE books SET title = ?, description = ?, theme = ?, updated_at = ? WHERE id = ? AND author_id = ?", [
    b.title, b.description, b.theme, Date.now(), id, authorId,
  ])) > 0;
}

/** Deleting a book keeps its chapters as standalone poems. */
export async function deleteBook(id: string, authorId: string): Promise<boolean> {
  const n = await run("DELETE FROM books WHERE id = ? AND author_id = ?", [id, authorId]);
  if (n) await run("UPDATE poems SET book_id = NULL, chapter_no = NULL WHERE book_id = ?", [id]);
  return n > 0;
}

/** Moves a chapter one place earlier or later. */
export async function moveChapter(bookId: string, authorId: string, poemId: string, dir: -1 | 1) {
  const book = await getBook(bookId);
  if (!book || book.authorId !== authorId) return;
  const rows = await all("SELECT id FROM poems WHERE book_id = ? ORDER BY chapter_no, created_at", [bookId]);
  const ids = rows.map((r) => String(r.id));
  const i = ids.indexOf(poemId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  for (let k = 0; k < ids.length; k++) await run("UPDATE poems SET chapter_no = ? WHERE id = ?", [k + 1, ids[k]]);
}
