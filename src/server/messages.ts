// Private messages between two people.
import "server-only";
import { all, newId, one, run } from "./db";

const pair = (x: string, y: string) => (x < y ? [x, y] : [y, x]);

export type ConversationRow = {
  id: string;
  other: { id: string; username: string; name: string };
  last: { body: string; at: number; mine: boolean } | null;
  unread: boolean;
};

/** Your conversations, newest first. */
export async function conversationsOf(userId: string): Promise<ConversationRow[]> {
  const rows = await all(
    `SELECT c.*, u.id AS other_id, u.username, u.display_name,
       (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_body,
       (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_sender
     FROM conversations c
     JOIN users u ON u.id = CASE WHEN c.a_id = :me THEN c.b_id ELSE c.a_id END
     WHERE c.a_id = :me OR c.b_id = :me
     ORDER BY c.last_at DESC LIMIT 100`,
    { me: userId },
  );
  return rows.map((r) => {
    const readAt = Number(r.a_id === userId ? r.a_read_at : r.b_read_at);
    const mine = r.last_sender === userId;
    return {
      id: String(r.id),
      other: { id: String(r.other_id), username: String(r.username), name: String(r.display_name) },
      last: r.last_body == null ? null : { body: String(r.last_body), at: Number(r.last_at), mine },
      unread: r.last_body != null && !mine && Number(r.last_at) > readAt,
    };
  });
}

export async function unreadConversations(userId: string): Promise<number> {
  const r = await one(
    `SELECT COUNT(*) AS n FROM conversations c
     WHERE ((c.a_id = :me AND c.last_at > c.a_read_at) OR (c.b_id = :me AND c.last_at > c.b_read_at))
       AND (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) != :me`,
    { me: userId },
  );
  return Number(r?.n ?? 0);
}

export type Message = { id: string; body: string; at: number; mine: boolean };

/** The messages between you and another person (oldest first), and marks them read. */
export async function threadWith(userId: string, otherId: string): Promise<Message[]> {
  const [a, b] = pair(userId, otherId);
  const c = await one("SELECT id FROM conversations WHERE a_id = ? AND b_id = ?", [a, b]);
  if (!c) return [];
  const rows = await all("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 300", [String(c.id)]);
  await run(`UPDATE conversations SET ${userId === a ? "a_read_at" : "b_read_at"} = ? WHERE id = ?`, [Date.now(), String(c.id)]);
  return rows.reverse().map((r) => ({ id: String(r.id), body: String(r.body), at: Number(r.created_at), mine: r.sender_id === userId }));
}

export async function sendMessage(userId: string, otherId: string, body: string): Promise<string | null> {
  const text = body.trim().slice(0, 2000);
  if (!text) return "Write something first.";
  if (userId === otherId) return "You can't message yourself.";
  if (!(await one("SELECT 1 FROM users WHERE id = ?", [otherId]))) return "That person no longer exists.";
  const [a, b] = pair(userId, otherId);
  const now = Date.now();
  await run("INSERT OR IGNORE INTO conversations (id, a_id, b_id, last_at) VALUES (?, ?, ?, ?)", [newId(8), a, b, now]);
  const c = await one("SELECT id FROM conversations WHERE a_id = ? AND b_id = ?", [a, b]);
  await run("INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)", [newId(8), String(c!.id), userId, text, now]);
  await run(`UPDATE conversations SET last_at = ?, ${userId === a ? "a_read_at" : "b_read_at"} = ? WHERE id = ?`, [now, now, String(c!.id)]);
  return null;
}
