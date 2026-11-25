// Gifts: a reader pays a writer on Solana. One transaction pays 85% to the writer's wallet
// and 15% to the platform's wallet. The platform never holds anyone's money: the reader's own
// wallet signs the payment, and the server only checks on the blockchain that it really happened
// with the right amounts before recording it.
import "server-only";
import { Connection, type ParsedTransactionWithMeta } from "@solana/web3.js";
import { createPublicKey, verify } from "node:crypto";
import { CUSTOM_MEMO_PREFIX } from "@/lib/giftMemo";
import { GIFT_MAX, GIFT_MIN, isAddress, RPC_URL, splitGift, toUnits, USDC_MINT, walletProofMessage, type Currency } from "@/lib/chain";
import { all, newId, one, run } from "./db";
import { notify } from "./notify";

const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

/** The platform's own wallet, which receives the 15%. Set PLATFORM_WALLET in .env.local. */
export const treasury = () => {
  const t = process.env.PLATFORM_WALLET?.trim();
  return t && isAddress(t) ? t : null;
};

// ---------- linking a wallet to an account ----------


/** Checks a wallet's signature (proves the browser really holds that wallet). */
function validProof(address: string, message: string, signatureB64: string): boolean {
  try {
    const raw = bs58decode(address);
    if (raw.length !== 32) return false;
    const key = createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), raw]), format: "der", type: "spki" });
    return verify(null, Buffer.from(message), key, Buffer.from(signatureB64, "base64"));
  } catch {
    return false;
  }
}

export async function setWallet(userId: string, address: string, kind: "created" | "own", proof?: string): Promise<string | null> {
  if (!isAddress(address) || bs58decode(address).length !== 32) return "That doesn't look like a Solana wallet address.";
  if (kind === "created" && (!proof || !validProof(address, walletProofMessage(userId, address), proof))) return "Couldn't confirm this wallet. Please try again.";
  await run("UPDATE users SET wallet_address = ?, wallet_kind = ? WHERE id = ?", [address, kind, userId]);
  return null;
}

// ---------- sending a gift ----------

export type GiftOrder = {
  id: string;
  currency: Currency;
  recipient: string;
  treasury: string;
  writerUnits: string;
  feeUnits: string;
  memo: string;
};

