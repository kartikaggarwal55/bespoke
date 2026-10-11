/**
 * Golden example: "From your wrist to Emma's" on Patek Philippe.
 *
 * `payload` is exactly what the agent would send to POST /v1/pages for this
 * journey. Everything else is what a great merchant page derives from it.
 * Every name, figure and quoted line comes from data/patek.json, normalised
 * from the product pages on patek.com; the rest comes from the payload.
 *
 * Prices: patek.com server-renders a per-visitor price into each product
 * page's __NEXT_DATA__ (componentProps[<ProductDetail uid>].price), chosen by
 * the visitor's IP. Fetched from the US it is { currency: "USD", isoCode: "US" },
 * and the site's own copy for that market reads "suggested retail prices taxes
 * excluded … subject to change". That is the figure used here, labelled as such.
 */

import type { PagePayload, Product } from "@/lib/merchant";

export type Keypoint = { text: string; image_url: string | null };

export type Specs = {
  reference: string;
  collection: string;
  family: string | null;
  title: string | null;
  url: string;
  marketingTitle: string | null;
  material: string | null;
  caseDiameterMm: number;
  caseThicknessMm: number;
  caseDecor: string | null;
  waterResistance: string | null;
  crown: string | null;
  caseBack: string | null;
  dial: string | null;
  hands: string | null;
  strap: string | null;
  bracelet: string | null;
  clasp: string | null;
  caliber: string | null;
  winding: string | null;
  powerReserve: string | null;
  powerReserveMinHours: number | null;
  powerReserveMaxHours: number | null;
  parts: number | null;
  jewels: number | null;
  frequency: string | null;
  rotor: string | null;
  complications: string[];
  keypoints: Keypoint[];
  images: Partial<Record<string, string>>;
};

export type Watch = Product & { price_known: boolean; specs: Specs };

export const payload: PagePayload = {
  user_name: "Daniel Hart",
  user_photo: "https://i.pravatar.cc/400?img=59",
  user_profile:
    "An architect in Chicago who has worn the same steel field watch for fifteen years. " +
    "Wants this to be the last watch he buys for himself, and prefers things that are " +
    "understated and made to be repaired rather than replaced.",
  context:
    "His first child, Emma, was born on 14 September 2026. He wants one watch to wear every " +
    "day from now on and to give to her on her twenty-first birthday. Asked to see a dress " +
    "watch, a sports watch and one with a calendar side by side before deciding.",
  products: [33, 4, 89, 57],
};

/** The moment the page is built around, straight from the payload. */
export const CHILD = "Emma";
export const BORN = { day: 14, month: "September", year: 2026 };
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** The dedication engraved on the hero's case back, e.g. "FOR IRIS · 14.IX.2026". */
export const DEDICATION = `For ${CHILD} · ${BORN.day}.${ROMAN[MONTHS.indexOf(BORN.month)]}.${BORN.year}`.toUpperCase();

/**
 * Where the flat gold ring sits on the 6119R case-back photo, in the cropped
 * image's own pixels (1000 × 1473). Measured from the photo: the sapphire
 * bezel ends at r ≈ 322 and the case edge is at r ≈ 366 around (506, 692).
 */
export const CASEBACK_RING = { cx: 506, cy: 692, r: 335 };
export const HANDOVER_YEAR = BORN.year + 21;

export type Role = "dress" | "sport" | "calendar";

export const ROLES: Record<Role, string> = {
  dress: "Dress watch",
  sport: "Sports watch",
  calendar: "Calendar",
};

type Pitch = {
  slug: string;
  /** Which macro shot from the product page to show up close. */
  detail: "dial" | "movement";
  role: Role;
  /** Short label for the selector. */
  label: string;
  /** Which of the product page's key points to quote. */
  quote: number;
  /**
   * Width of the case in the source photograph, in pixels, measured from the
   * alpha mask at the dial's centre line. With the case diameter from the
   * spec this gives each photo's pixels-per-millimetre, so the four can be
   * drawn at true relative scale. The Nautilus is measured across the bezel,
   * not the hinge "ears", because Patek quotes its 41 mm from 10 to 4 o'clock.
   */
  caseWidthPx: number;
};

const PITCH: Record<number, Pitch> = {
  33: { slug: "6119r", detail: "movement", role: "dress", label: "Calatrava", quote: 1, caseWidthPx: 1154 },
  4: { slug: "5167a", detail: "dial", role: "sport", label: "Aquanaut", quote: 0, caseWidthPx: 1144 },
  89: { slug: "5811", detail: "dial", role: "sport", label: "Nautilus", quote: 2, caseWidthPx: 1160 },
  57: { slug: "5396g", detail: "dial", role: "calendar", label: "Annual Calendar", quote: 1, caseWidthPx: 1136 },
};

/** Every photo was cropped from the same 1920px canvas: front 1520px wide, profile 720px. */
const FRONT_SRC_W = 1520;
const PROFILE_SRC_W = 720;
export const FRONT_RATIO = 1000 / 1473;
export const PROFILE_RATIO = 473 / 1473;

/** Resolve the payload's ids against the catalog. Server-side, so the
 *  117-row catalog never ships to the browser. */
export function resolveWatches(catalog: Watch[]) {
  return payload.products.map((id) => {
    const w = catalog.find((c) => c.id === id);
    if (!w) throw new Error(`Patek example: product ${id} missing from data/patek.json`);
    const p = PITCH[id];
    const pxPerMm = p.caseWidthPx / w.specs.caseDiameterMm;
    return {
      ...w,
      ...p,
      front: `/examples/patek/${p.slug}-front.webp`,
      profile: `/examples/patek/${p.slug}-profile.webp`,
      detail: `/examples/patek/${p.slug}-${p.detail}.webp`,
      // Physical width, in mm, of the whole cropped photo at true scale.
      frontMm: Math.round((FRONT_SRC_W / pxPerMm) * 10) / 10,
      profileMm: Math.round((PROFILE_SRC_W / pxPerMm) * 10) / 10,
    };
  });
}

export type ShortlistWatch = ReturnType<typeof resolveWatches>[number];

/** One factual line per watch, each a comparison that holds across the four. */
export function standout(w: ShortlistWatch, all: ShortlistWatch[]): string {
  const thin = Math.min(...all.map((x) => x.specs.caseThicknessMm));
  const thick = Math.max(...all.map((x) => x.specs.caseThicknessMm));
  const wide = Math.max(...all.map((x) => x.specs.caseDiameterMm));
  const cheap = Math.min(...all.map((x) => x.price));
  const s = w.specs;
  if (s.winding === "Manual winding")
    return `Wound by hand, unlike the rest, and ${s.caseThicknessMm} mm${s.caseThicknessMm === thin ? " thin: slimmest here" : " thick"}.`;
  if (s.caseThicknessMm === thick)
    return `Day, date, month and moon phases, with one correction a year. At ${s.caseThicknessMm} mm, the thickest here.`;
  if (w.price === cheap)
    return `Steel on a composite strap, with a screw-down crown. The least expensive here, at ${usd(w.price)}.`;
  if (s.caseDiameterMm === wide)
    return `${s.material} case and bracelet. At ${s.caseDiameterMm} mm, the largest here.`;
  return s.marketingTitle ?? "";
}

export const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
