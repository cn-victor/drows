// Likes, reposts, comments and follows.
// Writers can't like or repost their own work: later, likes and reposts decide writers' earnings.
import "server-only";
import { all, newId, one, run } from "./db";
import { notify, unnotify } from "./notify";

async function authorOf(poemId: string): Promise<string | null | undefined> {
  const r = await one("SELECT author_id FROM poems WHERE id = ?", [poemId]);
  return r ? (r.author_id as string | null) : undefined; // undefined = no such poem
}

/** Turns a like or repost on/off. Returns the new state, or an error message. */
export async function toggle(kind: "likes" | "reposts", userId: string, poemId: string, on: boolean): Promise<boolean | string> {
  const author = await authorOf(poemId);
  if (author === undefined) return "This poem no longer exists.";
  if (author === userId) return kind === "likes" ? "You can't like your own poem." : "You can't repost your own poem.";
  const note = kind === "likes" ? "like" : "repost";
  if (on) {
    const added = await run(`INSERT OR IGNORE INTO ${kind} (user_id, poem_id, created_at) VALUES (?, ?, ?)`, [userId, poemId, Date.now()]);
    if (added) await notify(author, userId, note, poemId);
  } else {
    await run(`DELETE FROM ${kind} WHERE user_id = ? AND poem_id = ?`, [userId, poemId]);
    await unnotify(author, userId, note, poemId);
  }
  return on;
}

export type Comment = { id: string; body: string; createdAt: number; userId: string; username: string; name: string };

export async function commentsOn(poemId: string): Promise<Comment[]> {
  return (
    await all(
      `SELECT c.*, u.username, u.display_name FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.poem_id = ? ORDER BY c.created_at ASC LIMIT 500`,
      [poemId],
    )
  ).map((r) => ({
    id: String(r.id),
    body: String(r.body),
    createdAt: Number(r.created_at),
    userId: String(r.user_id),
    username: String(r.username),
    name: String(r.display_name),
  }));
}

export async function addComment(userId: string, poemId: string, body: string): Promise<string | null> {
  const text = body.trim().slice(0, 1000);
  if (!text) return "Write something first.";
  const author = await authorOf(poemId);
  if (author === undefined) return "This poem no longer exists.";
  const id = newId(8);
  await run("INSERT INTO comments (id, poem_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)", [id, poemId, userId, text, Date.now()]);
  await notify(author, userId, "comment", poemId, id, text);
  return null;
}

/** The comment's writer, or the poem's writer, can remove a comment. */
export async function deleteComment(userId: string, commentId: string): Promise<boolean> {
  const n = await run(
    `DELETE FROM comments WHERE id = ? AND (user_id = ? OR poem_id IN (SELECT id FROM poems WHERE author_id = ?))`,
    [commentId, userId, userId],
  );
  return n > 0;
}

export async function setFollow(userId: string, targetId: string, on: boolean) {
  if (userId === targetId) return;
  if (on) {
    const added = await run("INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)", [userId, targetId, Date.now()]);
    if (added) await notify(targetId, userId, "follow");
  } else {
    await run("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?", [userId, targetId]);
    await unnotify(targetId, userId, "follow");
  }
}

/** Writers to suggest in the sidebar: active writers you don't follow yet. */
export async function suggestedWriters(viewerId: string | null, limit = 3) {
  const rows = await all(
    `SELECT u.username, u.display_name, u.bio, (SELECT COUNT(*) FROM poems WHERE author_id = u.id) AS n
     FROM users u
     WHERE u.id != ? AND u.id NOT IN (SELECT followee_id FROM follows WHERE follower_id = ?)
     ORDER BY n DESC, u.created_at DESC LIMIT ?`,
    [viewerId ?? "", viewerId ?? "", limit],
  );
  return rows.map((r) => ({ username: String(r.username), name: String(r.display_name), bio: String(r.bio ?? "") }));
}

/** Simple search across writers and poems (titles and words). */
export async function searchAll(q: string) {
  const term = `%${q.trim().toLowerCase().replace(/[%_]/g, "")}%`;
  const [people, poems] = await Promise.all([
    all(
      `SELECT username, display_name, bio FROM users WHERE lower(username) LIKE ? OR lower(display_name) LIKE ? ORDER BY created_at DESC LIMIT 10`,
      [term, term],
    ),
    all(`SELECT id FROM poems WHERE lower(title) LIKE ? OR lower(doc) LIKE ? ORDER BY created_at DESC LIMIT 40`, [term, term]),
  ]);
  return {
    people: people.map((r) => ({ username: String(r.username), name: String(r.display_name), bio: String(r.bio ?? "") })),
    poemIds: poems.map((r) => String(r.id)),
  };
}
