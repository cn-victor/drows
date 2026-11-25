"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { beginGift, finishGift } from "@/app/actions";
import { explorerTx, formatAmount, GIFT_MIN, GIFT_PRESETS, IS_TEST_MONEY, PLATFORM_FEE_PERCENT, splitGift, toUnits, type Currency } from "@/lib/chain";
import { explainChainError, getBalances, payGift } from "@/lib/solanaClient";
import { localWalletAddress } from "@/lib/wallet";
import { input, Modal, primary, secondary, TestMoneyBadge, useUnlock } from "./ui";
import { GiftIcon } from "../icons";

type Props = {
  poemId: string;
  writerName: string;
  writerHasWallet: boolean;
  isOwner: boolean;
  viewer: { id: string; walletAddress: string | null } | null;
  giftCount: number;
  /** Open the gift window straight away (used when someone taps 🎁 in a feed). */
  autoOpen?: boolean;
  /** "rail" = big round button with the count underneath (the swipe viewer). */
  variant?: "inline" | "rail";
};

/** 🎁 on a poem: readers send the writer money (85% to the writer, 15% to the platform). */
export default function GiftButton(p: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(!!p.autoOpen && !!p.viewer && !p.isOwner);
  const cls = "group flex items-center gap-1 text-muted transition hover:text-amber-400";

  return (
    <>
      <button
        className={cls}
        title={p.isOwner ? "Gifts you received for this poem" : "Send the writer a gift"}
        aria-label="Send a gift"
        onClick={() => {
          if (p.isOwner) return router.push("/wallet");
          if (!p.viewer) return router.push(`/login?next=/p/${p.poemId}`);
          setOpen(true);
        }}
      >
        {p.variant === "rail" ? (
          <span className="flex flex-col items-center gap-1">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition group-hover:bg-amber-400/30 group-hover:text-amber-300 sm:bg-soft sm:text-fg">
              <GiftIcon size={26} />
            </span>
            <span className="text-xs font-semibold text-white drop-shadow sm:text-fg sm:drop-shadow-none">{p.giftCount > 0 ? p.giftCount : "Gift"}</span>
          </span>
        ) : (
          <>
            <span className="-m-2 rounded-full p-2 transition group-hover:bg-amber-400/15"><GiftIcon size={22} /></span>
            <span className="min-w-[1ch] text-sm">{p.giftCount > 0 ? p.giftCount : ""}</span>
          </>
        )}
      </button>
      {open && p.viewer && <GiftDialog {...p} viewer={p.viewer} onClose={() => setOpen(false)} />}
    </>
  );
}

