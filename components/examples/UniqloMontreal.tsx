"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { MotionConfig, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  COLOR_FAMILY,
  FIRST_NAME,
  MEMORY,
  OUTFIT,
  PALETTE,
  payload,
  usd,
  type Piece,
} from "@/lib/examples/uniqlo";

/**
 * Two things have to land in the first seconds: this is Montreal in January,
 * and this was put together for Maya. So the hero is a winter morning with her
 * name on it and the whole kit in view; everything after it ties a piece back
 * to something she already wears. Motion is limited to the snowfall (off under
 * reduced motion), a gentle parallax and section reveals.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const sans = "font-['Helvetica_Neue',Helvetica,Arial,sans-serif]";
const RED = "#e60012";

const byId = (pieces: Piece[], id: number) => pieces.find((p) => p.id === id)!;

export function UniqloMontreal({ pieces }: { pieces: Piece[] }) {
  const total = pieces.reduce((sum, p) => sum + p.price, 0);

  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE, duration: 0.7 }}>
      <main className={`${sans} min-h-screen bg-white text-[#1b1b1b]`}>
        <Hero pieces={pieces} />
        <YourCloset pieces={pieces} />
        <DayAndDinner pieces={pieces} />
        <Kit pieces={pieces} total={total} />
        <footer className="mx-auto max-w-6xl px-4 pb-14 pt-4 text-xs leading-relaxed text-black/45 sm:px-8">
          A concept page built by bespoke from the merchant&apos;s public catalog. Not affiliated
          with or endorsed by Uniqlo. January average for Montréal–Trudeau from Environment
          Canada&apos;s 1991–2020 climate normals.
        </footer>
      </main>
    </MotionConfig>
  );
}

/* ─── Hero: a winter morning in Montreal, with her name and the whole kit ── */

