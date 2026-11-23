// What a poem is made of, plus the safety checks and the HTML printer used to show it.
import { AMBIENTS, getTheme, type Ambient } from "./themes";
import { FONTS, FONT_CSS, TEXT_SIZE_VALUES } from "./fonts";
import { CUE_IDS, SCAPE_IDS, UPLOAD_ID, type Music, type ScapeId } from "./sounds";
import { PAUSE_IDS, READING_IDS, TONE_IDS, VOICE_IDS } from "./voice";

export type PoemStyle = {
  theme: string;
  font: string; // font key
  size: "s" | "m" | "l";
  lineHeight: number;
  align: "left" | "center" | "right";
  ambient: Ambient;
  voice: string; // AI reader voice
  reading: string; // overall reading style
  music: Music; // background sound
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
  return {
    theme: t.id,
    font: t.font,
    size: "m",
    lineHeight: 1.7,
    align: "left",
    ambient: t.ambient,
    voice: "sage",
    reading: "gentle",
    music: { kind: "none", volume: 0.5 },
  };
}

export const LIMITS = { title: 120, author: 60, docBytes: 200_000 };

const BLOCKS = new Set(["paragraph", "heading", "blockquote", "horizontalRule"]);
const INLINE = new Set(["text", "hardBreak"]);
const SIMPLE_MARKS = new Set(["bold", "italic", "underline", "strike"]);
const ALIGNS = new Set(["left", "center", "right", "justify"]);
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Line settings: alignment, plus how the AI reader treats the line (tone, pause after, sound effect). */
function cleanLineAttrs(attrs?: Record<string, unknown>) {
  const out: Record<string, string> = {};
  const a = attrs ?? {};
  if (typeof a.textAlign === "string" && ALIGNS.has(a.textAlign)) out.textAlign = a.textAlign;
  if (typeof a.tone === "string" && TONE_IDS.has(a.tone)) out.tone = a.tone;
  if (typeof a.pause === "string" && PAUSE_IDS.has(a.pause)) out.pause = a.pause;
  if (typeof a.sound === "string" && CUE_IDS.has(a.sound)) out.sound = a.sound;
  return Object.keys(out).length ? out : undefined;
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
      out.push({ type: "heading", attrs: { level, ...cleanLineAttrs(n.attrs) }, content: cleanInline(n.content) });
    } else {
      out.push({ type: "paragraph", attrs: cleanLineAttrs(n.attrs), content: cleanInline(n.content) });
    }
  }
  return out;
}

/** Keeps only the formatting the platform supports, so nobody can sneak code into a poem. */
export function cleanDoc(doc: unknown): DocNode {
  const d = doc as DocNode | null;
  return { type: "doc", content: d && d.type === "doc" ? cleanBlocks(d.content) : [] };
}

function cleanMusic(m: unknown): Music {
  const v = (m ?? {}) as Record<string, unknown>;
  const volume = typeof v.volume === "number" ? Math.min(1, Math.max(0, v.volume)) : 0.5;
  if (v.kind === "scape" && typeof v.id === "string" && SCAPE_IDS.has(v.id)) return { kind: "scape", id: v.id as ScapeId, volume };
  if (v.kind === "upload" && typeof v.id === "string" && UPLOAD_ID.test(v.id)) {
    return { kind: "upload", id: v.id, name: String(v.name ?? "My music").slice(0, 80), volume };
  }
  return { kind: "none", volume };
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
    voice: typeof v.voice === "string" && VOICE_IDS.has(v.voice) ? v.voice : base.voice,
    reading: typeof v.reading === "string" && READING_IDS.has(v.reading) ? v.reading : base.reading,
    music: cleanMusic(v.music),
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

function lineAttrs(n: DocNode, index?: number): string {
  const a = n.attrs ?? {};
  let out = a.textAlign ? ` style="text-align:${a.textAlign}"` : "";
  if (index !== undefined) out += ` data-i="${index}"`;
  if (a.tone) out += ` data-tone="${a.tone}"`;
  if (a.sound) out += ` data-sound="${a.sound}"`;
  return out;
}

function renderBlock(n: DocNode, index?: number): string {
  const inner = (n.content ?? []).map(renderInline).join("");
  const at = lineAttrs(n, index);
  switch (n.type) {
    case "horizontalRule": return `<hr${index !== undefined ? ` data-i="${index}"` : ""}>`;
    case "blockquote": return `<blockquote${index !== undefined ? ` data-i="${index}"` : ""}>${(n.content ?? []).map((c) => renderBlock(c)).join("")}</blockquote>`;
    case "heading": return `<h${n.attrs?.level}${at}>${inner || "<br>"}</h${n.attrs?.level}>`;
    default: return `<p${at}>${inner || "<br>"}</p>`;
  }
}

/** Turns a cleaned poem into HTML. Only call this on output of cleanDoc().
 *  Each top-level line gets data-i="n" so the reader can highlight it while reading. */
export function renderDoc(doc: DocNode): string {
  return (doc.content ?? []).map((b, i) => renderBlock(b, i)).join("");
}

/** The plain words of one line (or a quote block). */
export function lineText(n: DocNode): string {
  if (n.type === "text") return n.text ?? "";
  if (n.type === "hardBreak") return "\n";
  if (n.type === "blockquote") return (n.content ?? []).map(lineText).join("\n");
  return (n.content ?? []).map(lineText).join("");
}

/** The first few lines as plain text, for previews and link cards. */
export function excerpt(doc: DocNode, lines = 4): string[] {
  const out: string[] = [];
  for (const b of doc.content ?? []) {
    for (const l of lineText(b).split("\n")) if (l.trim() && out.length < lines) out.push(l);
    if (out.length >= lines) break;
  }
  return out;
}

export function hasWords(doc: DocNode): boolean {
  return excerpt(doc, 1).length > 0;
}
