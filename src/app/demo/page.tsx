import type { Metadata } from "next";

import LegacyDemoHome from "../page";

export const metadata: Metadata = {
  title: "العرض السابق لوكيل المبيعات — بصيرة",
  description: "عرض تجريبي معزول لتجربة وكيل المبيعات القديمة في بصيرة.",
  robots: { index: false, follow: false },
};

export default function LegacyDemoPage() {
  return <LegacyDemoHome />;
}
