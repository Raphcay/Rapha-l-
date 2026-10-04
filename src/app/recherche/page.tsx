import type { Metadata } from "next";
import { SearchPanel } from "@/components/SearchPanel";

export const metadata: Metadata = {
  title: "Recherche",
  description: "Trouve un coloris, une page ou un article sur ARC.",
  robots: { index: false },
};

export default function RecherchePage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Recherche</p>
      <h1 className="sr-only">Rechercher sur ARC</h1>
      <div className="mt-6">
        <SearchPanel />
      </div>
    </section>
  );
}
