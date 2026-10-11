"use client";

import { useEffect, useRef, useState } from "react";
import type { TraceEvent } from "@/lib/agent";
import { StitchRule } from "@/components/Logo";
import { BrandMark } from "@/components/BrandMark";
import Link from "next/link";
import { RotatingHeading } from "@/components/RotatingHeading";
import { Elapsed } from "@/components/Elapsed";
import { usePersona } from "@/lib/usePersona";

const BRAND_LOGOS = [
  { name: "Uniqlo", src: "/brands/uniqlo.svg" },
  { name: "Montblanc", src: "/brands/montblanc.svg" },
  { name: "Porsche", src: "/brands/porsche.svg" },
];

/** Never visible to the user in a real product — rendered greyed and dotted. */
const BACKSTAGE = new Set(["reasoning", "call", "result", "page_pending"]);

/** A trace event stamped with when it reached the browser, so calls can be timed. */
type Timed = TraceEvent & { at: number };

type Group =
  | { type: "front"; event: Timed }
  | { type: "backstage"; events: Timed[] };

function group(events: Timed[]): Group[] {
  const out: Group[] = [];
  for (const event of events) {
    if (BACKSTAGE.has(event.kind)) {
      const last = out[out.length - 1];
      if (last?.type === "backstage") last.events.push(event);
      else out.push({ type: "backstage", events: [event] });
    } else {
      out.push({ type: "front", event });
    }
  }
  return out;
}

export default function Home() {
  const [intent, setIntent] = useState("");
  const [events, setEvents] = useState<Timed[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const [running, setRunning] = useState(false);
  const [persona] = usePersona();
  const bottom = useRef<HTMLDivElement>(null);
  const started = events.length > 0;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events, running]);

  function reset() {
    setEvents([]);
    setSessionId(null);
    setAwaiting(false);
    setIntent("");
  }

  async function send() {
    const text = intent.trim();
    if (!text || running) return;

    // Answering an outstanding question continues the thread; anything else
    // starts a fresh journey.
    const replying = Boolean(awaiting && sessionId);
    setIntent("");
    setAwaiting(false);
    setRunning(true);
    setEvents((prev) => [...(replying ? prev : []), { kind: "user", text, at: Date.now() }]);

    let sawQuestion = false;
    try {
      const res = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(replying ? { sessionId, answer: text } : { intent: text, persona }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          const event = JSON.parse(chunk.slice(6)) as TraceEvent;
          if (event.kind === "done") continue;
          if (event.kind === "session") {
            setSessionId(event.id);
            continue;
          }
          if (event.kind === "question") sawQuestion = true;
          setEvents((prev) => [...prev, { ...event, at: Date.now() }]);
        }
      }
    } finally {
      setRunning(false);
      setAwaiting(sawQuestion);
    }
  }

  const groups = group(events);

  const liveTrace = groups[groups.length - 1]?.type === "backstage";

  const composer = (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="relative rounded-2xl border-2 border-ink bg-surface shadow-[4px_4px_0_0_var(--color-ink)] transition focus-within:translate-x-px focus-within:translate-y-px focus-within:shadow-[3px_3px_0_0_var(--color-ink)]"
      >
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={awaiting ? "Reply to your agent…" : "What are you shopping for?"}
          rows={2}
          autoFocus
          disabled={running}
          className="composer w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint disabled:opacity-50"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={running || !intent.trim()}
          className="absolute right-2.5 bottom-2.5 grid size-9 place-items-center rounded-full bg-ink text-white transition hover:opacity-90 disabled:bg-line disabled:text-faint"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-faint">
        {awaiting
          ? "Your agent is waiting on your answer"
          : "Enter to send · Shift + Enter for a new line"}
      </p>
    </div>
  );

  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0">
        <div className="mx-auto flex max-w-3xl items-center justify-end px-5 py-3">
          <div className="flex items-center gap-4">
            {started && !running && (
              <button onClick={reset} className="text-xs text-muted transition hover:text-ink">
                Reset
              </button>
            )}
            <Link href="/profile" className="flex items-center gap-2">
              <span className="text-xs text-muted">{persona.name.split(" ")[0]}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={persona.photo}
                alt="Your profile"
                className="size-7 rounded-full object-cover ring-1 ring-line transition hover:ring-ink/30"
              />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-8">
          {!started && (
            <div className="pt-10 sm:pt-16">
              <RotatingHeading />
              <div className="mx-auto mt-8 max-w-2xl">{composer}</div>
              <div className="mt-10 flex flex-col items-center gap-4">
                <p className="text-xs font-bold tracking-[0.2em] text-ink uppercase">
                  Currently supporting Uniqlo, Montblanc and Porsche
                </p>
                <div className="flex items-center gap-10">
                  {BRAND_LOGOS.map((b) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={b.name} src={b.src} alt={b.name} className="h-9 w-auto max-w-28 object-contain" />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {groups.map((g, i) =>
              g.type === "front" ? (
                <Front key={i} event={g.event} />
              ) : (
                <Backstage
                  key={i}
                  events={g.events}
                  live={running && i === groups.length - 1}
                />
              ),
            )}

            {/* Only while there is no live trace to carry the status itself —
                the first model turn, or the one after answering a question. */}
            {running && !liveTrace && (
              <p className="flex items-center gap-2 text-xs text-faint">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-thread" />
                thinking
              </p>
            )}
          </div>
          <div ref={bottom} className="h-2" />
        </div>
      </div>

      {started && (
        <div className="shrink-0 border-t-2 border-ink">
          <div className="mx-auto max-w-3xl px-5 py-4">{composer}</div>
        </div>
      )}
    </div>
  );
}

function Front({ event }: { event: TraceEvent }) {
  if (event.kind === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] leading-relaxed text-white">
          {event.text}
        </p>
      </div>
    );
  }
  if (event.kind === "agent" || event.kind === "question") {
    return (
      <p className="max-w-[90%] text-[15px] leading-[1.7] whitespace-pre-wrap">
        {event.text}
      </p>
    );
  }
  if (event.kind === "page") {
    // The merchant builds the slug from the context the agent sent, so it makes
    // a better title than anything we could invent here.
    const { host, pathname } = new URL(event.url);
    const segments = pathname.split("/").filter(Boolean);
    const slug = segments[segments.length - 2] ?? "";
    const title =
      slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
      `Your ${event.store} storefront`;

    return (
      <a
        href={event.url}
        target="_blank"
        rel="noreferrer"
        className="flex max-w-sm items-center gap-3 rounded-xl border border-line bg-surface p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-ink/25 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
      >
        <BrandMark store={event.store} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{title}</span>
          <span className="block truncate text-xs text-faint">{host}</span>
        </span>
      </a>
    );
  }

  if (event.kind === "error") {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {event.message}
      </p>
    );
  }
  return null;
}

