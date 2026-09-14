"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { TShirtIllustration } from "./TShirtIllustration";
import { SIZES, type Product } from "@/data/products";

type Hotspot = {
  id: string;
  x: number;
  y: number;
  label: string;
  text: string;
};

function getHotspots(product: Product): Hotspot[] {
  return [
    {
      id: "coupe",
      x: 50,
      y: 20,
      label: "Coupe",
      text: `${product.description} Du ${SIZES[0]} au ${SIZES[SIZES.length - 1]}.`,
    },
    {
      id: "mark",
      x: 50,
      y: 52,
      label: "Mark",
      text: "Le triangle Arc, sérigraphié à la main sur chaque pièce, encre résistante au lavage.",
    },
    {
      id: "matiere",
      x: 50,
      y: 84,
      label: "Matière",
      text: `${product.material}, coloris ${product.colorName}.`,
    },
  ];
}

export function ProductVisual({ product }: { product: Product }) {
  const [active, setActive] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const hotspots = getHotspots(product);
  const activeHotspot = hotspots.find((h) => h.id === active) ?? null;

  function toggle(id: string) {
    setActive((current) => (current === id ? null : id));
  }

  function clear(id: string) {
    setActive((current) => (current === id ? null : current));
  }

  return (
    <div className="group/visual relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-surface">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 42%, var(--surface-raised), var(--surface) 72%)",
        }}
        aria-hidden="true"
      />
      <div className="absolute bottom-[14%] h-4 w-[55%] rounded-full bg-ink/10 blur-md" aria-hidden="true" />

      {/* Stage: art layer + hotspot layer share the exact same box so positions line up */}
      <div className="relative h-[72%] w-[72%]">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: activeHotspot && !shouldReduceMotion ? 2.1 : 1 }}
          style={{
            transformOrigin: activeHotspot ? `${activeHotspot.x}% ${activeHotspot.y}%` : "50% 50%",
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <TShirtIllustration product={product} />
        </motion.div>

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
              className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            >
              <span
                className={`h-2 w-2 rounded-full border transition-colors ${
                  active === hotspot.id ? "border-accent bg-accent" : "border-ink/60 bg-bg/80"
                }`}
              />
              {active === hotspot.id && !shouldReduceMotion && (
                <span className="absolute h-4 w-4 animate-ping rounded-full border border-accent/60" />
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end p-3">
        <AnimatePresence mode="wait">
          {activeHotspot ? (
            <motion.p
              key={activeHotspot.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className="bg-surface-raised/95 px-2.5 py-1.5 font-mono text-[10px] uppercase leading-snug tracking-[0.03em] text-ink backdrop-blur-sm"
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
              Rendu illustré — survoler pour explorer
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
