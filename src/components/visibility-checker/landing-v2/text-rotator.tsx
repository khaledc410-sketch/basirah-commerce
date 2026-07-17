"use client";

import { useEffect, useRef, useState } from "react";

export interface RotatorLine {
  /** Copy before the highlighted word. */
  lead: string;
  /** Word rendered in the primary color on the active line. */
  highlight: string;
  /** Copy after the highlighted word. */
  tail?: string;
}

interface TextRotatorProps {
  lines: RotatorLine[];
}

/**
 * Scroll-driven statement rotator: the section is tall, its content sticks to
 * the viewport center, and the active line follows scroll progress. Inactive
 * lines stay readable but recede with opacity + blur, so no copy is ever
 * hidden from crawlers or reduced-motion users.
 */
export function TextRotator({ lines }: TextRotatorProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Runs directly in the scroll handler: one getBoundingClientRect and a
    // usually-bailed-out setState per event, cheap enough without an rAF
    // gate — and rAF can be throttled to a standstill in background tabs.
    const update = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 0.999);
      setActive(Math.floor(progress * lines.length));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [lines.length]);

  return (
    <div className="relative" ref={sectionRef} style={{ height: `${lines.length * 60}vh` }}>
      <div className="sticky top-0 flex min-h-dvh flex-col items-center justify-center gap-3 px-4 sm:gap-5">
        {lines.map((line, index) => (
          <p
            className="rotator-line max-w-4xl text-center text-3xl font-bold leading-snug sm:text-5xl"
            data-active={index === active}
            key={line.highlight + index}
          >
            {line.lead} <span className="text-primary">{line.highlight}</span>
            {line.tail ? <> {line.tail}</> : null}
          </p>
        ))}
      </div>
    </div>
  );
}
