"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { products } from "@/data/products";
import { CONTACT_EMAIL_REAL } from "@/lib/site";

export function CartView() {
  const { items, count, total, setQty, remove } = useCart();

  const lines = items
    .map((item) => {
      const product = products.find((p) => p.slug === item.slug);
      return product ? { item, product } : null;
    })
    .filter((line) => line !== null);

  if (lines.length === 0) {
    return (
      <div className="py-10">
        <p className="font-display text-3xl sm:text-4xl">Ton panier est vide.</p>
        <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-muted">
          Les pièces que tu ajoutes apparaissent ici, même si tu quittes le site.
        </p>
        <Link
          href="/collection"
          className="mt-8 inline-block border border-ink/80 px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent"
        >
          Voir les coloris
        </Link>
      </div>
    );
  }

  const summary = lines
    .map(({ item, product }) => `${item.qty} x ${product.name} ${product.colorName}, taille ${item.size}`)
    .join("\n");
  const mailto = `mailto:${CONTACT_EMAIL_REAL}?subject=${encodeURIComponent("Commande ARC")}&body=${encodeURIComponent(
    `Bonjour,\n\nJe souhaite commander :\n${summary}\n\nTotal : ${total} €\n`,
  )}`;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
      <ul className="divide-y divide-line border-y border-line">
        {lines.map(({ item, product }) => (
          <li key={`${item.slug}-${item.size}`} className="grid grid-cols-[88px_1fr] gap-5 py-6 sm:grid-cols-[120px_1fr_auto]">
            <div className="relative aspect-[4/5] bg-surface">
              <Image src={product.images.front} alt="" fill sizes="120px" className="object-contain p-2" />
            </div>
            <div>
              <p className="font-display text-xl sm:text-2xl">
                {product.name} {product.colorName}
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Taille {item.size}</p>
              <p className="mt-2 font-mono text-sm tabular-nums">{product.price} €</p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty(item.slug, item.size, item.qty - 1)}
                  aria-label="Retirer une pièce"
                  className="h-9 w-9 border border-line font-mono text-sm transition-colors hover:border-accent hover:text-accent"
                >
                  −
                </button>
                <span className="w-6 text-center font-mono text-sm tabular-nums">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(item.slug, item.size, item.qty + 1)}
                  aria-label="Ajouter une pièce"
                  className="h-9 w-9 border border-line font-mono text-sm transition-colors hover:border-accent hover:text-accent"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.slug, item.size)}
                  className="ml-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted underline decoration-line underline-offset-4 hover:text-ink"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit border border-line bg-surface p-6 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Récapitulatif</p>
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-muted">{count} pièce{count > 1 ? "s" : ""}</span>
          <span className="font-mono tabular-nums">{total} €</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
          <span>Total</span>
          <span className="font-mono text-lg tabular-nums">{total} €</span>
        </div>
        <a
          href={mailto}
          className="mt-8 block border border-ink/80 px-6 py-4 text-center font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent"
        >
          Envoyer ma commande
        </a>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Le paiement en ligne arrive bientôt. D&apos;ici là, ta commande part par email et on te répond pour le paiement.
        </p>
      </aside>
    </div>
  );
}
