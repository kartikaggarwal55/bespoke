/**
 * The merchant's system. Everything HTTP-shaped lives in this file.
 *
 * Contract (discovered from the live OpenAPI spec):
 *   GET  /v1/stores                      -> StoreRead[]
 *   GET  /v1/products?store=&q=&color=   -> ProductRead[]
 *   POST /v1/pages                       -> { id, path }
 *   GET  {path}                          -> the rendered page
 *
 * `path` is absolute from the origin and already contains /v1, so it is joined
 * to ORIGIN, never to BASE.
 *
 * `q` is a case-insensitive SUBSTRING match on name + description. It is not a
 * natural-language search. There is no price or product-type filter, so all
 * price and suitability filtering happens agent-side.
 *
 * The agent is given read-only access. POST/PUT/DELETE /v1/products exist and
 * mutate the merchant's live catalog; they are deliberately not exposed as tools.
 */

const BASE = process.env.MERCHANT_BASE_URL ?? "https://bespoke-api-bgyg.onrender.com/v1";
const ORIGIN = new URL(BASE).origin;

// Render free tier cold-starts; the first call of the day can take ~40s.
const PRODUCTS_TIMEOUT_MS = 90_000;
// The merchant builds the page on demand — measured at 48-57s warm, and slower
// under load. This is the single slowest thing in the journey.
const PAGE_TIMEOUT_MS = 240_000;

export type Store = {
  name: string;
  brand_voice: string | null;
  brand_colors: string | null;
  brand_font: string | null;
  logo_url: string | null;
  created_at: string;
};

export type Product = {
  id: number;
  store: string;
  name: string;
  description: string | null;
  price: number; // integer cents
  category: string | null; // department only: "Men" | "Women"
  color: string | null;
  image_url: string | null;
  created_at: string;
};

export type PagePayload = {
  user_name: string;
  user_profile: string;
  user_photo: string;
  context: string;
  products: number[]; // product ids, not objects
};

export type PageResult =
  | { ok: true; id: string; url: string }
  | { ok: false; status: number; detail: string; payload: PagePayload };

async function req(path: string, timeoutMs: number, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export const storesUrl = "GET /v1/stores";

export async function listStores(): Promise<Store[]> {
  const res = await req("/stores", PRODUCTS_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`GET /stores ${res.status}: ${describe(res, await res.text())}`);
  }
  return (await res.json()) as Store[];
}

export async function listProducts(args: {
  store: string;
  q?: string;
  color?: string;
}): Promise<Product[]> {
  const params = new URLSearchParams({ store: args.store });
  if (args.q) params.set("q", args.q);
  if (args.color) params.set("color", args.color);

  const res = await req(`/products?${params}`, PRODUCTS_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`GET /products ${res.status}: ${describe(res, await res.text())}`);
  }
  return (await res.json()) as Product[];
}

export function productsUrl(args: { store: string; q?: string; color?: string }): string {
  const params = new URLSearchParams({ store: args.store });
  if (args.q) params.set("q", args.q);
  if (args.color) params.set("color", args.color);
  return `GET /v1/products?${params}`;
}

/**
 * Error bodies are not always JSON. A 502 from Render is a full HTML error
 * page — hundreds of KB of base64 font data — which is useless in a trace, so
 * say what happened instead of quoting it.
 */
function describe(res: Response, body: string): string {
  const html =
    (res.headers.get("content-type") ?? "").includes("html") ||
    body.trimStart().startsWith("<");

  if (html) {
    return res.status >= 502
      ? "the merchant's page builder failed or timed out upstream"
      : "the merchant returned an HTML error page";
  }
  return body.slice(0, 300);
}

export async function createPage(payload: PagePayload): Promise<PageResult> {
  // A slow or unreachable merchant must not take the whole journey down with
  // it — the agent still owes the user a closing message.
  let res: Response;
  let text: string;
  try {
    res = await req("/pages", PAGE_TIMEOUT_MS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    text = await res.text();
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, detail, payload };
  }

  if (!res.ok) {
    return { ok: false, status: res.status, detail: describe(res, text), payload };
  }

  // The merchant returns a short public id and the path it serves the page at.
  // The path is origin-absolute and already includes /v1.
  const { id, path } = JSON.parse(text) as { id: string; path?: string };
  if (!path) {
    return { ok: false, status: res.status, detail: `no path in response: ${text.slice(0, 200)}`, payload };
  }
  return { ok: true, id, url: `${ORIGIN}${path}` };
}
