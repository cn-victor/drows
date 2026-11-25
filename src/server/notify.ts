// Notifications ("Ada liked your poem") and saved poems.
import "server-only";
import { all, newId, one, run } from "./db";

export type NotifyKind = "like" | "repost" | "comment" | "follow" | "gift";

/** Tells `userId` that `actorId` did something. Never tells you about your own actions. */
export async function notify(userId: string | null, actorId: string, kind: NotifyKind, poemId: string | null = null, refId: string | null = null, body = "") {
  if (!userId || userId === actorId) return;
  // Liking, unliking and liking again shouldn't send three notes.
  if (kind === "like" || kind === "repost" || kind === "follow") {
    await run("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND kind = ? AND COALESCE(poem_id, '') = ?", [userId, actorId, kind, poemId ?? ""]);
  }
  await run(
    "INSERT INTO notifications (id, user_id, actor_id, kind, poem_id, ref_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [newId(8), userId, actorId, kind, poemId, refId, body.slice(0, 200), Date.now()],
  );
}

/** Takes a note back (for example when someone unlikes). */
export async function unnotify(userId: string | null, actorId: string, kind: NotifyKind, poemId: string | null = null) {
  if (!userId) return;
  await run("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND kind = ? AND COALESCE(poem_id, '') = ? AND read_at IS NULL", [userId, actorId, kind, poemId ?? ""]);
}

export type Notification = {
  id: string;
  kind: NotifyKind;
  at: number;
  unread: boolean;
  body: string;
  actor: { username: string; name: string };
  poem: { id: string; title: string } | null;
};

export async function notificationsFor(userId: string, limit = 80): Promise<Notification[]> {
  const rows = await all(
    `SELECT n.*, u.username, u.display_name, p.title AS poem_title
     FROM notifications n JOIN users u ON u.id = n.actor_id LEFT JOIN poems p ON p.id = n.poem_id
     WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT ?`,
    [userId, limit],
  );
  return rows.map((r) => ({
    id: String(r.id),
    kind: String(r.kind) as NotifyKind,
    at: Number(r.created_at),
    unread: r.read_at == null,
    body: String(r.body ?? ""),
    actor: { username: String(r.username), name: String(r.display_name) },
    poem: r.poem_id && r.poem_title != null ? { id: String(r.poem_id), title: String(r.poem_title) } : null,
  }));
}

export async function unreadNotifications(userId: string): Promise<number> {
  const r = await one("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL", [userId]);
  return Number(r?.n ?? 0);
}

export async function markNotificationsRead(userId: string) {
  await run("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL", [Date.now(), userId]);
}

// ---------- saved poems ----------

export async function setBookmark(userId: string, poemId: string, on: boolean): Promise<string | null> {
  if (!(await one("SELECT 1 FROM poems WHERE id = ?", [poemId]))) return "This poem no longer exists.";
  if (on) await run("INSERT OR IGNORE INTO bookmarks (user_id, poem_id, created_at) VALUES (?, ?, ?)", [userId, poemId, Date.now()]);
  else await run("DELETE FROM bookmarks WHERE user_id = ? AND poem_id = ?", [userId, poemId]);
  return null;
}
