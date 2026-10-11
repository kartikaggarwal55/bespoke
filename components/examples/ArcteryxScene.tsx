/**
 * The run, drawn on a canvas. Pure functions only: no React, no globals.
 *
 * World units are metres. X runs from Creekside (0) through Whistler Peak
 * (4,413) to Blackcomb Peak (12,867); Y is elevation × EXAG, up positive.
 * Every frame is a function of one number, the scroll progress `p`, except
 * the snow spray, which is simulated in time once a turn kicks it up.
 */

import { BACKDROP, RUN_M, SECTION } from "@/lib/examples/arcteryx";

export const EXAG = 2; // vertical exaggeration, printed in the caption
export const TURNS = 12; // apexes on the way down
export const PRODUCT_APEX = [0, 4, 7, 10]; // which apexes carry a product
const BAND = 190; // depth of the visible run surface, metres
/** Oblique projection: one metre of depth (toward the viewer) moves a point
 *  DEPTH_X metres right and one metre down, so the run surface reads as a
 *  strip and the turns cut across it. */
export const DEPTH_X = 0.6;
const X_TOP = RUN_M - 40;
const X_BOTTOM = 70;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const smooth = (a: number, b: number, v: number) => {
  const k = clamp((v - a) / (b - a));
  return k * k * (3 - 2 * k);
};

/* ─── Terrain ─────────────────────────────────────────────────────────── */

const SX = SECTION.map((p) => p[0]);
const SE = SECTION.map((p) => p[1]);

function interp(xs: number[], ys: number[], x: number) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0;
  let hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= x) lo = mid;
    else hi = mid;
  }
  const k = (x - xs[lo]) / (xs[hi] - xs[lo]);
  return ys[lo] + (ys[hi] - ys[lo]) * k;
}

/** Raw DEM: what the skyline is drawn from. */
export const elev = (x: number) => interp(SX, SE, x);

/** Box-blurred three times: what the rider and camera follow, so 30 m DEM
 *  steps never show up as jitter. */
const SMOOTH_E = (() => {
  let a = SE.slice();
  for (let pass = 0; pass < 3; pass++) {
    a = a.map((_, i) => {
      let s = 0;
      let n = 0;
      for (let j = Math.max(0, i - 2); j <= Math.min(a.length - 1, i + 2); j++) {
        s += a[j];
        n++;
      }
      return s / n;
    });
  }
  return a;
})();
export const elevSmooth = (x: number) => interp(SX, SMOOTH_E, x);

/* ─── The line ────────────────────────────────────────────────────────── */

export const apexT = (k: number) => (2 * k + 1) / (2 * TURNS);
const envelope = (t: number) => smooth(0, 0.045, t);
const lateral = (t: number) => Math.sin(Math.PI * TURNS * t) * envelope(t);
export const runX = (t: number) => lerp(X_TOP, X_BOTTOM, t);

/** World position of the board on the snow at run time t. */
function riderAt(t: number) {
  const x = runX(t);
  const z = lateral(t);
  const d = BAND * (0.5 + 0.43 * z);
  return { x: x + DEPTH_X * d, y: elevSmooth(x) * EXAG - d, z };
}

/* ─── Scroll choreography ─────────────────────────────────────────────── */

export function phases(p: number) {
  const kin = ease(clamp((p - 0.02) / 0.14));
  const kout = ease(clamp((p - 0.87) / 0.11));
  const t = clamp((p - 0.1) / 0.76);
  return { k: kin * (1 - kout), t, kin, kout };
}

/** Which product card is up, or -1. */
export function activeCard(p: number) {
  const { t, kout } = phases(p);
  if (t <= 0 || kout > 0.05) return -1;
  let idx = -1;
  PRODUCT_APEX.forEach((a, i) => {
    if (t >= apexT(a) - 0.045) idx = i;
  });
  return idx;
}

type Cam = { x: number; y: number; s: number };

