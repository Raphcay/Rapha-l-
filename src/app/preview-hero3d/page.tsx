"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Hero3D } from "@/components/hero3d/Hero3D";
import { LenisScrollProvider } from "@/components/hero3d/LenisScrollProvider";

function subscribeToUrl(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getDebugFlag() {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

// Isolated review sandbox for Hero3D, which now also runs live on the real
// homepage (src/app/page.tsx). Kept around for tuning the scroll sequence
// in isolation, with the ?debug=1 scrubber below.
export default function PreviewHero3DPage() {
  // useSyncExternalStore (not useState+useEffect) so this reads correctly
  // client-side without a setState-after-mount render pass.
  const debug = useSyncExternalStore(subscribeToUrl, getDebugFlag, () => false);

  return (
    <LenisScrollProvider>
      <div className="min-h-screen bg-bg text-ink">
        {/* Bottom-left corner, deliberately: the real site Nav still renders
           (this route sits under the shared root layout), so this badge
           avoids stacking a second header on top of it. */}
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-3 border border-line bg-surface/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted backdrop-blur-sm">
          <span>
            Preview isolé — Hero3D{" "}
            {debug ? <span className="text-accent">(debug)</span> : null}
          </span>
          {!debug && (
            <Link href="/preview-hero3d?debug=1" className="hover:text-ink">
              ?debug=1 → scrubber
            </Link>
          )}
        </div>

        <Hero3D debug={debug} />

        {/* Minimal continuation content so the pin-release and post-hero
           scroll feel (not just the pinned stage itself) can be judged too. */}
        <section className="mx-auto max-w-3xl px-5 py-24 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            Fin de la séquence pinned
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Le reste de la page d&apos;accueil réelle (coupe, fabrication, grille
            produits) suivrait ici, inchangé. Cette section n&apos;existe que
            pour évaluer le déblocage du pin et l&apos;inertie du scroll Lenis
            après la scène 3D.
          </p>
        </section>
      </div>
    </LenisScrollProvider>
  );
}
