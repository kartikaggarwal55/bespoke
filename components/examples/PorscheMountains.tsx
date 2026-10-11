"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  MODES,
  MODE_SPECS,
  ROUTE,
  payload,
  ranked,
  usd,
  type Mode,
  type ShortlistCar,
  type Specs,
} from "@/lib/examples/porsche";

/**
 * Every animation on this page explains something: the car driving off into
 * the brief, the climb it has to make, the shortlist re-ranking under a
 * different season, how close the 0–60 times really are. Nothing loops, and
 * MotionConfig hands transforms to the OS reduced-motion setting; the
 * non-transform animations (the race, the counters) check it themselves.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Each season tints the highlights so the active lens is legible at a glance. */
const ACCENT: Record<Mode, string> = {
  summer: "#f0a73a",
  ski: "#8fd0ff",
  weekday: "#e7e5e4",
};

const display = "font-[family-name:var(--font-display)] tracking-[-0.01em]";
const section = "mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28";

const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
const secs = (c: ShortlistCar) => parseFloat(c.specs.zeroToSixty ?? "0");

export function PorscheMountains({ cars }: { cars: ShortlistCar[] }) {
  const [mode, setMode] = useState<Mode>("summer");
  const hero = cars.find((c) => c.id === 14)!;

  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE, duration: 0.7 }}>
      <main
        className="min-h-screen overflow-x-clip bg-[#0d0e10] text-[#f2f1ee] selection:bg-white/20"
        style={{ "--accent": ACCENT[mode] } as React.CSSProperties}
      >
        <Hero car={hero} />
        <Route />
        <Garage cars={cars} mode={mode} setMode={setMode} />
        <Launch cars={cars} />
        <Decision cars={cars} />
        <footer className="mx-auto max-w-6xl space-y-2 px-4 pb-16 text-xs leading-relaxed text-white/40 sm:px-8">
          <p>
            Starting MSRP for model year {hero.specs.year} from Porsche USA, before options,
            destination and tax. Performance figures as published by Porsche.
          </p>
          <p>
            A concept page built by bespoke from Porsche USA&apos;s public model data. Not
            affiliated with or endorsed by Porsche.
          </p>
        </footer>
      </main>
    </MotionConfig>
  );
}

/* ─── Hero: pinned for a screen while the 911 drives off into the brief ── */

/** Constant acceleration from rest: distance grows with t². */
const launch = (p: number, from: number, to: number) => {
  const t = Math.min(1, Math.max(0, (p - from) / (to - from)));
  return t * t;
};

