"use client";

import { useEffect, useState } from "react";

/**
 * Seconds a single API call has been (or was) in flight. Ticks until `end` is
 * set, then holds the final value.
 */
export function Elapsed({ start, end }: { start: number; end: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (end !== null) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [end]);

  const seconds = Math.max(0, (end ?? now) - start) / 1000;
  const live = end === null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
        live ? "bg-thread/10 text-thread" : "bg-ink/5 text-ink"
      }`}
    >
      <span className={`inline-block size-1.5 rounded-full ${live ? "animate-pulse bg-thread" : "bg-ink"}`} />
      {seconds.toFixed(1)}s
    </span>
  );
}
