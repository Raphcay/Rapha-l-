import Link from "next/link";
import { Mark } from "@/components/Mark";
import { ProductVisual } from "@/components/ProductVisual";
import { products } from "@/data/products";

const PILLARS = [
  {
    label: "01 — Matière",
    title: "Coton épais, tenue dans le temps",
    body: "240g minimum, teinture pièce, sourcé auprès d'ateliers européens contrôlés.",
  },
  {
    label: "02 — Coupe",
    title: "Une silhouette, pensée pour durer",
    body: "Patronage testé sur plusieurs morphologies avant chaque production, pas de coupe générique.",
  },
  {
    label: "03 — Fabrication",
    title: "Petites séries, zéro surproduction",
    body: "Chaque drop est produit en quantité limitée et numérotée, pour éviter le déstockage.",
  },
];

export default function Home() {
  const featured = products.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Arc — Première collection
            </p>
            <h1 className="mt-5 text-balance font-display text-[13vw] italic leading-[0.95] sm:text-6xl md:text-7xl">
              Une garde-robe,
              <br />
              une intention.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-muted">
              Arc conçoit des vêtements techniques pensés pour la ville :
              coupes précises, matières durables, séries limitées. La
              première pièce de la marque : un t-shirt construit pour durer.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/collection"
                className="border border-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent"
              >
                Voir la collection
              </Link>
              <Link
                href="/a-propos"
                className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted underline decoration-line underline-offset-4 hover:text-ink"
              >
                Le projet Arc
              </Link>
            </div>
          </div>

          <div className="flex aspect-[4/5] items-center justify-center border border-line bg-surface">
            <Mark className="h-28 w-28 text-ink/80 sm:h-36 sm:w-36" />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-3 md:gap-8">
          {PILLARS.map((pillar) => (
            <div key={pillar.label}>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                {pillar.label}
              </p>
              <h3 className="mt-3 font-display text-xl">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              Drop 01
            </p>
            <h2 className="mt-2 font-display text-3xl italic sm:text-4xl">
              Le t-shirt Arc
            </h2>
          </div>
          <Link
            href="/collection"
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted underline decoration-line underline-offset-4 hover:text-ink"
          >
            Toute la collection →
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {featured.map((product) => (
            <Link
              key={product.slug}
              href="/collection"
              className="group block"
            >
              <ProductVisual product={product} />
              <div className="mt-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium group-hover:text-accent">
                    {product.name}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-muted">
                    {product.colorName}
                  </p>
                </div>
                <p className="font-mono text-sm tabular-nums">
                  {product.price} €
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-line bg-ink text-bg">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center sm:px-8">
          <p className="max-w-[36ch] font-display text-2xl italic leading-snug">
            Sois averti·e au lancement du prochain drop.
          </p>
          <Link
            href="/contact"
            className="shrink-0 border border-bg px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-bg hover:text-ink"
          >
            S&apos;inscrire
          </Link>
        </div>
      </section>
    </>
  );
}