function Hero({ car }: { car: ShortlistCar }) {
  const ref = useRef<HTMLElement>(null);
  // 0 → 1 over the extra screen of scroll while the stage is pinned.
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // The headline stays put: the car drives out from under it, and when the
  // pin releases it scrolls away with the brief right behind, so no frame of
  // the transition is ever empty.
  const cueFade = useTransform(p, [0, 0.06], [1, 0]);
  // Parked in the centre; scrolling launches it forward (it faces right).
  const carX = useTransform(p, (v) => `${launch(v, 0.04, 1) * 115}vw`);
  // A touch of blur as it gets quick reads as speed rather than a slide.
  const carBlur = useTransform(p, (v) => `blur(${launch(v, 0.4, 1) * 3}px)`);
  // Lane markings rush past underneath, faster as it accelerates.
  const roadX = useTransform(p, (v) => `${-launch(v, 0.02, 1) * 3200}px`);
  // Scenery drifts the other way at decreasing speeds with distance: parallax.
  const farX = useTransform(p, [0, 1], ["0%", "-2%"]);
  const midX = useTransform(p, [0, 1], ["0%", "-6%"]);
  const nearX = useTransform(p, [0, 1], ["0%", "-12%"]);
  const first = payload.user_name.split(" ")[0];

  return (
    // 55svh of pinned scroll: long enough to feel the launch, short enough
    // that the brief arrives the moment the car is gone.
    <section ref={ref} className="relative h-[155svh]">
      <div className="sticky top-0 flex h-[100svh] min-h-[620px] flex-col overflow-hidden">
        {/* Studio light pooled where the car stands. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-[radial-gradient(45%_55%_at_50%_80%,rgba(255,255,255,0.085),transparent_70%)]"
        />

        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/examples/porsche/wordmark.svg" alt="Porsche" width={134} height={14} className="h-3 w-auto sm:h-3.5" />
          <span className="flex items-center gap-2.5 text-sm text-white/60">
            Prepared for {payload.user_name}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payload.user_photo}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20"
            />
          </span>
        </header>

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-[4vh] sm:px-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="text-sm uppercase tracking-[0.2em] text-white/50"
          >
            {first}, from Boulder to Breckenridge
          </motion.p>
          <h1 className={`${display} mt-4 text-[clamp(2.9rem,8.6vw,8.25rem)] font-semibold leading-[0.9] tracking-tight`}>
            {["One car.", "Both seasons."].map((line, i) => (
              // Each line rises out of its own mask.
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  className="block"
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.2 + i * 0.14, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/70"
          >
            Loveland Pass in July. Breckenridge, skis in the back, every Saturday in January.
            Four Porsches that do both, including the 911 you&apos;ve always wanted.
          </motion.p>
        </div>

        {/* Sized from the photo's own ratio, capped by the height left over, so the
            whole car is always in frame; the road runs under its wheels. */}
        <div className="relative flex min-h-0 flex-1 flex-col justify-center pb-14 sm:justify-end">
          <div className="relative">
          <Scenery far={farX} mid={midX} near={nearX} />
          <motion.div style={{ x: carX, filter: carBlur }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ aspectRatio: `${car.width} / ${car.height}` }}
              className="relative mx-auto w-[min(62rem,calc(100vw-1.5rem),calc((100svh-28rem)*3.3))] origin-bottom"
            >
              <Image
                src={car.image}
                alt={`${car.name}, side view`}
                fill
                sizes="(min-width: 1024px) 62rem, 100vw"
                loading="eager"
                fetchPriority="high"
                className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]"
              />
            </motion.div>
          </motion.div>
          <Road x={roadX} />
          </div>
        </div>

        <motion.div
          style={{ opacity: cueFade }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-white/40"
        >
          Scroll
          <span className="h-6 w-px bg-gradient-to-b from-white/50 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Boulder from the east: the Front Range on the horizon, the Flatirons' tilted
 * slabs on the left (where they stand above town), rolling foothills nearest.
 * Kept faint so it reads as place, not decoration. Each layer fades downward
 * so the overlaps never show as hard bands; a low dusk glow sits behind the
 * range, where the sun sets. The car starts in front of it and, as it drives
 * off, uncovers the skyline.
 */
const SLABS = [
  // [left foot, right foot, apex x, apex y]: First through Fifth Flatiron.
  [110, 540, 270, 175],
  [450, 740, 545, 222],
  [650, 880, 718, 258],
  [830, 1000, 872, 290],
  [960, 1090, 990, 314],
] as const;

function Scenery({
  far,
  mid,
  near,
}: {
  far: MotionValue<string>;
  mid: MotionValue<string>;
  near: MotionValue<string>;
}) {
  const layer = "absolute inset-y-0 left-0 h-full w-[114%]";
  const fade = (id: string, top: number) => (
    <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="white" stopOpacity={top} />
      <stop offset="1" stopColor="white" stopOpacity="0" />
    </linearGradient>
  );
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 1.8 }}
      className="pointer-events-none absolute inset-x-0 bottom-1 h-[min(36svh,280px)] [mask-image:linear-gradient(to_bottom,black_60%,transparent)] sm:h-[min(56svh,540px)]"
    >
      <div className="absolute inset-x-0 bottom-[25%] h-2/3 bg-[radial-gradient(45%_60%_at_30%_100%,rgba(240,167,58,0.08),transparent_70%)]" />
      <motion.svg style={{ x: far }} className={layer} viewBox="0 0 1600 500" preserveAspectRatio="xMinYMax slice">
        <defs>{fade("sc-far", 0.06)}</defs>
        <path
          fill="url(#sc-far)"
          d="M0 230 L70 205 L130 220 L200 170 L255 192 L320 150 L375 172 L445 128 L505 162 L565 140 L640 178 L715 118 L785 158 L855 132 L925 170 L1005 110 L1075 152 L1145 128 L1225 168 L1295 138 L1375 178 L1445 152 L1525 186 L1600 168 L1600 500 L0 500 Z"
        />
      </motion.svg>
      <motion.svg style={{ x: mid }} className={layer} viewBox="0 0 1600 500" preserveAspectRatio="xMinYMax slice">
        <defs>{fade("sc-mid", 0.11)}</defs>
        {/* Green Mountain's rounded shoulder behind the slabs. */}
        <path fill="url(#sc-mid)" d="M20 430 C 140 300, 290 225, 440 238 C 600 252, 800 320, 1000 430 Z" />
        {SLABS.map(([x0, x1, ax, ay]) => (
          <g key={x0}>
            <path fill="url(#sc-mid)" d={`M${x0} 430 L${ax} ${ay} L${x1} 430 Z`} />
            {/* A single bedding line down the slab face. */}
            <path
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1.5"
              fill="none"
              d={`M${ax + 10} ${ay + 20} L${x0 + (x1 - x0) * 0.55} 430`}
            />
          </g>
        ))}
      </motion.svg>
      <motion.svg style={{ x: near }} className={layer} viewBox="0 0 1600 500" preserveAspectRatio="xMinYMax slice">
        <defs>{fade("sc-near", 0.05)}</defs>
        <path
          fill="url(#sc-near)"
          d="M0 430 C 180 400, 330 420, 480 404 S 820 386, 1000 408 S 1340 394, 1600 414 L1600 500 L0 500 Z"
        />
      </motion.svg>
    </motion.div>
  );
}

