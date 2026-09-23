import type { Metadata } from "next";
import { CONTACT_EMAIL_DISPLAY, CONTACT_EMAIL_REAL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente du site Arc.",
  alternates: { canonical: "/conditions-generales" },
  robots: { index: false, follow: true },
};

export default function ConditionsGeneralesPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        Avant de commander
      </p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">
        Conditions générales de vente
      </h1>

      <p className="mt-6 text-[15px] leading-relaxed text-muted">
        Le paiement en ligne n&apos;est pas encore actif sur ce site. Les
        précommandes se font directement par email ou via le formulaire de
        contact, et sont confirmées individuellement avant tout règlement.
      </p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted">
        <div>
          <h2 className="font-display text-lg text-ink">Produits et prix</h2>
          <p className="mt-2">
            Les prix affichés sont en euros, toutes taxes comprises. Chaque
            pièce est produite en petite série et numérotée — une fois un
            coloris épuisé, il n&apos;est pas systématiquement reconduit à
            l&apos;identique.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">Précommande</h2>
          <p className="mt-2">
            Une précommande passée via {CONTACT_EMAIL_DISPLAY} n&apos;engage
            ni paiement immédiat ni obligation d&apos;achat tant qu&apos;elle
            n&apos;a pas été confirmée par échange direct avec {SITE_NAME}.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">
            Livraison et retours
          </h2>
          <p className="mt-2">
            Les délais et frais de livraison sont communiqués au moment de
            la confirmation de commande. Le droit de rétractation de 14
            jours prévu par le Code de la consommation s&apos;applique à
            toute vente à distance conclue avec un particulier.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">Contact</h2>
          <p className="mt-2">
            Pour toute question sur une commande en cours, écris à{" "}
            <a
              href={`mailto:${CONTACT_EMAIL_REAL}`}
              className="text-ink underline decoration-line underline-offset-4 hover:text-accent"
            >
              {CONTACT_EMAIL_DISPLAY}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
