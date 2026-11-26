"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** A header that sticks to the top. On phones it slides away while you scroll down to read,
 *  and comes back as soon as you scroll up, like X. On computers it always stays. */
export default function ScrollHide({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    last.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - last.current;
      if (Math.abs(dy) < 6) return; // ignore tiny jiggles
      setHidden(dy > 0 && y > 120);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={`sticky top-0 z-30 transition-transform duration-300 ${hidden ? "max-sm:-translate-y-full" : ""} ${className}`}>
      {children}
    </div>
  );
}
