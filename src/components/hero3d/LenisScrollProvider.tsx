"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type LenisScrollProviderProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

/**
 * Wraps the preview page in Lenis smooth scroll and wires it to GSAP's
 * ticker + ScrollTrigger, so every scrub-linked animation reads Lenis's
 * eased scroll position instead of the browser's raw (stepped) one — this
 * is what makes the whole page feel "inertial" together, not just the
 * hero. Skips Lenis entirely under prefers-reduced-motion (native scroll,
 * ScrollTrigger still works off the real scroll position).
 */
export function LenisScrollProvider({ children, enabled = true }: LenisScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    // Exposed for the debug scrubber (moves the real scroll position so
    // every scroll-linked animation — not just the 3D timeline — stays in
    // sync, rather than faking progress on one timeline in isolation).
    (window as typeof window & { __lenis?: Lenis | null }).__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    // Lenis measures the scrollable height once on init. ScrollTrigger's
    // pin (created in Hero3D.tsx, after this effect since it's nested
    // deeper) inserts a spacer element asynchronously, growing the
    // document — without this, Lenis keeps its stale (shorter) limit and
    // silently refuses to scroll past where the page ended before the
    // pin spacer existed. Keep them in sync in both directions.
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", onRefresh);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      (window as typeof window & { __lenis?: Lenis | null }).__lenis = null;
    };
  }, [enabled]);

  return <>{children}</>;
}
