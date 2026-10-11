/**
 * Golden example: "One Car for the Mountains" on Porsche.
 *
 * `payload` is exactly what the agent would send to POST /v1/pages for this
 * journey. Everything else here is what a great merchant page derives from it.
 * Every number on the page comes from data/porsche.json, scraped from Porsche
 * USA's model overview, so nothing is invented.
 */

import type { PagePayload, Product } from "@/lib/merchant";

export type Specs = {
  year: string;
  body: string;
  drive: string;
  seats: string;
  fuel: string;
  transmission: string | null;
  hp: number;
  zeroToSixty: string | null;
  topSpeed: string | null;
  equipment: string[];
};

export type Car = Product & { specs: Specs };

export const payload: PagePayload = {
  user_name: "Jordan Reyes",
  user_photo: "https://i.pravatar.cc/400?img=12",
  user_profile:
    "Has wanted a 911 since they were a kid and is finally in a position to buy one. " +
    "Drives for the drive, but wants one car rather than a weekend toy and a daily.",
  context:
    "Moving to Boulder, Colorado next spring. Needs one car that is genuinely fun on " +
    "mountain passes in summer and still gets them and their skis to Breckenridge every " +
    "Saturday in January. Asked to see the 911 and the sensible option side by side.",
  products: [14, 25, 55, 68],
};

export type Mode = "summer" | "ski" | "weekday";

export const MODES: { id: Mode; label: string; blurb: string }[] = [
  { id: "summer", label: "Summer pass", blurb: "Ranked by 0–60. July, roof off, Loveland Pass." },
  { id: "ski", label: "Ski Saturday", blurb: "Ranked by room for people and gear. January, I-70." },
  { id: "weekday", label: "Weekday", blurb: "Ranked by price. Groceries, commute, real life." },
];

/** Which specs a mode is about — these light up on every card. */
export const MODE_SPECS: Record<Mode, (keyof Specs | "price")[]> = {
  summer: ["zeroToSixty", "topSpeed"],
  ski: ["drive", "seats"],
  weekday: ["price", "seats"],
};

type Pitch = { slug: string; href: string; lines: Record<Mode, string> };

const PITCH: Record<number, Pitch> = {
  14: {
    slug: "911-carrera-4s",
    href: "https://www.porsche.com/usa/models/911/carrera-models/911-carrera-4s/",
    lines: {
      summer: "3.3 s to 60 and 191 mph. The quickest car here, and the one you've wanted.",
      ski: "All-wheel drive gets you up I-70. The 2+2 cabin is the part you plan around.",
      weekday: "A 911 on a Tuesday is still a 911.",
    },
  },
  25: {
    slug: "911-targa-4s",
    href: "https://www.porsche.com/usa/models/911/targa-models/911-targa-4s/",
    lines: {
      summer: "Same 473 hp as the coupe, roof stowed over Loveland Pass.",
      ski: "All-wheel drive and 2+2 seats: the same winter trade-off as the coupe.",
      weekday: "$15,700 more than the coupe, for the roof. Worth it if summer is the point.",
    },
  },
  55: {
    slug: "macan-4s-electric",
    href: "https://www.porsche.com/usa/models/macan/macan-electric-models/macan-4s-electric/",
    lines: {
      summer: "509 hp, the most on this page, and 3.9 s to 60 in the tallest body.",
      ski: "Five seats, all-wheel drive, and the gear rides inside.",
      weekday: "$74,600 less than the 911 Carrera 4S, and the easiest to live with.",
    },
  },
  68: {
    slug: "cayenne-gts",
    href: "https://www.porsche.com/usa/models/cayenne/cayenne-models/cayenne-gts/",
    lines: {
      summer: "A twin-turbo V8 and sport exhaust. The loudest way up a pass.",
      ski: "Five seats, all-wheel drive, and the biggest cabin here.",
      weekday: "A middle path: five seats, still a GTS.",
    },
  },
};

const RANK: Record<Mode, number[]> = {
  summer: [14, 25, 55, 68], // by 0–60
  ski: [68, 55, 14, 25], // 5 seats first, biggest cabin leading
  weekday: [55, 68, 14, 25], // by price
};

/** Resolve the payload's ids against the catalog. Server-side, so the 76-row
 *  catalog never ships to the browser. */
export function resolveCars(catalog: Car[]) {
  return payload.products.map((id) => {
    const car = catalog.find((c) => c.id === id);
    if (!car) throw new Error(`Porsche example: product ${id} missing from data/porsche.json`);
    // Side shots differ in height (a Cayenne is taller than a 911); the source
    // dimensions are in Porsche's CDN path, e.g. /5000x1485/.
    const [, w, h] = car.image_url!.match(/\/(\d+)x(\d+)\//)!.map(Number);
    const image = `/examples/porsche/${PITCH[id].slug}.webp`;
    return { ...car, ...PITCH[id], image, width: w, height: h };
  });
}

export type ShortlistCar = ReturnType<typeof resolveCars>[number];

export function ranked(cars: ShortlistCar[], mode: Mode) {
  return RANK[mode].map((id) => cars.find((c) => c.id === id)!);
}

export const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** Real elevations, in feet. The spine of the page. */
export const ROUTE = [
  { name: "Boulder", ft: 5328, note: "Home, from spring" },
  { name: "Loveland Pass", ft: 11990, note: "US-6, the summer drive" },
  { name: "Breckenridge", ft: 9600, note: "Every Saturday in January" },
];
