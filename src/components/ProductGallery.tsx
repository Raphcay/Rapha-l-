"use client";

import Image from "next/image";
import { useState, type PointerEvent } from "react";
import type { Product } from "@/data/products";

type View = {
  key: string;
  label: string;
  alt: string;
  src: string;
  // Full garment views get the round magnifier; detail photos are shown as they are.
  garment: boolean;
};

function getViews(product: Product): View[] {
  return [
    { key: "front", label: "Devant", alt: `${product.name} ${product.colorName}, devant`, src: product.images.front, garment: true },
    { key: "back", label: "Dos", alt: `${product.name} ${product.colorName}, dos`, src: product.images.back, garment: true },
    { key: "logo", label: "Logo", alt: `${product.name} ${product.colorName}, détail du logo`, src: product.images.detailLogo, garment: false },
    { key: "collar", label: "Col", alt: `${product.name} ${product.colorName}, détail du col`, src: product.images.detailCollar, garment: false },
    { key: "shoulder", label: "Épaule", alt: `${product.name} ${product.colorName}, détail de l'épaule`, src: product.images.detailShoulder, garment: false },
  ];
}

const BACKGROUND = "radial-gradient(60% 55% at 50% 42%, var(--surface-raised), var(--surface) 72%)";
const LENS_SIZE = 180;
const ZOOM = 2.5;

type Lens = { x: number; y: number; width: number; height: number };

// Round magnifier over the whole garment. The enlarged layer repeats the same layout
// (garment inset 10%) at ZOOM times the size of the frame, so the zoomed shirt lines up
// with the one underneath. Hover on desktop, press and drag on touch.
function GarmentViewer({ src, alt }: { src: string; alt: string }) {
  const [lens, setLens] = useState<Lens | null>(null);

  function track(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setLens({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    });
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className="absolute inset-0 touch-none cursor-crosshair"
      style={{ background: BACKGROUND }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") track(event);
      }}
      onPointerMove={(event) => {
        if (event.pointerType === "mouse" || lens) track(event);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setLens(null);
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse") track(event);
      }}
      onPointerUp={(event) => {
        if (event.pointerType !== "mouse") setLens(null);
      }}
      onPointerCancel={() => setLens(null)}
    >
      <div className="absolute inset-[10%]">
        <Image src={src} alt="" fill sizes="(min-width: 640px) 520px, 90vw" className="object-contain" />
      </div>

      {lens && (
        <div
          className="pointer-events-none absolute overflow-hidden rounded-full border border-ink/40 shadow-2xl"
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            left: lens.x - LENS_SIZE / 2,
            top: lens.y - LENS_SIZE / 2,
            background: "var(--surface-raised)",
          }}
        >
          <div
            className="absolute"
            style={{
              width: lens.width * ZOOM,
              height: lens.height * ZOOM,
              left: -(lens.x * ZOOM - LENS_SIZE / 2),
              top: -(lens.y * ZOOM - LENS_SIZE / 2),
            }}
          >
            <div className="absolute inset-[10%]">
              <Image src={src} alt="" fill sizes="1100px" className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main view with thumbnails underneath: a click on a thumbnail shows that view.
export function ProductGallery({ product }: { product: Product }) {
  const views = getViews(product);
  const [selected, setSelected] = useState(0);
  const view = views[selected];

  return (
    <div>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
        {view.garment ? (
          <GarmentViewer key={view.key} src={view.src} alt={view.alt} />
        ) : (
          <Image
            key={view.key}
            src={view.src}
            alt={view.alt}
            fill
            sizes="(min-width: 640px) 520px, 90vw"
            className="object-cover"
          />
        )}
      </div>

      <ul className="mt-4 grid grid-cols-5 gap-3">
        {views.map((item, index) => {
          const active = index === selected;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={active}
                aria-label={item.alt}
                className={`block w-full overflow-hidden border bg-surface transition-colors ${
                  active ? "border-accent" : "border-line hover:border-ink/60"
                }`}
              >
                <span className="relative block aspect-square w-full">
                  <Image src={item.src} alt="" fill sizes="120px" className="object-contain p-2" />
                </span>
              </button>
              <span
                className={`mt-2 block text-center font-mono text-[10px] uppercase tracking-[0.1em] ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>

      {view.garment && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          Survole le t-shirt pour zoomer. Sur mobile, appuie et glisse.
        </p>
      )}
    </div>
  );
}
