import type { Metadata } from "next";
import Image from "next/image";
import { ScrollReveal } from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "À propos",
  description: "L'histoire et les intentions derrière La Rue des Nôtres.",
  alternates: { canonical: "/a-propos" },
};

const TIMELINE = [
  {
    year: "2025",
    title: "Le déclic",
    body: "On en avait assez des t-shirts basiques, mal coupés, qu'on remplaçait tous les six mois. L'idée de La Rue des Nôtres est partie de là : faire une pièce qui tienne vraiment.",
  },
  {
    year: "2026",
    title: "Douze mois de travail",
    body: "Le patronage et le choix des matières ont pris plus de temps que prévu. Le résultat : deux lignes, le Basique et le Spécial, sorties en série limitée.",
  },
  {
    year: "À venir",
    title: "Ensuite",
    body: "D'autres pièces suivront, toujours en petite série. Pas de stock permanent, pas de réassort automatique.",
  },
];

export default function AProposPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid items-start gap-12 md:grid-cols-[1fr_0.7fr]">
          <ScrollReveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              À propos
            </p>
            <h1 className="mt-2 max-w-[18ch] text-balance font-display text-4xl leading-[1.15] sm:text-5xl">
              Des vêtements qui méritent d&apos;être gardés.
            </h1>
            <p className="mt-6 max-w-[54ch] text-[15px] leading-relaxed text-muted">
              La Rue des Nôtres est née d&apos;une frustration assez simple :
              trop de t-shirts finissaient à la poubelle après quelques mois,
              mal coupés ou mal cousus dès le départ. On a voulu faire
              l&apos;inverse — des pièces taillées pour durer,
              produites en petites séries parce qu&apos;on n&apos;a ni
              l&apos;envie ni les moyens de stocker ce qu&apos;on ne vendra
              pas.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.12} y={16}>
            <div className="hero-gradient flex aspect-square items-center justify-center overflow-hidden border border-line bg-surface">
              <Image
                src="/brand/la-rue-des-notres-logo-light.png"
                alt="Logo La Rue des Nôtres"
                width={480}
                height={480}
                className="relative z-10 h-3/5 w-3/5 object-contain"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <ScrollReveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              Parcours
            </p>
          </ScrollReveal>
          <div className="mt-8">
            {TIMELINE.map((step, index) => (
              <ScrollReveal
                key={step.year}
                delay={index * 0.1}
                className="grid grid-cols-[4.5rem_1fr] gap-6 border-t border-ink/15 py-8 first:border-t-0 first:pt-2 sm:grid-cols-[7rem_1fr] sm:gap-10"
              >
                <p className="font-mono text-sm tabular-nums text-accent">
                  {step.year}
                </p>
                <div>
                  <h3 className="font-display text-xl sm:text-2xl">{step.title}</h3>
                  <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
