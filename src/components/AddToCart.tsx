"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { SIZES, type Product } from "@/data/products";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!size) return;
    add(product.slug, size);
    setAdded(true);
  }

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Choisis ta taille</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SIZES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setSize(item);
              setAdded(false);
            }}
            aria-pressed={size === item}
            className={`min-w-12 border px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
              size === item ? "border-accent text-accent" : "border-line text-muted hover:border-ink/60 hover:text-ink"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!size}
        className="mt-6 block w-full border border-ink/80 px-8 py-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink/80 disabled:hover:text-ink sm:w-auto"
      >
        Ajouter au panier
      </button>

      {added && (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-accent" aria-live="polite">
          Ajouté.{" "}
          <Link href="/panier" className="underline underline-offset-4 hover:text-ink">
            Voir le panier
          </Link>
        </p>
      )}
    </div>
  );
}
