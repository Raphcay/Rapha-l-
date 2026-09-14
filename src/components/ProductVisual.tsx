"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { TintedProductImage } from "./TintedProductImage";
import { PRODUCT_IMAGES, SIZES, type Product } from "@/data/products";

type Hotspot = {
  id: string;
  x: number;
  y: number;
  label: string;
  text: string;
  image: string;
};

function getHotspots(product: Product): Hotspot[] {
  return [
    {
      id: "coupe",
      x: 50,
      y: 18,
      label: "Coupe",
      text: `${product.cut}. Du ${SIZES[0]} au ${SIZES[SIZES.length - 1]}.`,
      image: PRODUCT_IMAGES.detailCollar,
    },
    {
      id: "mark",
      x: 62,
      y: 40,
      label: "Mark",
      text: "Logo Arc brodé, finition haut de gamme, résistant au lavage.",
      image: PRODUCT_IMAGES.detailLogo,
    },
    {
      id: "matiere",
      x: 38,
      y: 62,
      label: "Matière",
      text: `${product.material}, coloris ${product.colorName}.`,
      image: PRODUCT_IMAGES.detailShoulder,
    },
  ];
}

export function ProductVisual({ product, priority }: { product: Product; priority?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const [showBack, setShowBack] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const hotspots = getHotspots(product);
  const activeHotspot = hotspots.find((h) => h.id === active) ?? null;

  function toggle(id: string) {
    setActive((current) => (current === id ? null : id));
  }

  function clear(id: string) {
    setActive((current) => (current === id ? null : current));
  }

  const zoomTransition = { duration: shouldReduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="group/visual relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-surface">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(60% 55% at 50% 42%, var(--surface-raised), var(--surface) 72%)",
        }}
        aria-hidden="true"
      />
      <div className="absolute bottom-[10%] h-5 w-[50%] rounded-full bg-ink/10 blur-md" aria-hidden="true" />

      <div className="relative h-[80%] w-[80%]">
        <AnimatePresence mode="wait">
          {showBack ? (
            <motion.div
              key="back"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={zoomTransition}
            >
              <TintedProductImage
                src={PRODUCT_IMAGES.back}
                alt={`${product.name} — ${product.colorName}, dos`}
                colorHex={product.colorHex}
              />
            </motion.div>
          ) : (
            <motion.div
              key="front"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={zoomTransition}
            >
              <TintedProductImage
                src={PRODUCT_IMAGES.front}
                alt={`${product.name} — ${product.colorName}`}
                colorHex={product.colorHex}
                priority={priority}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeHotspot && !showBack && (
            <motion.div
              key={activeHotspot.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 1.06 }}
              transition={zoomTransition}
            >
              <TintedProductImage
                src={activeHotspot.image}
                alt={`${product.name} — détail ${activeHotspot.label.toLowerCase()}`}
                colorHex={product.colorHex}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!showBack && (
          <div className="absolute inset-0 z-10">
            {hotspots.map((hotspot) => (
              <span
                key={hotspot.id}
                role="button"
                aria-label={hotspot.label}
                onMouseEnter={() => setActive(hotspot.id)}
                onMouseLeave={() => clear(hotspot.id)}
                onClick={(event) => {
                  event.preventDefault();
                  toggle(hotspot.id);
                }}
                className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              >
                <span
                  className={`h-2 w-2 rounded-full border transition-colors ${
                    active === hotspot.id ? "border-accent bg-accent" : "border-ink/70 bg-bg/80"
                  }`}
                />
                {active === hotspot.id && !shouldReduceMotion && (
                  <span className="absolute h-4 w-4 animate-ping rounded-full border border-accent/60" />
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          setActive(null);
          setShowBack((v) => !v);
        }}
        className="absolute left-3 top-3 z-20 font-mono text-[10px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
      >
        {showBack ? "← Devant" : "Voir le dos"}
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-end p-3">
        <AnimatePresence mode="wait">
          {activeHotspot && !showBack ? (
            <motion.p
              key={activeHotspot.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className="bg-surface-raised/95 px-2.5 py-1.5 text-right font-mono text-[10px] uppercase leading-snug tracking-[0.03em] text-ink backdrop-blur-sm"
            >
              <span className="text-accent">{activeHotspot.label} — </span>
              {activeHotspot.text}
            </motion.p>
          ) : (
            <motion.span
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
            >
              {showBack ? "" : "Survoler pour explorer"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <span
        className="absolute right-3 top-3 z-20 h-3 w-3 rounded-full ring-1 ring-black/20"
        style={{ backgroundColor: product.colorHex }}
        aria-hidden="true"
      />
    </div>
  );
}
