"use client";
import { useCallback, useEffect, useState } from "react";
import { linkWallet } from "@/app/actions";
import { explorerAddress, explorerTx, GIFT_MIN, isAddress, IS_TEST_MONEY, toUnits, walletProofMessage, type Currency } from "@/lib/chain";
import { explainChainError, getBalances, sendFunds, type Balances } from "@/lib/solanaClient";
import {
  forgetLocalWallet,
  isValidPhrase,
  keypairFromPhrase,
  localWalletAddress,
  newRecoveryPhrase,
  normalizePhrase,
  saveWallet,
  signProof,
  unlockWallet,
} from "@/lib/wallet";
import { CopyAddress, input, Modal, primary, secondary, TestMoneyBadge, useUnlock } from "./ui";

type Props = { userId: string; linked: string | null; kind: "created" | "own" | null };

/** Everything on the Wallet page: setting a wallet up, balances, sending money out, and the backup words. */
export default function WalletPanel({ userId, linked, kind }: Props) {
  const [local, setLocal] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"none" | "create" | "restore" | "own">("none");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(localWalletAddress(userId));
    setReady(true);
  }, [userId]);

  if (!ready) return null;

  const finished = (address: string) => {
    setLocal(address);
    setMode("none");
  };

  if (mode === "create") return <CreateWallet userId={userId} onDone={finished} onCancel={() => setMode("none")} />;
  if (mode === "restore") return <RestoreWallet userId={userId} linked={linked} onDone={finished} onCancel={() => setMode("none")} />;
  if (mode === "own") return <OwnAddress onDone={() => setMode("none")} onCancel={() => setMode("none")} />;

  // A wallet made here, and it's in this browser: the full dashboard.
  if (linked && kind === "created" && local === linked) {
    return <Dashboard userId={userId} address={linked} onRemoved={() => setLocal(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {linked && kind === "own" && (
        <section className="rounded-3xl bg-soft p-6 ring-1 ring-line">
          <p className="text-sm text-muted">Gifts are paid to this address you gave us:</p>
          <div className="mt-2"><CopyAddress address={linked} /></div>
          <BalanceLine address={linked} />
          <p className="mt-3 text-sm text-muted">To send gifts to other writers, create a wallet here instead (below).</p>
        </section>
      )}
      {linked && kind === "created" && local !== linked && (
        <section className="rounded-3xl bg-amber-400/10 p-6 ring-1 ring-amber-400/30">
          <p className="font-medium">Your wallet isn&apos;t in this browser.</p>
          <p className="mt-1 text-sm">It was created on another device or browser. Use your 12 recovery words to open it here.</p>
          <p className="mt-2 font-mono text-xs">{linked}</p>
          <button className={`${primary} mt-4`} onClick={() => setMode("restore")}>Restore with my 12 words</button>
        </section>
      )}

      {(
        <section className="grid gap-4 sm:grid-cols-3">
          <Choice title="Create a wallet" text="We make a new Solana wallet for you, right here in your browser. Only you hold the keys." action="Create wallet" onClick={() => setMode("create")} highlight={!linked} />
          <Choice title="I have my 12 words" text="Open a wallet you created before (here, or in Phantom/Solflare) using its recovery words." action="Restore" onClick={() => setMode("restore")} />
          <Choice title="Use my own address" text="Already have a wallet (Phantom, an exchange…)? Paste its address to receive gifts there." action="Paste address" onClick={() => setMode("own")} />
        </section>
      )}
    </div>
  );
}

function Choice({ title, text, action, onClick, highlight }: { title: string; text: string; action: string; onClick: () => void; highlight?: boolean }) {
  return (
    <div className={`flex flex-col rounded-3xl p-5 ring-1 ${highlight ? "bg-bg ring-fg" : "bg-soft ring-line"}`}>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted">{text}</p>
      <button className={`${highlight ? primary : secondary} mt-4 self-start`} onClick={onClick}>{action}</button>
    </div>
  );
}

async function linkCreated(userId: string, phrase: string, password: string) {
  const address = await saveWallet(userId, phrase, password);
  const kp = await keypairFromPhrase(phrase);
  const r = await linkWallet(address, "created", signProof(kp, walletProofMessage(userId, address)));
  if (r.error) throw new Error(r.error);
  return address;
}

function PasswordFields({ onSubmit, busy, label }: { onSubmit: (pw: string) => void; busy: boolean; label: string }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const tooShort = pw.length > 0 && pw.length < 8;
  const mismatch = pw2.length > 0 && pw !== pw2;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (pw.length >= 8 && pw === pw2) onSubmit(pw);
      }}
    >
      <p className="text-sm text-muted">
        Choose a <b>wallet password</b>. You&apos;ll type it to send gifts. It stays on this device and we never see it, so we can&apos;t reset it. If you forget it, use your 12 words.
      </p>
      <input type="password" placeholder="Wallet password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} className={input} autoComplete="new-password" />
      <input type="password" placeholder="Type it again" value={pw2} onChange={(e) => setPw2(e.target.value)} className={input} autoComplete="new-password" />
      {tooShort && <p className="text-sm text-red-500">At least 8 characters, please.</p>}
      {mismatch && <p className="text-sm text-red-500">The two passwords don&apos;t match.</p>}
      <button className={`${primary} self-start`} disabled={busy || pw.length < 8 || pw !== pw2}>{busy ? "Setting up…" : label}</button>
    </form>
  );
}

