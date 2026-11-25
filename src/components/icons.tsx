// Simple outline icons used across the app. `filled` draws the solid version (e.g. the active tab).
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { filled?: boolean; size?: number };

function Svg({ filled, size = 24, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: P) => (
  <Svg {...p}>
    {p.filled ? <path d="M12 2.6 2.5 10v11a1 1 0 0 0 1 1H9v-7h6v7h5.5a1 1 0 0 0 1-1V10L12 2.6Z" /> : <path d="M3.5 10.5 12 3.5l8.5 7V20.5h-5.5v-6.5h-6v6.5H3.5Z" />}
  </Svg>
);
export const SearchIcon = (p: P) => (
  <Svg {...p} filled={false} strokeWidth={p.filled ? 2.6 : 1.8}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.8-4.8" />
  </Svg>
);
export const BookIcon = (p: P) => (
  <Svg {...p}>
    {p.filled ? (
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5a1.5 1.5 0 0 0 0 3H20v1H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
    ) : (
      <>
        <path d="M5 19.5v-15A2.5 2.5 0 0 1 7.5 2H19v16H7.5A2.5 2.5 0 0 0 5 20.5 2.5 2.5 0 0 0 7.5 23H19" />
        <path d="M9 7h6" />
      </>
    )}
  </Svg>
);
export const WalletIcon = (p: P) => (
  <Svg {...p}>
    {p.filled ? (
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H18v3h1.5A1.5 1.5 0 0 1 21 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-14A2.5 2.5 0 0 1 3 17.5v-11Zm13.5 7a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
    ) : (
      <>
        <path d="M18 7V4H5.5A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h14a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 19.5 7H5.5A2.5 2.5 0 0 1 3 4.5" />
        <circle cx="16.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      </>
    )}
  </Svg>
);
export const UserIcon = (p: P) => (
  <Svg {...p}>
    {p.filled ? (
      <>
        <circle cx="12" cy="7.5" r="4.5" />
        <path d="M3.5 21a8.5 8.5 0 0 1 17 0Z" />
      </>
    ) : (
      <>
        <circle cx="12" cy="7.5" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0Z" />
      </>
    )}
  </Svg>
);
export const GearIcon = (p: P) => (
  <Svg {...p} filled={false} strokeWidth={p.filled ? 2.4 : 1.8}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </Svg>
);
export const QuillIcon = (p: P) => (
  <Svg {...p} filled={false}>
    <path d="M20 3c-6 0-11 4-13 11l-2 7 2-1c1-3 2-4 4-5 4-1 7-4 9-12Z" />
    <path d="M7 14c2-1 4-1 6-3" />
  </Svg>
);
export const SunIcon = (p: P) => (
  <Svg {...p} filled={false}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);
export const MoonIcon = (p: P) => (
  <Svg {...p} filled={false}>
    <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
  </Svg>
);
export const HeartIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4 7.4 4c2 0 3.5 1.1 4.6 2.7C13.1 5.1 14.6 4 16.6 4c3.5 0 5.8 3.6 4.6 7.1-1.7 4.8-9.2 9.4-9.2 9.4Z" />
  </Svg>
);
export const RepostIcon = (p: P) => (
  <Svg {...p} filled={false} strokeWidth={p.filled ? 2.4 : 1.8}>
    <path d="M4 9V7.5A2.5 2.5 0 0 1 6.5 5H18m0 0-3-3m3 3-3 3M20 15v1.5a2.5 2.5 0 0 1-2.5 2.5H6m0 0 3 3m-3-3 3-3" />
  </Svg>
);
export const CommentIcon = (p: P) => (
  <Svg {...p} filled={false}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4.5V16a1 1 0 0 1-1-1V5.5Z" />
  </Svg>
);
export const GiftIcon = (p: P) => (
  <Svg {...p} filled={false}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v8.5h14V12M12 8v12.5M12 8S10.5 3 7.8 3.6C5.5 4.1 6.6 8 12 8Zm0 0s1.5-5 4.2-4.4C18.5 4.1 17.4 8 12 8Z" />
  </Svg>
);
export const ShareIcon = (p: P) => (
  <Svg {...p} filled={false}>
    <path d="M12 3v12M7 8l5-5 5 5M5 14v5.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V14" />
  </Svg>
);
export const BackIcon = (p: P) => (
  <Svg {...p} filled={false}>
    <path d="M20 12H4m0 0 6-6m-6 6 6 6" />
  </Svg>
);
export const PlayIcon = (p: P) => (
  <Svg {...p} filled>
    <path d="M7 4.5v15l13-7.5-13-7.5Z" />
  </Svg>
);
export const CalendarIcon = (p: P) => (
  <Svg {...p} filled={false}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

/** The Drows mark: a quill inside a circle. */
export const DrowsMark = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    <circle cx="16" cy="16" r="15" fill="var(--accent)" />
    <path d="M23 7c-5 0-9 3.4-10.6 9.2L11 22l1.6-.8c.8-2.4 1.7-3.4 3.4-4.1 3.3-.9 5.8-3.4 7-10.1Z" fill="#fff" />
    <path d="M11 22.5 9.4 25" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
