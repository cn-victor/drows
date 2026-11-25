"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Avatar from "../Avatar";
import { BellIcon, BookmarkIcon, BooksIcon, ChatIcon, DrowsMark, GearIcon, HomeIcon, MoonIcon, QuillIcon, SearchIcon, SunIcon, UserIcon, WalletIcon } from "../icons";
import { SITE_NAME } from "@/lib/site";

type Me = { username: string; name: string; alerts: number; inbox: number } | null;
type Item = { href: string; label: string; Icon: (p: { size?: number; filled?: boolean }) => ReactNode; badge?: number };

function useNavItems(me: Me): Item[] {
  const home = { href: "/", label: "Home", Icon: HomeIcon };
  const explore = { href: "/explore", label: "Explore", Icon: SearchIcon };
  const books = { href: "/books", label: "Books", Icon: BooksIcon };
  if (!me) return [home, explore, books];
  return [
    home,
    explore,
    { href: "/notifications", label: "Notifications", Icon: BellIcon, badge: me.alerts },
    { href: "/messages", label: "Messages", Icon: ChatIcon, badge: me.inbox },
    books,
    { href: "/saved", label: "Saved", Icon: BookmarkIcon },
    { href: "/wallet", label: "Wallet", Icon: WalletIcon },
    { href: `/u/${me.username}`, label: "Profile", Icon: UserIcon },
    { href: "/settings", label: "Settings", Icon: GearIcon },
  ];
}

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/") || path.startsWith(href + "?");
}

/** A small number on an icon for new notifications or messages. */
function Badge({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold leading-none text-on-accent ring-2 ring-bg">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function ItemIcon({ item, on, size }: { item: Item; on: boolean; size: number }) {
  const { Icon } = item;
  return (
    <span className="relative flex">
      <Icon size={size} filled={on} />
      <Badge n={on ? 0 : item.badge} />
    </span>
  );
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
    document.documentElement.setAttribute("data-theme", next);
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
      <div className="flex flex-col items-center gap-0.5 xl:items-start">
        <Link href="/" className="mb-1 flex items-center gap-2 rounded-full p-3 hover:bg-hover" title={SITE_NAME}>
          <DrowsMark size={32} />
          <span className="hidden font-display text-3xl font-semibold xl:inline">{SITE_NAME}</span>
        </Link>
        {items.map((item) => {
          const on = isActive(path, item.href);
          return (
            <Link key={item.href} href={item.href} className="group flex items-center" title={item.label}>
              <span className="flex items-center gap-5 rounded-full p-3 transition group-hover:bg-hover">
                <ItemIcon item={item} on={on} size={26} />
                <span className={`hidden text-xl xl:inline ${on ? "font-bold" : ""}`}>{item.label}</span>
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

/** Phones: a floating rounded bar (Home, Explore, Books, Messages) with the current page in a soft pill,
 *  plus a round Write button above it on the right. */
export function BottomNav({ me }: { me: Me }) {
  const path = usePathname();
  const all = useNavItems(me);
  const pick = (label: string) => all.find((i) => i.label === label)!;
  const items = me ? [pick("Home"), pick("Explore"), pick("Books"), pick("Messages")] : [...all, { href: "/login", label: "Log in", Icon: UserIcon }];
  return (
    <>
      {me && path !== "/write" && !path.startsWith("/messages/") && (
        <Link
          href="/write"
          aria-label="Write a poem"
          className="fixed bottom-[5.75rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-fg text-bg shadow-[0_6px_24px_rgba(0,0,0,0.35)] transition active:scale-95 sm:hidden"
        >
          <QuillIcon size={24} />
        </Link>
      )}
      <nav className="fixed inset-x-3 bottom-3 z-40 mx-auto flex h-16 max-w-[366px] items-center justify-between rounded-full bg-bg/90 px-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-line backdrop-blur-xl sm:hidden">
        {items.map((item) => {
          const on = isActive(path, item.href);
          return (
            <Link key={item.href} href={item.href} aria-label={item.label} aria-current={on ? "page" : undefined} className="flex items-center justify-center">
              <span className={`flex h-11 w-14 items-center justify-center rounded-full transition ${on ? "bg-hover" : ""}`}>
                <ItemIcon item={item} on={on} size={26} />
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

/** Phones: the top bar — your picture on the left (opens your menu), the Drows mark in the middle,
 *  and the bell on the right. */
export function MobileTop({ me }: { me: Me }) {
  const [openOn, setOpenOn] = useState<string | null>(null);
  const path = usePathname();
  const open = openOn === path; // closes by itself when you go to another page
  return (
    <div className="relative flex h-14 items-center justify-between px-4 sm:hidden">
      {me ? (
        <button onClick={() => setOpenOn(path)} aria-label="Your menu">
          <Avatar name={me.name} username={me.username} size={34} />
        </button>
      ) : (
        <span className="w-[34px]" />
      )}
      <Link href="/" aria-label={SITE_NAME} className="absolute left-1/2 -translate-x-1/2"><DrowsMark size={28} /></Link>
      {me ? (
        <Link href="/notifications" aria-label={me.alerts ? `Notifications, ${me.alerts} new` : "Notifications"} className="relative flex">
          <BellIcon size={26} filled={path === "/notifications"} />
          <Badge n={path === "/notifications" ? 0 : me.alerts} />
        </Link>
      ) : (
        <Link href="/login" className="rounded-full px-3 py-1.5 text-sm font-bold ring-1 ring-line">Log in</Link>
      )}
      {me && open && <Drawer me={me} onClose={() => setOpenOn(null)} />}
    </div>
  );
}

/** The menu that slides in from the left when you tap your picture (phones). */
function Drawer({ me, onClose }: { me: NonNullable<Me>; onClose: () => void }) {
  const links: Item[] = [
    { href: `/u/${me.username}`, label: "Profile", Icon: UserIcon },
    { href: "/wallet", label: "Wallet", Icon: WalletIcon },
    { href: "/saved", label: "Saved", Icon: BookmarkIcon },
    { href: "/notifications", label: "Notifications", Icon: BellIcon, badge: me.alerts },
    { href: "/settings", label: "Settings", Icon: GearIcon },
  ];
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Your menu">
      <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={onClose} />
      <nav className="absolute inset-y-0 left-0 flex w-[80%] max-w-[300px] flex-col overflow-y-auto bg-bg px-6 py-5 shadow-2xl">
        <Link href={`/u/${me.username}`} onClick={onClose}><Avatar name={me.name} username={me.username} size={40} /></Link>
        <Link href={`/u/${me.username}`} onClick={onClose} className="mt-2 leading-tight">
          <span className="block text-lg font-bold">{me.name}</span>
          <span className="block text-muted">@{me.username}</span>
        </Link>
        <div className="mt-6 flex flex-col">
          {links.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-5 py-3.5 text-xl font-bold">
              <ItemIcon item={item} on={false} size={24} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
