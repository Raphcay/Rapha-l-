import { getCurrentUser } from "@/lib/auth";
import { createCheckoutSessionAction, createPortalSessionAction } from "@/lib/actions/billing";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ essai?: string; abonnement?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const trialActive = user.trialEndsAt ? user.trialEndsAt > new Date() : false;
  const isActive = user.subscriptionStatus === "active";

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Réglages
        </h1>
      </div>

      {params.essai === "termine" && (
        <div className="rounded-md border border-corail/40 bg-corail/10 px-4 py-3 text-sm text-corail-dark">
          Ton essai gratuit est terminé. Abonne-toi pour continuer à
          utiliser Estimation.
        </div>
      )}
      {params.abonnement === "succes" && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Ton abonnement est actif. Merci !
        </div>
      )}

      <section className="rounded-lg border border-ligne bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-encre">
          Mon compte
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ardoise">Entreprise</dt>
            <dd className="text-encre">{user.businessName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ardoise">E-mail</dt>
            <dd className="text-encre">{user.email}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-ligne bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-encre">
          Abonnement
        </h2>

        {isActive && (
          <>
            <p className="mt-2 text-sm text-ardoise">
              Ton abonnement est actif — 45€/mois.
            </p>
            <form action={createPortalSessionAction} className="mt-4">
              <button
                type="submit"
                className="rounded-md border border-ligne px-4 py-2 text-sm font-medium text-encre hover:border-encre"
              >
                Gérer mon abonnement
              </button>
            </form>
          </>
        )}

        {!isActive && trialActive && user.trialEndsAt && (
          <>
            <p className="mt-2 text-sm text-ardoise">
              Essai gratuit jusqu&apos;au{" "}
              {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
                user.trialEndsAt
              )}
              .
            </p>
            <form action={createCheckoutSessionAction} className="mt-4">
              <button
                type="submit"
                className="rounded-md bg-corail px-4 py-2 text-sm font-semibold text-ivoire hover:bg-corail-dark"
              >
                S&apos;abonner — 45€/mois
              </button>
            </form>
          </>
        )}

        {!isActive && !trialActive && (
          <>
            <p className="mt-2 text-sm text-ardoise">
              Ton essai gratuit est terminé.
            </p>
            <form action={createCheckoutSessionAction} className="mt-4">
              <button
                type="submit"
                className="rounded-md bg-corail px-4 py-2 text-sm font-semibold text-ivoire hover:bg-corail-dark"
              >
                S&apos;abonner — 45€/mois
              </button>
            </form>
          </>
        )}
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-red-700">
          Supprimer mon compte
        </h2>
        <p className="mt-2 text-sm text-ardoise">
          Cette action supprime définitivement ton compte, ton
          questionnaire et toutes tes demandes reçues.
        </p>
        <div className="mt-4">
          <DeleteAccountForm />
        </div>
      </section>
    </div>
  );
}
