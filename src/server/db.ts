// The database. On your computer it is a file at data/poems.db.
// Online it can point at a hosted database by setting DATABASE_URL (and DATABASE_AUTH_TOKEN).
import "server-only";
import { createClient, type Client, type InArgs } from "@libsql/client";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";

let client: Client | null = null;
let ready: Promise<void> | null = null;

function connect(): Client {
  if (!client) {
    const url = process.env.DATABASE_URL || "file:data/poems.db";
    if (url.startsWith("file:")) mkdirSync("data", { recursive: true });
    client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  }
  return client;
}

const SCHEMA = `
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

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    pass_hash TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    theme TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS books_author ON books (author_id, updated_at DESC);
  CREATE TABLE IF NOT EXISTS likes (
    user_id TEXT NOT NULL,
    poem_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, poem_id)
  );
  CREATE INDEX IF NOT EXISTS likes_poem ON likes (poem_id);
  CREATE TABLE IF NOT EXISTS reposts (
    user_id TEXT NOT NULL,
    poem_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, poem_id)
  );
  CREATE INDEX IF NOT EXISTS reposts_poem ON reposts (poem_id);
  CREATE INDEX IF NOT EXISTS reposts_user ON reposts (user_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    poem_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS comments_poem ON comments (poem_id, created_at);
  CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL,
    followee_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (follower_id, followee_id)
  );
  CREATE INDEX IF NOT EXISTS follows_followee ON follows (followee_id);
`;

// Columns added after the first version. Each runs once, if the column is missing.
const ADDED_COLUMNS: [table: string, column: string, definition: string][] = [
  ["poems", "author_id", "TEXT"],
  ["poems", "book_id", "TEXT"],
  ["poems", "chapter_no", "INTEGER"],
];

async function migrate(c: Client) {
  await c.executeMultiple(SCHEMA);
  for (const [table, column, def] of ADDED_COLUMNS) {
    const cols = await c.execute(`PRAGMA table_info(${table})`);
    if (!cols.rows.some((r) => r.name === column)) await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
  }
  await c.executeMultiple(`
    CREATE INDEX IF NOT EXISTS poems_author ON poems (author_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS poems_book ON poems (book_id, chapter_no);
  `);
}

/** The database, ready to use (tables created/updated on first use). */
export async function db(): Promise<Client> {
  const c = connect();
  if (!ready) {
    ready = migrate(c).catch((e) => {
      ready = null;
      throw e;
    });
  }
  await ready;
  return c;
}

export type Row = Record<string, unknown>;

export async function all(sql: string, args: InArgs = []): Promise<Row[]> {
  return (await (await db()).execute({ sql, args })).rows as unknown as Row[];
}
export async function one(sql: string, args: InArgs = []): Promise<Row | null> {
  return (await all(sql, args))[0] ?? null;
}
export async function run(sql: string, args: InArgs = []): Promise<number> {
  return (await (await db()).execute({ sql, args })).rowsAffected;
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const newId = (bytes = 6) => randomBytes(bytes).toString("base64url"); // short, link-friendly