function CreateWallet({ userId, onDone, onCancel }: { userId: string; onDone: (a: string) => void; onCancel: () => void }) {
  const [phrase] = useState(newRecoveryPhrase);
  const [step, setStep] = useState<1 | 2>(1);
  const [savedIt, setSavedIt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <section className="rounded-3xl bg-soft p-6 ring-1 ring-line sm:p-8">
      <h2 className="font-display text-2xl font-semibold">{step === 1 ? "Your 12 recovery words" : "Lock your wallet"}</h2>
      {step === 1 ? (
        <>
          <p className="mt-2 text-sm text-fg">
            These words <b>are</b> your wallet. Write them on paper, in order, and keep them somewhere safe. Anyone with these words can take your money, so never share them, not even with us. If you lose this device, these words are the only way back in.
          </p>
          <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {phrase.split(" ").map((w, i) => (
              <li key={i} className="rounded-xl bg-soft px-3 py-2 font-mono text-sm">
                <span className="mr-2 text-muted">{i + 1}.</span>{w}
              </li>
            ))}
          </ol>
          <label className="mt-5 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={savedIt} onChange={(e) => setSavedIt(e.target.checked)} className="mt-1" />
            I&apos;ve written down all 12 words in order and put them somewhere safe.
          </label>
          <div className="mt-5 flex gap-2">
            <button className={primary} disabled={!savedIt} onClick={() => setStep(2)}>Next</button>
            <button className={secondary} onClick={onCancel}>Cancel</button>
          </div>
        </>
      ) : (
        <div className="mt-3">
          <PasswordFields
            busy={busy}
            label="Create my wallet"
            onSubmit={async (pw) => {
              setBusy(true);
              setError("");
              try {
                onDone(await linkCreated(userId, phrase, pw));
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong.");
                setBusy(false);
              }
            }}
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )}
    </section>
  );
}

