import type { Metadata } from "next";
import localFont from "next/font/local";
import catalog from "@/data/patek.json";
import { CHILD, payload, resolveWatches, type Watch } from "@/lib/examples/patek";
import { PatekHeirloom } from "@/components/examples/PatekHeirloom";

// patek.com's own font files (Lora as --font-primary, Open Sans as
// --font-secondary), bundled locally so the demo doesn't depend on its CDN.
const lora = localFont({
  variable: "--font-pp-serif",
  src: [
    { path: "./fonts/lora-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/lora-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/lora-bold.woff2", weight: "700", style: "normal" },
  ],
});
const openSans = localFont({
  variable: "--font-pp-sans",
  src: [
    { path: "./fonts/open-sans-light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/open-sans-regular.woff2", weight: "400", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "From your wrist to Emma's",
  description: `Four Patek Philippe references, chosen for ${payload.user_name} and ${CHILD}.`,
};

export default function Page() {
  return (
    <div className={`${lora.variable} ${openSans.variable}`}>
      <PatekHeirloom watches={resolveWatches(catalog as Watch[])} />
    </div>
  );
}
