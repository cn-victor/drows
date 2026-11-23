// The database. On your computer it is a file at data/poems.db.
// Online it can point at a hosted database by setting DATABASE_URL (and DATABASE_AUTH_TOKEN).
import "server-only";
import { createClient, type Client } from "@libsql/client";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { cleanDoc, cleanStyle, type DocNode, type Poem, type PoemStyle } from "@/lib/poem";

let client: Client | null = null;
let ready: Promise<void> | null = null;

function db(): Client {
  if (!client) {
    const url = process.env.DATABASE_URL || "file:data/poems.db";
    if (url.startsWith("file:")) mkdirSync("data", { recursive: true });
    client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  }
  return client;
}

async function setup() {
  if (!ready) {
    ready = db()
      .executeMultiple(`
        CREATE TABLE IF NOT EXISTS poems (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          doc TEXT NOT NULL,
          style TEXT NOT NULL,
          edit_hash TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS poems_created ON poems (created_at DESC);
      `)
      .catch((e) => {
        ready = null;
        throw e;
      });
  }
  await ready;
}

const hash = (key: string) => createHash("sha256").update(key).digest("hex");
const newId = () => randomBytes(6).toString("base64url"); // short, link-friendly, e.g. "aZ3k_9Qm"

function toPoem(r: Record<string, unknown>): Poem {
  return {
    id: String(r.id),
    title: String(r.title),
    author: String(r.author),
    doc: cleanDoc(JSON.parse(String(r.doc))),
    style: cleanStyle(JSON.parse(String(r.style))),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

export type PoemInput = { title: string; author: string; doc: DocNode; style: PoemStyle };

/** Saves a new poem. Returns its id and a secret "edit key" only the writer's browser keeps. */
export async function createPoem(p: PoemInput): Promise<{ id: string; editKey: string }> {
  await setup();
  const id = newId();
  const editKey = randomBytes(18).toString("base64url");
  const now = Date.now();
  await db().execute({
    sql: "INSERT INTO poems (id, title, author, doc, style, edit_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, p.title, p.author, JSON.stringify(p.doc), JSON.stringify(p.style), hash(editKey), now, now],
  });
  return { id, editKey };
}

/** Updates a poem if the edit key matches. Returns false if the key is wrong or the poem is gone. */
export async function updatePoem(id: string, editKey: string, p: PoemInput): Promise<boolean> {
  await setup();
  const r = await db().execute({
    sql: "UPDATE poems SET title = ?, author = ?, doc = ?, style = ?, updated_at = ? WHERE id = ? AND edit_hash = ?",
    args: [p.title, p.author, JSON.stringify(p.doc), JSON.stringify(p.style), Date.now(), id, hash(editKey)],
  });
  return r.rowsAffected > 0;
}

export async function deletePoem(id: string, editKey: string): Promise<boolean> {
  await setup();
  const r = await db().execute({ sql: "DELETE FROM poems WHERE id = ? AND edit_hash = ?", args: [id, hash(editKey)] });
  return r.rowsAffected > 0;
}

export async function getPoem(id: string): Promise<Poem | null> {
  await setup();
  const r = await db().execute({ sql: "SELECT * FROM poems WHERE id = ?", args: [id] });
  return r.rows[0] ? toPoem(r.rows[0] as Record<string, unknown>) : null;
}

export async function latestPoems(limit = 24): Promise<Poem[]> {
  await setup();
  const r = await db().execute({ sql: "SELECT * FROM poems ORDER BY created_at DESC LIMIT ?", args: [limit] });
  return r.rows.map((row) => toPoem(row as Record<string, unknown>));
}
