"use client";
import { useEffect, useState } from "react";

/** Dark / Light switch for the Settings page. The choice is remembered on this device. */
export default function DisplaySetting() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);
  const pick = (t: "dark" | "light") => {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("drows:theme", t);
    setTheme(t);
  };
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-bold">Display</p>
        <p className="text-sm text-muted">Dark or light colours. Saved on this device.</p>
      </div>
      <div className="flex rounded-full bg-soft p-1" role="radiogroup" aria-label="Display">
        {(["dark", "light"] as const).map((t) => (
          <button
            key={t}
            role="radio"
            aria-checked={theme === t}
            onClick={() => pick(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${theme === t ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
          >
            {t === "dark" ? "Dark" : "Light"}
          </button>
        ))}
      </div>
    </div>
  );
}
