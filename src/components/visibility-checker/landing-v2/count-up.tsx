"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Final value rendered when the element enters the viewport. */
  value: number;
  /** Text placed after the number, e.g. "%" or "+". */
  suffix?: string;
  /** Text placed before the number. */
  prefix?: string;
  className?: string;
  /** Animation duration in milliseconds. */
  duration?: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts from 0 to `value` once the element scrolls into view. Server HTML
 * carries the final value so the number is always correct without JS, and
 * reduced-motion users never see the interpolation.
 */
export function CountUp({ value, suffix, prefix, className, duration = 1200 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setDisplay(Math.round(easeOutCubic(progress) * value));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        setDisplay(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span className={className} ref={ref}>
      {prefix}
      <bdi dir="ltr">{display.toLocaleString("en-US")}</bdi>
      {suffix}
    </span>
  );
}
