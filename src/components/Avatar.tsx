// A round picture with the writer's initials (photo uploads can come later).
const COLORS = ["#9c4a2a", "#3a6ea5", "#6a1b9a", "#2e7d32", "#c2185b", "#00838f", "#ef6c00", "#5d4037", "#283593", "#827717"];

export default function Avatar({ name, username, size = 40 }: { name: string; username: string; size?: number }) {
  let h = 0;
  for (const ch of username) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: COLORS[h % COLORS.length], fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}
