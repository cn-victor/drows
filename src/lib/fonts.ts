// Fonts a writer can choose. The `css` value matches the variables set up in app/layout.tsx.
export type FontChoice = { key: string; label: string; css: string };

export const FONTS: FontChoice[] = [
  { key: "garamond", label: "Garamond", css: "var(--font-garamond)" },
  { key: "cormorant", label: "Cormorant", css: "var(--font-cormorant)" },
  { key: "lora", label: "Lora", css: "var(--font-lora)" },
  { key: "playfair", label: "Playfair", css: "var(--font-playfair)" },
  { key: "script", label: "Script", css: "var(--font-script)" },
  { key: "hand", label: "Handwritten", css: "var(--font-hand)" },
  { key: "typewriter", label: "Typewriter", css: "var(--font-typewriter)" },
  { key: "modern", label: "Modern", css: "var(--font-modern)" },
];

export const FONT_CSS = new Set(FONTS.map((f) => f.css));

export function fontCss(key: string): string {
  return FONTS.find((f) => f.key === key)?.css ?? FONTS[0].css;
}

// Sizes for highlighted words (on top of the poem's base size).
export const TEXT_SIZES = [
  { label: "Small", value: "0.8em" },
  { label: "Normal", value: "1em" },
  { label: "Large", value: "1.35em" },
  { label: "Huge", value: "1.9em" },
  { label: "Giant", value: "2.6em" },
];
export const TEXT_SIZE_VALUES = new Set(TEXT_SIZES.map((s) => s.value));
