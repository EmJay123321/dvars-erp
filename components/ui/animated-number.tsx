"use client";

import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function AnimatedNumber({
  value,
  format,
  duration = 750,
  className,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState(() => format(0));
  const prevValueRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (getPrefersReducedMotion()) {
      setDisplayed(format(value));
      prevValueRef.current = value;
      return;
    }

    if (prevValueRef.current === value) return;

    const from = prevValueRef.current;
    const to = value;
    const start = performance.now();

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    animatingRef.current = true;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = from + (to - from) * eased;
      setDisplayed(format(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(format(to));
        prevValueRef.current = to;
        animatingRef.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      animatingRef.current = false;
    };
  }, [value, duration]);

  useEffect(() => {
    if (!animatingRef.current) {
      setDisplayed(format(prevValueRef.current));
    }
  }, [format]);

  return <span className={className}>{displayed}</span>;
}
