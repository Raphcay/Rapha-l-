import Link from "next/link";
import { ProductVisual } from "@/components/ProductVisual";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { MagneticButton } from "@/components/MagneticButton";
import { MountainHero } from "@/components/MountainHero";
import { products } from "@/data/products";

const PILLARS = [
  {
    label: "01 — Matière",
    title: "Un coton qui tient la distance",
    body: "On ne descend jamais sous les 240g. La teinture se fait pièce par pièce, dans des ateliers européens qu'on connaît personnellement.",
  },
  {
    label: "02 — Coupe",
    title: "Une coupe testée, pas devinée",
    body: "Chaque patron passe par plusieurs morphologies avant validation — pas de taille générique qui ne va à personne.",
  },
  {
    label: "03 — Fabrication",
    title: "Peu de pièces, mais les bonnes",
    body: "Chaque drop est limité et numéroté. On préfère vendre vingt pièces bien faites que deux cents qu'on regrette.",
  },
];

const STATS = [
  { value: 240, suffix: "g", label: "Grammage du coton épais" },
  { value: 50, suffix: "", label: "Exemplaires numérotés par coloris" },
  { value: 12, suffix: "", label: "Mois de développement avant le premier drop" },
];

export default function Home() {
  const featured = products.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative flex h-[80vh] min-h-[560px] max-h-[760px] items-center justify-center overflow-hidden">
        <MountainHero />
        <ScrollReveal className="relative z-10 flex flex-col items-center px-5 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/70">
            Arc — Première collection
          </p>
          <h1 className="mt-5 text-balance font-display text-[13vw] leading-[1.02] sm:text-6xl md:text-7xl">
            Plus qu&apos;un style,
            <br />
            une identité.
          </h1>
          <MagneticButton className="mt-9">
            <Link
              href="/collection"
              className="block border border-ink/80 bg-bg/20 px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
            >
              Découvrir
            </Link>
          </MagneticButton>
        </ScrollReveal>
      </section>

      {/* Pillars */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-3 md:gap-8">
          {PILLARS.map((pillar, index) => (
            <ScrollReveal key={pillar.label} delay={index * 0.08}>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                {pillar.label}
              </p>
              <h3 className="mt-3 font-display text-xl">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {pillar.body}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-3">
          {STATS.map((stat, index) => (
            <ScrollReveal key={stat.label} delay={index * 0.08}>
              <p className="font-display text-5xl text-accent sm:text-6xl">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-3 max-w-[24ch] text-sm leading-relaxed text-muted">
                {stat.label}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <ScrollReveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                Drop 01
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl">
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
        </ScrollReveal>

        <div className="grid gap-8 sm:grid-cols-3">
          {featured.map((product, index) => (
            <ScrollReveal key={product.slug} delay={index * 0.08}>
              <Link href="/collection" className="group block">
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
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-line bg-ink text-bg">
        <ScrollReveal>
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center sm:px-8">
            <p className="max-w-[36ch] font-display text-2xl leading-snug">
              Sois averti·e au lancement du prochain drop.
            </p>
            <MagneticButton>
              <Link
                href="/contact"
                className="block shrink-0 border border-bg px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-bg hover:text-ink"
              >
                S&apos;inscrire
              </Link>
            </MagneticButton>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
