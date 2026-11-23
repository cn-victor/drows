// The looks a poem can wear. Each theme sets the background, ink colour, default font
// and an optional gentle animation ("ambient") that plays behind the words.
export type Ambient = "none" | "stars" | "rain" | "petals" | "fireflies" | "snow" | "embers";

export type Theme = {
  id: string;
  name: string;
  background: string; // any CSS background
  ink: string; // main text colour
  muted: string; // author line, small text
  accent: string; // buttons, highlights
  font: string; // key from lib/fonts.ts
  ambient: Ambient;
  dark: boolean;
};

export const THEMES: Theme[] = [
  { id: "parchment", name: "Parchment", background: "radial-gradient(ellipse at top, #fbf4e2 0%, #f1e4c6 70%, #e7d4ab 100%)", ink: "#3a2b20", muted: "#7a6450", accent: "#9c4a2a", font: "garamond", ambient: "none", dark: false },
  { id: "midnight", name: "Midnight", background: "linear-gradient(180deg, #070b1f 0%, #141a3d 55%, #2a2156 100%)", ink: "#ecebfa", muted: "#a6a3cc", accent: "#c9b8ff", font: "cormorant", ambient: "stars", dark: true },
  { id: "rain", name: "Rainy window", background: "linear-gradient(180deg, #3d4a57 0%, #56677a 60%, #6f8193 100%)", ink: "#f1f5f9", muted: "#c3cfdb", accent: "#9fd3ff", font: "lora", ambient: "rain", dark: true },
  { id: "rose", name: "Rose", background: "linear-gradient(160deg, #fff1f3 0%, #fbd3dc 60%, #f5b5c4 100%)", ink: "#5a1f33", muted: "#9b5a70", accent: "#c2185b", font: "playfair", ambient: "petals", dark: false },
  { id: "forest", name: "Forest night", background: "linear-gradient(180deg, #0b1a12 0%, #12301f 60%, #1d4430 100%)", ink: "#e5f3e8", muted: "#9cc2a7", accent: "#d8f27a", font: "lora", ambient: "fireflies", dark: true },
  { id: "ink", name: "Ink", background: "#0c0c0c", ink: "#f4f4f4", muted: "#9a9a9a", accent: "#ffffff", font: "typewriter", ambient: "none", dark: true },
  { id: "dawn", name: "Dawn", background: "linear-gradient(180deg, #ffd9b8 0%, #f9c4c8 45%, #c9b6e8 100%)", ink: "#3b2546", muted: "#6f5680", accent: "#b4467a", font: "cormorant", ambient: "none", dark: false },
  { id: "snow", name: "First snow", background: "linear-gradient(180deg, #dfe9f3 0%, #f3f7fb 100%)", ink: "#23344a", muted: "#61748c", accent: "#3a6ea5", font: "garamond", ambient: "snow", dark: false },
  { id: "hearth", name: "Hearth", background: "radial-gradient(ellipse at bottom, #5a1e0c 0%, #2a0f08 60%, #140705 100%)", ink: "#ffe9d2", muted: "#d9a882", accent: "#ff9a4d", font: "playfair", ambient: "embers", dark: true },
  { id: "notebook", name: "Notebook", background: "repeating-linear-gradient(180deg, #fffef8 0px, #fffef8 31px, #d9e4f2 32px)", ink: "#1f2a44", muted: "#5d6b88", accent: "#d64545", font: "hand", ambient: "none", dark: false },
];

export const AMBIENTS: { id: Ambient; label: string }[] = [
  { id: "none", label: "Still" },
  { id: "stars", label: "Stars" },
  { id: "rain", label: "Rain" },
  { id: "petals", label: "Petals" },
  { id: "fireflies", label: "Fireflies" },
  { id: "snow", label: "Snow" },
  { id: "embers", label: "Embers" },
];

export function getTheme(id: string | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
