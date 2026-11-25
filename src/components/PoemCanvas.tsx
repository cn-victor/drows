import type { CSSProperties, ReactNode } from "react";
import Ambient from "./Ambient";
import { fontCss } from "@/lib/fonts";
import { SIZE_PX, type PoemStyle } from "@/lib/poem";
import { getTheme } from "@/lib/themes";

/** CSS settings that give a poem its theme, font, size and spacing. */
export function poemVars(style: PoemStyle): CSSProperties {
  const t = getTheme(style.theme);
  return {
    background: t.background,
    color: t.ink,
    ["--poem-ink" as string]: t.ink,
    ["--poem-muted" as string]: t.muted,
    ["--poem-accent" as string]: t.accent,
    ["--poem-on-accent" as string]: t.dark ? "#14101f" : "#ffffff",
    ["--poem-font" as string]: fontCss(style.font),
    ["--poem-size" as string]: SIZE_PX[style.size],
    ["--poem-line" as string]: String(style.lineHeight),
    ["--poem-align" as string]: style.align,
  };
}

/** The themed "page" a poem sits on, with its moving background behind it. */
export default function PoemCanvas({ style, children, className = "" }: { style: PoemStyle; children: ReactNode; className?: string }) {
  return (
    <div className={`relative isolate overflow-clip ${className}`} style={poemVars(style)}>
      <Ambient kind={style.ambient} />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
