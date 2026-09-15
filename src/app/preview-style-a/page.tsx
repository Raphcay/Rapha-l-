import Image from "next/image";
import Link from "next/link";

// Isolated mockup — not wired into the real site. Option A: keep the
// current dark/minimal visual system, but drop the streetwear vocabulary
// ("oversize", "drop", "techwear") for a calmer, classic-fit tone.
export default function PreviewStyleA() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="fixed bottom-4 left-4 z-40 border border-line bg-surface/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted backdrop-blur-sm">
        Preview — Option A : coupe + vocabulaire seuls
      </div>

      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-24 sm:flex-row sm:gap-16">
        <div className="relative aspect-[4/5] w-full max-w-sm shrink-0">
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(60% 55% at 50% 42%, var(--surface-raised), var(--bg) 72%)",
            }}
          />
          <Image
            src="/products/arc-tee-front.png"
            alt="Tee Arc"
            fill
            priority
            className="object-contain object-center p-10"
          />
        </div>

        <div className="max-w-lg text-center sm:text-left">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Arc — Première collection
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[0.95] text-ink sm:text-5xl">
            Une pièce pensée pour durer.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            Coupe ajustée, coton premium 220g. Pas une tendance qu&apos;on
            oublie dans six mois : une base qu&apos;on porte des années.
          </p>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
            Coupe ajustée classique · 100% coton premium 220g/m² · Petite
            série
          </p>
          <Link
            href="/preview-style-a"
            className="mt-10 inline-block border border-line px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Découvrir
          </Link>
        </div>
      </section>
    </div>
  );
}
