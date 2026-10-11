import type { Metadata } from "next";
import catalog from "@/data/uniqlo.json";
import { payload, resolveGarments, type Garment } from "@/lib/examples/uniqlo";
import { UniqloMontreal } from "@/components/examples/UniqloMontreal";

export const metadata: Metadata = {
  title: "Ten Days in Montreal",
  description: `A January layering kit, chosen for ${payload.user_name}.`,
};

export default function Page() {
  return <UniqloMontreal pieces={resolveGarments(catalog as Garment[])} />;
}
