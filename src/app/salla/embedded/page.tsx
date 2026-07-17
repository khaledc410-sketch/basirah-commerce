import type { Metadata } from "next";

import { SallaEmbeddedApp } from "@/components/salla/salla-embedded-app";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "بصيرة لمتجر سلة",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SallaEmbeddedPage() {
  return <SallaEmbeddedApp />;
}
