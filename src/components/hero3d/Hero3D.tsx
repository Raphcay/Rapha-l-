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
import { MagneticButton } from "@/components/MagneticButton";

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

// ---------------------------------------------------------------------------
// Réglages de la séquence scroll — tout ce qu'on retouche pour ajuster le
// rendu (coloris, textes, vitesse) vit ici, en un seul endroit.
// ---------------------------------------------------------------------------
const SETTINGS = {
  /** Distance de scroll (px équivalent en % du viewport) pour dérouler toute
     la séquence. Plus la valeur est grande, plus le scroll "ressenti" est
     lent. Deux valeurs : une plus courte sur mobile pour ne pas imposer un
     scroll interminable sur petit écran. */
  scrollDistance: {
    mobile: "+=280%",
    desktop: "+=420%",
  },
  /** Point de bascule mobile/desktop pour scrollDistance ci-dessus. */
  mobileBreakpoint: "(max-width: 640px)",
  /** `scrub` GSAP : plus la valeur est haute, plus l'animation "traîne"
     derrière le scroll (effet d'inertie). */
  scrub: 1,
  /** Les 3 coloris parcourus à l'étape 4, dans l'ordre d'apparition. Le
     premier est aussi la couleur de remplissage initiale (étape 1). */
  colorways: [
    { name: "Noir", hex: "#141414" },
    { name: "Sable", hex: "#c9b995" },
    { name: "Vert forêt", hex: "#25402c" },
  ],
  /** Les 2-3 courts textes affichés pendant le zoom matière (étape 3). */
  fabricCallouts: ["Respirant", "Séchage rapide", "Coupe ajustée"],
  /** Easings utilisés par les différentes étapes — mouvements lents et
     fluides, jamais de rebond ni d'effet criard. */
  ease: {
    reveal: "power2.inOut",
    rotate: "power1.inOut",
    zoom: "power3.inOut",
    color: "power1.inOut",
    release: "power2.inOut",
  },
} as const;