/** Pixels per metre while following the rider: about 2.3 km of mountain
 *  across a desktop screen, so two or three turns are always in view. */
const runScale = (w: number, h: number) => (w >= 768 ? Math.max(w, h * 1.3) / 2300 : 0.4);

export function camera(p: number, w: number, h: number) {
  const wide = w >= 768;
  const [x0, x1] = wide ? [-320, 13150] : [-150, 5250];
  let s0 = w / (x1 - x0);
  s0 = Math.min(s0, (h * 0.5) / ((2400 - 600) * EXAG));
  const ov: Cam = {
    x: (x0 + x1) / 2,
    y: 658 * EXAG + (h * (wide ? 0.4 : 0.37)) / s0,
    s: s0,
  };
  const s1 = runScale(w, h);
  const anchor = wide ? { x: 0.6 * w, y: 0.52 * h } : { x: 0.56 * w, y: 0.46 * h };

  const { k, t } = phases(p);
  const r = riderAt(t);
  // Camera follows the middle of the run surface, not the board, so the
  // frame doesn't bob with every turn.
  const xr = runX(t);
  const cx = xr + DEPTH_X * BAND * 0.5;
  const cy = elevSmooth(xr) * EXAG - BAND * 0.5;
  const s = Math.exp(lerp(Math.log(ov.s), Math.log(s1), k));
  // Where the rider would sit in the overview, gliding to the anchor.
  const px0 = w / 2 + (cx - ov.x) * ov.s;
  const py0 = h / 2 - (cy - ov.y) * ov.s;
  const px = lerp(px0, anchor.x, k);
  const py = lerp(py0, anchor.y, k);
  const cam: Cam = { x: cx - (px - w / 2) / s, y: cy + (py - h / 2) / s, s };
  return { cam, ov, s1, k, t, rider: r, wide };
}

/* ─── Scenery generated once (seeded, so every visit draws the same) ──── */

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Tree = { x: number; d: number; h: number; tone: number };
const TREES: { back: Tree[]; front: Tree[] } = (() => {
  const rnd = mulberry(7);
  const back: Tree[] = [];
  const front: Tree[] = [];
  for (let i = 0; i < 1500; i++) {
    const x = -2500 + rnd() * 15500;
    const e = elev(x);
    if (e > 1380 - rnd() * 140) continue;
    const isRun = x > 0 && x < RUN_M;
    if (rnd() < 0.3) back.push({ x, d: rnd() * 5, h: 20 + rnd() * 18, tone: rnd() });
    else {
      // Trees thin out near the run so the line stays readable.
      const d = (isRun ? BAND + 18 : 4) + Math.pow(rnd(), 1.6) * 900;
      front.push({ x, d, h: 22 + rnd() * 22, tone: rnd() });
    }
  }
  front.sort((a, b) => a.d - b.d);
  return { back, front };
})();

/* ─── Snow spray ──────────────────────────────────────────────────────── */

export type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; age: number; r: number; puff: boolean;
};

export function burst(out: Particle[], t: number, big: boolean, rnd: () => number) {
  const r = riderAt(t);
  // Snow leaves the uphill (right, behind the rider) edge, up and back.
  const n = big ? 120 : 70;
  for (let i = 0; i < n; i++) {
    const a = (0.12 + rnd() * 0.55) * Math.PI; // 20°–120° from +X
    const v = (big ? 70 : 55) + rnd() * (big ? 150 : 110);
    out.push({
      x: r.x + 12 + rnd() * 10, y: r.y + 2 + rnd() * 6,
      vx: Math.cos(a) * v * 0.85 + 25, vy: Math.sin(a) * v,
      life: 0.7 + rnd() * 0.9, age: 0, r: 0.7 + rnd() * 2.1, puff: false,
    });
  }
  for (let i = 0; i < (big ? 9 : 5); i++) {
    out.push({
      x: r.x + 10 + rnd() * 18, y: r.y + 6 + rnd() * 14,
      vx: 18 + rnd() * 40, vy: 12 + rnd() * 30,
      life: 1.1 + rnd() * 0.9, age: 0, r: 10 + rnd() * 12, puff: true,
    });
  }
}

