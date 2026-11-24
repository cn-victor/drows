"use client";
import { EditorContent, useEditor } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { poemExtensions } from "./editorExtensions";
import LineBar from "./LineBar";
import LookPanel from "./LookPanel";
import PoemCanvas from "./PoemCanvas";
import PreviewReader from "./PreviewReader";
import SoundPanel from "./SoundPanel";
import Toolbar from "./Toolbar";
import { cleanDoc, cleanStyle, defaultStyle, LIMITS, type DocNode, type Poem, type PoemStyle } from "@/lib/poem";
import { SITE_NAME } from "@/lib/site";

type Draft = { title: string; doc: DocNode; style: PoemStyle };

type Props = {
  initial: Poem | null; // the poem being edited (null for a new one)
  authorName: string;
  book: { id: string; title: string } | null; // set when writing a chapter
};

export default function Writer({ initial, authorName, book }: Props) {
  const router = useRouter();
  const editing = initial?.id ?? null;
  // New chapters keep their own draft, separate from a new standalone poem.
  const DRAFT = book ? `drows:draft:book:${book.id}` : "drows:draft";
  const [title, setTitle] = useState(initial?.title ?? "");
  const [style, setStyle] = useState<PoemStyle>(initial?.style ?? defaultStyle());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showLook, setShowLook] = useState(false);
  const [panel, setPanel] = useState<"look" | "sound">("look");
  const loaded = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...poemExtensions,
      Placeholder.configure({ placeholder: "Begin your poem here…   (Enter = new line · empty line = new stanza · Tab = indent)" }),
    ],
    content: initial?.doc ?? "",
    parseOptions: { preserveWhitespace: "full" },
    editorProps: { attributes: { spellcheck: "true", "aria-label": "Your poem" } },
    onCreate: ({ editor: e }) => {
      // A new poem picks up where you left off (the draft is kept in this browser).
      if (!initial) {
        try {
          const d = JSON.parse(localStorage.getItem(DRAFT) || "null") as Draft | null;
          if (d) {
            e.commands.setContent(d.doc);
            setTitle(d.title);
            setStyle(cleanStyle(d.style)); // older drafts may miss newer settings
          }
        } catch {}
      }
      loaded.current = true;
    },
  });

  // Save a draft as you type (new poems only).
  useEffect(() => {
    if (!editor || editing) return;
    const save = () => {
      if (!loaded.current) return;
      localStorage.setItem(DRAFT, JSON.stringify({ title, doc: editor.getJSON() as DocNode, style } satisfies Draft));
    };
    save();
    editor.on("update", save);
    return () => {
      editor.off("update", save);
    };
  }, [editor, editing, title, style, DRAFT]);

  async function publish() {
    if (!editor) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(editing ? `/api/poems/${editing}` : "/api/poems", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, doc: editor.getJSON(), style, bookId: book?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      if (!editing) localStorage.removeItem(DRAFT);
      router.push(`/p/${data.id}${editing ? "" : "?new=1"}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !confirm("Delete this poem for good? Its likes and comments go too. This cannot be undone.")) return;
    const res = await fetch(`/api/poems/${editing}`, { method: "DELETE" });
    if (res.ok) {
      router.push(book ? `/b/${book.id}` : "/");
      router.refresh();
    } else setError("Could not delete this poem.");
  }

  function startOver() {
    if (!editor || !confirm("Clear this draft and start a new poem?")) return;
    editor.commands.clearContent(true);
    setTitle("");
    localStorage.removeItem(DRAFT);
  }


  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-black/10 bg-paper/90 px-4 backdrop-blur">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">{SITE_NAME}</Link>
        <span className="hidden truncate text-sm text-muted sm:inline">
          {book ? (
            <>
              {editing ? "Editing a chapter of " : "New chapter in "}
              <Link href={`/b/${book.id}`} className="underline">{book.title}</Link>
            </>
          ) : editing ? "Editing" : "New poem"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {editing && (
            <button onClick={remove} className="rounded-full px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">Delete</button>
          )}
          {!editing && (
            <button onClick={startOver} className="hidden rounded-full px-3 py-1.5 text-sm text-muted hover:bg-black/5 sm:block">Start over</button>
          )}
          <button onClick={() => setShowLook((v) => !v)} className="rounded-full px-3 py-1.5 text-sm ring-1 ring-black/15 hover:bg-black/5 lg:hidden">
            {showLook ? "Back to poem" : "Look & sound"}
          </button>
          <button
            onClick={publish}
            disabled={saving || !editor}
            className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-40"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Publish"}
          </button>
        </div>
      </header>

      {error && <p className="bg-red-50 px-4 py-2 text-center text-sm text-red-800">{error}</p>}

      <div className="flex flex-1 flex-col lg:flex-row">
        <PoemCanvas style={style} className={`flex-1 ${showLook ? "hidden lg:block" : ""}`}>
          <div className="mx-auto flex max-w-2xl flex-col px-5 pb-24 pt-5 sm:px-8">
            {editor && (
              <div className="sticky top-16 z-20 mb-10 flex flex-col gap-1.5">
                <Toolbar editor={editor} themeId={style.theme} />
                <LineBar editor={editor} />
              </div>
            )}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={LIMITS.title}
              placeholder="Title"
              aria-label="Title"
              className="w-full bg-transparent text-4xl font-semibold leading-tight outline-none placeholder:text-[var(--poem-muted)] placeholder:opacity-60 sm:text-5xl"
              style={{ fontFamily: "var(--poem-font)", textAlign: style.align }}
            />
            <p className="mt-2 text-lg italic" style={{ color: "var(--poem-muted)", fontFamily: "var(--poem-font)", textAlign: style.align }}>
              by {authorName}
            </p>
            <EditorContent editor={editor} className="poem-body mt-8" />
          </div>
        </PoemCanvas>

        <aside
          className={`${showLook ? "block" : "hidden"} w-full shrink-0 border-black/10 bg-paper p-5 lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)] lg:w-[340px] lg:overflow-y-auto lg:border-l`}
        >
          <div className="mb-5 grid grid-cols-2 rounded-full bg-black/5 p-1 text-sm">
            {(["look", "sound"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPanel(p)}
                className={`rounded-full py-1.5 transition ${panel === p ? "bg-white font-medium shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {p === "look" ? "Look" : "Sound & voice"}
              </button>
            ))}
          </div>
          {panel === "look" ? (
            <LookPanel style={style} onChange={setStyle} />
          ) : (
            <SoundPanel style={style} onChange={setStyle}>
              {editor && <PreviewReader getDoc={() => cleanDoc(editor.getJSON())} style={style} />}
            </SoundPanel>
          )}
        </aside>
      </div>
    </div>
  );
}
