import type { Metadata } from "next";
import { ProductVisual } from "@/components/ProductVisual";
import { ScrollReveal } from "@/components/ScrollReveal";
import { products } from "@/data/products";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Collection",
  description: "La première collection Arc : un t-shirt oversize en coton premium, décliné en quatre coloris, en série limitée.",
  alternates: { canonical: "/collection" },
};

const productsJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Product",
      name: `${product.name} — ${product.colorName}`,
      description: `${product.description} ${product.material}.`,
      brand: { "@type": "Brand", name: "Arc" },
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/collection`,
        priceCurrency: "EUR",
        price: product.price,
        availability: "https://schema.org/PreOrder",
      },
    },
  })),
};

export default function CollectionPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsJsonLd) }}
      />
      <ScrollReveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Drop 01
        </p>
        <h1 className="mt-2 max-w-[20ch] font-display text-4xl sm:text-5xl">
          La collection
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted">
          Une seule coupe, déclinée en quatre coloris. Chaque édition est
          cousue en petit atelier, en quantité limitée. Une fois le stock
          épuisé, on ne le refait pas à l&apos;identique.
        </p>
      </ScrollReveal>

      <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <ScrollReveal key={product.slug} delay={(index % 4) * 0.06} className="group">
            <ProductVisual product={product} priority={index === 0} />
            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{product.name}</p>
                <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-muted">
                  {product.colorName}
                </p>
              </div>
              <p className="font-mono text-sm tabular-nums">
                {product.price} €
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {product.material}
            </p>
          </ScrollReveal>
        ))}
      </div>

      <p className="mt-16 border-t border-line pt-8 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
        Le paiement en ligne arrive bientôt. En attendant, pour précommander
        une pièce, écris-nous via la page{" "}
        <a href="/contact" className="text-ink underline decoration-line underline-offset-4 hover:text-accent">
          contact
        </a>
        .
      </p>
    </section>
  );
}
