import { Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";

// Tab key adds an indent (four spaces) instead of jumping out of the poem.
const PoemTab = Extension.create({
  name: "poemTab",
  addKeyboardShortcuts() {
    return { Tab: () => this.editor.commands.insertContent({ type: "text", text: "    " }) };
  },
});

// Lets every line carry reader settings: tone (how it is read), pause after it, and a sound effect.
const LineVoice = Extension.create({
  name: "lineVoice",
  addGlobalAttributes() {
    const attr = (name: string) => ({
      default: null,
      keepOnSplit: false, // pressing Enter starts a fresh line without the previous line's settings
      parseHTML: (el: HTMLElement) => el.getAttribute(`data-${name}`),
      renderHTML: (attrs: Record<string, unknown>) => (attrs[name] ? { [`data-${name}`]: attrs[name] } : {}),
    });
    return [{ types: ["paragraph", "heading"], attributes: { tone: attr("tone"), pause: attr("pause"), sound: attr("sound") } }];
  },
});

export const poemExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    code: false,
    codeBlock: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    listKeymap: false,
    link: false,
  }),
  TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
  TextStyle,
  Color,
  FontFamily,
  FontSize,
  PoemTab,
  LineVoice,
];