export function trail(out: Particle[], t: number, n: number, rnd: () => number) {
  const r = riderAt(t);
  for (let i = 0; i < n; i++) {
    out.push({
      x: r.x + 8 + rnd() * 8, y: r.y + rnd() * 3,
      vx: 10 + rnd() * 35, vy: 10 + rnd() * 35,
      life: 0.35 + rnd() * 0.4, age: 0, r: 0.6 + rnd() * 1.2, puff: false,
    });
  }
}

export function step(ps: Particle[], dt: number) {
  for (const q of ps) {
    q.age += dt;
    const drag = q.puff ? 0.9 : 0.6;
    q.vx *= Math.exp(-drag * dt * 2);
    q.vy *= Math.exp(-drag * dt * 2);
    if (!q.puff) q.vy -= 160 * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
  }
  let j = 0;
  for (const q of ps) if (q.age < q.life) ps[j++] = q;
  ps.length = j;
}

/* ─── Drawing ─────────────────────────────────────────────────────────── */

const C = {
  skyTop: "#cfd8df",
  skyLow: "#f1f3f4",
  far: "#b7c3cc",
  mid: "#9eacb7",
  snow: "#ffffff",
  snowDeep: "#e3e9ed",
  hatch: "rgba(30,45,60,0.07)",
  line: "rgba(54,82,104,0.62)",
  tree: ["#1d2a28", "#24332f", "#2c3b37"],
  ink: "#000000",
  jacket: "#009dc7", // Sabre Jacket, Aquaculture AC
  jacketLow: "#626979", // … / Stratus
  pant: "#121314", // Sabre Pant, Black
};

type Frame = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  p: number;
  particles: Particle[];
  font: string;
  marks: string[];
};