function RestoreWallet({ userId, linked, onDone, onCancel }: { userId: string; linked: string | null; onDone: (a: string) => void; onCancel: () => void }) {
  const [phrase, setPhrase] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const valid = isValidPhrase(phrase);

  useEffect(() => {
    let live = true;
    if (valid) keypairFromPhrase(phrase).then((kp) => live && setAddress(kp.publicKey.toBase58()));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setAddress(null);
    return () => {
      live = false;
    };
  }, [phrase, valid]);

  return (
    <section className="rounded-3xl bg-soft p-6 ring-1 ring-line sm:p-8">
      <h2 className="font-display text-2xl font-semibold">Restore your wallet</h2>
      <p className="mt-2 text-sm text-fg">Type your 12 recovery words, in order, with spaces between them.</p>
      <textarea value={phrase} onChange={(e) => setPhrase(e.target.value)} rows={3} className={`${input} mt-3 font-mono`} autoComplete="off" spellCheck={false} />
      {phrase.trim().split(/\s+/).length >= 12 && !valid && <p className="mt-1 text-sm text-red-500">Those words don&apos;t make a valid recovery phrase. Check the spelling and order.</p>}
      {address && (
        <p className="mt-2 text-sm text-fg">
          Wallet found: <span className="font-mono">{address}</span>
          {linked && address !== linked && <span className="mt-1 block text-amber-400">This is a different wallet from the one on your account. Gifts will go to this one from now on.</span>}
        </p>
      )}
      {address && (
        <div className="mt-4">
          <PasswordFields
            busy={busy}
            label="Restore wallet"
            onSubmit={async (pw) => {
              setBusy(true);
              setError("");
              try {
                onDone(await linkCreated(userId, normalizePhrase(phrase), pw));
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong.");
                setBusy(false);
              }
            }}
          />
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <button className={`${secondary} mt-4`} onClick={onCancel}>Cancel</button>
    </section>
  );
}

function OwnAddress({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [address, setAddress] = useState("");
  const [sure, setSure] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = isAddress(address.trim());
  return (
    <section className="rounded-3xl bg-soft p-6 ring-1 ring-line sm:p-8">
      <h2 className="font-display text-2xl font-semibold">Use your own wallet address</h2>
      <p className="mt-2 text-sm text-fg">Paste the Solana address where you want to receive gifts (for example from Phantom). Double-check it: money sent to a wrong address can&apos;t be brought back.</p>
      <input value={address} onChange={(e) => setAddress(e.target.value)} className={`${input} mt-3 font-mono`} placeholder="Solana address" spellCheck={false} />
      {address && !ok && <p className="mt-1 text-sm text-red-500">That doesn&apos;t look like a Solana address.</p>}
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="mt-1" />
        I&apos;ve checked this is my address{IS_TEST_MONEY ? " (on the test network)" : ""}.
      </label>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          className={primary}
          disabled={!ok || !sure || busy}
          onClick={async () => {
            setBusy(true);
            const r = await linkWallet(address.trim(), "own");
            setBusy(false);
            if (r.error) setError(r.error);
            else onDone();
          }}
        >
          Save address
        </button>
        <button className={secondary} onClick={onCancel}>Cancel</button>
      </div>
    </section>
  );
}

function BalanceLine({ address, refreshKey = 0 }: { address: string; refreshKey?: number }) {
  const [b, setB] = useState<Balances | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    getBalances(address)
      .then((x) => live && setB(x))
      .catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, [address, refreshKey]);
  if (err) return <p className="mt-3 text-sm text-muted">Couldn&apos;t load the balance right now.</p>;
  return (
    <div className="mt-4 flex gap-6">
      <div><p className="text-xs uppercase tracking-wider text-muted">SOL</p><p className="text-2xl font-semibold">{b ? Number(b.sol.toFixed(4)) : "…"}</p></div>
      <div><p className="text-xs uppercase tracking-wider text-muted">USDC</p><p className="text-2xl font-semibold">{b ? `$${b.usdc.toFixed(2)}` : "…"}</p></div>
    </div>
  );
}

function Dashboard({ userId, address, onRemoved }: { userId: string; address: string; onRemoved: () => void }) {
  const [refresh, setRefresh] = useState(0);
  const [dialog, setDialog] = useState<"send" | "phrase" | null>(null);
  const reload = useCallback(() => setRefresh((n) => n + 1), []);

  return (
    <section className="rounded-3xl bg-soft p-6 ring-1 ring-line sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold">Your wallet</h2>
        {IS_TEST_MONEY && <TestMoneyBadge />}
      </div>
      <p className="mt-3 text-sm text-muted">Your address (share it to receive money):</p>
      <div className="mt-1"><CopyAddress address={address} /></div>
      <BalanceLine address={address} refreshKey={refresh} />

      <div className="mt-6 flex flex-wrap gap-2">
        <button className={primary} onClick={() => setDialog("send")}>Send</button>
        <button className={secondary} onClick={reload}>Refresh</button>
        {IS_TEST_MONEY && (
          <a className={secondary} href="https://faucet.solana.com" target="_blank" rel="noreferrer" title="Paste your address there to get free test SOL">
            Get free test SOL ↗
          </a>
        )}
        <button className={secondary} onClick={() => setDialog("phrase")}>Show my 12 words</button>
        <a className={secondary} href={explorerAddress(address)} target="_blank" rel="noreferrer">View on Solana Explorer ↗</a>
      </div>
      {IS_TEST_MONEY && (
        <p className="mt-3 text-xs text-muted">
          Free test money: copy your address above, then paste it at faucet.solana.com (test SOL) or faucet.circle.com (test USDC, choose Solana Devnet).
        </p>
      )}

      <button
        className="mt-8 text-xs text-muted underline hover:text-red-500"
        onClick={() => {
          if (confirm("Remove the wallet from this browser? You'll need your 12 words to open it again. The money stays in the wallet.")) {
            forgetLocalWallet(userId);
            onRemoved();
          }
        }}
      >
        Remove wallet from this browser
      </button>

      {dialog === "send" && <SendDialog userId={userId} onClose={() => setDialog(null)} onSent={reload} />}
      {dialog === "phrase" && <PhraseDialog userId={userId} onClose={() => setDialog(null)} />}
    </section>
  );
}

function SendDialog({ userId, onClose, onSent }: { userId: string; onClose: () => void; onSent: () => void }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("SOL");
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const unlock = useUnlock(userId);
  const n = Number(amount);
  const ok = isAddress(to.trim()) && n > 0;

  return (
    <Modal title="Send money" onClose={onClose}>
      {done ? (
        <div className="flex flex-col gap-3">
          <p>Sent ✓</p>
          <a className="text-sm underline" href={explorerTx(done)} target="_blank" rel="noreferrer">See it on Solana Explorer ↗</a>
          <button className={primary} onClick={onClose}>Close</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {(["SOL", "USDC"] as const).map((c) => (
              <button key={c} className={currency === c ? primary : secondary} onClick={() => setCurrency(c)}>{c}</button>
            ))}
          </div>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Send to (Solana address)" className={`${input} font-mono`} spellCheck={false} />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Amount in ${currency}`} inputMode="decimal" className={input} />
          {!unlock.isOpen() && unlock.field}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="text-xs text-muted">Double-check the address. Payments on the blockchain can&apos;t be reversed.</p>
          <button
            className={primary}
            disabled={!ok || unlock.busy}
            onClick={async () => {
              setError("");
              const kp = await unlock.getKeypair();
              if (!kp) return;
              try {
                const sig = await sendFunds(kp, to.trim(), toUnits(n, currency), currency);
                setDone(sig);
                onSent();
              } catch (e) {
                setError(explainChainError(e));
              }
            }}
          >
            {unlock.busy ? "Opening wallet…" : `Send ${amount || ""} ${currency}`}
          </button>
          <p className="text-xs text-muted">Minimum gift elsewhere on the site is {GIFT_MIN.SOL} SOL / ${GIFT_MIN.USDC}.</p>
        </div>
      )}
    </Modal>
  );
}

function PhraseDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [phrase, setPhrase] = useState<string | null>(null);
  const [error, setError] = useState("");
  return (
    <Modal title="Your 12 recovery words" onClose={onClose}>
      {phrase ? (
        <>
          <p className="text-sm text-fg">Make sure nobody can see your screen. Never share these words.</p>
          <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {phrase.split(" ").map((w, i) => (
              <li key={i} className="rounded-xl bg-soft px-3 py-2 font-mono text-sm"><span className="mr-2 text-muted">{i + 1}.</span>{w}</li>
            ))}
          </ol>
        </>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setPhrase((await unlockWallet(userId, password)).phrase);
            } catch {
              setError("That wallet password isn't right.");
            }
          }}
        >
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Wallet password" className={input} autoComplete="off" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className={`${primary} self-start`}>Show words</button>
        </form>
      )}
    </Modal>
  );
}