function GiftDialog({ poemId, writerName, writerHasWallet, viewer, onClose }: Props & { viewer: NonNullable<Props["viewer"]>; onClose: () => void }) {
  const [currency, setCurrency] = useState<Currency>("SOL");
  const [amount, setAmount] = useState(String(GIFT_PRESETS.SOL[1]));
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"form" | "sending" | "done">("form");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");
  const [hasLocal, setHasLocal] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const unlock = useUnlock(viewer.id);

  useEffect(() => {
    const local = localWalletAddress(viewer.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasLocal(!!local && local === viewer.walletAddress);
    if (local) getBalances(local).then((b) => setBalance(currency === "SOL" ? b.sol : b.usdc)).catch(() => {});
  }, [viewer.id, viewer.walletAddress, currency]);

  const n = Number(amount);
  const valid = Number.isFinite(n) && n >= GIFT_MIN[currency];
  const split = valid ? splitGift(toUnits(n, currency)) : null;

  async function send() {
    setError("");
    // Stop early if the wallet clearly can't cover it (SOL also pays the small network fee).
    const needed = currency === "SOL" ? n + 0.00001 : n;
    if (balance !== null && balance < needed) {
      setError(`Your wallet doesn't have enough ${currency} for this gift. Add some on your Wallet page first.`);
      return;
    }
    const kp = await unlock.getKeypair();
    if (!kp) return;
    setStep("sending");
    try {
      setStatus("Preparing your gift…");
      const order = await beginGift(poemId, currency, n, message);
      if ("error" in order) throw new Error(order.error);
      setStatus("Sending on Solana…");
      const sig = await payGift(kp, order);
      setSignature(sig);
      setPaid({ giftId: order.id, signature: sig });
      await check(order.id, sig);
    } catch (e) {
      console.error("Gift failed:", e);
      setError(explainChainError(e));
      setStep("form");
    }
  }

  // The money has left the wallet; now the server confirms it on the blockchain and records the gift.
  const [paid, setPaid] = useState<{ giftId: string; signature: string } | null>(null);
  async function check(giftId: string, sig: string) {
    setStep("sending");
    setError("");
    setStatus("Checking it arrived…");
    const r = await finishGift(giftId, sig);
    if (r.error) {
      setError(`Your payment was sent, but we couldn't confirm it yet (${r.error}). Please press "Check again" in a moment.`);
      setStep("form");
    } else setStep("done");
  }

  return (
    <Modal title={`Send ${writerName} a gift`} onClose={step === "sending" ? () => {} : onClose}>
      {IS_TEST_MONEY && <div className="-mt-2 mb-4"><TestMoneyBadge /></div>}

      {!writerHasWallet ? (
        <p className="text-fg">{writerName} hasn&apos;t set up a wallet for gifts yet.</p>
      ) : hasLocal === false ? (
        <div className="flex flex-col gap-3 text-fg">
          <p>To send gifts you need a wallet on this browser.</p>
          <Link href="/wallet" className={`${primary} self-start`}>Set up my wallet</Link>
        </div>
      ) : step === "done" ? (
        <div className="flex flex-col gap-3">
          <p className="text-lg">🎁 Gift sent. Thank you for supporting {writerName}!</p>
          {signature && <a className="text-sm underline" href={explorerTx(signature)} target="_blank" rel="noreferrer">See the payment on Solana Explorer ↗</a>}
          <button className={`${primary} self-start`} onClick={onClose}>Close</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(["SOL", "USDC"] as const).map((c) => (
              <button
                key={c}
                className={currency === c ? primary : secondary}
                disabled={step === "sending"}
                onClick={() => {
                  setCurrency(c);
                  setAmount(String(GIFT_PRESETS[c][1]));
                }}
              >
                {c === "USDC" ? "USDC ($)" : "SOL"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {GIFT_PRESETS[currency].map((v) => (
              <button key={v} className={Number(amount) === v ? primary : secondary} disabled={step === "sending"} onClick={() => setAmount(String(v))}>
                {currency === "USDC" ? `$${v}` : `${v} SOL`}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Or choose an amount ({currency})
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={input} disabled={step === "sending"} />
          </label>
          {!valid && amount && <p className="-mt-2 text-sm text-red-500">The smallest gift is {GIFT_MIN[currency]} {currency}.</p>}
          {balance !== null && <p className="-mt-2 text-xs text-muted">In your wallet: {currency === "USDC" ? `$${balance.toFixed(2)}` : `${Number(balance.toFixed(4))} SOL`}</p>}

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            A note for {writerName} (optional)
            <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={140} className={input} placeholder="This poem made my day" disabled={step === "sending"} />
          </label>

          {split && (
            <div className="rounded-2xl bg-soft p-3 text-sm">
              <div className="flex justify-between"><span>{writerName} receives</span><b>{formatAmount(split.writer, currency)}</b></div>
              <div className="flex justify-between text-muted"><span>Platform fee ({PLATFORM_FEE_PERCENT}%)</span><span>{formatAmount(split.fee, currency)}</span></div>
              <p className="mt-1 text-xs text-muted">Plus a tiny Solana network fee (less than a cent).</p>
            </div>
          )}

          {!unlock.isOpen() && unlock.field}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {step === "sending" ? (
            <p className="text-sm text-fg">{status}</p>
          ) : paid ? (
            // Already paid: never send twice, just check again.
            <button className={primary} onClick={() => check(paid.giftId, paid.signature)}>Check again</button>
          ) : (
            <button className={primary} disabled={!valid || unlock.busy || hasLocal === null} onClick={send}>
              {unlock.busy ? "Opening wallet…" : `Send ${currency === "USDC" ? `$${amount}` : `${amount} SOL`}`}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