export function draw({ ctx, w, h, p, particles, font, marks }: Frame) {
  const { cam, k, t, rider, wide } = camera(p, w, h);
  const s = cam.s;
  const sx = (x: number) => w / 2 + (x - cam.x) * s;
  const sy = (y: number) => h / 2 - (y - cam.y) * s;

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, C.skyTop);
  sky.addColorStop(0.75, C.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Backdrop ridges: the Black Tusk → Blackcomb line, at two distances.
  // They barely zoom and drift slowly with the run, which reads as depth.
  const ridge = (depth: number, colour: string, alpha: number, flip: boolean, lift: number, hScale: number) => {
    const zoom = 1 + k * 0.5 * depth;
    const span = w * (wide ? 1.45 : 3) * zoom;
    const hs = (wide ? 0.2 : 0.14) * hScale * zoom * (h / 900);
    const baseOv = h * (wide ? 0.68 : 0.64) - lift;
    const baseRun = h * (wide ? 0.62 : 0.5) - lift * 1.4;
    const base = lerp(baseOv, baseRun, k) + t * k * h * 0.12 * depth;
    const x0 = -w * 0.22 - k * w * 0.25 * depth + t * k * w * 0.35 * depth;
    ctx.beginPath();
    ctx.moveTo(x0, h);
    BACKDROP.forEach((e, i) => {
      const u = flip ? 1 - i / (BACKDROP.length - 1) : i / (BACKDROP.length - 1);
      ctx.lineTo(x0 + u * span, base - (e - 800) * hs);
    });
    ctx.lineTo(x0 + span, h);
    ctx.closePath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  ridge(0.4, C.far, 0.5, true, 70, 0.7);
  ridge(0.8, C.mid, 0.42, false, 0, 1);

  // Haze where the backdrop meets the mountain
  const haze = ctx.createLinearGradient(0, h * 0.35, 0, h);
  haze.addColorStop(0, "rgba(241,243,244,0)");
  haze.addColorStop(1, "rgba(241,243,244,0.65)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, h);

  // The mountain: Creekside → Whistler Peak → Blackcomb Peak, real DEM.
  const left = cam.x - w / 2 / s - 50 - BAND * 4;
  const right = cam.x + w / 2 / s + 50;
  const stepM = Math.max(8, 2 / s);
  const sky1: [number, number][] = [];
  for (let x = left; x <= right; x += stepM) sky1.push([sx(x), sy(elev(x) * EXAG)]);
  ctx.beginPath();
  ctx.moveTo(sky1[0][0], h + 2);
  for (const [x, y] of sky1) ctx.lineTo(x, y);
  ctx.lineTo(sky1[sky1.length - 1][0], h + 2);
  ctx.closePath();
  const top = sy(2400 * EXAG);
  const g = ctx.createLinearGradient(0, top, 0, Math.max(h, top + 10));
  g.addColorStop(0, C.snow);
  g.addColorStop(1, C.snowDeep);
  ctx.fillStyle = g;
  ctx.fill();

  // Skyline edge, drawn like a section line.
  ctx.beginPath();
  sky1.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Hatching: the skyline repeated every 80 m of depth, like contour lines.
  ctx.strokeStyle = C.hatch;
  for (let i = 1; i <= 16; i++) {
    const off = i * 80;
    ctx.beginPath();
    for (let j = 0; j < sky1.length; j++) {
      const y = sky1[j][1] + off * s;
      if (j === 0) ctx.moveTo(sky1[j][0], y);
      else ctx.lineTo(sky1[j][0], y);
    }
    ctx.stroke();
  }

  const tree = (tr: Tree) => {
    if (tr.x < left || tr.x > right) return;
    const base = sy(elev(tr.x) * EXAG - tr.d);
    const x = sx(tr.x + DEPTH_X * tr.d);
    const hh = tr.h * s * (1 + tr.d / 1600);
    if (hh < 0.8) return;
    ctx.fillStyle = C.tree[Math.floor(tr.tone * 3)];
    // Farther from the viewer, a little more haze.
    ctx.globalAlpha = 0.62 + 0.38 * Math.min(1, tr.d / 600);
    ctx.beginPath();
    const ww = hh * 0.36;
    // Three tiers of a coast conifer.
    for (let i = 0; i < 3; i++) {
      const ty = base - hh * (0.12 + i * 0.27);
      const tw = ww * (1 - i * 0.24);
      ctx.moveTo(x - tw, ty);
      ctx.lineTo(x, ty - hh * 0.5);
      ctx.lineTo(x + tw, ty);
    }
    ctx.fill();
    ctx.fillRect(x - Math.max(0.5, hh * 0.03), base - hh * 0.12, Math.max(1, hh * 0.06), hh * 0.12);
    ctx.globalAlpha = 1;
  };
  TREES.back.forEach(tree);

  // The carved line, from the top to where the rider is now.
  if (t > 0) {
    const n = Math.max(2, Math.round(t * 900));
    let prev = riderAt(0);
    const lw = Math.max(0.9, Math.min(2.6, 2.2 * s));
    for (let i = 1; i <= n; i++) {
      const q = riderAt((i / n) * t);
      // Deeper where the edge is set hardest, at each apex.
      ctx.lineWidth = lw * (0.55 + 0.75 * Math.abs(q.z));
      ctx.strokeStyle = C.line;
      ctx.beginPath();
      ctx.moveTo(sx(prev.x), sy(prev.y));
      ctx.lineTo(sx(q.x), sy(q.y));
      ctx.stroke();
      prev = q;
    }
  }

  // Callouts where each product came up: numbered like a drawing's notes.
  PRODUCT_APEX.forEach((a, i) => {
    const ta = apexT(a);
    if (t < ta) return;
    const q = riderAt(ta);
    const x = sx(q.x);
    const y = sy(q.y);
    const alpha = smooth(ta, ta + 0.03, t);
    const lead = Math.max(18, 46 * Math.min(1, s / runScale(w, h)));
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = C.ink;
    ctx.fillStyle = C.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `700 ${wide ? 11 : 10}px ${font}`;
    const text = `${String(i + 1).padStart(2, "0")}  ${marks[i] ?? ""}`.toUpperCase();
    // Leader goes right unless the note would run off the screen.
    const dir = x + lead * 0.7 + 14 + ctx.measureText(text).width > w - 8 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dir * lead * 0.7, y + lead);
    ctx.lineTo(x + dir * (lead * 0.7 + 10), y + lead);
    ctx.stroke();
    ctx.textAlign = dir > 0 ? "left" : "right";
    ctx.fillText(text, x + dir * (lead * 0.7 + 14), y + lead + 4);
    ctx.globalAlpha = 1;
  });

  // Rider
  const scale = clamp(s / runScale(w, h), 0.22, 1) * (wide ? 0.92 : 0.8);
  const rx = sx(rider.x);
  const ry = sy(rider.y);
  const ahead = riderAt(Math.min(1, t + 0.002));
  const behind = riderAt(Math.max(0, t - 0.002));
  // Screen angle of a leftward vector, as a tilt from horizontal.
  const tilt = (dx: number, dy: number) => Math.atan(dy / Math.min(-1e-6, dx));
  const pathAng = tilt(sx(ahead.x) - sx(behind.x), sy(ahead.y) - sy(behind.y));
  const xr = runX(t);
  const slopeAng = tilt(-80, (elevSmooth(xr + 40) - elevSmooth(xr - 40)) * EXAG);
  // The board sits mostly across the slope, swinging toward the path.
  const ang = lerp(slopeAng, pathAng, 0.25);
  const dz = Math.cos(Math.PI * TURNS * t) * envelope(t); // toward/away from viewer
  drawRider(ctx, rx, ry, scale * (1 + 0.1 * rider.z), clamp(ang, -0.62, 0.62), dz);

  // Spray
  for (const q of particles) {
    const a = 1 - q.age / q.life;
    const x = sx(q.x);
    const y = sy(q.y);
    if (q.puff) {
      const rr = (q.r + q.age * 28) * Math.max(0.35, s);
      const pg = ctx.createRadialGradient(x, y, 0, x, y, rr);
      pg.addColorStop(0, `rgba(250,252,253,${0.85 * a})`);
      pg.addColorStop(0.55, `rgba(214,224,231,${0.55 * a})`);
      pg.addColorStop(1, "rgba(200,212,221,0)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const rr = q.r * Math.max(0.5, s);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.strokeStyle = `rgba(80,105,125,${0.6 * a})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  TREES.front.forEach(tree);

  // Labels belong to the overview; they fade as the camera drops in.
  const la = 1 - smooth(0, 0.35, k);
  if (la > 0.01) {
    ctx.globalAlpha = la;
    ctx.font = `500 ${wide ? 12 : 11}px ${font}`;
    ctx.fillStyle = C.ink;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 1;
    const label = (x: number, e: number, text: string, up: number, align: CanvasTextAlign = "center") => {
      const px = sx(x);
      const py = sy(e * EXAG);
      if (px < -40 || px > w + 40) return;
      ctx.beginPath();
      ctx.moveTo(px, py - 6);
      ctx.lineTo(px, py - up);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
      const tw = ctx.measureText(text).width;
      const a2: CanvasTextAlign = px + tw / 2 > w - 12 ? "right" : align;
      ctx.textAlign = a2;
      ctx.fillText(text, px + (a2 === "left" ? -2 : a2 === "right" ? 4 : 0), py - up - 7);
    };
    label(RUN_M, elev(RUN_M), "WHISTLER PEAK", wide ? 70 : 54);
    label(12867, elev(12867), "BLACKCOMB PEAK", 46, "center");
    label(8183, elev(8183), "FITZSIMMONS CREEK", 120);
    label(0, elev(0), "CREEKSIDE", wide ? 70 : 54, "left");
    ctx.globalAlpha = 1;
  }

  // Elevation scale down the left edge, tied to the camera.
  ctx.font = `400 10px ${font}`;
  ctx.textAlign = "left";
  for (let e = 600; e <= 2400; e += 200) {
    const y = sy(e * EXAG);
    if (y < 70 || y > h - 10) continue;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, Math.round(y), e % 400 === 0 ? 14 : 8, 1);
    if (e % 400 === 0 && (wide || k > 0.5)) ctx.fillText(`${e.toLocaleString("en-US")} m`, 18, Math.round(y) + 3.5);
  }

  return { t, k };
}

/** A tapered limb from a to b, widths w1 → w2, with rounded ends: reads as a
 *  sleeve or a pant leg rather than a stroke. */
function limb(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  w1: number,
  w2: number,
) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  // Quad plus two round joints, filled separately so no winding can cut holes.
  ctx.beginPath();
  ctx.moveTo(ax + nx * w1, ay + ny * w1);
  ctx.lineTo(bx + nx * w2, by + ny * w2);
  ctx.lineTo(bx - nx * w2, by - ny * w2);
  ctx.lineTo(ax - nx * w1, ay - ny * w1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ax, ay, w1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bx, by, w2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * A snowboarder facing us, board along the slope, travelling left (nose to
 * the left). Proper proportions (about seven heads tall), A-frame stance with
 * knees flexed in over the bindings, two-segment limbs, shoulders and head
 * turned toward the nose. `dz` (−1…1) is the turn phase: it shifts the hips,
 * swings the arms and leans the body. Units are CSS px at scale 1; the figure
 * is ~68 px tall.
 */
function drawRider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  ang: number,
  dz: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineJoin = "round";

  // ── Board, contact shadow, bindings: these follow the slope exactly.
  ctx.save();
  ctx.rotate(ang);
  const sh = ctx.createRadialGradient(0, 2, 0, 0, 2, 36);
  sh.addColorStop(0, "rgba(40,60,80,0.3)");
  sh.addColorStop(1, "rgba(40,60,80,0)");
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(0, 2.5, 36, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Directional board: longer, more upturned nose (left), shorter tail.
  const deck = ctx.createLinearGradient(0, -4, 0, 1);
  deck.addColorStop(0, "#2a2d31");
  deck.addColorStop(1, "#0c0d0e");
  ctx.fillStyle = deck;
  ctx.beginPath();
  ctx.moveTo(-26, -1.6);
  ctx.bezierCurveTo(-30, -1.8, -33.5, -3.4, -33, -6.4);
  ctx.bezierCurveTo(-32.6, -7.6, -31, -7.2, -29.6, -5.4);
  ctx.bezierCurveTo(-28.4, -3.9, -27, -3.3, -25, -3.3);
  ctx.lineTo(25, -3.3);
  ctx.bezierCurveTo(26.6, -3.3, 27.6, -3.8, 28.6, -5);
  ctx.bezierCurveTo(29.6, -6.2, 31, -6, 30.8, -4.6);
  ctx.bezierCurveTo(30.4, -2.4, 28.2, -1.6, 25, -1.6);
  ctx.closePath();
  ctx.fill();
  // Base edge catching the light.
  ctx.strokeStyle = "#009dc7";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-25, -1.4);
  ctx.lineTo(25, -1.4);
  ctx.stroke();

  // High-back bindings, angled slightly toward each other (duck stance).
  ctx.fillStyle = "#1a1c1e";
  for (const bxp of [-12, 12]) {
    ctx.beginPath();
    ctx.roundRect(bxp - 5, -6.2, 10, 3, 1);
    ctx.fill();
  }
  ctx.restore();

  // ── Body: tilts most of the way with the slope (riders stay roughly
  // square to the board), plus a lean into the turn.
  const bodyRot = ang * 0.6 + dz * 0.08;
  ctx.rotate(bodyRot);
  // Bindings in the body's frame, so the boots land exactly on the board.
  const rel = ang - bodyRot;
  const onBoard = (bx: number, by: number) => ({
    x: bx * Math.cos(rel) - by * Math.sin(rel),
    y: bx * Math.sin(rel) + by * Math.cos(rel),
  });
  const hipX = -1.5 + dz * 2.2; // hips shift over the working edge
  const lean = -2.5 + dz * 1.2; // upper body leans toward the nose

  // Joints (y up is negative).
  const footF = onBoard(-12, -6.5);
  const footB = onBoard(12, -6.5);
  // Knees flex in over the bindings: just inside the line from hip to boot.
  const kneeF = { x: footF.x * 0.72 + (hipX - 5) * 0.28 + 2.2 + dz * 0.8, y: (footF.y + -29) / 2 + 1.5 };
  const kneeB = { x: footB.x * 0.72 + (hipX + 5) * 0.28 - 2.2 + dz * 0.8, y: (footB.y + -29) / 2 + 1.5 };
  const hipF = { x: hipX - 5, y: -29 };
  const hipB = { x: hipX + 5, y: -29 };
  const shF = { x: hipX + lean - 8.5, y: -48 };
  const shB = { x: hipX + lean + 8, y: -49 };
  const neck = { x: hipX + lean - 1, y: -51 };

  // Boots.
  ctx.fillStyle = "#0b0b0c";
  ctx.beginPath();
  ctx.roundRect(footF.x - 5, footF.y - 4.5, 10, 6, 2);
  ctx.roundRect(footB.x - 5, footB.y - 4.5, 10, 6, 2);
  ctx.fill();

  // Legs: baggy Sabre Pant, thigh then shin, back leg drawn first.
  ctx.fillStyle = "#1d1f22";
  limb(ctx, hipB.x, hipB.y, kneeB.x, kneeB.y, 4.6, 4.1);
  limb(ctx, kneeB.x, kneeB.y, footB.x, footB.y - 3, 4.1, 3.7);
  ctx.fillStyle = C.pant;
  limb(ctx, hipF.x, hipF.y, kneeF.x, kneeF.y, 4.7, 4.2);
  limb(ctx, kneeF.x, kneeF.y, footF.x, footF.y - 3, 4.2, 3.8);
  // Pelvis bridging the two legs.
  ctx.beginPath();
  ctx.ellipse(hipX, -29, 9, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Knee seams: articulated patterning.
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(kneeF.x - 3.5, kneeF.y - 0.5);
  ctx.lineTo(kneeF.x + 3.5, kneeF.y + 0.8);
  ctx.moveTo(kneeB.x - 3.5, kneeB.y + 0.8);
  ctx.lineTo(kneeB.x + 3.5, kneeB.y - 0.5);
  ctx.stroke();

  // Back arm (behind the torso): relaxed, hand by the back hip.
  const elbowB = { x: shB.x + 7.5, y: shB.y + 5 - dz * 1.5 };
  const handB = { x: elbowB.x + 6.5, y: elbowB.y + 4.5 - dz * 2 };
  ctx.fillStyle = "#0081a6";
  limb(ctx, shB.x, shB.y, elbowB.x, elbowB.y, 3.4, 3);
  limb(ctx, elbowB.x, elbowB.y, handB.x, handB.y, 3, 2.6);
  ctx.fillStyle = "#0b0b0c";
  ctx.beginPath();
  ctx.arc(handB.x, handB.y, 2.6, 0, Math.PI * 2);
  ctx.fill();

  // Torso: Sabre Jacket, Stratus lower panel, Aquaculture upper, hem past the hips.
  ctx.fillStyle = C.jacketLow;
  ctx.beginPath();
  ctx.moveTo(hipX - 10, -24);
  ctx.quadraticCurveTo(hipX, -22.5, hipX + 10, -24.5);
  ctx.lineTo(shB.x + 1.5, -39);
  ctx.lineTo(shF.x - 1.5, -38.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.jacket;
  ctx.beginPath();
  ctx.moveTo(shF.x - 1.6, -38.5);
  ctx.lineTo(shB.x + 1.6, -39.2);
  ctx.quadraticCurveTo(shB.x + 2.4, shB.y + 1, shB.x - 0.5, shB.y - 1.6);
  ctx.lineTo(shF.x + 0.5, shF.y - 1.6);
  ctx.quadraticCurveTo(shF.x - 2.4, shF.y + 1, shF.x - 1.6, -38.5);
  ctx.closePath();
  ctx.fill();
  // Shade the far side so the torso reads as round.
  const shade = ctx.createLinearGradient(shF.x - 2, 0, shB.x + 2, 0);
  shade.addColorStop(0, "rgba(255,255,255,0.12)");
  shade.addColorStop(0.55, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(hipX - 10, -24);
  ctx.quadraticCurveTo(hipX, -22.5, hipX + 10, -24.5);
  ctx.lineTo(shB.x - 0.5, shB.y - 1.6);
  ctx.lineTo(shF.x + 0.5, shF.y - 1.6);
  ctx.closePath();
  ctx.fill();
  // Centre zip and hem line.
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(neck.x + 0.5, -49);
  ctx.lineTo(hipX + 0.3, -24);
  ctx.stroke();

  // Lead arm (in front of the torso): reaching toward the nose and down.
  const elbowF = { x: shF.x - 8.5, y: shF.y + 3.5 + dz * 1.2 };
  const handF = { x: elbowF.x - 9, y: elbowF.y + 1.5 + dz * 2.5 };
  ctx.fillStyle = C.jacket;
  limb(ctx, shF.x, shF.y, elbowF.x, elbowF.y, 3.5, 3.1);
  limb(ctx, elbowF.x, elbowF.y, handF.x, handF.y, 3.1, 2.7);
  ctx.fillStyle = "#0b0b0c";
  ctx.beginPath();
  ctx.arc(handF.x, handF.y, 2.7, 0, Math.PI * 2);
  ctx.fill();

  // Hood/collar, then helmet turned toward the nose, then goggles.
  ctx.fillStyle = "#008bb0";
  ctx.beginPath();
  ctx.ellipse(neck.x, -51.5, 5.6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const head = { x: neck.x - 0.8, y: -57.6 };
  const helmet = ctx.createRadialGradient(head.x - 2, head.y - 2.5, 0.5, head.x, head.y, 6.2);
  helmet.addColorStop(0, "#3a3e43");
  helmet.addColorStop(1, "#141618");
  ctx.fillStyle = helmet;
  ctx.beginPath();
  ctx.ellipse(head.x, head.y, 5.4, 5.9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Goggle strap and lens, offset toward the nose (looking downhill).
  ctx.fillStyle = "#0b0b0c";
  ctx.beginPath();
  ctx.roundRect(head.x - 5.6, head.y - 0.9, 11.2, 2.6, 1.2);
  ctx.fill();
  const lens = ctx.createLinearGradient(head.x - 5, head.y - 1, head.x + 2, head.y + 2);
  lens.addColorStop(0, "#f4c25a");
  lens.addColorStop(0.6, "#e07b33");
  lens.addColorStop(1, "#9b3d1f");
  ctx.fillStyle = lens;
  ctx.beginPath();
  ctx.roundRect(head.x - 5.4, head.y - 1.6, 8.2, 4, 1.8);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(head.x - 4.2, head.y - 0.9, 2.6, 0.7);
  // Chin and jaw below the goggles: a sliver of face.
  ctx.fillStyle = "#c99a7a";
  ctx.beginPath();
  ctx.ellipse(head.x - 0.8, head.y + 3.9, 2.7, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Elevation and distance for the HUD, from the DEM under the rider. */
export function readout(p: number) {
  const { t } = phases(p);
  const x = runX(t);
  return { elev: Math.round(elev(x)), km: (x / 1000).toFixed(1) };
}
