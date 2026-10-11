"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  BORN,
  CASEBACK_RING,
  CHILD,
  DEDICATION,
  FRONT_RATIO,
  HANDOVER_YEAR,
  PROFILE_RATIO,
  ROLES,
  payload,
  standout,
  usd,
  type ShortlistWatch,
} from "@/lib/examples/patek";

/**
 * The page is built around one fact from the brief: the watch is Daniel's
 * from 2026 and Emma's from 2047. The hero turns the watch over as the year
 * behind it turns from one to the other; the true-scale comparison shows what
 * actually separates the four on a wrist. Nothing loops. MotionConfig hands
 * transforms to the OS reduced-motion setting, and the hero's turn falls back
 * to a crossfade when it is set.
 *
 * Colour and type follow patek.com: warm whites, #2e2e33 ink, #8c7a66 taupe,
 * and patek.com's own fonts: Open Sans Light uppercase titles over Lora text.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

const serif = "font-[family-name:var(--font-pp-serif)]";
const sans = "font-[family-name:var(--font-pp-sans)]";
const eyebrow = `${sans} text-[12px] font-normal uppercase tracking-[0.12em] text-[#8c7a66]`;
// patek.com titles: Open Sans Light, uppercase, 0.045rem tracking.
const title = `${sans} font-light uppercase tracking-[0.045rem] text-[#2e2e33]`;
const wrap = "mx-auto w-full max-w-[86rem] px-5 sm:px-8 2xl:px-12";

const first = payload.user_name.split(" ")[0];
const bornLong = `${BORN.day} ${BORN.month} ${BORN.year}`;

export function PatekHeirloom({ watches }: { watches: ShortlistWatch[] }) {
  const hero = watches.find((w) => w.role === "dress")!;
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE, duration: 0.8 }}>
      <main className={`${serif} min-h-screen overflow-x-clip bg-[#f8f7f7] text-[#2e2e33] selection:bg-[#8c7a66]/20`}>
        <Hero watch={hero} />
        <Brief />
        <TrueScale watches={watches} />
        <Choice watches={watches} />
        <footer className="border-t border-[#e8e4e0] bg-white">
          <div className={`${wrap} ${sans} space-y-2 py-10 text-xs leading-relaxed text-[#757575]`}>
            <p>
              Suggested US retail prices, taxes excluded, from patek.com in October 2026; subject to
              change. Specifications as published by Patek Philippe.
            </p>
            <p>
              A concept page built by bespoke from Patek Philippe&apos;s public website data. Not
              affiliated with or endorsed by Patek Philippe.
            </p>
          </div>
        </footer>
      </main>
    </MotionConfig>
  );
}

/* ─── Hero: the watch turns over as 2026 becomes 2047 ─────────────────── */

