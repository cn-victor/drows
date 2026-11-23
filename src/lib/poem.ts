// What a poem is made of, plus the safety checks and the HTML printer used to show it.
import { AMBIENTS, getTheme, type Ambient } from "./themes";
import { FONTS, FONT_CSS, TEXT_SIZE_VALUES } from "./fonts";

export type PoemStyle = {
  theme: string;
  font: string; // font key
  size: "s" | "m" | "l";
  lineHeight: number;
  align: "left" | "center" | "right";
  ambient: Ambient;
};

export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export type Poem = {
  id: string;
  title: string;
  author: string;
  doc: DocNode;
  style: PoemStyle;
  createdAt: number;
  updatedAt: number;
};

export const SIZE_PX: Record<PoemStyle["size"], string> = { s: "18px", m: "22px", l: "27px" };

export function defaultStyle(themeId = "parchment"): PoemStyle {
  const t = getTheme(themeId);
  return { theme: t.id, font: t.font, size: "m", lineHeight: 1.7, align: "left", ambient: t.ambient };
}

export const LIMITS = { title: 120, author: 60, docBytes: 200_000 };

const BLOCKS = new Set(["paragraph", "heading", "blockquote", "horizontalRule"]);
const INLINE = new Set(["text", "hardBreak"]);
const SIMPLE_MARKS = new Set(["bold", "italic", "underline", "strike"]);
const ALIGNS = new Set(["left", "center", "right", "justify"]);
const HEX = /^#[0-9a-fA-F]{6}$/;

function cleanAlign(attrs?: Record<string, unknown>) {
  const a = attrs?.textAlign;
  return typeof a === "string" && ALIGNS.has(a) ? { textAlign: a } : undefined;
}

function cleanMarks(marks: DocNode["marks"]) {
  if (!Array.isArray(marks)) return undefined;
  const out: NonNullable<DocNode["marks"]> = [];
  for (const m of marks) {
    if (!m || typeof m.type !== "string") continue;
    if (SIMPLE_MARKS.has(m.type)) out.push({ type: m.type });
    else if (m.type === "textStyle") {
      const attrs: Record<string, string> = {};
      const { color, fontFamily, fontSize } = m.attrs ?? {};
      if (typeof color === "string" && HEX.test(color)) attrs.color = color;
      if (typeof fontFamily === "string" && FONT_CSS.has(fontFamily)) attrs.fontFamily = fontFamily;
      if (typeof fontSize === "string" && TEXT_SIZE_VALUES.has(fontSize)) attrs.fontSize = fontSize;
      if (Object.keys(attrs).length) out.push({ type: "textStyle", attrs });
    }
  }
  return out.length ? out : undefined;
}

function cleanInline(nodes: unknown): DocNode[] {
  if (!Array.isArray(nodes)) return [];
  const out: DocNode[] = [];
  for (const n of nodes as DocNode[]) {
    if (!n || !INLINE.has(n.type)) continue;
    if (n.type === "hardBreak") out.push({ type: "hardBreak" });
    else if (typeof n.text === "string" && n.text.length) out.push({ type: "text", text: n.text, marks: cleanMarks(n.marks) });
  }
  return out;
}

function cleanBlocks(nodes: unknown, depth = 0): DocNode[] {
  if (!Array.isArray(nodes)) return [];
  const out: DocNode[] = [];
  for (const n of nodes as DocNode[]) {
    if (!n || !BLOCKS.has(n.type)) continue;
    if (n.type === "horizontalRule") out.push({ type: "horizontalRule" });
    else if (n.type === "blockquote") {
      if (depth < 2) out.push({ type: "blockquote", content: cleanBlocks(n.content, depth + 1) });
    } else if (n.type === "heading") {
      const level = [1, 2, 3].includes(Number(n.attrs?.level)) ? Number(n.attrs?.level) : 2;
      out.push({ type: "heading", attrs: { level, ...cleanAlign(n.attrs) }, content: cleanInline(n.content) });
    } else {
      out.push({ type: "paragraph", attrs: cleanAlign(n.attrs), content: cleanInline(n.content) });
    }
  }
  return out;
}

/** Keeps only the formatting the platform supports, so nobody can sneak code into a poem. */
export function cleanDoc(doc: unknown): DocNode {
  const d = doc as DocNode | null;
  return { type: "doc", content: d && d.type === "doc" ? cleanBlocks(d.content) : [] };
}

export function cleanStyle(s: unknown): PoemStyle {
  const v = (s ?? {}) as Partial<PoemStyle>;
  const base = defaultStyle(typeof v.theme === "string" ? v.theme : undefined);
  return {
    theme: base.theme,
    font: FONTS.some((f) => f.key === v.font) ? (v.font as string) : base.font,
    size: v.size === "s" || v.size === "l" ? v.size : "m",
    lineHeight: typeof v.lineHeight === "number" ? Math.min(2.6, Math.max(1.1, v.lineHeight)) : base.lineHeight,
    align: v.align === "center" || v.align === "right" ? v.align : "left",
    ambient: AMBIENTS.some((a) => a.id === v.ambient) ? (v.ambient as Ambient) : base.ambient,
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderInline(n: DocNode): string {
  if (n.type === "hardBreak") return "<br>";
  let html = esc(n.text ?? "");
  for (const m of n.marks ?? []) {
    if (m.type === "bold") html = `<strong>${html}</strong>`;
    else if (m.type === "italic") html = `<em>${html}</em>`;
    else if (m.type === "underline") html = `<u>${html}</u>`;
    else if (m.type === "strike") html = `<s>${html}</s>`;
    else if (m.type === "textStyle") {
      const a = m.attrs ?? {};
      const css = [
        a.color ? `color:${a.color}` : "",
        a.fontFamily ? `font-family:${a.fontFamily}` : "",
        a.fontSize ? `font-size:${a.fontSize}` : "",
      ].filter(Boolean).join(";");
      if (css) html = `<span style="${esc(css)}">${html}</span>`;
    }
  }
  return html;
}

function renderBlock(n: DocNode): string {
  const align = n.attrs?.textAlign ? ` style="text-align:${n.attrs.textAlign}"` : "";
  const inner = (n.content ?? []).map(renderInline).join("");
  switch (n.type) {
    case "horizontalRule": return "<hr>";
    case "blockquote": return `<blockquote>${(n.content ?? []).map(renderBlock).join("")}</blockquote>`;
    case "heading": return `<h${n.attrs?.level}${align}>${inner || "<br>"}</h${n.attrs?.level}>`;
    default: return `<p${align}>${inner || "<br>"}</p>`;
  }
}

/** Turns a cleaned poem into HTML. Only call this on output of cleanDoc(). */
export function renderDoc(doc: DocNode): string {
  return (doc.content ?? []).map(renderBlock).join("");
}

/** The first few lines as plain text, for previews and link cards. */
export function excerpt(doc: DocNode, lines = 4): string[] {
  const out: string[] = [];
  const walk = (n: DocNode) => {
    if (out.length >= lines) return;
    if (n.type === "paragraph" || n.type === "heading") {
      const parts: string[] = [""];
      for (const c of n.content ?? []) {
        if (c.type === "hardBreak") parts.push("");
        else parts[parts.length - 1] += c.text ?? "";
      }
      for (const p of parts) if (p.trim() && out.length < lines) out.push(p);
    } else n.content?.forEach(walk);
  };
  walk(doc);
  return out;
}

export function hasWords(doc: DocNode): boolean {
  return excerpt(doc, 1).length > 0;
}
