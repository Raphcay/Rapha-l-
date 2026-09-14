"use client";

import { useId } from "react";
import type { Product } from "@/data/products";

type Palette = {
  base: string;
  shade: string;
  highlight: string;
  mark: string;
};

const TONE_PALETTES: Record<Product["tone"], Palette> = {
  night: { base: "#1a1a1c", shade: "#0b0b0c", highlight: "#2d2d30", mark: "#f3f1ea" },
  raw: { base: "#e4ddc9", shade: "#cfc6ac", highlight: "#efe9da", mark: "#211f18" },
  clay: { base: "#8a3a24", shade: "#6c2c1a", highlight: "#a24a30", mark: "#f4ece2" },
  steel: { base: "#5a5e64", shade: "#46494e", highlight: "#6d7178", mark: "#f1f0ec" },
};

export function TShirtIllustration({ product }: { product: Product }) {
  const gradientId = useId();
  const palette = TONE_PALETTES[product.tone];

  return (
    <svg viewBox="0 0 200 220" className="h-full w-full" role="img" aria-label={`${product.name}, ${product.colorName}`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.highlight} />
          <stop offset="55%" stopColor={palette.base} />
          <stop offset="100%" stopColor={palette.shade} />
        </linearGradient>
      </defs>

      {/* Body + sleeves */}
      <path
        d="M76,32
           L52,44
           L24,78
           L45,98
           L62,80
           L62,196
           L138,196
           L138,80
           L155,98
           L176,78
           L148,44
           L124,32
           Q116,50 100,50
           Q84,50 76,32
           Z"
        fill={`url(#${gradientId})`}
        stroke={palette.highlight}
        strokeWidth="1.5"
        strokeOpacity="0.6"
        strokeLinejoin="round"
      />

      {/* Collar rib */}
      <path
        d="M76,32 Q100,58 124,32"
        fill="none"
        stroke={palette.shade}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Side seams */}
      <path d="M62,80 L62,196" stroke={palette.shade} strokeWidth="1" opacity="0.35" />
      <path d="M138,80 L138,196" stroke={palette.shade} strokeWidth="1" opacity="0.35" />

      {/* Sleeve hems */}
      <path d="M24,78 L45,98" stroke={palette.shade} strokeWidth="1" opacity="0.4" />
      <path d="M176,78 L155,98" stroke={palette.shade} strokeWidth="1" opacity="0.4" />

      {/* Chest mark */}
      <path
        d="M100 96 L118 138 L107 138 L100 122 L93 138 L82 138 Z"
        fill={palette.mark}
        opacity="0.92"
      />
    </svg>
  );
}
