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

/** The bottom bar on phones, plus the round Write button. */
export function BottomNav({ me }: { me: Me }) {
  const path = usePathname();
  const items = useNavItems(me).filter((i) => i.label !== "Settings");
  return (
    <>
      {me && (
        <Link
          href="/write"
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg sm:hidden"
          aria-label="Write"
        >
          <QuillIcon size={26} />
        </Link>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t border-line bg-bg/90 backdrop-blur sm:hidden">
        {items.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-label={label} className="flex h-full flex-1 items-center justify-center">
            <Icon size={26} filled={isActive(path, href)} />
          </Link>
        ))}
        {!me && (
          <Link href="/login" className="flex h-full flex-1 items-center justify-center" aria-label="Log in">
            <UserIcon size={26} />
          </Link>
        )}
      </nav>
    </>
  );
}

/** The top bar on phones (logo and your picture). */
export function MobileTop({ me }: { me: Me }) {
  return (
    <div className="flex h-12 items-center justify-between px-4 sm:hidden">
      {me ? (
        <Link href={`/u/${me.username}`} aria-label="Your profile"><Avatar name={me.name} username={me.username} size={32} /></Link>
      ) : (
        <span className="w-8" />
      )}
      <Link href="/" aria-label={SITE_NAME}><DrowsMark size={28} /></Link>
      <ThemeToggle compact />
    </div>
  );
}
