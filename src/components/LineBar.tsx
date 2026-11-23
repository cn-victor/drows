"use client";
import { useEditorState, type Editor } from "@tiptap/react";
import { playCue } from "@/lib/audioEngine";
import { CUES } from "@/lib/sounds";
import { PAUSES, TONES } from "@/lib/voice";

const sel = "h-8 rounded-lg bg-transparent px-1 text-sm hover:bg-black/5";

/** "This line" controls: how the AI reader says the line, a pause after it, and a sound effect. */
export default function LineBar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const type = e.isActive("heading") ? "heading" : "paragraph";
      const a = e.getAttributes(type);
      return { tone: (a.tone as string) ?? "", pause: (a.pause as string) ?? "", sound: (a.sound as string) ?? "" };
    },
  });

  // Applies to every line in the selection (lines and titles alike).
  const set = (key: "tone" | "pause" | "sound", value: string) => {
    const v = value || null;
    editor.commands.updateAttributes("paragraph", { [key]: v });
    editor.commands.updateAttributes("heading", { [key]: v });
    editor.commands.focus();
  };

  return (
    <div className="flex flex-nowrap items-center gap-1 overflow-x-auto rounded-2xl bg-white/75 px-3 py-1 text-neutral-800 shadow-sm ring-1 ring-black/5 backdrop-blur [scrollbar-width:none] [&>*]:shrink-0">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">This line</span>
      <select title="How the reader says this line" className={sel} value={s.tone} onChange={(e) => set("tone", e.target.value)}>
        <option value="">🎙 Tone: normal</option>
        {TONES.map((t) => (
          <option key={t.id} value={t.id}>🎙 {t.label}</option>
        ))}
      </select>
      <select title="Silence after this line" className={sel} value={s.pause} onChange={(e) => set("pause", e.target.value)}>
        <option value="">⏸ No pause</option>
        {PAUSES.map((p) => (
          <option key={p.id} value={p.id}>⏸ {p.label}</option>
        ))}
      </select>
      <select
        title="Sound effect when the reader reaches this line"
        className={sel}
        value={s.sound}
        onChange={(e) => {
          set("sound", e.target.value);
          if (e.target.value) playCue(e.target.value);
        }}
      >
        <option value="">♪ No sound</option>
        {CUES.map((c) => (
          <option key={c.id} value={c.id}>♪ {c.label}</option>
        ))}
      </select>
    </div>
  );
}
