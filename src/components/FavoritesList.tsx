"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { products } from "@/data/products";
import { supabase } from "@/lib/supabase";

// The client's saved colours, shown on the account page.
export function FavoritesList({ userId }: { userId: string }) {
  const [slugs, setSlugs] = useState<string[] | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("favorites")
      .select("product_slug")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setSlugs((data ?? []).map((row) => row.product_slug as string)));
  }, [userId]);

  async function remove(slug: string) {
    if (!supabase) return;
    await supabase.from("favorites").delete().eq("user_id", userId).eq("product_slug", slug);
    setSlugs((current) => (current ?? []).filter((item) => item !== slug));
  }

  if (slugs === null) {
    return <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Chargement…</p>;
  }

  const items = slugs
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product) => product !== undefined);

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Mes favoris</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Aucun favori pour l&apos;instant. Ajoute un coloris depuis sa fiche.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {items.map((product) => (
            <li key={product.slug} className="flex items-center gap-4 py-4">
              <div className="relative h-16 w-14 shrink-0 bg-surface">
                <Image src={product.images.front} alt="" fill sizes="56px" className="object-contain p-1" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/collection/${product.slug}`} className="font-display text-lg hover:text-accent">
                  {product.name} {product.colorName}
                </Link>
                <p className="font-mono text-xs tabular-nums text-muted">{product.price} €</p>
              </div>
              <button
                type="button"
                onClick={() => remove(product.slug)}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted underline decoration-line underline-offset-4 hover:text-ink"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
