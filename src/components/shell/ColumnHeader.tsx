"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BackIcon } from "../icons";

/** The see-through bar at the top of the middle column: an optional back arrow, a title, and tabs. */
export default function ColumnHeader({ title, subtitle, back = false, desktopOnlyTitle = false, children }: { title?: ReactNode; subtitle?: ReactNode; back?: boolean; desktopOnlyTitle?: boolean; children?: ReactNode }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
      {title && (
        <div className={`h-[53px] items-center gap-6 px-4 ${desktopOnlyTitle ? "hidden sm:flex" : "flex"}`}>
          {back && (
            <button
              onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
              className="-ml-2 rounded-full p-2 hover:bg-hover"
              aria-label="Back"
            >
              <BackIcon size={20} />
            </button>
          )}
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-xl font-bold">{title}</h1>
            {subtitle && <p className="truncate text-[13px] text-muted">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/** Tabs that sit under a column header, with the X-style underline on the active one. */
export function Tabs({ tabs, active }: { tabs: { id: string; label: string; href: string }[]; active: string }) {
  return (
    <nav className="flex overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <Link key={t.id} href={t.href} className="flex min-w-[80px] flex-1 justify-center px-4 hover:bg-hover">
          <span className={`relative py-4 text-[15px] ${active === t.id ? "font-bold" : "text-muted"}`}>
            {t.label}
            {active === t.id && <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-accent" />}
          </span>
        </Link>
      ))}
    </nav>
  );
}
