/**
 * Golden example: "Ten Days in Montreal" on Uniqlo.
 *
 * `payload` is exactly what the agent would send to POST /v1/pages for this
 * journey. Everything else here is what a great merchant page derives from it.
 * Products come from data/uniqlo.json, cached from the merchant's own
 * /v1/products endpoint. The catalog's descriptions carry only fit and a
 * product code, so every "warmth" cue on the page is read off product names.
 */

import type { PagePayload, Product } from "@/lib/merchant";
import { defaultPersona } from "@/lib/persona";

export type Garment = Product & { code: string; image: string };

export const payload: PagePayload = {
  user_name: defaultPersona.name,
  user_photo: defaultPersona.photo,
  user_profile:
    "Shops Women's, tops M, bottoms 29. Wears navy, olive, off white, grey, black and brown; " +
    "skips pink, red, bright orange and purple. Loves merino, cashmere and cotton. Has rebought " +
    "HEATTECH Leggings (black) two winters running; a grey Merino Cardigan is her most-worn piece.",
  context:
    "10 days in Montreal in January: cold, a lot of walking, two nicer dinners out. " +
    "Wants a layering kit that works by day and dresses up for dinner.",
  products: [95, 20, 18, 21, 104],
};

export const FIRST_NAME = payload.user_name.split(" ")[0];

export type LayerId = "base" | "mid" | "outer";
export type Mode = "day" | "evening";

export const LAYERS: { id: LayerId; n: string; label: string; where: string }[] = [
  { id: "base", n: "01", label: "Base", where: "Next to skin" },
  { id: "mid", n: "02", label: "Mid", where: "Over the top" },
  { id: "outer", n: "03", label: "Outer", where: "Out the door" },
];

/** Which garments make each layer, by day and for dinner. The dress swaps in
 *  for the T-shirt; everything else stays. */
export const OUTFIT: Record<Mode, Record<LayerId, number[]>> = {
  day: { base: [95, 20], mid: [18], outer: [21] },
  evening: { base: [104, 20], mid: [18], outer: [21] },
};

/** Words in Uniqlo's own product names that signal warmth. Nothing else. */
const WARM_WORDS = ["HEATTECH", "Extra Warm", "Cashmere Blend", "Merino", "PUFFTECH"];

export function warmWords(name: string): string[] {
  return WARM_WORDS.filter((w) => name.includes(w));
}

/** The name as a Uniqlo tag would print it: "HEATTECH Cashmere Blend T-Shirt",
 *  with the "| Extra Warm" variant split out. */
export function splitName(name: string): { title: string; variant: string | null } {
  const [title, variant] = name.split(" | ");
  return { title, variant: variant ?? null };
}

/** Why each piece is here, in one line, from the persona and the trip only. */
const WHY: Record<number, string> = {
  95: "HEATTECH in a cashmere blend, one of the three materials you reach for.",
  20: "The pair you've rebought two winters running. A fresh one for the trip.",
  18: "Your grey one is the most-worn thing you own. Same cardigan, in navy.",
  21: "The layer for a lot of walking. Brown, so it goes over everything here.",
  104: "For the two dinners out. Leggings underneath, cardigan on top.",
};

/** Resolve the payload's ids against the cached catalog, server-side. */
export function resolveGarments(catalog: Garment[]) {
  return payload.products.map((id) => {
    const g = catalog.find((c) => c.id === id);
    if (!g) throw new Error(`Uniqlo example: product ${id} missing from data/uniqlo.json`);
    return {
      ...g,
      ...splitName(g.name),
      why: WHY[id],
      warmth: warmWords(g.name),
      href: `https://www.uniqlo.com/us/en/products/${g.code}-000`,
    };
  });
}

export type Piece = ReturnType<typeof resolveGarments>[number];

/** Uniqlo US prints prices as "$29.90". */
export const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** Maya's palette, from memory, with a swatch for each. */
export const PALETTE = {
  wears: [
    { name: "Navy", hex: "#1f2a44" },
    { name: "Olive", hex: "#556045" },
    { name: "Off white", hex: "#f1ede4" },
    { name: "Grey", hex: "#9a9a9a" },
    { name: "Black", hex: "#141414" },
    { name: "Brown", hex: "#6b4f3a" },
  ],
  avoids: ["Pink", "Red", "Bright orange", "Purple"],
};

/** Which of her colours each catalog colour falls under. */
export const COLOR_FAMILY: Record<string, string> = {
  Olive: "Olive",
  Black: "Black",
  Navy: "Navy",
  Brown: "Brown",
  "Dark Brown": "Brown",
};

export const MEMORY = {
  sizes: { tops: "M", bottoms: "29" },
  loves: ["Merino", "Cashmere", "Cotton"],
  past: [
    { item: "HEATTECH Leggings", note: "Black. Rebought two winters running.", picks: 20 },
    { item: "Merino Cardigan", note: "Grey. Your most-worn piece.", picks: 18 },
    { item: "AIRism Cotton T-Shirt", note: "Navy and white. Bought in multiples.", picks: null },
  ],
};
