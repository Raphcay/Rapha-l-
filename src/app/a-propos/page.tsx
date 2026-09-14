import type { Metadata } from "next";
import { Mark } from "@/components/Mark";

export const metadata: Metadata = {
  title: "À propos",
  description: "L'histoire et les intentions derrière Arc.",
};

const TIMELINE = [
  {
    year: "2025",
    title: "Le constat",
    body: "Trop de t-shirts basiques, mal coupés, produits en masse et jetés vite. Arc part d'une frustration simple : vouloir une pièce qui dure.",
  },
  {
    year: "2026",
    title: "Le premier drop",
    body: "Un an de travail sur le patronage et le choix des matières pour sortir une première pièce : le Tee Arc, en série limitée.",
  },
  {
    year: "À venir",
    title: "La suite",
    body: "De nouvelles pièces techniques, toujours produites en petite série, jamais en stock permanent.",
  },
];

export default function AProposPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid items-start gap-12 md:grid-cols-[1fr_0.7fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              À propos
            </p>
            <h1 className="mt-2 max-w-[18ch] text-balance font-display text-4xl italic sm:text-5xl">
              Construire des vêtements qui méritent d&apos;être gardés.
            </h1>
            <p className="mt-6 max-w-[54ch] text-[15px] leading-relaxed text-muted">
              Arc est née d&apos;une conviction simple : un vêtement du quotidien
              ne devrait pas être jetable. Nous dessinons des pièces
              techniques, taillées pour durer, produites en petites séries
              pour rester exigeants sur chaque étape — de la matière au
              dernier point de couture.
            </p>
          </div>
          <div className="flex aspect-square items-center justify-center border border-line bg-surface">
            <Mark className="h-20 w-20 text-ink/70" />
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            Parcours
          </p>
          <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
            {TIMELINE.map((step) => (
              <div key={step.year} className="border-t border-ink/20 pt-5">
                <p className="font-mono text-sm tabular-nums text-accent">
                  {step.year}
                </p>
                <h3 className="mt-2 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
