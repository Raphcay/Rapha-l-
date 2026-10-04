import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { MagneticButton } from "@/components/MagneticButton";
import { ScrollReveal } from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "À propos",
  description: "L'histoire d'ARC, une marque installée sur la Côte d'Azur qui fait des t-shirts pensés pour durer.",
  alternates: { canonical: "/a-propos" },
};

const STATS = [
  { value: "220", suffix: "g/m²", label: "Coton premium" },
  { value: "4", suffix: "", label: "Coloris : blanc, noir, gris, beige" },
  { value: "25", suffix: "€", label: "Le T-shirt ARC, un prix juste" },
];

export default function AProposPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pb-16 pt-14 text-center sm:px-8 sm:pb-24 sm:pt-24">
        <ScrollReveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">À propos</p>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] sm:text-7xl">L&apos;histoire ARC</h1>
          <p className="mx-auto mt-8 max-w-[38ch] font-display text-2xl leading-snug text-ink/80 sm:text-3xl">
            Une envie simple : une pièce qui tient, qu&apos;on porte longtemps
            et qu&apos;on a plaisir à garder.
          </p>
        </ScrollReveal>
      </section>

      {/* Origin of the name */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <ScrollReveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">D&apos;où vient ARC</p>
            <h2 className="mt-3 max-w-[20ch] font-display text-3xl sm:text-5xl">Trois lettres, deux frères.</h2>
            <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-muted">
              ARC, ce sont nos initiales. Deux frères, et une marque qui porte leur nom.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0">
            {[
              { letter: "A", word: "Axel", note: "Un frère, une seule ligne." },
              { letter: "R", word: "Raphaël", note: "L'autre frère, la même main." },
              { letter: "C", word: "Nom de famille", note: "Le nom qu'on porte depuis toujours, et qui nous unit." },
            ].map((item, index) => (
              <ScrollReveal
                key={item.letter}
                delay={index * 0.08}
                className="md:border-l md:border-line md:px-10 first:md:border-l-0 first:md:pl-0"
              >
                <p className="font-display text-[8rem] leading-none text-ink/90 sm:text-[10rem]">{item.letter}</p>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">{item.word}</p>
                <p className="mt-3 max-w-[26ch] text-sm leading-relaxed text-muted">{item.note}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter 1 */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 sm:px-8 sm:pb-32 md:grid-cols-2 md:items-center md:gap-20">
        <ScrollReveal className="relative aspect-[4/5] overflow-hidden bg-surface">
          <Image
            src="/products/arc-tee-front-gris.png"
            alt="T-shirt ARC gris, vue de face"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-contain p-10"
          />
        </ScrollReveal>
        <ScrollReveal delay={0.08}>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">01 · 2025</p>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl">Le déclic</h2>
          <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-muted">
            On en avait assez des t-shirts basiques, mal coupés, qu&apos;on
            remplaçait tous les six mois. Un jour, on s&apos;est demandé
            pourquoi personne ne faisait celui qu&apos;on aurait voulu porter.
          </p>
          <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-muted">
            ARC est née de cette question, sur la Côte d&apos;Azur, avec une idée
            en tête : faire moins de pièces, mais des pièces qui tiennent.
          </p>
        </ScrollReveal>
      </section>

      {/* Chapter 2 */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-32 md:grid-cols-2 md:items-center md:gap-20">
          <ScrollReveal className="order-2 md:order-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">02 · 2026</p>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl">Douze mois de travail</h2>
            <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-muted">
              Le patron a changé plusieurs fois avant de nous convenir. On a
              cherché le coton, la bonne épaisseur, une coupe qui tombe bien sans
              être encombrante.
            </p>
            <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-muted">
              Le résultat : le T-shirt ARC, en quatre coloris, à 25 €.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.08} className="relative order-1 aspect-[4/5] overflow-hidden bg-ink/[0.03] md:order-2">
            <Image
              src="/products/arc-tee-detail-collar-gris.png"
              alt="T-shirt ARC gris, détail du col"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </ScrollReveal>
        </div>
      </section>

      {/* The tee */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-32 md:grid-cols-2 md:items-center md:gap-20">
        <ScrollReveal className="relative aspect-[4/5] overflow-hidden bg-surface">
          <Image
            src="/products/arc-tee-back-noir.png"
            alt="T-shirt ARC noir, vue de dos"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-contain p-10"
          />
        </ScrollReveal>
        <ScrollReveal delay={0.08}>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Le T-shirt ARC</p>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl">Un coton épais, une coupe oversize.</h2>
          <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-muted">
            220 g/m², des épaules tombantes, un logo brodé discret sur le torse.
            Disponible en blanc, noir, gris et beige.
          </p>
          <MagneticButton className="mt-10 inline-block">
            <Link
              href="/collection"
              className="block border border-ink/80 px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent"
            >
              Voir les coloris
            </Link>
          </MagneticButton>
        </ScrollReveal>
      </section>

      {/* Stats */}
      <section className="border-y border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 md:grid-cols-3 md:gap-0">
          {STATS.map((stat, index) => (
            <ScrollReveal
              key={stat.label}
              delay={index * 0.08}
              className="md:border-l md:border-line md:px-10 first:md:border-l-0 first:md:pl-0"
            >
              <p className="font-display text-6xl leading-none sm:text-7xl">
                {stat.value}
                <span className="ml-1 text-2xl text-muted sm:text-3xl">{stat.suffix}</span>
              </p>
              <p className="mt-4 max-w-[24ch] text-sm leading-relaxed text-muted">{stat.label}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-4xl px-5 py-24 text-center sm:px-8 sm:py-36">
        <ScrollReveal>
          <Mark className="mx-auto mb-10 h-10 w-10 text-accent" />
          <p className="font-display text-3xl leading-[1.15] sm:text-5xl">
            « Il y a quelque chose de rassurant dans les choses simples et bien
            faites. »
          </p>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            L&apos;équipe ARC
          </p>
        </ScrollReveal>
      </section>

      {/* Chapter 3 */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-32">
          <ScrollReveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">03 · à suivre</p>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl">La suite</h2>
            <p className="mx-auto mt-6 max-w-[48ch] text-[15px] leading-relaxed text-muted">
              D&apos;autres pièces arriveront, au fil des envies et des besoins.
              Le premier chapitre est écrit. La suite arrive bientôt.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 sm:py-24 md:flex-row md:items-center">
        <ScrollReveal>
          <p className="max-w-[24ch] font-display text-3xl leading-snug sm:text-4xl">
            Porte ARC, raconte-le.
          </p>
          <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-muted">
            Publie ta photo avec le tag <span className="text-ink">#PorteARC</span>.
            Chaque photo repartagée t&apos;ouvre l&apos;accès anticipé aux nouvelles pièces.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.08} className="flex flex-wrap gap-4">
          <MagneticButton>
            <Link
              href="/contact"
              className="block border border-ink/80 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent"
            >
              Envoyer ma photo
            </Link>
          </MagneticButton>
          <MagneticButton>
            <Link
              href="/collection"
              className="block border border-ink/80 bg-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-bg transition-colors hover:border-accent hover:bg-accent"
            >
              Voir la boutique
            </Link>
          </MagneticButton>
        </ScrollReveal>
      </section>
    </>
  );
}
