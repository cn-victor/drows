"use client";
// Remembers, in this browser, which poems you wrote (and the secret key that lets you edit them).
// Stage 3 replaces this with real accounts.
const KEY = "inkwell:mine";
export type MyPoem = { id: string; editKey: string; title: string };

export function myPoems(): MyPoem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
export function rememberPoem(p: MyPoem) {
  const rest = myPoems().filter((m) => m.id !== p.id);
  localStorage.setItem(KEY, JSON.stringify([p, ...rest]));
}
export function forgetPoem(id: string) {
  localStorage.setItem(KEY, JSON.stringify(myPoems().filter((m) => m.id !== id)));
}
export function editKeyFor(id: string): string | null {
  return myPoems().find((m) => m.id === id)?.editKey ?? null;
}
