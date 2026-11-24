import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import WalletPanel from "@/components/wallet/WalletPanel";
import { explorerTx, formatAmount, PLATFORM_FEE_PERCENT, type Currency } from "@/lib/chain";
import { currentUser } from "@/server/auth";
import { giftsReceived, giftsSent, type GiftRow } from "@/server/gifts";

export const metadata = { title: "Wallet" };

function totals(rows: GiftRow[], field: "writer" | "total") {
  const t: Record<Currency, bigint> = { SOL: BigInt(0), USDC: BigInt(0) };
  for (const r of rows) t[r.currency] += BigInt(r[field]);
  return (["USDC", "SOL"] as const).filter((c) => t[c] > BigInt(0)).map((c) => formatAmount(t[c], c));
}

function History({ title, rows, dir }: { title: string; rows: GiftRow[]; dir: "received" | "sent" }) {
  const sum = totals(rows, dir === "received" ? "writer" : "total");
  return (
    <section className="rounded-3xl bg-white/80 p-6 ring-1 ring-black/5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        {sum.length > 0 && <p className="text-sm text-muted">Total: <b className="text-ink">{sum.join(" + ")}</b></p>}
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{dir === "received" ? "No gifts yet. When readers send you one, it shows here." : "You haven't sent any gifts yet."}</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-black/5">
          {rows.map((g) => (
            <li key={g.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 text-sm">
              <b className="text-base">{formatAmount(dir === "received" ? g.writer : g.total, g.currency)}</b>
              <span>
                {dir === "received" ? "from " : "to "}
                <Link href={`/u/${g.other.username}`} className="font-medium hover:underline">{g.other.name}</Link>
                {" for "}
                <Link href={`/p/${g.poemId}`} className="italic hover:underline">{g.poemTitle}</Link>
              </span>
              <span className="text-muted">{new Date(g.at).toLocaleDateString()}</span>
              <a href={explorerTx(g.signature)} target="_blank" rel="noreferrer" className="text-xs text-muted underline">receipt ↗</a>
              {g.message && <p className="w-full font-serif text-base italic text-neutral-700">&ldquo;{g.message}&rdquo;</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function Body() {
  const me = await currentUser();
  if (!me) redirect("/login?next=/wallet");
  const [received, sent] = await Promise.all([giftsReceived(me.id), giftsSent(me.id)]);
  return (
    <div className="flex flex-col gap-8">
      <WalletPanel userId={me.id} linked={me.walletAddress} kind={me.walletKind} />
      <History title="Gifts you received" rows={received} dir="received" />
      <History title="Gifts you sent" rows={sent} dir="sent" />
      <p className="text-xs leading-relaxed text-muted">
        How gifts work: readers pay from their own wallet straight to yours on Solana. You receive {100 - PLATFORM_FEE_PERCENT}% and the platform keeps{" "}
        {PLATFORM_FEE_PERCENT}%. The platform never holds your money or your keys: your wallet lives in your browser, protected by your password and your 12 recovery words.
      </p>
    </div>
  );
}

export default function WalletPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="mb-8 font-display text-4xl font-semibold">Wallet</h1>
        <Suspense fallback={<p className="text-muted">Opening your wallet…</p>}>
          <Body />
        </Suspense>
      </main>
    </>
  );
}
