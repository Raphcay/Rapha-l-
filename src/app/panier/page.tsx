import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Panier",
  description: "Les pièces ARC que tu as choisies.",
  robots: { index: false },
};

export default function PanierPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Panier</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Ton panier</h1>
      <div className="mt-12">
        <CartView />
      </div>
    </section>
  );
}
