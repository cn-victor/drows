"use client";
// Before accounts existed, this browser remembered which poems you published (with a secret key).
// Those keys are sent when you sign up or log in, so the poems move into your account.
const KEY = "inkwell:mine";
export type MyPoem = { id: string; editKey: string; title: string };

export function myPoems(): MyPoem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
