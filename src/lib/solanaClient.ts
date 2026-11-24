"use client";
// Talking to the Solana blockchain from the browser: balances, test money, and payments.
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { DECIMALS, RPC_URL, USDC_MINT, type Currency } from "./chain";

const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const mint = new PublicKey(USDC_MINT);
let conn: Connection | null = null;
const connection = () => (conn ??= new Connection(RPC_URL, "confirmed"));

export type Balances = { sol: number; usdc: number };

export async function getBalances(address: string): Promise<Balances> {
  const owner = new PublicKey(address);
  const [lamports, tokens] = await Promise.all([
    connection().getBalance(owner),
    connection().getParsedTokenAccountsByOwner(owner, { mint }).catch(() => ({ value: [] })),
  ]);
  const usdc = tokens.value.reduce((sum, t) => sum + Number(t.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0), 0);
  return { sol: lamports / LAMPORTS_PER_SOL, usdc };
}

/** Adds "pay this much of this coin to this address" steps to a transaction. */
function addPayment(tx: Transaction, payer: PublicKey, to: PublicKey, units: bigint, currency: Currency) {
  if (units <= BigInt(0)) return;
  if (currency === "SOL") {
    tx.add(SystemProgram.transfer({ fromPubkey: payer, toPubkey: to, lamports: units }));
  } else {
    const from = getAssociatedTokenAddressSync(mint, payer);
    const dest = getAssociatedTokenAddressSync(mint, to);
    // Opens a USDC "pocket" for the receiver if they don't have one yet (paid by the sender, once).
    tx.add(createAssociatedTokenAccountIdempotentInstruction(payer, dest, to, mint));
    tx.add(createTransferCheckedInstruction(from, mint, dest, payer, units, DECIMALS.USDC));
  }
}

async function signAndSend(tx: Transaction, signer: Keypair): Promise<string> {
  const c = connection();
  const latest = await c.getLatestBlockhash();
  tx.recentBlockhash = latest.blockhash;
  tx.feePayer = signer.publicKey;
  tx.sign(signer);
  const signature = await c.sendRawTransaction(tx.serialize());
  const res = await c.confirmTransaction({ signature, ...latest }, "confirmed");
  if (res.value.err) throw new Error("The payment failed on the blockchain.");
  return signature;
}

/** Pays a gift in ONE transaction: the writer's share, the platform's share, and a note linking it to the gift. */
export async function payGift(
  signer: Keypair,
  order: { currency: Currency; recipient: string; treasury: string; writerUnits: string; feeUnits: string; memo: string },
): Promise<string> {
  const tx = new Transaction();
  addPayment(tx, signer.publicKey, new PublicKey(order.recipient), BigInt(order.writerUnits), order.currency);
  addPayment(tx, signer.publicKey, new PublicKey(order.treasury), BigInt(order.feeUnits), order.currency);
  tx.add(new TransactionInstruction({ programId: MEMO_PROGRAM, keys: [], data: Buffer.from(order.memo, "utf8") }));
  return signAndSend(tx, signer);
}

/** Sends money out of your wallet to any address (e.g. your exchange account or Phantom). */
export async function sendFunds(signer: Keypair, to: string, units: bigint, currency: Currency): Promise<string> {
  const tx = new Transaction();
  addPayment(tx, signer.publicKey, new PublicKey(to), units, currency);
  return signAndSend(tx, signer);
}

/** Turns blockchain error messages into plain words. */
export function explainChainError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/insufficient|0x1\b|debit an account but found no record|may not be used to pay transaction fees/i.test(msg)) return "There isn't enough money in your wallet for this (remember a tiny network fee too).";
  if (/429|too many requests|rate limit/i.test(msg)) return "The Solana network is busy. Please try again in a minute.";
  if (/blockhash|expired/i.test(msg)) return "The network took too long. Please try again.";
  return msg.length > 160 ? "Something went wrong sending the payment. Please try again." : msg;
}
