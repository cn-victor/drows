"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "../Avatar";
import { BookIcon, DrowsMark, GearIcon, HomeIcon, MoonIcon, QuillIcon, SearchIcon, SunIcon, UserIcon, WalletIcon } from "../icons";
import { SITE_NAME } from "@/lib/site";

type Me = { username: string; name: string } | null;

function useNavItems(me: Me) {
  const items = [
    { href: "/", label: "Home", Icon: HomeIcon },
    { href: "/explore", label: "Explore", Icon: SearchIcon },
    { href: "/books", label: "Books", Icon: BookIcon },
  ];
  if (me) {
    items.push(
      { href: "/wallet", label: "Wallet", Icon: WalletIcon },
      { href: `/u/${me.username}`, label: "Profile", Icon: UserIcon },
      { href: "/settings", label: "Settings", Icon: GearIcon },
    );
  }
  return items;
}

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/") || path.startsWith(href + "?");
}

/** Light / dark switch. The choice is remembered in this browser. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("drows:theme", next);
    setTheme(next);
  };
  const Icon = theme === "dark" ? SunIcon : MoonIcon;
  return (
    <button onClick={flip} className="group flex items-center" title={theme === "dark" ? "Light mode" : "Dark mode"}>
      <span className="flex items-center gap-5 rounded-full p-3 transition group-hover:bg-hover">
        <Icon size={compact ? 24 : 26} />
        {!compact && <span className="hidden text-xl xl:inline">{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
      </span>
    </button>
  );
}

/** The left column on computers and tablets. */
export function SideNav({ me }: { me: Me }) {
  const path = usePathname();
  const items = useNavItems(me);
  return (
    <div className="sticky top-0 flex h-screen flex-col justify-between overflow-y-auto px-2 py-1 no-scrollbar xl:w-[260px]">
      <div className="flex flex-col items-center gap-1 xl:items-start">
        <Link href="/" className="mb-1 flex items-center gap-2 rounded-full p-3 hover:bg-hover" title={SITE_NAME}>
          <DrowsMark size={32} />
          <span className="hidden font-display text-3xl font-semibold xl:inline">{SITE_NAME}</span>
        </Link>
        {items.map(({ href, label, Icon }) => {
          const on = isActive(path, href);
          return (
            <Link key={href} href={href} className="group flex items-center" title={label}>
              <span className="flex items-center gap-5 rounded-full p-3 transition group-hover:bg-hover">
                <Icon size={26} filled={on} />
                <span className={`hidden text-xl xl:inline ${on ? "font-bold" : ""}`}>{label}</span>
              </span>
            </Link>
          );
        })}
        <ThemeToggle />
        {me ? (
          <Link
            href="/write"
            className="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-lg font-bold text-on-accent shadow-md transition hover:brightness-110 xl:w-[90%]"
            title="Write"
          >
            <QuillIcon size={26} className="xl:hidden" />
            <span className="hidden xl:inline">Write</span>
          </Link>
        ) : (
          <div className="mt-4 flex w-full flex-col gap-2 xl:w-[90%]">
            <Link href="/signup" className="flex h-12 items-center justify-center rounded-full bg-accent font-bold text-on-accent hover:brightness-110">
              <span className="hidden xl:inline">Join Drows</span>
              <span className="xl:hidden">Join</span>
            </Link>
            <Link href="/login" className="flex h-12 items-center justify-center rounded-full font-bold ring-1 ring-line hover:bg-hover">Log in</Link>
          </div>
        )}
      </div>

      {me && (
        <Link href={`/u/${me.username}`} className="my-3 flex items-center gap-3 rounded-full p-3 hover:bg-hover">
          <Avatar name={me.name} username={me.username} size={40} />
          <span className="hidden min-w-0 leading-tight xl:block">
            <span className="block truncate font-bold">{me.name}</span>
            <span className="block truncate text-muted">@{me.username}</span>
          </span>
        </Link>
      )}
    </div>
  );
}

/** Phones: a floating rounded bar (like X) with the current page in a soft pill,
 *  plus a round Write button above it on the right. */
export function BottomNav({ me }: { me: Me }) {
  const path = usePathname();
  const all = useNavItems(me);
  const pick = (label: string) => all.find((i) => i.label === label)!;
  const items = me
    ? [pick("Home"), pick("Explore"), pick("Books"), pick("Wallet"), pick("Profile")]
    : [pick("Home"), pick("Explore"), pick("Books")];
  const cell = (href: string, label: string, on: boolean, icon: React.ReactNode) => (
    <Link key={href} href={href} aria-label={label} aria-current={on ? "page" : undefined} className="flex flex-1 items-center justify-center">
      <span className={`flex h-11 w-14 items-center justify-center rounded-full transition ${on ? "bg-hover" : ""}`}>{icon}</span>
    </Link>
  );
  return (
    <>
      {me && path !== "/write" && (
        <Link
          href="/write"
          aria-label="Write a poem"
          className="fixed bottom-[5.75rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-fg text-bg shadow-[0_6px_24px_rgba(0,0,0,0.35)] transition active:scale-95 sm:hidden"
        >
          <QuillIcon size={24} />
        </Link>
      )}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-center rounded-full bg-bg/80 px-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-line backdrop-blur-xl sm:hidden">
        {items.map(({ href, label, Icon }) => cell(href, label, isActive(path, href), <Icon size={26} filled={isActive(path, href)} />))}
        {!me && cell("/login", "Log in", path === "/login", <UserIcon size={26} filled={path === "/login"} />)}
      </nav>
    </>
  );
}

/** Phones: the top bar, like X — your picture on the left, the Drows mark in the middle. */
export function MobileTop({ me }: { me: Me }) {
  return (
    <div className="relative flex h-14 items-center justify-between px-4 sm:hidden">
      {me ? (
        <Link href={`/u/${me.username}`} aria-label="Your profile"><Avatar name={me.name} username={me.username} size={34} /></Link>
      ) : (
        <span className="w-9" />
      )}
      <Link href="/" aria-label={SITE_NAME} className="absolute left-1/2 -translate-x-1/2"><DrowsMark size={30} /></Link>
      {me ? (
        <span className="w-9" />
      ) : (
        <Link href="/login" className="rounded-full px-3 py-1.5 text-sm font-bold ring-1 ring-line">Log in</Link>
      )}
    </div>
  );
}
