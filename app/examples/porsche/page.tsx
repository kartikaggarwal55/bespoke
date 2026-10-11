import type { Metadata } from "next";
import localFont from "next/font/local";
import catalog from "@/data/porsche.json";
import { payload, resolveCars, type Car } from "@/lib/examples/porsche";
import { PorscheMountains } from "@/components/examples/PorscheMountains";

// Porsche Next, as served on porsche.com, bundled locally so the demo doesn't
// depend on Porsche's CDN.
const porscheNext = localFont({
  variable: "--font-display",
  src: [
    { path: "./fonts/porsche-next-latin-regular.woff2", weight: "400" },
    { path: "./fonts/porsche-next-latin-semi-bold.woff2", weight: "600" },
    { path: "./fonts/porsche-next-latin-bold.woff2", weight: "700" },
  ],
});

export const metadata: Metadata = {
  title: "One Car for the Mountains",
  description: `Four Porsches, chosen for ${payload.user_name}'s move to Boulder.`,
};

export default function Page() {
  return (
    <div className={`${porscheNext.variable} font-[family-name:var(--font-display)]`}>
      <PorscheMountains cars={resolveCars(catalog as Car[])} />
    </div>
  );
}
