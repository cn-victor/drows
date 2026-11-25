"use client";
import { useEffect, useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function short(t: number, now: number) {
  const s = Math.max(0, (now - t) / 1000);
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  const d = new Date(t);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}${sameYear ? "" : `, ${d.getFullYear()}`}`;
}

function full(t: number) {
  const d = new Date(t);
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() < 12 ? "AM" : "PM"} · ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "5m", "3h", "Nov 24" (or the full date and time with `long`). Worked out in the reader's own time zone. */
export default function TimeAgo({ at, long = false }: { at: number; long?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);
  if (now === null) return <span className="invisible">·</span>;
  return (
    <time dateTime={new Date(at).toISOString()} title={full(at)}>
      {long ? full(at) : short(at, now)}
    </time>
  );
}
