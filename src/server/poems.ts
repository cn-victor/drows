// Reading and saving poems (and book chapters, which are poems that belong to a book).
import "server-only";
import { cleanDoc, cleanStyle, type DocNode, type Poem, type PoemStyle } from "@/lib/poem";
import { all, newId, one, run, sha256, type Row } from "./db";

// Every poem comes with its writer, book, like/repost/comment counts, and whether the viewer liked/reposted it.
const SELECT = `
  SELECT p.*, u.username, u.display_name, u.wallet_address AS author_wallet, b.title AS book_title,
    (SELECT COUNT(*) FROM likes WHERE poem_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM reposts WHERE poem_id = p.id) AS repost_count,
    (SELECT COUNT(*) FROM comments WHERE poem_id = p.id) AS comment_count,
    (SELECT COUNT(*) FROM gifts WHERE poem_id = p.id AND status = 'confirmed') AS gift_count,
    EXISTS (SELECT 1 FROM likes WHERE poem_id = p.id AND user_id = :viewer) AS liked,
    EXISTS (SELECT 1 FROM reposts WHERE poem_id = p.id AND user_id = :viewer) AS reposted,
    EXISTS (SELECT 1 FROM bookmarks WHERE poem_id = p.id AND user_id = :viewer) AS saved
  FROM poems p
  LEFT JOIN users u ON u.id = p.author_id
  LEFT JOIN books b ON b.id = p.book_id`;

function toPoem(r: Row): Poem {
  return {
    id: String(r.id),
    title: String(r.title),
    caption: String(r.caption ?? ""),
    author: r.display_name ? String(r.display_name) : String(r.author),
    username: r.username ? String(r.username) : null,
    authorId: r.author_id ? String(r.author_id) : null,
    doc: cleanDoc(JSON.parse(String(r.doc))),
    style: cleanStyle(JSON.parse(String(r.style))),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    bookId: r.book_id ? String(r.book_id) : null,
    bookTitle: r.book_title ? String(r.book_title) : null,
    chapter: r.chapter_no == null ? null : Number(r.chapter_no),
    likes: Number(r.like_count ?? 0),
    reposts: Number(r.repost_count ?? 0),
    comments: Number(r.comment_count ?? 0),
    gifts: Number(r.gift_count ?? 0),
    authorHasWallet: !!r.author_wallet,
    liked: !!Number(r.liked ?? 0),
    reposted: !!Number(r.reposted ?? 0),
    saved: !!Number(r.saved ?? 0),
  };
}

const v = (viewer?: string | null) => viewer ?? "";

export async function getPoem(id: string, viewer?: string | null): Promise<Poem | null> {
  const r = await one(`${SELECT} WHERE p.id = :id`, { id, viewer: v(viewer) });
  return r ? toPoem(r) : null;
}

export async function latestPoems(viewer?: string | null, limit = 30): Promise<Poem[]> {
  return (await all(`${SELECT} ORDER BY p.created_at DESC LIMIT :limit`, { viewer: v(viewer), limit })).map(toPoem);
}

/** Standalone poems by a writer (book chapters are shown on the book instead). */
export async function poemsByAuthor(userId: string, viewer?: string | null): Promise<Poem[]> {
  return (await all(`${SELECT} WHERE p.author_id = :uid AND p.book_id IS NULL ORDER BY p.created_at DESC LIMIT 100`, { uid: userId, viewer: v(viewer) })).map(toPoem);
}

export async function chaptersOf(bookId: string, viewer?: string | null): Promise<Poem[]> {
  return (await all(`${SELECT} WHERE p.book_id = :book ORDER BY p.chapter_no, p.created_at`, { book: bookId, viewer: v(viewer) })).map(toPoem);
}

async function poemsByIds(ids: string[], viewer: string) {
  if (!ids.length) return new Map<string, Poem>();
  const params: Record<string, string> = { viewer };
  ids.forEach((id, i) => (params[`p${i}`] = id));
  const rows = await all(`${SELECT} WHERE p.id IN (${ids.map((_, i) => `:p${i}`).join(",")})`, params);
  return new Map(rows.map((r) => [String(r.id), toPoem(r)]));
}

/** Poems that someone reposted, newest repost first. */
export async function repostsBy(userId: string, viewer?: string | null): Promise<Poem[]> {
  const rows = await all(
    `SELECT r.poem_id, r.created_at, u.username, u.display_name FROM reposts r JOIN users u ON u.id = r.user_id
     WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 100`,
    [userId],
  );
  const poems = await poemsByIds(rows.map((r) => String(r.poem_id)), v(viewer));
  return rows.flatMap((r) => {
    const p = poems.get(String(r.poem_id));
    return p ? [{ ...p, repostedBy: { username: String(r.username), name: String(r.display_name) }, feedTime: Number(r.created_at) }] : [];
  });
}

/** The "Following" feed: new poems and reposts from people you follow (and your own). */
export async function followingFeed(viewer: string, limit = 60): Promise<Poem[]> {
  const rows = await all(
    `SELECT pid, t, by_user FROM (
       SELECT p.id AS pid, p.created_at AS t, NULL AS by_user FROM poems p
         WHERE p.author_id = :viewer OR p.author_id IN (SELECT followee_id FROM follows WHERE follower_id = :viewer)
       UNION ALL
       SELECT r.poem_id, r.created_at, r.user_id FROM reposts r
         WHERE r.user_id IN (SELECT followee_id FROM follows WHERE follower_id = :viewer)
     ) ORDER BY t DESC LIMIT :limit`,
    { viewer, limit: limit * 2 },
  );
  // Each poem appears once, at its most recent moment.
  const seen = new Set<string>();
  const entries = rows.filter((r) => !seen.has(String(r.pid)) && seen.add(String(r.pid))).slice(0, limit);
  const poems = await poemsByIds(entries.map((r) => String(r.pid)), viewer);
  const reposters = new Map(
    (await all(
      `SELECT id, username, display_name FROM users WHERE id IN (${entries.filter((e) => e.by_user).map(() => "?").join(",") || "''"})`,
      entries.filter((e) => e.by_user).map((e) => String(e.by_user)),
    )).map((u) => [String(u.id), { username: String(u.username), name: String(u.display_name) }]),
  );
  return entries.flatMap((e) => {
    const p = poems.get(String(e.pid));
    if (!p) return [];
    return [{ ...p, repostedBy: e.by_user ? reposters.get(String(e.by_user)) ?? null : null, feedTime: Number(e.t) }];
  });
}

