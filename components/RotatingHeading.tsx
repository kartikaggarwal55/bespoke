"use client";

import { useEffect, useState } from "react";

const WORDS = [
  { text: "Instinct", color: "#e11d48" },
  { text: "Muse", color: "#7c3aed" },
  { text: "Dots", color: "#0891b2" },
  { text: "CC", color: "#ea580c" },
];

/** The hero. One word at a time, big enough that it is the page. */
export function RotatingHeading() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 6600);
    return () => clearInterval(t);
  }, []);

  const word = WORDS[i];
  return (
    <h1
      aria-label={WORDS.map((w) => w.text).join(", ")}
      className="text-center text-[clamp(4.5rem,18vw,11rem)] leading-none font-black tracking-[-0.06em] select-none"
    >
      {/* key remounts the span so the entrance animation replays per word */}
      <span key={word.text} className="word-in inline-block" style={{ color: word.color }}>
        {word.text}
      </span>
    </h1>
  );
}
