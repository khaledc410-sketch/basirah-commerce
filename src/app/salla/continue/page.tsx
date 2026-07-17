import type { Metadata } from "next";

import { SallaContinueClient } from "./salla-continue-client";

export const metadata: Metadata = {
  title: "متابعة ربط متجر سلة",
  robots: { index: false, follow: false },
};

export default function SallaContinuePage() {
  return <SallaContinueClient />;
}
