"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { useWebglSupport } from "./useWebglSupport";
import { DebugScrubber } from "./DebugScrubber";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Code-split + client-only: three.js/WebGL never enters the server bundle
// and never blocks the hero text's first paint. The fallback image below
// covers the gap while this chunk streams in.
const Scene = dynamic(() => import("./Scene").then((mod) => mod.Scene), {
  ssr: false,
  loading: () => null,
});

const SCROLL_DISTANCE = "+=140%";

export function Hero3D({ debug = false }: { debug?: boolean }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const matiereTextRef = useRef<HTMLDivElement>(null);
  const scrollGroupRef = useRef<THREE.Group>(null);

  const [sceneReady, setSceneReady] = useState(false);
  const webglSupported = useWebglSupport();
  const prefersReducedMotion = useReducedMotion();

  // Anything other than a confirmed "true" renders the static fallback —
  // including the brief instant before the check resolves. WebGLRenderer
  // throws if constructed without a context, so this is a hard gate, not
  // just a nicety: never attempt <Scene> until support is confirmed.
  const useFallback = webglSupported !== true;

  useEffect(() => {
    if (useFallback || prefersReducedMotion || !sceneReady) return;
    const group = scrollGroupRef.current;
    if (!group || !pinRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          id: "hero3d-timeline",
          trigger: pinRef.current,
          start: "top top",
          end: SCROLL_DISTANCE,
          scrub: 1,
          pin: true,
          markers: debug,
        },
      });

      // TODO(categories/text): once this ships on the real homepage, drive
      // these two blocks from the same copy already used in page.tsx
      // (hero tagline + the "01 Matière" pillar) instead of the local JSX
      // below, so there's a single source of truth for the wording.
      tl.to(heroTextRef.current, { autoAlpha: 0, y: -48, ease: "power2.out", duration: 0.4 }, 0.1)
        .to(group.rotation, { y: `+=${Math.PI * 0.3}`, ease: "power3.inOut", duration: 1 }, 0)
        .to(group.position, { z: 0.12, ease: "expo.out", duration: 1 }, 0.05)
        .to(group.scale, { x: 1.1, y: 1.1, z: 1.1, ease: "expo.out", duration: 0.9 }, 0.3)
        .to(
          matiereTextRef.current,
          { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.4 },
          0.55
        );
    });

    // See the comment in LenisScrollProvider.tsx: this is what actually
    // notifies Lenis that the pin spacer grew the page, so it stops
    // clamping scroll short of the real content height.
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [useFallback, prefersReducedMotion, sceneReady, debug]);

  return (
    <>
      <div ref={pinRef} className="relative h-screen w-full overflow-hidden bg-bg">
        <div className="absolute inset-0">
          {useFallback ? (
            <FallbackVisual />
          ) : (
            <>
              {/* Shown instantly; the real canvas crossfades over it once ready. */}
              <div
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: sceneReady ? 0 : 1 }}
                aria-hidden="true"
              >
                <FallbackVisual />
              </div>
              <Scene
                groupRef={scrollGroupRef}
                reducedMotion={Boolean(prefersReducedMotion)}
                onCreated={() => setSceneReady(true)}
              />
            </>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-5">
          <div ref={heroTextRef} className="max-w-3xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Arc — Première collection
            </p>
            <h1 className="mt-3 font-display text-5xl leading-[0.95] text-ink sm:text-7xl">
              Plus qu&apos;un style,
              <br />
              une identité.
            </h1>
          </div>
        </div>

        <div
          ref={matiereTextRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 opacity-0"
          style={{ transform: "translateY(24px)" }}
        >
          <div className="max-w-xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
              01 — Matière
            </p>
            <h2 className="mt-3 font-display text-4xl leading-[0.95] text-ink sm:text-5xl">
              220g minimum, sans discussion
            </h2>
          </div>
        </div>
      </div>

      {debug && <DebugScrubber />}
    </>
  );
}

// TODO(fallback asset): swap for a short looping .mp4 of the real garment
// turning once one is shot — a video reads as more "premium" here than a
// static photo. Keep the same radial-gradient overlay behind it either way.
function FallbackVisual() {
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(60% 55% at 50% 42%, var(--surface-raised), var(--bg) 72%)",
        }}
      />
      <Image
        src="/products/arc-tee-front.png"
        alt="Tee Arc"
        fill
        priority
        className="object-contain object-center p-16"
      />
    </div>
  );
}