/** Shorten an endpoint for the collapsed summary: drop /v1. */
function compact(label: string): string {
  const [method, rest] = label.split(" ");
  if (!rest) return label;
  const [path, query] = rest.split("?");
  const short = path.replace(/^\/v1/, "");
  if (!query) return `${method} ${short}`;
  const remaining = new URLSearchParams(query).toString();
  return remaining
    ? `${method} ${short}?${decodeURIComponent(remaining)}`
    : `${method} ${short}`;
}

/**
 * Collapsed by default — it's the agent working, not something the user is
 * meant to read. While it's live the summary carries the request in flight,
 * which is more legible than a wall of text scrolling past.
 */
function Backstage({ events, live }: { events: Timed[]; live: boolean }) {
  const calls = events.filter((e) => e.kind === "call");
  const latest = calls[calls.length - 1];

  return (
    // Collapsed it is just a quiet line of metadata; the dashed frame only
    // earns its place once there is something inside it to frame.
    <details open className="group rounded-xl transition-colors open:border open:border-dashed open:border-line open:bg-surface/60">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-0 py-1 group-open:px-3 group-open:py-3 [&::-webkit-details-marker]:hidden">
        {live ? (
          <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-thread" />
        ) : (
          <StitchRule className="shrink-0 text-thread" />
        )}
        <span className="shrink-0 text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
          agent ↔ merchant
        </span>
        <span className="min-w-0 truncate font-mono text-[11px] text-muted">
          {live && latest?.kind === "call"
            ? compact(latest.label)
            : `${calls.length} request${calls.length === 1 ? "" : "s"}`}
        </span>
        <svg
          width="9"
          height="9"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className="-ml-1 shrink-0 text-faint transition-transform group-open:rotate-90"
        >
          <path d="M3 1.5 L7 5 L3 8.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="space-y-3 border-t border-dashed border-line p-4">
        {events.map((event, i) => {
          // A call is timed until the next result arrives. Only the last
          // unanswered call in a live trace is still in flight.
          let end: number | null = null;
          if (event.kind === "call") {
            const answer = events.slice(i + 1).find((e) => e.kind === "result");
            end = answer ? answer.at : live ? null : event.at;
          }
          return <Row key={i} event={event} end={end} />;
        })}
      </div>
    </details>
  );
}

function Row({ event, end }: { event: Timed; end: number | null }) {
  // The model's own deliberation. Deliberately quieter than the calls — it's
  // commentary on the work, not the work itself.
  if (event.kind === "reasoning") {
    return (
      <div className="flex gap-2.5 border-l-2 border-line pl-3">
        <span className="shrink-0 pt-px text-[9px] font-medium tracking-[0.1em] text-faint uppercase">
          thinking
        </span>
        <p className="text-xs leading-relaxed text-muted/80 italic">{event.text}</p>
      </div>
    );
  }

  if (event.kind === "call") {
    const [method, ...rest] = event.label.split(" ");
    return (
      <div>
        <p className="flex flex-wrap items-baseline gap-x-2 font-mono text-[13px]">
          <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
            {method}
          </span>
          <span className="break-all text-ink">{rest.join(" ")}</span>
          <Elapsed start={event.at} end={end} />
        </p>
        <p className="mt-1 pl-1 text-xs text-muted">{event.rationale}</p>
        {event.detail != null && (
          <pre className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-line bg-paper p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words text-muted">
            {JSON.stringify(event.detail, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (event.kind === "result") {
    const garments = event.products
      ? [...new Set(event.products.map((p) => p.name))].slice(0, 6)
      : [];
    const empty = event.summary.startsWith("0 ");
    return (
      <div className="border-l-2 border-line pl-3">
        <p className={`text-xs ${empty ? "text-thread" : "text-ink"}`}>
          {event.summary}
        </p>
        {garments.length > 0 && (
          <p className="mt-0.5 text-xs text-faint">{garments.join(" · ")}</p>
        )}
      </div>
    );
  }

  if (event.kind === "page_pending") {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        The page couldn&apos;t be built
        {event.status ? ` (${event.status})` : ""} — {event.detail}. The payload above
        is what it would have received.
      </p>
    );
  }

  return null;
}
