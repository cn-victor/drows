"use client";
// Small building blocks shared by the wallet screens.
import { useState, type ReactNode } from "react";
import { unlockWallet, unlockedWallet } from "@/lib/wallet";
import type { Keypair } from "@solana/web3.js";

export const input = "w-full rounded-xl bg-white px-4 py-3 text-base text-neutral-900 ring-1 ring-black/15 outline-none focus:ring-2 focus:ring-neutral-900";
export const primary = "rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40";
export const secondary = "rounded-full px-4 py-2 text-sm text-neutral-800 ring-1 ring-black/15 transition hover:bg-black/5 disabled:opacity-40";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-[#fbf7ee] p-6 text-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 rounded-full px-2 text-2xl leading-none text-neutral-500 hover:bg-black/5">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TestMoneyBadge() {
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900" title="Solana's test network: the money has no real value">
      Test network · not real money
    </span>
  );
}

export function shortAddress(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="break-all rounded-xl bg-black/5 px-3 py-2 text-left font-mono text-sm hover:bg-black/10"
      title="Copy address"
    >
      {address} <span className="ml-1 font-sans text-xs text-neutral-500">{copied ? "✓ copied" : "copy"}</span>
    </button>
  );
}

/** Asks for the wallet password when the wallet is locked. Calls onOpen with the wallet keys. */
export function useUnlock(userId: string) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isOpen = () => !!unlockedWallet(userId);

  async function getKeypair(): Promise<Keypair | null> {
    const w = unlockedWallet(userId);
    if (w) return w.keypair;
    setBusy(true);
    setError("");
    try {
      return (await unlockWallet(userId, password)).keypair;
    } catch (e) {
      setError(e instanceof Error && e.message === "wrong-password" ? "That wallet password isn't right." : "Couldn't open your wallet.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const field = (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      Wallet password
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" className={input} />
      {error && <span className="text-sm font-normal text-red-700">{error}</span>}
    </label>
  );
  return { isOpen, getKeypair, field, busy, password };
}