export type PoemInput = { title: string; caption: string; doc: DocNode; style: PoemStyle };

export async function createPoem(p: PoemInput, author: { id: string; name: string }, bookId: string | null = null): Promise<string> {
  const id = newId();
  const now = Date.now();
  await run(
    `INSERT INTO poems (id, title, caption, author, doc, style, edit_hash, created_at, updated_at, author_id, book_id, chapter_no)
     VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ${bookId ? "(SELECT COALESCE(MAX(chapter_no), 0) + 1 FROM poems WHERE book_id = ?)" : "NULL"})`,
    [id, p.title, p.caption, author.name, JSON.stringify(p.doc), JSON.stringify(p.style), now, now, author.id, bookId, ...(bookId ? [bookId] : [])],
  );
  if (bookId) await run("UPDATE books SET updated_at = ? WHERE id = ?", [now, bookId]);
  return id;
}

/** Saves changes. Only works for the poem's own writer. */
export async function updatePoem(id: string, authorId: string, p: PoemInput): Promise<boolean> {
  const n = await run("UPDATE poems SET title = ?, caption = ?, doc = ?, style = ?, updated_at = ? WHERE id = ? AND author_id = ?", [
    p.title, p.caption, JSON.stringify(p.doc), JSON.stringify(p.style), Date.now(), id, authorId,
  ]);
  return n > 0;
}

export async function deletePoem(id: string, authorId: string): Promise<boolean> {
  const n = await run("DELETE FROM poems WHERE id = ? AND author_id = ?", [id, authorId]);
  if (n) {
    for (const t of ["likes", "reposts", "comments", "bookmarks", "notifications"]) await run(`DELETE FROM ${t} WHERE poem_id = ?`, [id]);
  }
  return n > 0;
}

/** Poems published before accounts existed are moved into your account using the keys your browser kept. */
export async function claimPoems(userId: string, name: string, claims: { id: string; editKey: string }[]): Promise<number> {
  let moved = 0;
  for (const c of claims.slice(0, 200)) {
    if (typeof c?.id !== "string" || typeof c?.editKey !== "string" || !c.editKey) continue;
    moved += await run("UPDATE poems SET author_id = ?, author = ? WHERE id = ? AND author_id IS NULL AND edit_hash = ?", [userId, name, c.id, sha256(c.editKey)]);
  }
  return moved;
}

/** Several poems by id, kept in the order given. */
export async function getPoems(ids: string[], viewer?: string | null): Promise<Poem[]> {
  const map = await poemsByIds(ids, v(viewer));
  return ids.flatMap((id) => map.get(id) ?? []);
}

/** Poems someone saved, newest save first. */
export async function savedBy(userId: string): Promise<Poem[]> {
  const rows = await all("SELECT poem_id FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC LIMIT 200", [userId]);
  const poems = await poemsByIds(rows.map((r) => String(r.poem_id)), userId);
  return rows.flatMap((r) => poems.get(String(r.poem_id)) ?? []);
}

/** Poems for the Reels screen, newest first, older than `before`.
 *  "friends" = only people the viewer follows. `exclude` skips the poem already showing. */
export async function reelPoems(viewer: string | null, tab: "reels" | "friends", before: number, exclude: string, limit = 8): Promise<Poem[]> {
  if (tab === "friends" && !viewer) return [];
  const friends = tab === "friends" ? "AND p.author_id IN (SELECT followee_id FROM follows WHERE follower_id = :viewer)" : "";
  return (
    await all(`${SELECT} WHERE p.created_at < :before AND p.id != :exclude ${friends} ORDER BY p.created_at DESC LIMIT :limit`, {
      viewer: v(viewer),
      before,
      exclude,
      limit,
    })
  ).map(toPoem);
}

/** The Writers tab: people who have written poems (most poems first), each with their newest poem. */
export async function writersWithLatest(viewer: string | null, limit = 20) {
  const rows = await all(
    `SELECT u.id, u.username, u.display_name, u.bio,
       EXISTS (SELECT 1 FROM follows WHERE follower_id = :viewer AND followee_id = u.id) AS following,
       (SELECT id FROM poems WHERE author_id = u.id ORDER BY created_at DESC LIMIT 1) AS latest,
       (SELECT COUNT(*) FROM poems WHERE author_id = u.id) AS n
     FROM users u WHERE EXISTS (SELECT 1 FROM poems WHERE author_id = u.id)
     ORDER BY n DESC, u.created_at DESC LIMIT :limit`,
    { viewer: v(viewer), limit },
  );
  const latest = await poemsByIds(rows.map((r) => String(r.latest)), v(viewer));
  return rows.map((r) => ({
    id: String(r.id),
    username: String(r.username),
    name: String(r.display_name),
    bio: String(r.bio ?? ""),
    following: !!Number(r.following),
    poems: Number(r.n),
    latest: latest.get(String(r.latest)) ?? null,
  }));
}
