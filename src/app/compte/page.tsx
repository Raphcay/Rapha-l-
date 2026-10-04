import type { Metadata } from "next";
import Link from "next/link";
import { AccountView } from "@/components/AccountView";
import { ScrollReveal } from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Ton espace client ARC : commandes, adresses, parrainage.",
  robots: { index: false },
};

// The account needs a real login backend, which is not chosen yet. This page shows the
// planned space without a fake login form.
const SECTIONS = [
  { title: "Mes commandes", body: "Le suivi de chaque commande, de la précommande à l'envoi." },
  { title: "Mes adresses", body: "Livraison et facturation, enregistrées une seule fois." },
  { title: "Mon parrainage", body: "Ton code personnel et les réductions obtenues en parrainant." },
  { title: "Mes informations", body: "Nom, email, mot de passe et préférences de communication." },
  { title: "Mes favoris", body: "Les coloris que tu veux garder sous la main." },
];

export default function ComptePage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-24">
      <ScrollReveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Compte</p>
        <h1 className="mt-3 max-w-[18ch] font-display text-4xl sm:text-6xl">Ton espace ARC.</h1>
        <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-muted">
          Connecte-toi pour retrouver tes informations. Voici ce que tu trouveras ici.
        </p>
      </ScrollReveal>

      <div className="mt-10">
        <AccountView />
      </div>

      <ul className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section, index) => (
          <ScrollReveal key={section.title} delay={index * 0.05} className="bg-bg">
            <li className="flex h-full flex-col p-7 sm:p-8">
              <p className="font-display text-2xl">{section.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{section.body}</p>
              <span className="mt-auto pt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Bientôt</span>
            </li>
          </ScrollReveal>
        ))}
      </ul>

      <p className="mt-10 text-sm text-muted">
        Une question en attendant ?{" "}
        <Link href="/contact" className="text-ink underline decoration-line underline-offset-4 hover:text-accent">
          Écris-nous
        </Link>
        .
      </p>
    </section>
  );
}
