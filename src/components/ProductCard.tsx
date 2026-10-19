"use client";

import { useState } from "react";
import { ProductVisual } from "./ProductVisual";
import type { Colorway, Product } from "@/data/products";

export function ProductCard({
  product,
  priority,
  defaultView = "front",
  showMaterial = false,
  nameClassName = "",
}: {
  product: Product;
  priority?: boolean;
  defaultView?: "front" | "back";
  showMaterial?: boolean;
  nameClassName?: string;
}) {
  const [colorway, setColorway] = useState<Colorway>(product.colorways[0]);

  return (
    <>
      <ProductVisual
        product={product}
        priority={priority}
        defaultView={defaultView}
        onColorwayChange={setColorway}
      />
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${nameClassName}`}>{product.name}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-muted">
            {colorway.name}
          </p>
        </div>
        <p className="font-mono text-sm tabular-nums">{product.price} €</p>
      </div>
      {showMaterial && (
        <p className="mt-2 text-xs leading-relaxed text-muted">{product.material}</p>
      )}
    </>
  );
}
