import type { Metadata } from "next";
import localFont from "next/font/local";
import catalog from "@/data/arcteryx.json";
import { payload, resolveKit, type Item } from "@/lib/examples/arcteryx";
import { ArcteryxRun } from "@/components/examples/ArcteryxRun";

// Helvetica Now Display, as self-hosted on arcteryx.com, bundled locally so
// the demo doesn't depend on Arc'teryx's CDN.
const helveticaNow = localFont({
  variable: "--font-arc",
  src: [
    { path: "./fonts/HelveticaNowDisplayLight_normal_normal.woff2", weight: "300" },
    { path: "./fonts/HelveticaNowDisplayRegular_normal_normal.woff2", weight: "400" },
    { path: "./fonts/HelveticaNowDisplayBold_normal_normal.woff2", weight: "700" },
  ],
});

export const metadata: Metadata = {
  title: "Peak to Creek",
  description: `An Arc'teryx snowboard kit for ${payload.user_name}'s first season at Whistler Blackcomb.`,
};

export default function Page() {
  return (
    <div className={`${helveticaNow.variable} font-[family-name:var(--font-arc)]`}>
      <ArcteryxRun kit={resolveKit(catalog as Item[])} />
    </div>
  );
}
