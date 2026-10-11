/**
 * The merchant's mark, for the link unfurl. Known brands get their own colors;
 * anything else falls back to a neutral initial, so a store the agent picks
 * that we have no colors for doesn't break the card.
 */
const BRANDS: Record<string, { bg: string; fg: string }> = {
  uniqlo: { bg: "#ff0000", fg: "#ffffff" },
  away: { bg: "#022850", fg: "#ffffff" },
  allbirds: { bg: "#212a2f", fg: "#ffffff" },
  porsche: { bg: "#b12b28", fg: "#ffffff" },
};

export function BrandMark({
  store,
  size = 42,
  className = "",
}: {
  store: string;
  size?: number;
  className?: string;
}) {
  const brand = BRANDS[store.toLowerCase()];
  // At favicon size the wordmark is deliberately illegible — that is what a
  // real favicon looks like, and colour plus shape carry the recognition.
  const fontSize = Math.max(3.5, size * 0.18);

  if (!brand) {
    return (
      <span
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        className={`grid shrink-0 place-items-center rounded bg-ink font-semibold text-white ${className}`}
      >
        {store.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      style={{ width: size, height: size, background: brand.bg, color: brand.fg, fontSize }}
      className={`grid shrink-0 place-items-center rounded leading-none font-bold tracking-tight uppercase ${className}`}
    >
      {store}
    </span>
  );
}
