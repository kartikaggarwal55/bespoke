/**
 * The merchant's mark, for the link unfurl. Known brands get their own colors;
 * anything else falls back to a neutral initial, so changing BESPOKE_STORE
 * doesn't break the card.
 */
const BRANDS: Record<string, { bg: string; fg: string }> = {
  uniqlo: { bg: "#ff0000", fg: "#ffffff" },
};

export function BrandMark({ store, size = 42 }: { store: string; size?: number }) {
  const brand = BRANDS[store.toLowerCase()];

  if (!brand) {
    return (
      <span
        style={{ width: size, height: size }}
        className="grid shrink-0 place-items-center rounded-md bg-ink text-sm font-semibold text-white"
      >
        {store.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      style={{ width: size, height: size, background: brand.bg, color: brand.fg }}
      className="grid shrink-0 place-items-center rounded-md text-[7.5px] leading-none font-bold tracking-tight uppercase"
    >
      {store}
    </span>
  );
}
