"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { grams, payload, usd, type KitItem } from "@/lib/examples/arcteryx";
import {
  EXAG,
  PRODUCT_APEX,
  TURNS,
  activeCard,
  apexT,
  burst,
  draw,
  readout,
  step,
  trail,
  type Particle,
} from "@/components/examples/ArcteryxScene";

/**
 * Follows arcteryx.com's own look: Helvetica Now Display, black and white,
 * a black header with the wordmark, grey (#f2f2f2) product tiles, prices
 * written "$750", and short, plain sentences.
 *
 * One signature interaction: the run. Everything else stays quiet.
 */

const EASE = [0.25, 0.1, 0.25, 1] as const;
const first = payload.user_name.split(" ")[0];

export function ArcteryxRun({ kit }: { kit: KitItem[] }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE, duration: 0.5 }}>
      <main className="min-h-screen overflow-x-clip bg-white text-black antialiased selection:bg-black selection:text-white">
        <Run kit={kit} />
        <Kit kit={kit} />
        <Summary kit={kit} />
        <Footer />
      </main>
    </MotionConfig>
  );
}

/* ─── Header, as on arcteryx.com ──────────────────────────────────────── */

function Header() {
  return (
    <header className="relative z-20 flex h-12 items-center justify-between bg-black px-4 text-white sm:px-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/examples/arcteryx/wordmark-white.svg" alt="Arc'teryx" width={123} height={20} className="h-[15px] w-auto sm:h-[17px]" />
      <span className="flex items-center gap-2.5 text-[13px] text-white/80">
        <span className="hidden sm:inline">Prepared for</span> {payload.user_name}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={payload.user_photo} alt="" width={26} height={26} className="h-[26px] w-[26px] rounded-full object-cover" />
      </span>
    </header>
  );
}

/* ─── The run: pinned while the rider goes Peak to Creek ──────────────── */

