import type { Metadata } from "next";
import { CONTACT_EMAIL_DISPLAY, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Arc.",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: false, follow: true },
};

export default function MentionsLegalesPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        Informations légales
      </p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">Mentions légales</h1>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted">
        <div>
          <h2 className="font-display text-lg text-ink">Éditeur du site</h2>
          <p className="mt-2">
            {SITE_NAME} — [forme juridique et numéro SIRET à compléter avant
            mise en ligne définitive]
            <br />
            [Adresse du siège à compléter]
            <br />
            Contact : {CONTACT_EMAIL_DISPLAY}
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">Directeur de publication</h2>
          <p className="mt-2">[Nom du responsable de publication à compléter]</p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">Hébergement</h2>
          <p className="mt-2">
            Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723,
            États-Unis
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">Propriété intellectuelle</h2>
          <p className="mt-2">
            L&apos;ensemble des contenus présents sur ce site (textes, images,
            logo, identité visuelle) est la propriété de {SITE_NAME}, sauf
            mention contraire. Toute reproduction sans autorisation préalable
            est interdite.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">Données personnelles</h2>
          <p className="mt-2">
            Le traitement des données transmises via le formulaire de contact
            est détaillé dans notre{" "}
            <a
              href="/confidentialite"
              className="text-ink underline decoration-line underline-offset-4 hover:text-accent"
            >
              politique de confidentialité
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