/** Step 1: the reader chooses an amount. We note the gift as "pending" and say exactly who gets what. */
export async function startGift(fromUserId: string, poemId: string, currency: Currency, amount: number, message: string): Promise<GiftOrder | string> {
  const t = treasury();
  if (!t) return "Gifts aren't switched on yet: the platform wallet hasn't been set.";
  if (currency !== "SOL" && currency !== "USDC") return "Choose SOL or USDC.";
  if (!Number.isFinite(amount) || amount < GIFT_MIN[currency] || amount > GIFT_MAX[currency]) {
    return `Gifts can be from ${GIFT_MIN[currency]} to ${GIFT_MAX[currency]} ${currency}.`;
  }
  const poem = await one("SELECT p.id, p.author_id, u.wallet_address FROM poems p JOIN users u ON u.id = p.author_id WHERE p.id = ?", [poemId]);
  if (!poem) return "This poem no longer exists.";
  if (poem.author_id === fromUserId) return "You can't send a gift to yourself.";
  if (!poem.wallet_address) return "This writer hasn't set up a wallet for gifts yet.";

  const total = toUnits(amount, currency);
  const { writer, fee } = splitGift(total);
  const id = newId(9);
  await run(
    `INSERT INTO gifts (id, poem_id, from_user_id, to_user_id, currency, total_units, writer_units, fee_units, recipient, treasury, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [id, poemId, fromUserId, String(poem.author_id), currency, total.toString(), writer.toString(), fee.toString(), String(poem.wallet_address), t, message.trim().slice(0, 140), Date.now()],
  );
  return { id, currency, recipient: String(poem.wallet_address), treasury: t, writerUnits: writer.toString(), feeUnits: fee.toString(), memo: `${CUSTOM_MEMO_PREFIX}${id}` };
}

function memoOf(tx: ParsedTransactionWithMeta): string[] {
  const out: string[] = [];
  for (const ix of tx.transaction.message.instructions) {
    if (ix.programId.toBase58() === MEMO_PROGRAM && "parsed" in ix) out.push(String(ix.parsed));
  }
  return out;
}

/** How much each address gained in this transaction (SOL, or USDC by wallet owner). */
function gains(tx: ParsedTransactionWithMeta, currency: Currency): Map<string, bigint> {
  const m = new Map<string, bigint>();
  const add = (who: string, d: bigint) => m.set(who, (m.get(who) ?? BigInt(0)) + d);
  const meta = tx.meta!;
  if (currency === "SOL") {
    tx.transaction.message.accountKeys.forEach((k, i) => add(k.pubkey.toBase58(), BigInt(meta.postBalances[i]) - BigInt(meta.preBalances[i])));
  } else {
    for (const b of meta.postTokenBalances ?? []) if (b.mint === USDC_MINT && b.owner) add(b.owner, BigInt(b.uiTokenAmount.amount));
    for (const b of meta.preTokenBalances ?? []) if (b.mint === USDC_MINT && b.owner) add(b.owner, -BigInt(b.uiTokenAmount.amount));
  }
  return m;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Step 2: the reader's wallet has sent the payment. We look it up on the blockchain and check it. */
export async function confirmGift(fromUserId: string, giftId: string, signature: string): Promise<string | null> {
  const g = await one("SELECT * FROM gifts WHERE id = ? AND from_user_id = ?", [giftId, fromUserId]);
  if (!g) return "Gift not found.";
  if (g.status === "confirmed") return null;
  if (!/^[1-9A-HJ-NP-Za-km-z]{60,100}$/.test(signature)) return "That payment reference doesn't look right.";
  if (await one("SELECT 1 FROM gifts WHERE signature = ? AND id != ?", [signature, giftId])) return "That payment was already used for another gift.";

  const conn = new Connection(RPC_URL, "confirmed");
  let tx: ParsedTransactionWithMeta | null = null;
  for (let i = 0; i < 8 && !tx; i++) {
    tx = await conn.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: "confirmed" }).catch(() => null);
    if (!tx) await sleep(1500);
  }
  if (!tx || !tx.meta) return "We couldn't find that payment on the blockchain yet. Please try again in a moment.";
  if (tx.meta.err) return "The payment failed on the blockchain.";
  if (!memoOf(tx).some((m) => m.includes(`${CUSTOM_MEMO_PREFIX}${giftId}`))) return "That payment isn't for this gift.";

  const currency = g.currency as Currency;
  const got = gains(tx, currency);
  if ((got.get(String(g.recipient)) ?? BigInt(0)) < BigInt(String(g.writer_units))) return "The writer's share didn't arrive.";
  if ((got.get(String(g.treasury)) ?? BigInt(0)) < BigInt(String(g.fee_units))) return "The platform's share didn't arrive.";

  const sender = tx.transaction.message.accountKeys.find((k) => k.signer)?.pubkey.toBase58() ?? null;
  await run("UPDATE gifts SET status = 'confirmed', signature = ?, sender_address = ?, confirmed_at = ? WHERE id = ?", [signature, sender, Date.now(), giftId]);
  const amount = Number(BigInt(String(g.total_units))) / (currency === "SOL" ? 1e9 : 1e6);
  await notify(String(g.to_user_id), fromUserId, "gift", String(g.poem_id), giftId, `${amount} ${currency}${g.message ? ` · ${g.message}` : ""}`);
  return null;
}

// ---------- history ----------

export type GiftRow = {
  id: string;
  poemId: string;
  poemTitle: string;
  currency: Currency;
  total: string;
  writer: string;
  fee: string;
  message: string;
  signature: string;
  at: number;
  other: { username: string; name: string };
};

async function history(userId: string, dir: "received" | "sent"): Promise<GiftRow[]> {
  const me = dir === "received" ? "to_user_id" : "from_user_id";
  const them = dir === "received" ? "from_user_id" : "to_user_id";
  const rows = await all(
    `SELECT g.*, p.title AS poem_title, u.username, u.display_name FROM gifts g
     LEFT JOIN poems p ON p.id = g.poem_id JOIN users u ON u.id = g.${them}
     WHERE g.${me} = ? AND g.status = 'confirmed' ORDER BY g.confirmed_at DESC LIMIT 200`,
    [userId],
  );
  return rows.map((r) => ({
    id: String(r.id),
    poemId: String(r.poem_id),
    poemTitle: r.poem_title ? String(r.poem_title) : "(deleted poem)",
    currency: r.currency as Currency,
    total: String(r.total_units),
    writer: String(r.writer_units),
    fee: String(r.fee_units),
    message: String(r.message),
    signature: String(r.signature),
    at: Number(r.confirmed_at),
    other: { username: String(r.username), name: String(r.display_name) },
  }));
}

export const giftsReceived = (userId: string) => history(userId, "received");
export const giftsSent = (userId: string) => history(userId, "sent");

export async function giftCount(poemId: string): Promise<number> {
  return Number((await one("SELECT COUNT(*) AS n FROM gifts WHERE poem_id = ? AND status = 'confirmed'", [poemId]))?.n ?? 0);
}

// ---------- small helper: Solana addresses are written in "base58" ----------

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function bs58decode(s: string): Buffer {
  let n = BigInt(0);
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("bad base58");
    n = n * BigInt(58) + BigInt(i);
  }
  const bytes: number[] = [];
  while (n > BigInt(0)) {
    bytes.unshift(Number(n % BigInt(256)));
    n /= BigInt(256);
  }
  for (const c of s) {
    if (c !== "1") break;
    bytes.unshift(0);
  }
  return Buffer.from(bytes);
}