function Hero({ watch }: { watch: ShortlistWatch }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  // 0 → 1 over the half screen of scroll while the stage is pinned.
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // The watch turns a quarter away while its case back turns in to meet it,
  // crossfading, so there is never an edge-on (empty) frame.
  const frontRot = useTransform(p, [0.05, 0.6], [0, 50], { clamp: true });
  const backRot = useTransform(p, [0.3, 0.9], [-50, 0], { clamp: true });
  const frontY = useTransform(frontRot, (v) => (reduce ? 0 : Math.round(v * 10) / 10));
  const backY = useTransform(backRot, (v) => (reduce ? 0 : Math.round(v * 10) / 10));
  const frontOpacity = useTransform(p, [0.36, 0.48], [1, 0]);
  const backOpacity = useTransform(p, [0.36, 0.48], [0, 1]);
  // The year behind the watch counts from his to hers as it turns.
  const year = useTransform(p, (v) => {
    const t = Math.min(1, Math.max(0, (v - 0.05) / 0.85));
    return String(BORN.year + Math.round(t * (HANDOVER_YEAR - BORN.year)));
  });
  const now = useTransform(p, [0.3, 0.42], [1, 0]);
  const later = useTransform(p, [0.46, 0.58], [0, 1]);
  const cue = useTransform(p, [0, 0.08], [1, 0]);
  const etch = useTransform(p, [0.55, 0.88], [0, 1], { clamp: true });
  const s = watch.specs;

  return (
    <section ref={ref} className="relative h-[150svh] bg-[#f8f7f7]">
      <div className="sticky top-0 flex h-[100svh] min-h-[600px] flex-col overflow-hidden">
        <header className="relative z-10 border-b border-[#e8e4e0]/80 bg-[#f8f7f7]/70 backdrop-blur-sm">
          <div className={`${wrap} grid h-[72px] grid-cols-[1fr_auto_1fr] items-center sm:h-[84px]`}>
            <span className={`${sans} hidden text-[11px] uppercase tracking-[0.16em] text-[#757575] sm:block`}>
              Prepared for {payload.user_name}
            </span>
            <span className="sm:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/examples/patek/logo.svg" alt="Patek Philippe Genève" width={164} height={87} className="h-10 w-auto sm:h-12" />
            <span className="flex justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payload.user_photo}
                alt={payload.user_name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover grayscale-[30%]"
              />
            </span>
          </div>
        </header>

        <div className={`${wrap} relative grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-1`}>
          {/* Copy: the dedication, the line, and three facts. Nothing else. */}
          <div className="relative z-10 flex flex-col justify-center pt-7 md:pt-0 md:pb-10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
              className={`${eyebrow} flex items-center gap-3`}
            >
              <span className="h-px w-8 bg-[#8c7a66]" />
              {DEDICATION}
            </motion.p>
            <h1 className={`${title} mt-5 text-[clamp(2.1rem,3.7vw,4.2rem)] leading-[1.06] md:mt-7`}>
              {["From your wrist", `to ${CHILD}’s.`].map((line, i) => (
                <span key={line} className="block overflow-hidden whitespace-nowrap pb-[0.08em]">
                  <motion.span
                    className="block"
                    initial={{ y: "105%" }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            {/* His year, counting to hers as the watch turns over. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 1 }}
              className="mt-5 flex items-end gap-4 md:mt-9"
            >
              <motion.span className={`${sans} text-[2.6rem] font-light leading-none tracking-[0.02em] text-[#8c7a66] tabular-nums md:text-[4.25rem]`}>
                {year}
              </motion.span>
              <span className={`${sans} relative mb-1 h-4 w-48 text-[11px] uppercase tracking-[0.2em] text-[#757575] md:mb-2`}>
                <motion.span style={{ opacity: now }} className="absolute inset-0">
                  Yours
                </motion.span>
                <motion.span style={{ opacity: later }} className="absolute inset-0 whitespace-nowrap">
                  {CHILD}&apos;s · {BORN.day} {BORN.month}
                </motion.span>
              </span>
            </motion.div>

            {/* Three facts about what you are looking at: dial side, then movement. */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="relative mt-8 hidden h-[4.25rem] md:mt-10 md:block"
            >
              <Facts
                opacity={now}
                items={[
                  ["Collection", s.collection],
                  ["Reference", s.reference],
                  ["Case", `${s.material?.replace(" gold", "")} gold · ${s.caseDiameterMm} mm`],
                ]}
              />
              <Facts
                opacity={later}
                items={[
                  ["Caliber", s.caliber ?? ""],
                  ["Parts", String(s.parts ?? "")],
                  ["Winding", (s.winding ?? "").replace(" winding", "")],
                ]}
              />
            </motion.div>
          </div>

          {/* The stage: the year behind, guilloché rings, light, and the watch. */}
          <div className="relative min-h-0">
            <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center md:pl-10">
              <Guilloche />
              <div className="absolute inset-0 bg-[radial-gradient(42%_48%_at_50%_52%,#ffffff_0%,rgba(255,255,255,0)_100%)] md:bg-[radial-gradient(40%_52%_at_55%_50%,#ffffff_0%,rgba(255,255,255,0)_100%)]" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center pb-8 pt-4 md:pb-8 md:pl-10 [perspective:1800px]"
            >
              <div style={{ aspectRatio: FRONT_RATIO }} className="relative h-[min(100%,50rem)]">
                <motion.div style={{ rotateY: frontY, opacity: frontOpacity }} className="absolute inset-0">
                  <Image
                    src={watch.front}
                    alt={`${watch.name}, dial side`}
                    fill
                    sizes="(min-width: 768px) 32rem, 70vw"
                    loading="eager"
                    fetchPriority="high"
                    className="object-contain drop-shadow-[0_28px_34px_rgba(46,46,51,0.18)]"
                  />
                </motion.div>
                <motion.div style={{ rotateY: backY, opacity: backOpacity }} className="absolute inset-0">
                  <Image
                    src={`/examples/patek/${watch.slug}-back.webp`}
                    alt={`${watch.name}, case back showing caliber ${s.caliber}`}
                    fill
                    sizes="(min-width: 768px) 32rem, 70vw"
                    className="object-contain drop-shadow-[0_28px_34px_rgba(46,46,51,0.18)]"
                  />
                  <Engraving reveal={etch} reduce={reduce} />
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>

        <motion.div
          style={{ opacity: cue }}
          className="pointer-events-none absolute bottom-6 left-0 hidden md:block"
        >
          <div className={`${wrap} ${sans} flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-[#939393]`}>
            <span className="h-px w-8 bg-[#c4bdb4]" />
            Scroll to turn it over
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** Fine concentric rings, like the guilloché on a dial, fading out from the
 *  watch. Pure decoration of the stage, drawn once. */
function Guilloche() {
  const rings = Array.from({ length: 34 }, (_, i) => 40 + i * 14);
  return (
    <svg
      viewBox="-520 -520 1040 1040"
      className="absolute h-[150%] max-h-[64rem] w-auto [mask-image:radial-gradient(circle,black_25%,transparent_68%)]"
    >
      {rings.map((r) => (
        <circle key={r} r={r} fill="none" stroke="#d8d0c6" strokeWidth={0.6} opacity={0.55} />
      ))}
    </svg>
  );
}

function Facts({ opacity, items }: { opacity: MV; items: [string, string][] }) {
  return (
    <motion.dl style={{ opacity }} className="absolute inset-0 grid grid-cols-3 border-t border-[#ddd6ce] pt-4">
      {items.map(([k, v], i) => (
        <div key={k} className={i ? "border-l border-[#e8e4e0] pl-5" : "pr-5"}>
          <dt className={`${sans} text-[10px] uppercase tracking-[0.18em] text-[#8c7a66]`}>{k}</dt>
          <dd className={`${sans} mt-1.5 whitespace-nowrap text-[1.05rem] font-light tracking-[0.02em] text-[#2e2e33]`}>{v}</dd>
        </div>
      ))}
    </motion.dl>
  );
}

/**
 * "FOR IRIS · 14.IX.2026" cut into the flat gold ring of the case back. The
 * SVG shares the photo's own 1000 × 1473 coordinates, so the arc lands on the
 * metal at any size. Engraved, not printed: a dark cut with a light lower lip,
 * revealed along the arc as if by the graver.
 */
function Engraving({ reveal, reduce }: { reveal: MV; reduce: boolean }) {
  const id = useId().replace(/:/g, "");
  const { cx, cy, r } = CASEBACK_RING;
  // Upper arc, 80° either side of 12 o'clock, drawn clockwise so the letters stand upright.
  const a = (80 * Math.PI) / 180;
  const x0 = Math.round((cx - r * Math.sin(a)) * 10) / 10;
  const x1 = Math.round((cx + r * Math.sin(a)) * 10) / 10;
  const y = Math.round((cy - r * Math.cos(a)) * 10) / 10;
  const arc = `M ${x0} ${y} A ${r} ${r} 0 0 1 ${x1} ${y}`;
  const text = (dy: number, fill: string, opacity: number) => (
    <text
      dy={dy}
      fill={fill}
      opacity={opacity}
      fontSize={21}
      letterSpacing={7}
      style={{ fontFamily: "var(--font-pp-serif), serif" }}
    >
      <textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">
        {DEDICATION}
      </textPath>
    </text>
  );
  return (
    <svg aria-label={`Engraved on the case back: ${DEDICATION}`} role="img" viewBox="0 0 1000 1473" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <path id={`${id}-arc`} d={arc} />
        <mask id={`${id}-mask`}>
          <motion.path
            d={arc}
            fill="none"
            stroke="white"
            strokeWidth={60}
            style={reduce ? undefined : { pathLength: reveal }}
          />
        </mask>
      </defs>
      <motion.g mask={reduce ? undefined : `url(#${id}-mask)`} style={reduce ? { opacity: reveal } : undefined}>
        {/* Light catching the lower lip of the cut, then the cut itself. */}
        {text(1.4, "#fff3e2", 0.75)}
        {text(0, "#5a3218", 0.72)}
      </motion.g>
    </svg>
  );
}

type MV = ReturnType<typeof useTransform<number, number>>;

/* ─── The brief: who, the moment, the handover ─────────────────────────── */

function Brief() {
  const years = Array.from({ length: HANDOVER_YEAR - BORN.year + 1 }, (_, i) => BORN.year + i);
  const cells: [string, string, string][] = [
    ["Who", payload.user_name, "Architect, Chicago. Wants the last watch he buys for himself."],
    ["Born", `${CHILD}, ${bornLong}`, "Worn every day from her first year."],
    ["Handover", `${BORN.day} ${BORN.month} ${HANDOVER_YEAR}`, "Her twenty-first birthday."],
  ];
  return (
    <section className="relative bg-white">
      <div className={`${wrap} py-20 md:py-28`}>
        <p className={eyebrow}>Brief</p>
        <h2 className={`${title} mt-4 text-[1.7rem] leading-[1.2] sm:text-[2.5rem]`}>Twenty-one years, one watch.</h2>

        <dl className="mt-12 grid border-y border-[#e8e4e0] md:grid-cols-3">
          {cells.map(([k, v, note], i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.1 }}
              className="border-b border-[#e8e4e0] py-7 last:border-b-0 md:border-b-0 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0"
            >
              <dt className={`${sans} text-[10px] uppercase tracking-[0.18em] text-[#8c7a66]`}>{k}</dt>
              <dd className={`${sans} mt-2 text-xl font-light tracking-[0.02em] text-[#2e2e33]`}>{v}</dd>
              <dd className="mt-1.5 text-[15px] text-[#757575]">{note}</dd>
            </motion.div>
          ))}
        </dl>

        {/* The twenty-one years as a line, a tick a year. */}
        <div className="mt-10">
          <div className="relative h-8">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 1.6 }}
              className="absolute inset-x-0 top-1/2 h-px origin-left bg-[#c4bdb4]"
            />
            <div className="absolute inset-0 flex items-center justify-between">
              {years.map((y, i) => {
                const end = i === 0 || i === years.length - 1;
                return (
                  <motion.span
                    key={y}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                    className={end ? "h-3 w-3 rounded-full border border-[#8c7a66] bg-white" : "h-2 w-px bg-[#c4bdb4]"}
                  />
                );
              })}
            </div>
          </div>
          <div className={`${sans} mt-3 flex justify-between text-[11px] uppercase tracking-[0.16em] text-[#757575]`}>
            <span>{BORN.year} · {first}&apos;s</span>
            <span>{HANDOVER_YEAR} · {CHILD}&apos;s</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── True scale: the four, front and profile, at the same millimetres ── */

function TrueScale({ watches }: { watches: ShortlistWatch[] }) {
  const [selected, setSelected] = useState(watches[0].id);
  const name = useId();
  const active = watches.find((w) => w.id === selected)!;
  const thin = Math.min(...watches.map((w) => w.specs.caseThicknessMm));
  const thick = Math.max(...watches.map((w) => w.specs.caseThicknessMm));

  return (
    <section className="bg-[#f4f2f0]">
      <div className={`${wrap} py-20 md:py-28`}>
        <p className={eyebrow}>At true scale</p>
        <h2 className={`${title} mt-4 max-w-3xl text-[1.7rem] leading-[1.2] sm:text-[2.5rem]`}>
          Four references, side by side.
        </h2>
        <p className="mt-4 text-[15px] text-[#757575]">
          Drawn to the same scale, {thin} mm to {thick} mm thick. Choose one.
        </p>

        {/* --mm is one millimetre on screen; every width below is a real dimension times it. */}
        <fieldset className="mt-12 [--mm:calc((100vw-3rem)/165)] md:[--mm:min(3.7px,calc((100vw-8rem)/305))]">
          <legend className="sr-only">Choose a reference</legend>
          <div className="grid grid-cols-2 items-end gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {watches.map((w, i) => {
              const on = w.id === selected;
              return (
                <motion.label
                  key={w.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: i * 0.1, duration: 1 }}
                  className="group cursor-pointer rounded-sm outline-offset-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-[#8c7a66]"
                >
                  <input
                    type="radio"
                    name={name}
                    value={w.id}
                    checked={on}
                    onChange={() => setSelected(w.id)}
                    className="sr-only"
                  />
                  <div className={`flex items-end justify-center transition-opacity duration-500 ${on ? "opacity-100" : "opacity-45 group-hover:opacity-75"}`}>
                    <div className="relative shrink-0" style={{ width: `calc(var(--mm) * ${w.frontMm})`, aspectRatio: FRONT_RATIO }}>
                      <Image src={w.front} alt={`${w.name}, dial side`} fill sizes="14rem" className="object-contain" />
                    </div>
                    <div
                      className="relative -ml-[calc(var(--mm)*6)] shrink-0"
                      style={{ width: `calc(var(--mm) * ${w.profileMm})`, aspectRatio: PROFILE_RATIO }}
                    >
                      <Image src={w.profile} alt={`${w.name}, profile`} fill sizes="6rem" className="object-contain" />
                    </div>
                  </div>
                  <div className={`mt-4 border-t pt-3 transition-colors duration-500 ${on ? "border-[#8c7a66]" : "border-[#d9d3cc]"}`}>
                    <p className={`${sans} text-[11px] uppercase tracking-[0.16em] ${on ? "text-[#8c7a66]" : "text-[#939393]"}`}>{w.label}</p>
                    <p className={`${sans} mt-1 text-lg font-light tracking-[0.03em] text-[#2e2e33]`}>{w.specs.reference}</p>
                    <p className="mt-1 text-sm tabular-nums text-[#757575]">
                      {w.specs.caseDiameterMm} mm · {w.specs.caseThicknessMm} mm thick
                    </p>
                  </div>
                </motion.label>
              );
            })}
          </div>
        </fieldset>

        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45 }}
            className="mt-14 grid overflow-hidden bg-white md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
          >
            <div className="relative aspect-[16/10] bg-[#1f1f1f] md:aspect-auto md:min-h-[28rem]">
              <Image
                src={active.detail}
                alt={`${active.name}, detail`}
                fill
                sizes="(min-width: 768px) 44rem, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col p-6 sm:p-10">
              <p className={eyebrow}>{ROLES[active.role]}</p>
              <h3 className={`${title} mt-3 text-[1.6rem] leading-tight`}>{active.specs.marketingTitle}</h3>
              <p className={`${sans} mt-1 text-sm uppercase tracking-[0.12em] text-[#757575]`}>
                {active.specs.collection} {active.specs.reference}
              </p>
              <p className="mt-5 text-[15px] leading-relaxed text-[#2e2e33]">{standout(active, watches)}</p>
              <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[#e8e4e0] pt-6 text-sm">
                {[
                  ["Case", `${active.specs.material}, ${active.specs.caseDiameterMm} mm`],
                  ["Movement", `${active.specs.caliber}, ${active.specs.winding?.toLowerCase()}`],
                  ["Power reserve", active.specs.powerReserve],
                  [active.specs.bracelet ? "Bracelet" : "Strap", active.specs.bracelet ?? active.specs.strap],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className={`${sans} text-[10px] uppercase tracking-[0.16em] text-[#939393]`}>{k}</dt>
                    <dd className="mt-1 text-[#2e2e33]">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
                <p className={`${sans} text-xl font-light tabular-nums text-[#2e2e33]`}>{usd(active.price)}</p>
                <a
                  href={active.specs.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`${sans} inline-flex items-center gap-2 bg-[#8c7a66] px-6 py-3.5 text-[14px] uppercase tracking-[0.0175rem] text-white transition-colors hover:bg-[#75664f]`}
                >
                  Discover the {active.specs.reference}
                </a>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─── The choice: three paths, one handover ───────────────────────────── */

function Choice({ watches }: { watches: ShortlistWatch[] }) {
  const roles = ["dress", "sport", "calendar"] as const;
  return (
    <section className="bg-white">
      <div className={`${wrap} py-20 md:py-28`}>
        <p className={eyebrow}>Your choice</p>
        <h2 className={`${title} mt-4 max-w-3xl text-[1.7rem] leading-[1.2] sm:text-[2.5rem]`}>
          Whichever you choose, it is {CHILD}&apos;s in&nbsp;{HANDOVER_YEAR}.
        </h2>
        <div className="mt-12 grid border-t border-[#e8e4e0] md:grid-cols-3">
          {roles.map((role, i) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.12 }}
              className="border-b border-[#e8e4e0] py-8 md:border-b-0 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0"
            >
              <p className={eyebrow}>{ROLES[role]}</p>
              <ul className="mt-5 space-y-5">
                {watches
                  .filter((w) => w.role === role)
                  .map((w) => (
                    <li key={w.id} className="flex items-center gap-4">
                      <div className="relative h-24 w-16 shrink-0">
                        <Image src={w.front} alt="" fill sizes="4rem" className="object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className={`${serif} text-lg text-[#1f1f1f]`}>{w.specs.marketingTitle}</p>
                        <p className="text-sm text-[#757575]">
                          {w.specs.collection} {w.specs.reference}
                        </p>
                        <p className="mt-1 flex items-baseline gap-4 text-sm">
                          <span className="tabular-nums text-[#2e2e33]">{usd(w.price)}</span>
                          <a
                            href={w.specs.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs uppercase tracking-[0.14em] text-[#8c7a66] underline-offset-4 hover:underline"
                          >
                            Discover
                          </a>
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