function Road({ x }: { x: MotionValue<string> }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.6 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: 0.3, duration: 1.4 }}
      className="relative mx-4 mt-1 h-px sm:mx-8"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <motion.div
        aria-hidden
        style={{ backgroundPositionX: x }}
        className="absolute inset-x-0 top-3 h-[2px] [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_36px,transparent_36px_90px)]"
      />
    </motion.div>
  );
}

/* ─── Route: a marker climbs the profile as you scroll ──────────────────── */

const MIN_FT = 4500;
const MAX_FT = 12500;
const yFor = (ft: number) => 280 - ((ft - MIN_FT) / (MAX_FT - MIN_FT)) * 260;
const STOPS = [
  { ...ROUTE[0], x: 20, align: "left" as const },
  { ...ROUTE[1], x: 620, align: "center" as const },
  { ...ROUTE[2], x: 980, align: "right" as const },
];
const PROFILE =
  `M ${STOPS[0].x} ${yFor(STOPS[0].ft)} ` +
  `C 300 ${yFor(5600)}, 420 ${yFor(9800)}, ${STOPS[1].x} ${yFor(STOPS[1].ft)} ` +
  `S 860 ${yFor(9300)}, ${STOPS[2].x} ${yFor(STOPS[2].ft)}`;

function Route() {
  const wrap = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start 0.85", "end 0.5"] });
  const mx = useMotionValue(STOPS[0].x);
  const my = useMotionValue(yFor(STOPS[0].ft));
  const left = useTransform(mx, (x) => `${x / 10}%`);
  const top = useTransform(my, (y) => `${y / 3}%`);
  const [reached, setReached] = useState(0);

  function place(p: number) {
    const el = path.current;
    if (!el) return;
    const pt = el.getPointAtLength(el.getTotalLength() * p);
    mx.set(pt.x);
    my.set(pt.y);
    const n = STOPS.filter((s) => pt.x >= s.x - 2).length;
    setReached((r) => (r === n ? r : n));
  }
  useMotionValueEvent(scrollYProgress, "change", place);
  useEffect(() => place(scrollYProgress.get()), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className={`${section} !pt-6 sm:!pt-10`}>
      <Eyebrow>Your drive</Eyebrow>
      <h2 className={`${display} mt-3 max-w-3xl text-4xl font-semibold leading-[0.95] sm:text-6xl`}>
        {(ROUTE[1].ft - ROUTE[0].ft).toLocaleString("en-US")} feet of climbing, in both seasons.
      </h2>
      <p className="mt-5 max-w-2xl text-white/60">
        July with the roof off, January with skis in the back. Every car below is ranked
        against this drive.
      </p>

      <div ref={wrap} className="relative mt-14">
        <svg
          viewBox="0 0 1000 300"
          className="block w-full overflow-visible"
          role="img"
          aria-label="Elevation profile: Boulder 5,328 ft, over Loveland Pass at 11,990 ft, down to Breckenridge at 9,600 ft"
        >
          <defs>
            <linearGradient id="profile-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0.1" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${PROFILE} L 980 300 L 20 300 Z`} fill="url(#profile-fill)" />
          <path d={PROFILE} fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="2" />
          <motion.path
            ref={path}
            d={PROFILE}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            style={{ pathLength: scrollYProgress }}
          />
          {STOPS.map((s, i) => (
            <g key={s.name}>
              <line
                x1={s.x}
                x2={s.x}
                y1={yFor(s.ft)}
                y2={300}
                stroke="white"
                strokeOpacity={reached > i ? 0.35 : 0.12}
                strokeDasharray="3 5"
              />
              <circle
                cx={s.x}
                cy={yFor(s.ft)}
                r="6"
                fill="#0d0e10"
                stroke={reached > i ? "var(--accent)" : "rgba(255,255,255,.3)"}
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
        {/* The traveller, positioned in % of the same 1000×300 box. */}
        <motion.span
          aria-hidden
          style={{ left, top }}
          className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_0_6px_rgba(255,255,255,0.08),0_0_24px_var(--accent)]"
        />
      </div>

      {/* Labels sit under their points on wide screens, stack on phones. */}
      <ol className="mt-6 grid gap-6 sm:relative sm:block sm:h-24">
        {STOPS.map((s, i) => (
          <li
            key={s.name}
            style={{ "--x": `${s.x / 10}%` } as React.CSSProperties}
            className={`border-t border-white/15 pt-4 transition-opacity duration-500 sm:absolute sm:top-0 sm:left-[var(--x)] sm:border-0 sm:pt-0 ${
              { left: "", center: "sm:-translate-x-1/2 sm:text-center", right: "sm:-translate-x-full sm:text-right" }[s.align]
            } ${reached > i ? "opacity-100" : "opacity-40"}`}
          >
            <div className={`${display} whitespace-nowrap text-2xl font-semibold`}>{s.name}</div>
            <div className="mt-1 whitespace-nowrap text-sm text-white/50">
              <span className="font-mono tabular-nums text-[var(--accent)]">
                <Counter to={s.ft} start={reached > i} /> ft
              </span>{" "}
              · {s.note}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Counter({ to, start }: { to: number; start: boolean }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("en-US"));
  useEffect(() => {
    if (!start) return;
    const controls = animate(mv, to, { duration: reduce ? 0 : 1.2, ease: EASE });
    return () => controls.stop();
  }, [start, to, mv, reduce]);
  return <motion.span>{text}</motion.span>;
}

/* ─── Garage: the shortlist, re-ranked by season ────────────────────────── */

type SpecKey = keyof Specs | "price";

const SPEC_ROWS: { key: SpecKey; label: string; value: (c: ShortlistCar) => string }[] = [
  { key: "zeroToSixty", label: "0–60 mph", value: (c) => c.specs.zeroToSixty ?? "—" },
  { key: "topSpeed", label: "Top speed", value: (c) => c.specs.topSpeed ?? "—" },
  { key: "drive", label: "Drive", value: (c) => (c.specs.drive.startsWith("All") ? "AWD" : "RWD") },
  { key: "seats", label: "Seats", value: (c) => c.specs.seats },
  { key: "price", label: "From", value: (c) => usd(c.price) },
];

function Garage({
  cars,
  mode,
  setMode,
}: {
  cars: ShortlistCar[];
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  const order = ranked(cars, mode);
  const lit = MODE_SPECS[mode];
  const active = MODES.find((m) => m.id === mode)!;

  return (
    <section className={`${section} relative isolate`}>
      {/* A low glow in the season's colour, so the whole list reads as "seen through" it. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={mode}
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none absolute inset-x-0 top-48 -z-10 h-[70%]"
          style={{ background: `radial-gradient(55% 45% at 50% 40%, ${ACCENT[mode]}1c, transparent 70%)` }}
        />
      </AnimatePresence>

      <Eyebrow>Your shortlist</Eyebrow>
      <h2 className={`${display} mt-3 text-4xl font-semibold leading-[0.95] sm:text-6xl`}>
        Four cars, three lenses.
      </h2>

      {/* Sticky so the re-ranking is visible while you scroll the cards. */}
      <div className="sticky top-0 z-20 -mx-4 mt-8 bg-[#0d0e10]/85 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <fieldset className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <legend className="sr-only">Rank the shortlist for</legend>
          <div className="inline-flex rounded-full border border-white/15 p-1">
            {MODES.map((m) => (
              <label
                key={m.id}
                className="relative cursor-pointer rounded-full px-4 py-2 text-sm font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white"
              >
                <input
                  type="radio"
                  name="mode"
                  value={m.id}
                  checked={mode === m.id}
                  onChange={() => setMode(m.id)}
                  className="sr-only"
                />
                {mode === m.id && (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-full bg-[var(--accent)]"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className={`relative transition-colors ${mode === m.id ? "text-black" : "text-white/70 hover:text-white"}`}>
                  {m.label}
                </span>
              </label>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={mode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-sm text-white/55"
            >
              {active.blurb}
            </motion.p>
          </AnimatePresence>
        </fieldset>
      </div>

      <ol className="mt-6 divide-y divide-white/10 border-y border-white/10">
        {order.map((car, i) => (
          <motion.li
            key={car.id}
            layout
            transition={{ type: "spring", bounce: 0.12, duration: 0.7 }}
            className="relative grid items-center gap-x-8 gap-y-4 py-8 md:grid-cols-[3rem_minmax(0,1.1fr)_minmax(0,1fr)]"
          >
            {/* On phones the rank sits over the image's empty top-left corner. */}
            <motion.span
              layout="position"
              className={`${display} absolute left-0 top-8 z-10 text-2xl font-semibold text-[var(--accent)] transition-colors duration-500 md:static md:text-3xl`}
            >
              {String(i + 1).padStart(2, "0")}
            </motion.span>

            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1 }}
            >
              <Image
                src={car.image}
                alt={`${car.name}, side view`}
                width={car.width}
                height={car.height}
                sizes="(min-width: 768px) 34rem, 92vw"
                className="h-auto w-full"
              />
            </motion.div>

            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className={`${display} text-2xl font-semibold`}>{car.name}</h3>
                <span className="text-white/50">{car.specs.fuel}</span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={mode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 min-h-[3rem] leading-relaxed text-white/75"
                >
                  {car.lines[mode]}
                </motion.p>
              </AnimatePresence>
              <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5">
                {SPEC_ROWS.map((s) => {
                  const on = lit.includes(s.key);
                  return (
                    <div key={s.key}>
                      <dt className="text-[11px] uppercase tracking-wider text-white/40">{s.label}</dt>
                      <dd
                        className={`mt-0.5 font-mono text-sm tabular-nums transition-colors duration-500 ${
                          on ? "font-semibold text-[var(--accent)]" : "text-white/70"
                        }`}
                      >
                        {s.value(car)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/* ─── Launch: 0–60 in real time, so the gap is felt rather than read ───── */

function Launch({ cars }: { cars: ShortlistCar[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion() ?? false;
  const [replays, setReplays] = useState(0);
  // 0 = on the line. Scrolling it into view is the first launch; each replay is another.
  const run = inView ? replays + 1 : 0;
  const order = [...cars].sort((a, b) => secs(a) - secs(b));
  const slowest = Math.max(...cars.map(secs));

  const clock = useMotionValue(0);
  const clockText = useTransform(clock, (v) => v.toFixed(2));
  useEffect(() => {
    if (!run) return;
    clock.set(0);
    const c = animate(clock, slowest, { duration: reduce ? 0 : slowest, ease: "linear" });
    return () => c.stop();
  }, [run, slowest, reduce, clock]);

  const bars = [
    { label: "Horsepower", value: (c: ShortlistCar) => c.specs.hp, fmt: (c: ShortlistCar) => `${c.specs.hp} hp` },
    { label: "Starting price", value: (c: ShortlistCar) => c.price, fmt: (c: ShortlistCar) => usd(c.price) },
  ];

  return (
    <section className={section}>
      <Eyebrow>Launch control</Eyebrow>
      <h2 className={`${display} mt-3 max-w-3xl text-4xl font-semibold leading-[0.95] sm:text-6xl`}>
        Closer than the badges suggest.
      </h2>
      <p className="mt-5 max-w-2xl text-white/60">
        Each car runs 0–60 at its published time, in real time. {spread(cars.map(secs)).toFixed(1)}{" "}
        seconds separates first from last. The price gap is {usd(spread(cars.map((c) => c.price)))}.
      </p>

      <div ref={ref} className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-3xl tabular-nums sm:text-4xl">
            <motion.span>{clockText}</motion.span>
            <span className="ml-1 text-base text-white/40">s</span>
          </span>
          <button
            type="button"
            onClick={() => setReplays((r) => r + 1)}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition-colors hover:border-white/50 hover:bg-white/5"
          >
            {run ? "Run it again" : "Launch"}
          </button>
        </div>
        {order.map((car) => (
          <Lane key={`${car.id}-${run}`} car={car} running={run > 0} reduce={reduce} />
        ))}
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        {bars.map((m, mi) => {
          const max = Math.max(...cars.map(m.value));
          return (
            <div key={m.label}>
              <h3 className="border-b border-white/15 pb-2 font-semibold">{m.label}</h3>
              <ul className="mt-4 space-y-4">
                {order.map((c, ci) => (
                  <li key={c.id}>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">{c.name}</span>
                      <span className="font-mono tabular-nums">{m.fmt(c)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/10">
                      <motion.div
                        className="h-full origin-left rounded-full bg-white/80"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: m.value(c) / max }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ delay: mi * 0.15 + ci * 0.08, duration: 1 }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Lane({ car, running, reduce }: { car: ShortlistCar; running: boolean; reduce: boolean }) {
  const [done, setDone] = useState(false);
  const s = secs(car);
  return (
    <div className="border-t border-white/10 pt-3 first-of-type:border-0">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-white/70">{car.name}</span>
        <span className={`font-mono tabular-nums transition-colors ${done ? "text-[var(--accent)]" : "text-white/30"}`}>
          {car.specs.zeroToSixty}
        </span>
      </div>
      <div className="relative h-14 sm:h-20">
        <div className="absolute inset-y-0 right-0 border-r border-dashed border-white/25" />
        {/* The car's front edge travels from the start to the finish line. */}
        <div className="absolute inset-y-0 left-0 right-[7rem] sm:right-[11rem]">
          <motion.div
            className="absolute bottom-1 w-[7rem] sm:w-[11rem]"
            initial={{ left: "0%" }}
            animate={{ left: running ? "100%" : "0%" }}
            // Constant acceleration: distance grows with t², i.e. a quadratic ease-in.
            transition={{ duration: running && !reduce ? s : 0, ease: [0.11, 0, 0.5, 0] }}
            onAnimationComplete={() => running && setDone(true)}
          >
            <Image
              src={car.image}
              alt=""
              width={car.width}
              height={car.height}
              sizes="11rem"
              className="h-auto w-full"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ─── Decision: the one fork only the buyer can settle ──────────────────── */

function Decision({ cars }: { cars: ShortlistCar[] }) {
  const nine11 = cars.find((c) => c.id === 14)!;
  const macan = cars.find((c) => c.id === 55)!;
  const options = [
    { car: nine11, kicker: "Your 911 moment", body: "Wanted since you were a kid. Skis on the roof." },
    {
      car: macan,
      kicker: "Does everything",
      body: `More power, five seats, and ${usd(nine11.price - macan.price)} less.`,
    },
  ];

  return (
    <section className={section}>
      <Eyebrow>One real question</Eyebrow>
      <h2 className={`${display} mt-3 max-w-3xl text-4xl font-semibold leading-[0.95] sm:text-6xl`}>
        Is this the year for the 911?
      </h2>
      <p className="mt-5 max-w-2xl text-white/60">Every car here does the drive. The rest is your call.</p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {options.map((o, i) => (
          <motion.article
            key={o.car.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.12 }}
            className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/25 sm:p-8"
          >
            <span className="text-sm uppercase tracking-[0.2em] text-white/50">{o.kicker}</span>
            <h3 className={`${display} mt-2 text-3xl font-semibold`}>{o.car.name}</h3>
            <p className="mt-2 text-white/70">{o.body}</p>

            {/* Fixed-ratio stage so a tall SUV and a low coupe line up. */}
            <div className="relative my-8 aspect-[3/1] transition-transform duration-700 ease-out group-hover:translate-x-3">
              <Image
                src={o.car.image}
                alt=""
                fill
                sizes="(min-width: 768px) 30rem, 90vw"
                className="object-contain object-bottom"
              />
            </div>

            <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
              {[
                ["0–60 mph", o.car.specs.zeroToSixty],
                ["Seats", o.car.specs.seats],
                ["From", usd(o.car.price)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-wider text-white/40">{label}</dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <a
              href={o.car.href}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#f2f1ee] px-6 py-3 font-semibold text-black transition-colors hover:bg-white"
            >
              Explore the {o.car.name}
              <span aria-hidden className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-white/50">
      <span className="h-px w-8 bg-[var(--accent)] transition-colors duration-500" />
      {children}
    </p>
  );
}
