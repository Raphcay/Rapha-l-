import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCart } from "@/components/AddToCart";
import { ScrollReveal } from "@/components/ScrollReveal";
import { products, SIZES } from "@/data/products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

function findProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return {};

  return {
    title: `${product.name} ${product.colorName}`,
    description: `${product.description} ${product.material}.`,
    alternates: { canonical: `/collection/${product.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const otherColors = products.filter((item) => item.slug !== product.slug);

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <nav aria-label="Fil d'Ariane" className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        <Link href="/collection" className="hover:text-ink">
          Boutique
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-ink">{product.colorName}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <ScrollReveal>
          <ProductGallery product={product} />
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="lg:pt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            {product.name}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">
            {product.name} {product.colorName}
          </h1>
          <p className="mt-4 font-mono text-lg tabular-nums">{product.price} €</p>

          <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-muted">
            {product.description}
          </p>

          <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
            <div className="grid grid-cols-[8rem_1fr] gap-4 py-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Matière</dt>
              <dd>{product.material}</dd>
            </div>
            <div className="grid grid-cols-[8rem_1fr] gap-4 py-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Coupe</dt>
              <dd>{product.cut}</dd>
            </div>
            <div className="grid grid-cols-[8rem_1fr] items-center gap-4 py-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Coloris</dt>
              <dd className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-line"
                  style={{ backgroundColor: product.colorHex }}
                  aria-hidden="true"
                />
                {product.colorName}
              </dd>
            </div>
            <div className="grid grid-cols-[8rem_1fr] gap-4 py-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Tailles</dt>
              <dd>{SIZES.join(" · ")}</dd>
            </div>
          </dl>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>
          <p className="mt-4 max-w-[48ch] text-xs leading-relaxed text-muted">
            Le paiement en ligne arrive bientôt. D&apos;ici là, ta commande part par email.
          </p>
        </ScrollReveal>
      </div>

      {otherColors.length > 0 && (
        <div className="mt-20 border-t border-line pt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            Les autres coloris
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-3">
            {otherColors.map((item) => (
              <li key={item.slug}>
                <Link href={`/collection/${item.slug}`} className="group flex items-center justify-between gap-4 border border-line px-5 py-4 transition-colors hover:border-accent">
                  <span className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-line"
                      style={{ backgroundColor: item.colorHex }}
                      aria-hidden="true"
                    />
                    <span className="text-sm group-hover:text-accent">
                      {item.name} {item.colorName}
                    </span>
                  </span>
                  <span className="font-mono text-sm tabular-nums">{item.price} €</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
