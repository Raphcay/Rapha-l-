import type { Metadata } from "next";
import { Mark } from "@/components/Mark";
import { ScrollReveal } from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "À propos",
  description: "L'histoire et les intentions derrière Arc.",
  alternates: { canonical: "/a-propos" },
};

const TIMELINE = [
  {
    year: "2025",
    title: "Le déclic",
    body: "On en avait assez des t-shirts basiques, mal coupés, qu'on remplaçait tous les six mois. L'idée d'Arc est partie de là : faire une pièce qui tienne vraiment.",
  },
  {
    year: "2026",
    title: "Douze mois de travail",
    body: "Le patronage et le choix des matières ont pris plus de temps que prévu. Le résultat : le Tee Arc, sorti en série limitée.",
  },
  {
    year: "À venir",
    title: "Ensuite",
    body: "D'autres pièces techniques suivront, toujours en petite série. Pas de stock permanent, pas de réassort automatique.",
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
              Arc est née d&apos;une frustration assez simple : trop de
              t-shirts finissaient à la poubelle après quelques mois, mal
              coupés ou mal cousus dès le départ. On a voulu faire
              l&apos;inverse — des pièces techniques, taillées pour durer,
              produites en petites séries parce qu&apos;on n&apos;a ni
              l&apos;envie ni les moyens de stocker ce qu&apos;on ne vendra
              pas.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.12} y={16}>
            <div className="hero-gradient flex aspect-square items-center justify-center border border-line bg-surface">
              <Mark className="relative z-10 h-20 w-20 text-ink/70" />
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
          <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
            {TIMELINE.map((step, index) => (
              <ScrollReveal key={step.year} delay={index * 0.1} className="border-t border-ink/20 pt-5">
                <p className="font-mono text-sm tabular-nums text-accent">
                  {step.year}
                </p>
                <h3 className="mt-2 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