function Run({ kit }: { kit: KitItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elevRef = useRef<HTMLSpanElement>(null);
  const kmRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion() ?? false;
  const [card, setCard] = useState(-1);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // A little inertia, so a flick of the wheel becomes a carve, not a jump.
  const p = useSpring(scrollYProgress, { stiffness: 160, damping: 32, mass: 0.45, restDelta: 0.0002 });

  const introOpacity = useTransform(p, [0, 0.05], [1, 0]);
  const introY = useTransform(p, [0, 0.06], [0, -40]);
  const hudOpacity = useTransform(p, [0.1, 0.14, 0.86, 0.9], [0, 1, 1, 0]);
  const endOpacity = useTransform(p, [0.93, 0.985], [0, 1]);
  const endY = useTransform(p, [0.93, 0.985], [16, 0]);
  const captionOpacity = useTransform(p, [0, 0.05, 0.92, 0.97], [1, 0, 0, 1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const font = getComputedStyle(canvas).fontFamily;
    const particles: Particle[] = [];
    const marks = kit.map((k) => k.name);
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let lastT = -1;
    let lastCard = -2;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Reduced motion: one still, composed frame of the finished line.
      const pv = reduced ? 1 : p.get();
      const tNow = Math.min(1, Math.max(0, (pv - 0.1) / 0.76));
      if (!reduced && lastT >= 0) {
        // Every apex the rider crosses, in either direction, throws snow.
        for (let k = 0; k < TURNS; k++) {
          const a = apexT(k);
          if ((lastT < a && tNow >= a) || (lastT > a && tNow <= a)) {
            burst(particles, a, PRODUCT_APEX.includes(k), Math.random);
          }
        }
        const d = tNow - lastT;
        if (d > 0.0002 && tNow < 1) trail(particles, tNow, Math.min(8, Math.round(d * 5000)), Math.random);
      }
      lastT = tNow;
      step(particles, dt);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw({ ctx, w, h, p: pv, particles, font, marks });

      const r = readout(pv);
      if (elevRef.current) elevRef.current.textContent = `${r.elev.toLocaleString("en-US")} m`;
      if (kmRef.current) kmRef.current.textContent = `${r.km} km`;
      if (barRef.current) barRef.current.style.transform = `scaleX(${tNow.toFixed(4)})`;
      const c = reduced ? -1 : activeCard(pv);
      if (c !== lastCard) {
        lastCard = c;
        setCard(c);
      }

      raf = particles.length ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.round(rect.width);
      h = Math.round(rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      kick();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const unsub = p.on("change", kick);
    // Fonts arrive after first paint; redraw the labels in the real face.
    document.fonts?.ready.then(kick);
    return () => {
      unsub();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [p, reduced, kit]);

  return (
    <section ref={ref} className={reduced ? "relative h-[100svh]" : "relative h-[420svh]"}>
      <div className="sticky top-0 flex h-[100svh] min-h-[600px] flex-col overflow-hidden bg-[#f1f3f4]">
        <Header />
        <div className="relative min-h-0 flex-1">
          <canvas
            ref={canvasRef}
            aria-label="A section through Whistler Mountain: a snowboarder carves twelve turns from Whistler Peak down to Creekside."
            role="img"
            className="absolute inset-0 h-full w-full"
          />

          {/* Intro */}
          <motion.div
            style={reduced ? undefined : { opacity: introOpacity, y: introY }}
            className="pointer-events-none relative px-4 pt-6 sm:px-8 sm:pt-10"
          >
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] sm:text-[13px]">
              {first}&rsquo;s first season · Whistler Blackcomb
            </p>
            <h1 className="mt-3 text-[clamp(3.1rem,8.4vw,7.4rem)] font-bold leading-[0.88] tracking-[-0.035em]">
              Peak to Creek.
            </h1>
            <p className="mt-4 max-w-[34rem] text-[15px] leading-[1.45] text-black/75 sm:mt-5 sm:text-[17px]">
              Night laps on the North Shore after work. Whistler Blackcomb on weekends, December to April. Four
              pieces from the Arc&rsquo;teryx ski and snowboard range for heavy coast snow, and the goal: top to
              bottom without stopping.
            </p>
            {!reduced && (
              <p className="mt-6 flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.12em] sm:mt-8">
                <span className="inline-block h-px w-10 bg-black" /> Scroll to drop in
              </p>
            )}
          </motion.div>

          {/* Product at each turn */}
          <AnimatePresence mode="wait">
            {card >= 0 && <TurnCard key={kit[card].id} item={kit[card]} index={card} total={kit.length} />}
          </AnimatePresence>

          {/* Readout */}
          {!reduced && <Hud opacity={hudOpacity} elevRef={elevRef} kmRef={kmRef} barRef={barRef} />}

          {/* End of the run */}
          {!reduced && (
            <motion.div
              style={{ opacity: endOpacity, y: endY }}
              className="pointer-events-none absolute inset-x-0 top-0 px-4 pt-6 sm:px-8 sm:pt-10"
            >
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] sm:text-[13px]">Peak to Creek · {TURNS} turns</p>
              <h2 className="mt-3 text-[clamp(2.6rem,6.4vw,5.6rem)] font-bold leading-[0.9] tracking-[-0.035em]">
                Top to bottom.
              </h2>
              <p className="mt-4 text-[15px] text-black/75 sm:text-[17px]">
                {kit.length} pieces · {grams(kit.reduce((s, k) => s + k.weight_g, 0))} ·{" "}
                {usd(kit.reduce((s, k) => s + k.price, 0))}
              </p>
            </motion.div>
          )}

          <motion.p
            style={reduced ? undefined : { opacity: captionOpacity }}
            className="pointer-events-none absolute bottom-3 right-4 max-w-[60%] text-right text-[10px] uppercase leading-snug tracking-[0.1em] text-black/55 sm:right-8 sm:max-w-none"
          >
            Section · Creekside – Whistler Peak – Blackcomb Peak · 12.9 km · vertical ×{EXAG} · SRTM 30 m
          </motion.p>
        </div>
      </div>
    </section>
  );
}

function Hud({
  opacity,
  elevRef,
  kmRef,
  barRef,
}: {
  opacity: MotionValue<number>;
  elevRef: React.RefObject<HTMLSpanElement | null>;
  kmRef: React.RefObject<HTMLSpanElement | null>;
  barRef: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <motion.div
      style={{ opacity }}
      className="pointer-events-none absolute bottom-9 left-3 w-[min(22rem,calc(100vw-1.5rem))] bg-white/90 px-4 py-3 shadow-[0_12px_40px_rgba(20,30,40,0.12)] backdrop-blur sm:bottom-12 sm:left-8"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em]">Peak to Creek · Whistler Mountain</p>
      <div className="mt-2 flex gap-8 tabular-nums">
        <p>
          <span className="block text-[10px] uppercase tracking-[0.1em] text-black/55">Elevation</span>
          <span ref={elevRef} className="text-2xl font-bold tracking-tight">
            2,149 m
          </span>
        </p>
        <p>
          <span className="block text-[10px] uppercase tracking-[0.1em] text-black/55">To Creekside</span>
          <span ref={kmRef} className="text-2xl font-bold tracking-tight">
            4.4 km
          </span>
        </p>
      </div>
      <div className="relative mt-3 h-px w-full bg-black/20">
        <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-black" />
        {PRODUCT_APEX.map((a) => (
          <span
            key={a}
            className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-black"
            style={{ left: `${(apexT(a) * 100).toFixed(2)}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function TurnCard({ item, index, total }: { item: KitItem; index: number; total: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="absolute left-3 right-3 top-3 flex gap-4 bg-white p-3 shadow-[0_12px_40px_rgba(20,30,40,0.14)] sm:left-8 sm:right-auto sm:top-10 sm:w-[25rem] sm:gap-5 sm:p-4"
    >
      <div className="relative h-[118px] w-[92px] shrink-0 bg-[#f2f2f2] sm:h-[160px] sm:w-[126px]">
        <Image src={item.image} alt={item.fullName} fill sizes="126px" className="object-contain p-2" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black/55 sm:text-[11px]">
          Turn {PRODUCT_APEX[index] + 1} · {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")} ·{" "}
          {item.role}
        </p>
        <h3 className="mt-1 text-[18px] font-bold leading-tight tracking-tight sm:text-[22px]">{item.name}</h3>
        <p className="mt-0.5 text-[13px] tabular-nums sm:text-[14px]">
          {usd(item.price)} <span className="text-black/45">·</span> {grams(item.weight_g)}
        </p>
        <p className="mt-2 text-[12.5px] leading-snug text-black/70 sm:text-[13.5px]">{item.why}</p>
      </div>
    </motion.article>
  );
}

/* ─── The kit ─────────────────────────────────────────────────────────── */

function Kit({ kit }: { kit: KitItem[] }) {
  return (
    <section className="mx-auto max-w-[1360px] px-4 py-20 sm:px-8 sm:py-28">
      <p className="text-[12px] font-bold uppercase tracking-[0.12em]">The kit</p>
      <h2 className="mt-3 max-w-5xl text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-[0.98] tracking-[-0.03em]">
        Shell, insulation, base layer, pant.
      </h2>
      <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-black/70">
        In the order they came up on the run. Waterproof where the weather hits, warm where it&rsquo;s damp.
      </p>

      <div className="mt-12 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {kit.map((item, i) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="flex flex-col"
          >
            <div className="relative aspect-[4/5] bg-[#f2f2f2]">
              <Image
                src={item.image}
                alt={item.fullName}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-contain p-8"
              />
              <span className="absolute left-3 top-3 text-[11px] font-bold uppercase tracking-[0.12em]">
                {String(i + 1).padStart(2, "0")} {item.role}
              </span>
            </div>
            <h3 className="mt-4 text-[19px] font-bold tracking-tight">{item.name}</h3>
            <p className="text-[15px] tabular-nums">{usd(item.price)}</p>
            <p className="mt-2 text-[14px] leading-snug text-black/70">{item.tagline}</p>
            <dl className="mt-4 grid grid-cols-[5.5rem_1fr] gap-y-1.5 border-t border-black/15 pt-3 text-[13px]">
              <dt className="text-black/55">Weight</dt>
              <dd className="tabular-nums">{item.weight}</dd>
              <dt className="text-black/55">Fabric</dt>
              <dd>{item.spec}</dd>
              <dt className="text-black/55">Fit</dt>
              <dd>{item.fit}</dd>
              <dt className="text-black/55">Colour</dt>
              <dd className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/15" style={{ background: item.hex }} />
                {item.colour}
              </dd>
            </dl>
            <p className="mt-3 text-[12.5px] text-black/60">{[...item.technical, ...item.snowsport.slice(0, 1)].join(" · ")}</p>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-auto pt-5 text-[13px] font-bold underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              View on arcteryx.com
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ─── For the rider ──────────────────────────────────────────────────────── */

function Summary({ kit }: { kit: KitItem[] }) {
  const total = kit.reduce((s, k) => s + k.price, 0);
  const weight = kit.reduce((s, k) => s + k.weight_g, 0);
  return (
    <section className="bg-[#f2f2f2]">
      <div className="mx-auto grid max-w-[1360px] gap-14 px-4 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.12em]">For {first}</p>
          <div className="mt-6 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={payload.user_photo} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className="text-[19px] font-bold tracking-tight">{payload.user_name}</p>
              <p className="text-[13px] text-black/60">Vancouver · first full season</p>
            </div>
          </div>
          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-black/75">{payload.user_profile}</p>
          <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-black/75">{payload.context}</p>
        </div>

        <div>
          <table className="w-full border-collapse text-[14px] tabular-nums">
            <thead>
              <tr className="border-b border-black text-left text-[11px] uppercase tracking-[0.12em]">
                <th className="pb-3 font-bold">Piece</th>
                <th className="pb-3 text-right font-bold">Weight</th>
                <th className="pb-3 text-right font-bold">Price</th>
              </tr>
            </thead>
            <tbody>
              {kit.map((k) => (
                <tr key={k.id} className="border-b border-black/15">
                  <td className="py-3.5">
                    <span className="font-bold">{k.name}</span>
                    <span className="block text-[12px] text-black/55">{k.role}</span>
                  </td>
                  <td className="py-3.5 text-right">{grams(k.weight_g)}</td>
                  <td className="py-3.5 text-right">{usd(k.price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-[16px] font-bold">
                <td className="pt-4">Total</td>
                <td className="pt-4 text-right">{grams(weight)}</td>
                <td className="pt-4 text-right">{usd(total)}</td>
              </tr>
            </tfoot>
          </table>
          <a
            href="https://arcteryx.com/us/en/c/mens/ski-snowboard"
            target="_blank"
            rel="noreferrer"
            className="mt-8 flex h-12 items-center justify-center bg-black px-6 text-[14px] font-bold text-white transition-colors hover:bg-black/80 sm:inline-flex"
          >
            Shop ski &amp; snowboard
          </a>
          <p className="mt-4 text-[12px] text-black/50">
            Prices, weights and specs from the product pages on arcteryx.com. The Sabre Pant&rsquo;s button connectors
            pair with the Sabre Jacket&rsquo;s powder skirt.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-black px-4 py-10 text-white sm:px-8">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/examples/arcteryx/logo-stacked-white.svg" alt="Arc'teryx" width={76} height={45} className="h-[45px] w-auto" />
        <p className="max-w-xl text-[12px] leading-relaxed text-white/60 sm:text-right">
          A concept page built by bespoke from Arc&rsquo;teryx&rsquo;s public catalog. Not affiliated with or
          endorsed by Arc&rsquo;teryx. Terrain from SRTM 30 m elevation data.
        </p>
      </div>
    </footer>
  );
}
