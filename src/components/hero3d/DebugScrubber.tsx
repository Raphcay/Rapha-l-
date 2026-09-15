"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

/**
 * Dev-only overlay (mounted when Hero3D is given `debug`, i.e. the preview
 * page was opened with ?debug=1): a slider that moves the *real* scroll
 * position instead of faking timeline progress in isolation, so it drives
 * every scroll-linked effect — the 3D group, the text crossfade, GSAP's own
 * ScrollTrigger markers — exactly as a real scroll would, without having to
 * scroll the page by hand for every test.
 */
export function DebugScrubber() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const st = ScrollTrigger.getById("hero3d-timeline");
      if (st) setProgress(st.progress);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function scrubTo(value: number) {
    const st = ScrollTrigger.getById("hero3d-timeline");
    if (!st) return;
    const target = st.start + value * (st.end - st.start);
    const lenis = (window as typeof window & { __lenis?: Lenis | null }).__lenis;
    if (lenis) {
      lenis.scrollTo(target, { immediate: true });
    } else {
      window.scrollTo(0, target);
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,28rem)] -translate-x-1/2 items-center gap-3 border border-line bg-surface-raised/95 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.06em] text-ink shadow-xl backdrop-blur-sm">
      <span className="shrink-0 text-muted">Hero3D debug</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        defaultValue={0}
        onChange={(event) => scrubTo(Number(event.target.value))}
        className="flex-1 accent-accent"
        aria-label="Scrub the Hero3D scroll timeline"
      />
      <span className="w-10 shrink-0 text-right tabular-nums text-accent">
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
}
