import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { MagneticButton } from "@/components/MagneticButton";
import { Hero } from "@/components/Hero";
import { ColorCarousel } from "@/components/ColorCarousel";
import { products } from "@/data/products";

const PILLARS = [
  {
    number: "01",
    label: "Matière",
    title: "220g minimum, sans discussion",
    body: "C'est le seuil qu'on s'est fixé au lancement et qu'on n'a jamais revu à la baisse. La teinture se fait pièce par pièce, dans des ateliers européens qu'on connaît personnellement.",
  },
  {
    number: "02",
    label: "Coupe",
    title: "Une coupe qui a mis du temps",
    body: "Le patron est passé par plusieurs morphologies avant d'être validé. On voulait éviter la taille générique qui, au final, ne va vraiment à personne.",
  },
  {
    number: "03",
    label: "Fabrication",
    title: "Quatre coloris, une seule coupe",
    body: "Le même patron, le même coton et les mêmes finitions pour chaque couleur. Chaque pièce est cousue en petit atelier.",
  },
];

const STATS = [
  { value: 220, suffix: "g", label: "Grammage du coton premium" },
  { value: 4, suffix: "", label: "Coloris disponibles" },
  { value: 12, suffix: "", label: "Mois de développement avant la première pièce" },
];

export default function Home() {
  return (
    <>
      <Hero />

      {/* Pillars */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.85fr_2fr] lg:gap-20">
          <ScrollReveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Sans compromis
            </p>
            <h2 className="mt-3 max-w-[18ch] text-balance font-display text-3xl leading-[1.05] sm:text-4xl">
              Trois choses qu&apos;on ne change pas.
            </h2>
          </ScrollReveal>

          <div className="divide-y divide-line lg:mt-1">
            {PILLARS.map((pillar, index) => (
              <ScrollReveal
                key={pillar.number}
                delay={index * 0.08}
                className="grid gap-3 py-7 first:pt-0 last:pb-0 sm:grid-cols-[3.5rem_1fr] sm:gap-8"
              >
                <span
                  className="font-display text-4xl leading-none text-ink/[0.12] sm:text-5xl"
                  aria-hidden="true"
                >
                  {pillar.number}
                </span>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                    {pillar.label}
                  </p>
                  <h3 className="mt-2 font-display text-xl sm:text-2xl">{pillar.title}</h3>
                  <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-muted">
                    {pillar.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map((stat, index) => (
            <ScrollReveal
              key={stat.label}
              delay={index * 0.08}
              className="py-6 first:pt-0 sm:px-8 sm:py-0 sm:first:pl-0 sm:last:pr-0"
            >
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

      {/* Couleurs */}
      <section id="couleurs" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <ScrollReveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            T-shirt ARC
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Nos couleurs</h2>
        </ScrollReveal>
        <div className="mt-10">
          <ColorCarousel products={products} />
        </div>
      </section>

      {/* Ambassadeurs */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-20">
          <ScrollReveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Communauté
            </p>
            <h2 className="mt-3 max-w-[24ch] font-display text-3xl leading-[1.05] sm:text-4xl">
              Porte ARC, raconte-le.
            </h2>
            <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-muted">
              Tu portes une pièce ARC ? Publie ta photo et mentionne-nous avec le
              tag <span className="text-ink">#PorteARC</span>. On la partage et on
              te répond.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.08} className="flex flex-col justify-center">
            <p className="max-w-[30ch] font-display text-2xl leading-snug">
              Chaque photo repartagée t&apos;ouvre l&apos;accès anticipé de 24 h aux
              nouvelles pièces.
            </p>
            <MagneticButton className="mt-8 self-start">
              <Link
                href="/contact"
                className="block border border-ink/80 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent"
              >
                Envoyer ma photo
              </Link>
            </MagneticButton>
          </ScrollReveal>
        </div>
      </section>

      {/* Parrainage */}
      <section className="border-t border-line">
        <ScrollReveal>
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center sm:px-8">
            <div>
              <p className="font-display text-2xl leading-snug">
                Un ami, un code, une réduction.
              </p>
              <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">
                Parraine un ami : il reçoit 10 % sur sa première commande, et toi
                10 % dès son premier achat.
              </p>
            </div>
            <MagneticButton>
              <Link
                href="/contact"
                className="block shrink-0 border border-ink/80 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent"
              >
                Demander mon code
              </Link>
            </MagneticButton>
          </div>
        </ScrollReveal>
      </section>

      {/* CTA band */}
      <section className="border-t border-line bg-ink text-bg">
        <ScrollReveal>
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center sm:px-8">
            <p className="max-w-[36ch] font-display text-2xl leading-snug">
              Sois averti·e des prochaines pièces.
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
