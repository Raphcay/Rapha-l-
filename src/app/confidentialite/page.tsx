import type { Metadata } from "next";
import { CONTACT_EMAIL_DISPLAY, CONTACT_EMAIL_REAL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Arc traite les données transmises sur ce site.",
  alternates: { canonical: "/confidentialite" },
  robots: { index: false, follow: true },
};

export default function ConfidentialitePage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        Vie privée
      </p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">
        Politique de confidentialité
      </h1>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted">
        <div>
          <h2 className="font-display text-lg text-ink">
            Quelles données on collecte
          </h2>
          <p className="mt-2">
            Le formulaire de la page contact demande un nom, une adresse
            email et un message. Ces informations sont transmises par email
            à {SITE_NAME} pour répondre à la demande — elles ne sont ni
            vendues, ni partagées avec un tiers à des fins commerciales.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">
            L&apos;assistant de discussion
          </h2>
          <p className="mt-2">
            Les messages échangés avec l&apos;assistant du site sont envoyés à
            l&apos;API de Google (Gemini) pour générer une réponse. Ils ne
            sont pas conservés par {SITE_NAME} au-delà de la session de
            discussion en cours.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">Cookies et mesure d&apos;audience</h2>
          <p className="mt-2">
            Ce site n&apos;utilise pas de cookies publicitaires ni de
            traceurs tiers à des fins de profilage. Aucun outil d&apos;analytics
            n&apos;est actuellement installé.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">Hébergement</h2>
          <p className="mt-2">
            Le site est hébergé par Vercel Inc. (États-Unis). Les données de
            navigation transitent par leur infrastructure dans le cadre
            normal de la fourniture du service.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">
            Droits d&apos;accès et de suppression
          </h2>
          <p className="mt-2">
            Pour toute question sur les données te concernant, ou pour
            demander leur suppression, écris à{" "}
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