function Hero({ pieces }: { pieces: Piece[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // The kit drifts up a little faster than the page; the skyline lags behind.
  const gridY = useTransform(p, [0, 1], ["0%", "-8%"]);
  const skyY = useTransform(p, [0, 1], ["0%", "25%"]);
  const day = OUTFIT.day;
  const kit = [day.base[0], day.mid[0], day.outer[0], day.base[1]].map((id) => byId(pieces, id));

  return (
    <section ref={ref} className="relative overflow-hidden bg-gradient-to-b from-[#cfdbe6] via-[#e6edf3] to-white">
      <Snow />
      <motion.div style={{ y: skyY }} className="pointer-events-none absolute inset-x-0 bottom-0">
        <Skyline />
      </motion.div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <span className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/examples/uniqlo/logo.svg" alt="UNIQLO" width={44} height={44} className="h-11 w-11" />
          <span className="text-xs font-bold tracking-[0.2em] text-black/70">LifeWear</span>
        </span>
        <span className="flex items-center gap-2.5 text-sm text-black/60">
          For {payload.user_name}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={payload.user_photo} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
        </span>
      </header>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-6 sm:px-8 md:grid-cols-[1fr_1.05fr] md:items-center md:pb-32 md:pt-12">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold uppercase tracking-[0.2em] text-black/55"
          >
            Montreal · January · 10 days
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.9 }}
            className="mt-4 text-[clamp(2.5rem,5.6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.02em]"
          >
            {FIRST_NAME}&apos;s ten days in Montreal.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-5 max-w-md text-lg leading-relaxed text-black/70"
          >
            Cold, a lot of walking, and two nicer dinners out. Five pieces, all in your colours,
            that layer for the days and dress up for the nights.
          </motion.p>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid max-w-md grid-cols-3 border-y border-black/10 py-4 text-sm"
          >
            {[
              ["−10 °C", "January average"],
              ["10 days", "Mostly on foot"],
              ["2 dinners", "Somewhere nice"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="text-xl font-bold tracking-tight">{v}</dd>
                <dd className="mt-0.5 text-xs text-black/55">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* The day kit at a glance, top to toe. */}
        <motion.ul style={{ y: gridY }} className="grid grid-cols-2 gap-3 sm:gap-4">
          {kit.map((piece, i) => (
            <motion.li
              key={piece.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.1, duration: 0.8 }}
              className={i % 2 === 1 ? "md:translate-y-8" : ""}
            >
              <div className="relative aspect-[5/6] overflow-hidden bg-[#f3f3f3] shadow-[0_10px_30px_-12px_rgba(20,40,70,0.25)]">
                <Image
                  src={piece.image}
                  alt={`${piece.title}, ${piece.color}`}
                  fill
                  sizes="(min-width: 768px) 18rem, 45vw"
                  loading={i < 2 ? "eager" : undefined}
                  fetchPriority={i === 0 ? "high" : undefined}
                  className="object-cover"
                />
              </div>
              <p className="mt-2 text-[12px] font-bold leading-tight">{piece.title}</p>
              <p className="text-[11px] text-black/55">
                {piece.color} · {usd(piece.price)}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/**
 * Snowfall on a canvas: soft round flakes in three depths (far ones small,
 * faint and slow; near ones larger and quicker), each swaying as it falls
 * with a light drift of wind. A faint blue-grey halo keeps white flakes
 * visible on a pale sky. Under reduced motion it paints one still frame.
 */
function Snow() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Depth 0 = far, 2 = near. Sizes, speeds and opacity all scale with it.
    // Depth 3 is a handful of big out-of-focus flakes right by the "lens".
    const flakes = Array.from({ length: 230 }, () => {
      const roll = Math.random();
      const depth = roll < 0.5 ? 0 : roll < 0.82 ? 1 : roll < 0.97 ? 2 : 3;
      return {
        x: Math.random(),
        y: Math.random(),
        r: [1.3, 2.4, 3.8, 8][depth] + Math.random() * [0.9, 1.3, 2.2, 6][depth],
        speed: [0.02, 0.034, 0.055, 0.08][depth] * (0.8 + Math.random() * 0.4),
        sway: [6, 12, 20, 30][depth] + Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
        alpha: [0.6, 0.8, 0.92, 0.35][depth],
        soft: depth >= 2,
      };
    });

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        const x = f.x * w + Math.sin(t / 1600 + f.phase) * f.sway;
        const y = f.y * h;
        ctx.beginPath();
        ctx.arc(x, y, f.r, 0, Math.PI * 2);
        if (f.soft) {
          // Near flakes are out of focus: a bright core fading to nothing.
          const g = ctx.createRadialGradient(x, y, 0, x, y, f.r);
          g.addColorStop(0, `rgba(255,255,255,${f.alpha})`);
          g.addColorStop(0.55, `rgba(255,255,255,${f.alpha * 0.6})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = `rgba(255,255,255,${f.alpha})`;
          ctx.shadowColor = "rgba(95,125,155,0.5)";
          ctx.shadowBlur = 3;
        }
        ctx.fill();
      }
    };

    if (reduce) {
      draw(0);
      return () => ro.disconnect();
    }

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      for (const f of flakes) {
        f.y += f.speed * dt * 6;
        f.x += 0.004 * dt; // a light westerly drift
        if (f.y > 1.03) {
          f.y = -0.03;
          f.x = Math.random();
        }
        if (f.x > 1.02) f.x -= 1.04;
      }
      draw(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduce]);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}

/** Mount Royal with its cross, and downtown at its foot. Schematic, faint. */
function Skyline() {
  return (
    <svg viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" className="block h-[14vh] min-h-[80px] w-full" aria-hidden>
      <path fill="#e3eaf1" d="M0 220 L0 150 C 160 120, 300 70, 470 64 C 620 60, 760 110, 900 150 L1440 170 L1440 220 Z" />
      {/* The cross on the summit. */}
      <path stroke="#d3dde7" strokeWidth="3" d="M470 64 V24 M458 36 H482" />
      <g fill="#e3eaf1">
        {[
          [760, 120, 46], [812, 92, 34], [852, 130, 40], [898, 74, 30], [934, 104, 44],
          [984, 86, 28], [1018, 120, 50], [1074, 100, 36], [1116, 138, 42], [1164, 116, 30],
          [1200, 150, 56], [1262, 132, 40], [1308, 160, 60], [1374, 150, 66],
        ].map(([x, y, w]) => (
          <rect key={x} x={x} y={y} width={w} height={220 - y} />
        ))}
      </g>
    </svg>
  );
}

/* ─── Your closet: every pick traced to something she already wears ─────── */

function YourCloset({ pieces }: { pieces: Piece[] }) {
  const leggings = byId(pieces, 20);
  const cardigan = byId(pieces, 18);
  const colours = [...new Set(pieces.map((p) => COLOR_FAMILY[p.color ?? ""]).filter(Boolean))];

  const reasons = [
    {
      piece: leggings,
      lead: `You've rebought black ${MEMORY.past[0].item} two winters running.`,
      body: "So there's a fresh pair under everything, every day.",
    },
    {
      piece: cardigan,
      lead: `Your grey ${MEMORY.past[1].item} is your most-worn piece.`,
      body: "Same cardigan, in navy. It goes over the tee by day and the dress at dinner.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
      <Kicker>Picked from what you already wear</Kicker>
      <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
        Nothing new to get used to.
      </h2>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {reasons.map((r) => (
          <Reveal key={r.piece.id} className="flex gap-4 border-t border-black/10 pt-5 md:flex-col">
            <div className="relative aspect-[5/6] w-28 shrink-0 overflow-hidden bg-[#f3f3f3] md:w-full">
              <Image src={r.piece.image} alt="" fill sizes="(min-width: 768px) 22rem, 7rem" className="object-cover" />
            </div>
            <div>
              <p className="font-bold">{r.lead}</p>
              <p className="mt-1 text-black/65">{r.body}</p>
              <p className="mt-3 text-xs font-bold">
                {r.piece.title} · {r.piece.color}
              </p>
            </div>
          </Reveal>
        ))}

        <Reveal className="border-t border-black/10 pt-5">
          <p className="font-bold">Only colours you wear.</p>
          <p className="mt-1 text-black/65">
            No {PALETTE.avoids.slice(0, -1).join(", ").toLowerCase()} or{" "}
            {PALETTE.avoids.at(-1)!.toLowerCase()}. Tops in {MEMORY.sizes.tops}, bottoms in{" "}
            {MEMORY.sizes.bottoms}.
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {PALETTE.wears.map((c) => {
              const used = colours.includes(c.name);
              return (
                <li key={c.name} className={`flex items-center gap-2 text-sm ${used ? "" : "opacity-35"}`}>
                  <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: c.hex }} />
                  {c.name}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-black/45">Faded: in your palette, not in this kit.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Day and dinner: one swap turns the walking kit into the dinner kit ── */

function DayAndDinner({ pieces }: { pieces: Piece[] }) {
  const looks = [
    { title: "Days out", note: "Layered for a lot of walking.", ids: [...OUTFIT.day.outer, ...OUTFIT.day.mid, ...OUTFIT.day.base] },
    { title: "Two dinners", note: "Swap the tee for the dress. Keep the rest.", ids: [...OUTFIT.evening.outer, ...OUTFIT.evening.mid, ...OUTFIT.evening.base] },
  ];
  const swapped = new Set([...OUTFIT.evening.base].filter((id) => !OUTFIT.day.base.includes(id)));

  return (
    <section className="bg-[#f4f6f8]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <Kicker>Day to dinner</Kicker>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
          One swap. Two looks.
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          {looks.map((look) => (
            <Reveal key={look.title}>
              <div className="flex items-baseline justify-between border-b border-black/15 pb-3">
                <h3 className="text-xl font-bold">{look.title}</h3>
                <p className="text-sm text-black/60">{look.note}</p>
              </div>
              <ul className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
                {look.ids.map((id) => {
                  const piece = byId(pieces, id);
                  const isSwap = swapped.has(id);
                  return (
                    <li key={id}>
                      <div
                        className={`relative aspect-[5/6] overflow-hidden bg-white ${
                          isSwap ? "ring-2 ring-offset-2 ring-offset-[#f4f6f8]" : ""
                        }`}
                        style={isSwap ? ({ "--tw-ring-color": RED } as React.CSSProperties) : undefined}
                      >
                        <Image src={piece.image} alt={piece.title} fill sizes="(min-width: 768px) 9rem, 22vw" className="object-cover" />
                      </div>
                      <p className="mt-1.5 text-[11px] font-bold leading-tight sm:text-xs">{piece.title}</p>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── The kit: everything, with why, and the total ─────────────────────── */

function Kit({ pieces, total }: { pieces: Piece[]; total: number }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
      <Kicker>Your kit</Kicker>
      <h2 className="mt-3 text-3xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
        Five pieces. One bag.
      </h2>

      <ul className="mt-10 divide-y divide-black/10 border-y border-black/10">
        {pieces.map((piece) => (
          <li key={piece.id} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 py-4 sm:grid-cols-[5.5rem_1fr_auto_auto] sm:gap-6">
            <div className="relative aspect-[5/6] overflow-hidden bg-[#f3f3f3]">
              <Image src={piece.image} alt="" fill sizes="5.5rem" className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">
                {piece.title}
                {piece.variant && <span className="font-normal text-black/55"> · {piece.variant}</span>}
              </p>
              <p className="text-xs text-black/55">{piece.color}</p>
              <p className="mt-1 text-sm text-black/70">{piece.why}</p>
            </div>
            <span className="font-bold tabular-nums">{usd(piece.price)}</span>
            <a
              href={piece.href}
              target="_blank"
              rel="noreferrer"
              className="col-start-2 justify-self-start text-sm font-bold underline underline-offset-4 sm:col-start-auto"
            >
              View
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-baseline justify-between">
        <span className="text-sm text-black/60">{pieces.length} pieces</span>
        <span className="text-2xl font-bold tabular-nums">{usd(total)}</span>
      </div>
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-black/55">
      <span className="h-px w-6" style={{ background: RED }} />
      {children}
    </p>
  );
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
