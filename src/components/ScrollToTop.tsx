"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type LenisLike = { scrollTo: (target: number, options?: { immediate?: boolean }) => void };

// The homepage's 3D hero is GSAP-pinned over a huge virtual scroll distance
// (several screen heights) and scrolled via Lenis, which owns the native
// scroll position while mounted there. Navigating away (e.g. clicking
// "Boutique") can lose the race against Next.js's own scroll-to-top: the
// browser is left at the old, very large scrollY, which the next — much
// shorter — page just clamps to its own bottom instead of showing its top.
// Force it back to (0,0) on every route change, trying a few times since
// Lenis's teardown and the new page's layout can both still be settling.
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const reset = () => {
      const lenis = (window as typeof window & { __lenis?: LenisLike | null }).__lenis;
      lenis?.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
    };
    reset();
    // Something downstream of this effect (observed: the browser's own
    // scroll-anchoring/restoration racing with Next.js's route swap) can
    // still jump the scroll back to a leftover offset up to ~500ms after
    // the new page is already showing. Keep correcting on a short interval
    // until that window has safely passed, instead of a single deferred
    // attempt that can itself lose the race.
    const interval = setInterval(reset, 50);
    const stop = setTimeout(() => clearInterval(interval), 800);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [pathname]);

  return null;
}