export function Hero3D({ debug = false }: { debug?: boolean }) {
  const pinRef = useRef<HTMLDivElement>(null);
  // Everything visual lives inside this inner wrapper, a *descendant* of the
  // pinned element — never the pin's own ancestor. GSAP's release-stage
  // transform (translateY) needs some element to animate, but applying a
  // transform to an ANCESTOR of the pinned element creates a new CSS
  // containing block, which silently breaks ScrollTrigger's `position:
  // fixed` pin (it then positions relative to that ancestor instead of the
  // viewport, so the "pinned" content just scrolls away like a normal
  // element instead of staying put while the scene animates).
  const contentRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const calloutRefs = useRef<Array<HTMLDivElement | null>>([]);

  const scrollGroupRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const wireframeRef = useRef<THREE.MeshBasicMaterial>(null);

  const [sceneReady, setSceneReady] = useState(false);
  const [garmentReady, setGarmentReady] = useState(false);
  const webglSupported = useWebglSupport();
  const prefersReducedMotion = useReducedMotion();

  // Anything other than a confirmed "true" renders the static fallback —
  // including the brief instant before the check resolves. WebGLRenderer
  // throws if constructed without a context, so this is a hard gate, not
  // just a nicety: never attempt <Scene> until support is confirmed.
  const useFallback = webglSupported !== true;

  useEffect(() => {
    if (useFallback || prefersReducedMotion || !garmentReady) return;
    const group = scrollGroupRef.current;
    const material = materialRef.current;
    const wireframe = wireframeRef.current;
    const camera = cameraRef.current;
    if (!group || !material || !wireframe || !camera || !pinRef.current) return;

    const mm = gsap.matchMedia();

    mm.add(
      { isMobile: SETTINGS.mobileBreakpoint, isDesktop: "(min-width: 641px)" },
      (context) => {
        const { isMobile } = context.conditions as { isMobile: boolean };
        const scrollDistance = isMobile
          ? SETTINGS.scrollDistance.mobile
          : SETTINGS.scrollDistance.desktop;

        const homeZ = camera.position.z;
        const homeY = camera.position.y;
        const homeFov = camera.fov;
        const colors = SETTINGS.colorways.map((c) => new THREE.Color(c.hex));

        const tl = gsap.timeline({
          scrollTrigger: {
            id: "hero3d-timeline",
            trigger: pinRef.current,
            start: "top top",
            end: scrollDistance,
            scrub: SETTINGS.scrub,
            pin: true,
            markers: debug,
          },
        });

        // Étape 0 — le texte d'accroche s'efface dès les premiers pixels de scroll.
        tl.to(heroTextRef.current, { autoAlpha: 0, y: -32, ease: "power2.out", duration: 0.5 }, 0);

        // Étape 1 — wireframe noir (patron technique) → remplissage progressif.
        tl.addLabel("reveal", 0)
          .to(
            wireframe,
            { opacity: 0, ease: SETTINGS.ease.reveal, duration: 1.1 },
            "reveal"
          )
          .to(
            material,
            { opacity: 1, ease: SETTINGS.ease.reveal, duration: 1.1 },
            "reveal+=0.15"
          );

        // Étape 2 — rotation lente : face → profil → dos.
        tl.addLabel("rotate", "reveal+=0.9").to(
          group.rotation,
          { y: `+=${Math.PI}`, ease: SETTINGS.ease.rotate, duration: 2.2 },
          "rotate"
        );

        // Étape 3 — la caméra se rapproche du tissu et des coutures pendant
        // que les courts textes matière apparaissent puis disparaissent.
        tl.addLabel("zoom", "rotate+=2.3")
          .to(
            camera.position,
            { z: homeZ - 1.8, y: homeY + 0.14, ease: SETTINGS.ease.zoom, duration: 0.9 },
            "zoom"
          )
          .to(
            camera,
            {
              fov: homeFov - 10,
              ease: SETTINGS.ease.zoom,
              duration: 0.9,
              onUpdate: () => camera.updateProjectionMatrix(),
            },
            "zoom"
          );

        const calloutWindow = 2.0; // durée totale réservée aux textes matière
        const calloutCount = Math.max(1, SETTINGS.fabricCallouts.length);
        const calloutSlot = calloutWindow / calloutCount;
        SETTINGS.fabricCallouts.forEach((_, index) => {
          const el = calloutRefs.current[index];
          if (!el) return;
          const fadeInOffset = 0.35 + index * calloutSlot;
          const fadeOutOffset = fadeInOffset + Math.max(calloutSlot - 0.4, 0.3);
          tl.fromTo(
            el,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.35 },
            `zoom+=${fadeInOffset}`
          ).to(
            el,
            { autoAlpha: 0, y: -14, ease: "power2.in", duration: 0.35 },
            `zoom+=${fadeOutOffset}`
          );
        });

        // Fin d'étape 3 — la caméra revient au cadrage large avant le
        // changement de coloris.
        tl.addLabel("zoomOut", `zoom+=${calloutWindow + 0.1}`)
          .to(
            camera.position,
            { z: homeZ, y: homeY, ease: SETTINGS.ease.zoom, duration: 0.7 },
            "zoomOut"
          )
          .to(
            camera,
            {
              fov: homeFov,
              ease: SETTINGS.ease.zoom,
              duration: 0.7,
              onUpdate: () => camera.updateProjectionMatrix(),
            },
            "zoomOut"
          );

        // Étape 4 — la couleur passe en douceur entre les coloris configurés.
        tl.addLabel("color", "zoomOut+=0.5");
        for (let i = 1; i < colors.length; i += 1) {
          tl.to(
            material.color,
            {
              r: colors[i].r,
              g: colors[i].g,
              b: colors[i].b,
              ease: SETTINGS.ease.color,
              duration: 0.8,
            },
            i === 1 ? "color" : "color+=0.9"
          );
        }

        // Étape 5 — le t-shirt reprend son tour et glisse vers le haut,
        // laissant place à la section suivante.
        tl.addLabel("release", "color+=1.9")
          .to(
            group.rotation,
            { y: `+=${Math.PI * 2}`, ease: SETTINGS.ease.release, duration: 1 },
            "release"
          )
          .to(
            contentRef.current,
            { y: "-8%", autoAlpha: 0, ease: SETTINGS.ease.release, duration: 0.9 },
            "release+=0.3"
          );

        // See the comment in LenisScrollProvider.tsx: this is what actually
        // notifies Lenis that the pin spacer grew the page, so it stops
        // clamping scroll short of the real content height.
        ScrollTrigger.refresh();
      }
    );

    return () => mm.revert();
  }, [useFallback, prefersReducedMotion, garmentReady, debug]);

  const initialColor = SETTINGS.colorways[0].hex;

  function scrollPastHero() {
    const target = document.getElementById("apres-hero");
    target?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  return (
    <>
      <div ref={pinRef} className="relative h-screen w-full overflow-hidden bg-bg">
        <div ref={contentRef} className="absolute inset-0">
          <StageBackdrop />

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
                  cameraRef={cameraRef}
                  materialRef={materialRef}
                  wireframeRef={wireframeRef}
                  initialColor={initialColor}
                  idleActive={false}
                  reducedMotion={Boolean(prefersReducedMotion)}
                  onCreated={() => setSceneReady(true)}
                  onGarmentReady={() => setGarmentReady(true)}
                />
              </>
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-5">
            <div ref={heroTextRef} className="flex max-w-3xl flex-col items-center text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                Arc — Marketplace décentralisée
              </p>
              <h1 className="mt-3 font-display text-5xl leading-[0.95] text-ink sm:text-7xl">
                ARC
              </h1>
              <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-muted sm:text-base">
                Le vêtement technique pensé pièce par pièce, produit en série limitée.
              </p>
              <MagneticButton className="pointer-events-auto mt-8">
                <button
                  type="button"
                  onClick={scrollPastHero}
                  className="block border border-ink/80 bg-bg/20 px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
                >
                  Commencer
                </button>
              </MagneticButton>
            </div>
          </div>

          {/* Textes matière, affichés puis masqués pendant le zoom (étape 3). */}
          {SETTINGS.fabricCallouts.map((label, index) => (
            <div
              key={label}
              ref={(el) => {
                calloutRefs.current[index] = el;
              }}
              className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[18%] opacity-0"
              style={{ transform: "translateY(14px)" }}
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent sm:text-sm">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {debug && <DebugScrubber />}
    </>
  );
}

// Fond "studio" — un halo blanc cassé au centre qui se fond dans le fond
// sombre du site : lit comme une scène de studio photo sans casser le
// dark mode épuré de la page.
function StageBackdrop() {
  return (
    <div
      className="absolute inset-0"
      aria-hidden="true"
      style={{
        background:
          "radial-gradient(60% 52% at 50% 44%, #f2efe8 0%, #d9d3c2 26%, var(--surface) 58%, var(--bg) 82%)",
      }}
    />
  );
}

// TODO(fallback asset): swap for a short looping .mp4 of the real garment
// turning once one is shot — a video reads as more "premium" here than a
// static photo. Keep the same radial-gradient overlay behind it either way.
function FallbackVisual() {
  return (
    <div className="relative h-full w-full">
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
