import Link from "next/link";
import { Mark } from "@/components/Mark";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
      <Mark className="h-10 w-10 text-ink/30" />
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Erreur 404
      </p>
      <h1 className="mt-3 max-w-[20ch] text-balance font-display text-3xl leading-[1.1] sm:text-4xl">
        Cette page n&apos;existe pas, ou plus.
      </h1>
      <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted">
        Le lien est peut-être mort, ou la page a été déplacée. Voici deux
        endroits où continuer.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="border border-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/collection"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted underline decoration-line underline-offset-4 hover:text-ink"
        >
          Voir la collection →
        </Link>
      </div>
    </section>
  );
}
