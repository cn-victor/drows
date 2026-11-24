"use server";
// Everything a button or form asks the server to do. Each action checks who is asking first.
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createUser, currentUser, endSession, startSession, updateProfile, verifyLogin } from "@/server/auth";
import { createBook, deleteBook, getBook, moveChapter, updateBook } from "@/server/books";
import { one } from "@/server/db";
import { claimPoems } from "@/server/poems";
import { addComment, deleteComment, setFollow, toggle } from "@/server/social";

export type FormState = { error?: string; ok?: boolean; values?: Record<string, string> } | null;

/** What the person typed (never the password), so the form can keep it after an error. */
const keep = (form: FormData, ...names: string[]) => Object.fromEntries(names.map((n) => [n, String(form.get(n) || "")]));

// Simple protection against someone guessing passwords over and over.
const failures = new Map<string, { n: number; until: number }>();
function tooManyTries(key: string) {
  const f = failures.get(key);
  return !!f && f.n >= 8 && f.until > Date.now();
}
function noteFailure(key: string) {
  const f = failures.get(key);
  const fresh = !f || f.until < Date.now();
  failures.set(key, { n: fresh ? 1 : f.n + 1, until: Date.now() + 15 * 60_000 });
}

/** Moves poems published from this browser before accounts existed into the account. */
async function claimFromForm(form: FormData, userId: string, name: string) {
  try {
    const claims = JSON.parse(String(form.get("claims") || "[]"));
    if (Array.isArray(claims)) await claimPoems(userId, name, claims);
  } catch {}
}

const safeNext = (n: FormDataEntryValue | null) => {
  const s = String(n || "/");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
};

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const user = await createUser({
    username: String(form.get("username") || ""),
    name: String(form.get("name") || ""),
    email: String(form.get("email") || ""),
    password: String(form.get("password") || ""),
  });
  if (typeof user === "string") return { error: user, values: keep(form, "name", "username", "email") };
  await startSession(user.id);
  await claimFromForm(form, user.id, user.name);
  redirect(safeNext(form.get("next")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const who = String(form.get("login") || "").trim().toLowerCase();
  if (tooManyTries(who)) return { error: "Too many tries. Please wait 15 minutes and try again.", values: keep(form, "login") };
  const user = await verifyLogin(who, String(form.get("password") || ""));
  if (!user) {
    noteFailure(who);
    return { error: "That email/username and password don't match.", values: keep(form, "login") };
  }
  failures.delete(who);
  await startSession(user.id);
  await claimFromForm(form, user.id, user.name);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const me = await currentUser();
  if (!me) return { error: "Please log in again." };
  await updateProfile(me.id, String(form.get("name") || me.username), String(form.get("bio") || ""));
  refresh();
  return { ok: true };
}

// ---------- likes, reposts, comments, follows ----------

export async function setLike(poemId: string, on: boolean): Promise<{ error?: string }> {
  const me = await currentUser();
  if (!me) return { error: "login" };
  const r = await toggle("likes", me.id, poemId, on);
  return typeof r === "string" ? { error: r } : {};
}

export async function setRepost(poemId: string, on: boolean): Promise<{ error?: string }> {
  const me = await currentUser();
  if (!me) return { error: "login" };
  const r = await toggle("reposts", me.id, poemId, on);
  return typeof r === "string" ? { error: r } : {};
}

export async function postComment(poemId: string, _: FormState, form: FormData): Promise<FormState> {
  const me = await currentUser();
  if (!me) return { error: "Please log in to comment.", values: keep(form, "body") };
  const err = await addComment(me.id, poemId, String(form.get("body") || ""));
  if (err) return { error: err, values: keep(form, "body") };
  refresh();
  return { ok: true };
}

export async function removeComment(commentId: string) {
  const me = await currentUser();
  if (!me) return;
  await deleteComment(me.id, commentId);
  refresh();
}

export async function setFollowing(username: string, on: boolean): Promise<{ error?: string }> {
  const me = await currentUser();
  if (!me) return { error: "login" };
  const target = await one("SELECT id FROM users WHERE username = ?", [username]);
  if (!target) return { error: "That writer no longer exists." };
  await setFollow(me.id, String(target.id), on);
  refresh();
  return {};
}

// ---------- books ----------

export async function saveBook(bookId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const me = await currentUser();
  if (!me) return { error: "Please log in again." };
  const input = { title: String(form.get("title") || ""), description: String(form.get("description") || ""), theme: String(form.get("theme") || "") };
  if (bookId) {
    if (!(await updateBook(bookId, me.id, input))) return { error: "You can only change your own books." };
    redirect(`/b/${bookId}`);
  }
  const id = await createBook(me.id, input);
  redirect(`/b/${id}`);
}

export async function removeBook(bookId: string) {
  const me = await currentUser();
  if (!me) return;
  const book = await getBook(bookId);
  if (book && (await deleteBook(bookId, me.id))) redirect(`/u/${me.username}`);
}

export async function reorderChapter(bookId: string, poemId: string, dir: -1 | 1) {
  const me = await currentUser();
  if (!me) return;
  await moveChapter(bookId, me.id, poemId, dir);
  refresh();
}
