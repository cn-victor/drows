// Accounts and logins. Passwords are never stored, only a scrambled "hash" of them.
// When you log in, your browser gets a secret session cookie that proves who you are.
import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { all, newId, one, run, sha256 } from "./db";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
// Internal label from the working name; kept so nobody gets logged out.
const COOKIE = "ink_session";
const SESSION_DAYS = 30;

export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  bio: string;
  createdAt: number;
  walletAddress: string | null; // where gifts are paid
  walletKind: "created" | "own" | null;
};

const toUser = (r: Record<string, unknown>): User => ({
  id: String(r.id),
  username: String(r.username),
  name: String(r.display_name),
  email: String(r.email),
  bio: String(r.bio ?? ""),
  createdAt: Number(r.created_at),
  walletAddress: r.wallet_address ? String(r.wallet_address) : null,
  walletKind: r.wallet_kind === "created" || r.wallet_kind === "own" ? r.wallet_kind : null,
});

async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

async function checkPassword(pw: string, stored: string) {
  const [, saltHex, keyHex] = stored.split("$");
  if (!saltHex || !keyHex) return false;
  const key = await scrypt(pw, Buffer.from(saltHex, "hex"), 64);
  return timingSafeEqual(key, Buffer.from(keyHex, "hex"));
}

// ---------- rules for new accounts ----------

const RESERVED = new Set(["admin", "drows", "inkwell", "support", "help", "about", "settings", "login", "signup", "logout", "write", "api", "u", "b", "p", "books", "feed", "explore", "me", "null", "undefined"]);

export function checkUsername(u: string): string | null {
  if (!/^[a-z0-9_]{3,20}$/.test(u)) return "Usernames are 3–20 letters, numbers or underscores (no spaces).";
  if (RESERVED.has(u)) return "That username is reserved. Please pick another.";
  return null;
}

export async function createUser(input: { username: string; name: string; email: string; password: string }): Promise<User | string> {
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().slice(0, 60) || username;
  const bad = checkUsername(username);
  if (bad) return bad;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
  if (input.password.length < 8) return "Passwords need at least 8 characters.";
  if (await one("SELECT 1 FROM users WHERE username = ?", [username])) return "That username is taken.";
  if (await one("SELECT 1 FROM users WHERE email = ?", [email])) return "There's already an account with that email. Try logging in.";
  const id = newId(9);
  const now = Date.now();
  await run("INSERT INTO users (id, username, display_name, email, pass_hash, bio, created_at) VALUES (?, ?, ?, ?, ?, '', ?)", [
    id, username, name, email, await hashPassword(input.password), now,
  ]);
  return { id, username, name, email, bio: "", createdAt: now, walletAddress: null, walletKind: null };
}

/** Checks an email/username and password. Returns the user, or null if they don't match. */
export async function verifyLogin(login: string, password: string): Promise<User | null> {
  const key = login.trim().toLowerCase();
  const r = await one("SELECT * FROM users WHERE email = ? OR username = ?", [key, key]);
  if (!r) {
    await hashPassword(password); // take the same time either way, so nobody can test which accounts exist
    return null;
  }
  return (await checkPassword(password, String(r.pass_hash))) ? toUser(r) : null;
}

// ---------- sessions ----------

/** Logs the user in on this browser. Only call from a Server Action. */
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  await run("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", [sha256(token), userId, expires]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expires),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE token_hash = ?", [sha256(token)]);
  jar.delete(COOKIE);
}

/** Who is looking at this page (null if logged out). Remembered for the rest of the request. */
export const currentUser = cache(async (): Promise<User | null> => {
  await connection(); // always check fresh, on every visit
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const r = await one(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?",
    [sha256(token), Date.now()],
  );
  return r ? toUser(r) : null;
});

// ---------- profiles ----------

export type Profile = User & { followers: number; following: number; poems: number; isFollowing: boolean };

export async function getProfile(username: string, viewer?: string | null): Promise<Profile | null> {
  const r = await one(
    `SELECT u.*,
       (SELECT COUNT(*) FROM follows WHERE followee_id = u.id) AS followers,
       (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following,
       (SELECT COUNT(*) FROM poems WHERE author_id = u.id) AS poem_count,
       EXISTS (SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = u.id) AS is_following
     FROM users u WHERE u.username = ?`,
    [viewer ?? "", username.toLowerCase()],
  );
  if (!r) return null;
  return {
    ...toUser(r),
    followers: Number(r.followers),
    following: Number(r.following),
    poems: Number(r.poem_count),
    isFollowing: !!Number(r.is_following),
  };
}

export async function updateProfile(userId: string, name: string, bio: string) {
  await run("UPDATE users SET display_name = ?, bio = ? WHERE id = ?", [name.trim().slice(0, 60), bio.trim().slice(0, 300), userId]);
}

export async function followList(userId: string, which: "followers" | "following") {
  const sql =
    which === "followers"
      ? "SELECT u.username, u.display_name FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.followee_id = ? ORDER BY f.created_at DESC LIMIT 200"
      : "SELECT u.username, u.display_name FROM follows f JOIN users u ON u.id = f.followee_id WHERE f.follower_id = ? ORDER BY f.created_at DESC LIMIT 200";
  return (await all(sql, [userId])).map((r) => ({ username: String(r.username), name: String(r.display_name) }));
}
