"use client";

import { useReportWebVitals } from "next/web-vitals";

type WebVitalsReporter = Parameters<typeof useReportWebVitals>[0];

const reportWebVital: WebVitalsReporter = (metric) => {
  const payload = JSON.stringify({
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/telemetry/web-vitals",
      new Blob([payload], { type: "application/json" }),
    );
    return;
  }

  void fetch("/api/telemetry/web-vitals", {
    method: "POST",
    body: payload,
    headers: { "content-type": "application/json" },
    keepalive: true,
  });
};

export function WebVitals() {
  useReportWebVitals(reportWebVital);
  return null;
}
