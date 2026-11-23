"use client";
import { useEditorState, type Editor } from "@tiptap/react";
import { FONTS, TEXT_SIZES } from "@/lib/fonts";
import { getTheme } from "@/lib/themes";

const btn = "h-9 min-w-9 px-2 rounded-lg text-sm grid place-items-center transition hover:bg-black/10 disabled:opacity-30";
const on = "bg-black/80 text-white hover:bg-black/80";

/** The formatting buttons above the poem. */
export default function Toolbar({ editor, themeId }: { editor: Editor; themeId: string }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      quote: e.isActive("blockquote"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      left: e.isActive({ textAlign: "left" }),
      center: e.isActive({ textAlign: "center" }),
      right: e.isActive({ textAlign: "right" }),
      font: (e.getAttributes("textStyle").fontFamily as string) ?? "",
      size: (e.getAttributes("textStyle").fontSize as string) ?? "",
      color: (e.getAttributes("textStyle").color as string) ?? "",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();
  const theme = getTheme(themeId);
  const swatches = Array.from(new Set([theme.ink, theme.accent, theme.muted, "#b71c1c", "#e65100", "#f9a825", "#2e7d32", "#1565c0", "#6a1b9a", "#ffffff", "#000000"]));
  const block = s.h1 ? "h1" : s.h2 ? "h2" : s.h3 ? "h3" : s.quote ? "quote" : "p";

  return (
    // On phones the buttons sit in one row you can swipe sideways; on bigger screens they wrap.
    <div className="flex flex-nowrap items-center gap-1 overflow-x-auto rounded-2xl bg-white/85 px-2 py-1.5 text-neutral-800 shadow-sm ring-1 ring-black/5 backdrop-blur [scrollbar-width:none] sm:flex-wrap [&>*]:shrink-0">
      <button className={btn} title="Undo" disabled={!s.canUndo} onClick={() => c().undo().run()}>↶</button>
      <button className={btn} title="Redo" disabled={!s.canRedo} onClick={() => c().redo().run()}>↷</button>
      <Sep />
      <select
        title="Line type"
        className="h-9 rounded-lg bg-transparent px-1 text-sm hover:bg-black/5"
        value={block}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") c().setParagraph().run();
          else if (v === "quote") c().setParagraph().toggleBlockquote().run();
          else c().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
        }}
      >
        <option value="p">Line</option>
        <option value="h1">Big title</option>
        <option value="h2">Subtitle</option>
        <option value="h3">Section</option>
        <option value="quote">Quote</option>
      </select>
      <Sep />
      <button className={`${btn} font-bold ${s.bold ? on : ""}`} title="Bold (Ctrl+B)" onClick={() => c().toggleBold().run()}>B</button>
      <button className={`${btn} italic font-serif ${s.italic ? on : ""}`} title="Italic (Ctrl+I)" onClick={() => c().toggleItalic().run()}>I</button>
      <button className={`${btn} underline ${s.underline ? on : ""}`} title="Underline (Ctrl+U)" onClick={() => c().toggleUnderline().run()}>U</button>
      <button className={`${btn} line-through ${s.strike ? on : ""}`} title="Strike through" onClick={() => c().toggleStrike().run()}>S</button>
      <Sep />
      <button className={`${btn} ${s.left ? on : ""}`} title="Line to the left" onClick={() => c().setTextAlign("left").run()}><AlignIcon kind="left" /></button>
      <button className={`${btn} ${s.center ? on : ""}`} title="Line in the centre" onClick={() => c().setTextAlign("center").run()}><AlignIcon kind="center" /></button>
      <button className={`${btn} ${s.right ? on : ""}`} title="Line to the right" onClick={() => c().setTextAlign("right").run()}><AlignIcon kind="right" /></button>
      <button className={btn} title="Indent this line (or press Tab)" onClick={() => c().insertContent({ type: "text", text: "    " }).run()}>⇥</button>
      <Sep />
      <select
        title="Font for selected words"
        className="h-9 max-w-28 rounded-lg bg-transparent px-1 text-sm hover:bg-black/5"
        value={s.font}
        onChange={(e) => (e.target.value ? c().setFontFamily(e.target.value).run() : c().unsetFontFamily().run())}
      >
        <option value="">Poem font</option>
        {FONTS.map((f) => (
          <option key={f.key} value={f.css} style={{ fontFamily: f.css }}>{f.label}</option>
        ))}
      </select>
      <select
        title="Size of selected words"
        className="h-9 rounded-lg bg-transparent px-1 text-sm hover:bg-black/5"
        value={s.size}
        onChange={(e) => (e.target.value ? c().setFontSize(e.target.value).run() : c().unsetFontSize().run())}
      >
        <option value="">Size</option>
        {TEXT_SIZES.map((z) => (
          <option key={z.value} value={z.value}>{z.label}</option>
        ))}
      </select>
      <div className="flex items-center gap-0.5 px-1" title="Colour of selected words">
        {swatches.map((col) => (
          <button
            key={col}
            aria-label={`Colour ${col}`}
            className={`h-5 w-5 rounded-full ring-1 ring-black/20 transition hover:scale-110 ${s.color === col ? "ring-2 ring-black scale-110" : ""}`}
            style={{ background: col }}
            onClick={() => c().setColor(col).run()}
          />
        ))}
        <label className="relative h-5 w-5 cursor-pointer overflow-hidden rounded-full ring-1 ring-black/20" title="Pick any colour" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
          <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => c().setColor(e.target.value).run()} />
        </label>
      </div>
      <Sep />
      <button className={btn} title="Stanza divider" onClick={() => c().setHorizontalRule().run()}>✦</button>
      <button className={btn} title="Remove formatting from selected words" onClick={() => c().unsetAllMarks().unsetTextAlign().run()}>⌫</button>
    </div>
  );
}

function Sep() {
  return <span className="mx-0.5 h-6 w-px bg-black/10" />;
}

function AlignIcon({ kind }: { kind: "left" | "center" | "right" }) {
  const x = (w: number) => (kind === "left" ? 2 : kind === "right" ? 16 - w : (18 - w) / 2);
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor" aria-hidden>
      {[14, 9, 12, 7].map((w, i) => (
        <rect key={i} x={x(w)} y={i * 3.5} width={w} height="1.8" rx="0.9" />
      ))}
    </svg>
  );
}
