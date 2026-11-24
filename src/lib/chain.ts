// Solana settings shared by the browser and the server.
// "devnet" is Solana's test network: the money there is free and has no value.
// Switch to "mainnet-beta" only when you're ready for real money (and have had legal advice).

export type Cluster = "devnet" | "mainnet-beta";
export const CLUSTER: Cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta" ? "mainnet-beta" : "devnet";
export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC || (CLUSTER === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com");
export const IS_TEST_MONEY = CLUSTER === "devnet";

/** USDC, a coin worth one US dollar. Different address on the test network. */
export const USDC_MINT = CLUSTER === "devnet" ? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export type Currency = "SOL" | "USDC";
export const DECIMALS: Record<Currency, number> = { SOL: 9, USDC: 6 };

/** The platform keeps this share of every gift; the writer gets the rest. */
export const PLATFORM_FEE_PERCENT = 15;

export const GIFT_PRESETS: Record<Currency, number[]> = {
  SOL: [0.01, 0.05, 0.1, 0.5],
  USDC: [1, 2, 5, 10],
};
export const GIFT_MIN: Record<Currency, number> = { SOL: 0.01, USDC: 0.5 };
export const GIFT_MAX: Record<Currency, number> = { SOL: 100, USDC: 10_000 };

/** Turns "0.05" SOL into the whole-number units the blockchain uses (lamports / micro-USDC). */
export function toUnits(amount: number, currency: Currency): bigint {
  const [whole, frac = ""] = amount.toFixed(DECIMALS[currency]).split(".");
  return BigInt(whole) * 10n ** BigInt(DECIMALS[currency]) + BigInt(frac.padEnd(DECIMALS[currency], "0"));
}

export function fromUnits(units: bigint | number | string, currency: Currency): number {
  return Number(BigInt(units)) / 10 ** DECIMALS[currency];
}

/** Splits a gift: 15% to the platform (rounded down), the rest to the writer. */
export function splitGift(total: bigint): { writer: bigint; fee: bigint } {
  const fee = (total * BigInt(PLATFORM_FEE_PERCENT)) / 100n;
  return { writer: total - fee, fee };
}

export function formatAmount(units: bigint | number | string, currency: Currency): string {
  const n = fromUnits(units, currency);
  return currency === "USDC" ? `$${n.toFixed(2)}` : `${Number(n.toFixed(4))} SOL`;
}

export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}${CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;
export const explorerAddress = (a: string) => `https://explorer.solana.com/address/${a}${CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;

export const isAddress = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);

/** The note a wallet signs to prove it belongs to an account (browser and server must agree on it). */
export const walletProofMessage = (userId: string, address: string) => `Link wallet ${address} to Inkwell account ${userId}`;
