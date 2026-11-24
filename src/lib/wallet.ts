"use client";
// The writer's own Solana wallet, created and kept in their browser.
// - It comes from a 12-word recovery phrase (the same kind Phantom and Solflare use, so it can be
//   opened in those apps too).
// - It is locked with a wallet password that never leaves the browser. The platform only ever
//   learns the public address, so it can never move anyone's money.
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { ed25519 } from "@noble/curves/ed25519";
import { Keypair } from "@solana/web3.js";

// Internal label from the working name; kept so wallets already saved in browsers still open.
const STORE = (userId: string) => `inkwell:wallet:${userId}`;
const PBKDF2_ROUNDS = 310_000;

type Stored = { v: 1; address: string; salt: string; iv: string; data: string };

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const buf = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

export function newRecoveryPhrase(): string {
  return generateMnemonic(wordlist, 128); // 12 words
}

export function normalizePhrase(p: string) {
  return p.trim().toLowerCase().split(/\s+/).join(" ");
}

export function isValidPhrase(p: string) {
  return validateMnemonic(normalizePhrase(p), wordlist);
}

// SLIP-0010 key derivation for Solana's standard path m/44'/501'/0'/0' (what Phantom uses).
async function hmac512(key: Uint8Array, data: Uint8Array) {
  const k = await crypto.subtle.importKey("raw", buf(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, buf(data)));
}

export async function keypairFromPhrase(phrase: string): Promise<Keypair> {
  const seed = mnemonicToSeedSync(normalizePhrase(phrase));
  let I = await hmac512(new TextEncoder().encode("ed25519 seed"), seed);
  let key = I.slice(0, 32);
  let chain = I.slice(32);
  for (const index of [44, 501, 0, 0]) {
    const data = new Uint8Array(37);
    data.set(key, 1);
    new DataView(data.buffer).setUint32(33, (index | 0x80000000) >>> 0);
    I = await hmac512(chain, data);
    key = I.slice(0, 32);
    chain = I.slice(32);
  }
  return Keypair.fromSeed(key);
}

async function aesKey(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", buf(new TextEncoder().encode(password)), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: buf(salt), iterations: PBKDF2_ROUNDS, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Saves the wallet in this browser, locked with the wallet password. */
export async function saveWallet(userId: string, phrase: string, password: string): Promise<string> {
  const kp = await keypairFromPhrase(phrase);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(iv) }, await aesKey(password, salt), buf(new TextEncoder().encode(normalizePhrase(phrase))));
  const stored: Stored = { v: 1, address: kp.publicKey.toBase58(), salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(data)) };
  localStorage.setItem(STORE(userId), JSON.stringify(stored));
  unlocked = { userId, keypair: kp, phrase: normalizePhrase(phrase), at: Date.now() };
  return stored.address;
}

/** The address of the wallet kept in this browser (or null if there isn't one here). */
export function localWalletAddress(userId: string): string | null {
  try {
    return (JSON.parse(localStorage.getItem(STORE(userId)) || "null") as Stored | null)?.address ?? null;
  } catch {
    return null;
  }
}

export function forgetLocalWallet(userId: string) {
  localStorage.removeItem(STORE(userId));
  if (unlocked?.userId === userId) unlocked = null;
}

// Stays unlocked for a while after you type the password, so you don't retype it for every gift.
let unlocked: { userId: string; keypair: Keypair; phrase: string; at: number } | null = null;
const UNLOCK_MINUTES = 15;

export function unlockedWallet(userId: string) {
  if (!unlocked || unlocked.userId !== userId) return null;
  if (Date.now() - unlocked.at > UNLOCK_MINUTES * 60_000) {
    unlocked = null;
    return null;
  }
  return unlocked;
}

/** Opens the wallet with its password. Throws "wrong-password" if it doesn't match. */
export async function unlockWallet(userId: string, password: string) {
  const s = JSON.parse(localStorage.getItem(STORE(userId)) || "null") as Stored | null;
  if (!s) throw new Error("no-wallet");
  let phrase: string;
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf(unb64(s.iv)) }, await aesKey(password, unb64(s.salt)), buf(unb64(s.data)));
    phrase = new TextDecoder().decode(plain);
  } catch {
    throw new Error("wrong-password");
  }
  const keypair = await keypairFromPhrase(phrase);
  unlocked = { userId, keypair, phrase, at: Date.now() };
  return unlocked;
}

export function lockWallet() {
  unlocked = null;
}

/** Signs a short message proving this browser controls the wallet (used when linking it to the account). */
export function signProof(keypair: Keypair, message: string): string {
  return b64(ed25519.sign(new TextEncoder().encode(message), keypair.secretKey.slice(0, 32)));
}
