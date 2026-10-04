"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/data/products";

const CONTROL_CLASS =
  "font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:text-accent";

// Full-bleed colour carousel, inspired by product pages with large hero slides.
// One slide per colour: big product photo, title and price, a row of tabs to jump
// between colours, previous/next buttons and a counter. No autoplay, so the visitor
// stays in control of the pace.
export function ColorCarousel({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const total = products.length;
  const product = products[index];

  function go(step: number) {
    setIndex((current) => (current + step + total) % total);
  }

  return (
    <div className="relative">
      <div className="relative min-h-[78vh] overflow-hidden bg-surface sm:min-h-[84vh]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={product.slug}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center px-5 pb-40 pt-12 sm:px-8 sm:pb-44"
          >
            <div className="relative h-[46vh] w-full max-w-md sm:h-[56vh]">
              <Image
                src={product.images.front}
                alt={`${product.name}, coloris ${product.colorName.toLowerCase()}`}
                fill
                sizes="(min-width: 640px) 448px, 90vw"
                className="object-contain"
                priority={index === 0}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-transparent"
          aria-hidden="true"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-6 px-5 pb-8 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              {product.name} · {product.price} €
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-6xl">
              {product.colorName}
            </h2>
            <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-muted">
              {product.description}
            </p>
            <Link
              href={`/collection/${product.slug}`}
              className="mt-5 inline-block border border-ink/80 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent"
            >
              Voir la fiche
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Couleur précédente"
              className={`${CONTROL_CLASS} px-2 py-1`}
            >
              ←
            </button>
            <span className="font-mono text-[11px] tabular-nums text-muted">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Couleur suivante"
              className={`${CONTROL_CLASS} px-2 py-1`}
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Choisir un coloris"
        className="mt-px flex overflow-x-auto border-t border-line bg-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((item, i) => {
          const active = i === index;
          return (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setIndex(i)}
              className={`relative flex-1 whitespace-nowrap px-4 py-5 text-left font-mono text-[11px] uppercase tracking-[0.12em] transition-colors sm:px-8 ${
                active ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              <span
                className="mr-2 inline-block h-2.5 w-2.5 rounded-full border border-line align-middle"
                style={{ backgroundColor: item.colorHex }}
                aria-hidden="true"
              />
              {item.colorName}
              {active && (
                <motion.span
                  layoutId="color-tab-line"
                  className="absolute inset-x-0 bottom-0 h-px bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
