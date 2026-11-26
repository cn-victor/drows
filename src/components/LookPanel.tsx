"use client";
import { FONTS } from "@/lib/fonts";
import { defaultStyle, type PoemStyle } from "@/lib/poem";
import { AMBIENTS, THEMES } from "@/lib/themes";

const label = "text-xs font-semibold uppercase tracking-wider text-muted";
const chip = "rounded-full px-3 py-1.5 text-sm ring-1 ring-line transition hover:bg-hover";
const chipOn = "bg-ink text-paper ring-ink hover:bg-ink";

/** The side panel where the writer picks the poem's look. */
export default function LookPanel({ style, onChange }: { style: PoemStyle; onChange: (s: PoemStyle) => void }) {
  const set = (patch: Partial<PoemStyle>) => onChange({ ...style, ...patch });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className={label}>Layout</h2>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["page", "Single page", "The whole poem on one screen"],
            ["slides", "Picture cards", "4:5 cards readers swipe, like a photo post. Each can be saved as a picture"],
          ] as const).map(([id, name, hint]) => (
            <button
              key={id}
              onClick={() => onChange({ ...style, layout: id })}
              className={`flex flex-col items-start gap-2 rounded-xl p-3 text-left ring-1 transition ${style.layout === id ? "ring-2 ring-accent" : "ring-line hover:bg-hover"}`}
            >
              <span className="flex h-10 items-end gap-1" aria-hidden>
                {id === "page" ? (
                  <span className="h-10 w-7 rounded-sm bg-fg/70" />
                ) : (
                  <>
                    <span className="h-10 w-7 rounded-sm bg-fg/70" />
                    <span className="h-8 w-6 rounded-sm bg-fg/40" />
                    <span className="h-6 w-5 rounded-sm bg-fg/20" />
                  </>
                )}
              </span>
              <span className="text-sm font-bold">{name}</span>
              <span className="text-xs text-muted">{hint}</span>
            </button>
          ))}
        </div>
        {style.layout === "slides" && (
          <p className="text-xs leading-relaxed text-muted">
            Press <b>⧉ New slide</b> in the toolbar (or Ctrl + Enter) where each slide should start. With no slide breaks, each stanza becomes a slide.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={label}>Theme</h2>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              // Choosing a theme also brings its matching font and background motion.
              onClick={() => onChange({ ...defaultStyle(t.id), size: style.size, lineHeight: style.lineHeight, align: style.align })}
              className={`group relative h-16 overflow-hidden rounded-xl text-left ring-offset-2 transition ${style.theme === t.id ? "ring-2 ring-ink" : "ring-1 ring-line hover:ring-line"}`}
              style={{ background: t.background, color: t.ink }}
            >
              <span className="absolute bottom-1.5 left-2.5 text-[15px] leading-tight" style={{ fontFamily: FONTS.find((f) => f.key === t.font)?.css }}>
                {t.name}
              </span>
              {t.ambient !== "none" && <span className="absolute right-2 top-1.5 text-[10px] opacity-70">✧ {t.ambient}</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={label}>Poem font</h2>
        <div className="flex flex-wrap gap-1.5">
          {FONTS.map((f) => (
            <button key={f.key} className={`${chip} ${style.font === f.key ? chipOn : ""}`} style={{ fontFamily: f.css }} onClick={() => set({ font: f.key })}>
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={label}>Text size</h2>
        <div className="flex gap-1.5">
          {(["s", "m", "l"] as const).map((z) => (
            <button key={z} className={`${chip} ${style.size === z ? chipOn : ""}`} onClick={() => set({ size: z })}>
              {z === "s" ? "Small" : z === "m" ? "Medium" : "Large"}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={label}>Line spacing</h2>
        <input
          type="range"
          min={1.1}
          max={2.6}
          step={0.1}
          value={style.lineHeight}
          onChange={(e) => set({ lineHeight: Number(e.target.value) })}
          className="accent-[var(--accent)]"
        />
        <div className="flex justify-between text-xs text-muted"><span>Tight</span><span>Airy</span></div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={label}>Whole poem lines up</h2>
        <div className="flex gap-1.5">
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} className={`${chip} ${style.align === a ? chipOn : ""}`} onClick={() => set({ align: a })}>
              {a === "left" ? "Left" : a === "center" ? "Centre" : "Right"}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={label}>Background motion</h2>
        <div className="flex flex-wrap gap-1.5">
          {AMBIENTS.map((a) => (
            <button key={a.id} className={`${chip} ${style.ambient === a.id ? chipOn : ""}`} onClick={() => set({ ambient: a.id })}>
              {a.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
