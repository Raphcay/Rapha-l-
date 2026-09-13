import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex-1">
      <header className="border-b border-ligne">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-serif text-xl font-semibold">Estimation</span>
          <nav className="flex items-center gap-6">
            <Link
              href="/connexion"
              className="text-sm font-medium text-ardoise hover:text-encre"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="rounded-md bg-corail px-4 py-2 text-sm font-semibold text-ivoire hover:bg-corail-dark"
            >
              Essai gratuit
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
          <h1 className="font-serif text-4xl font-semibold leading-tight text-encre sm:text-5xl">
            Donne un prix à tes visiteurs avant qu&apos;ils ferment
            l&apos;onglet.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ardoise">
            Estimation affiche une fourchette de prix immédiate sur ton site,
            à partir de quelques questions. Tu ne reçois plus que des
            demandes déjà qualifiées, classées par montant.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/inscription"
              className="rounded-md bg-corail px-6 py-3 text-base font-semibold text-ivoire hover:bg-corail-dark"
            >
              Essayer gratuitement, sans carte bancaire
            </Link>
            <span className="text-sm text-ardoise">
              14 jours d&apos;essai · configuration en moins de 3 minutes
            </span>
          </div>
        </section>

        {/* Douleur */}
        <section className="border-t border-ligne bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <p className="font-serif text-2xl leading-snug text-encre sm:text-3xl">
              Le calcul est simple : un visiteur qui ne trouve pas de prix va
              voir ailleurs en quelques secondes. Celui qui reste, tu le
              chiffres à la main — souvent pour un devis qui n&apos;aboutira
              jamais.
            </p>
          </div>
        </section>

        {/* Bénéfices */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-3">
            <BenefitCard
              title="Une réponse immédiate"
              text="Le visiteur voit sa fourchette de prix tout de suite, sans attendre un rappel ou un e-mail."
            />
            <BenefitCard
              title="Moins de devis pour rien"
              text="Tu ne chiffres en détail que les demandes qui ont déjà vu le prix et qui sont toujours là."
            />
            <BenefitCard
              title="Des demandes classées"
              text="Chaque demande arrive triée par montant estimé : tu sais où mettre ton énergie en premier."
            />
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="border-t border-ligne bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-center font-serif text-2xl font-semibold text-encre">
              Trois étapes, une seule fois
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <StepCard
                number="1"
                title="Configure tes questions"
                text="Tu indiques les critères qui font varier ton prix et l'écart que chacun ajoute."
              />
              <StepCard
                number="2"
                title="Partage ton lien"
                text="Tu ajoutes le lien ou le bouton sur ton site, tes réseaux ou tes devis."
              />
              <StepCard
                number="3"
                title="Reçois des demandes triées"
                text="Chaque visiteur qui va au bout te laisse ses coordonnées, classées par montant."
              />
            </div>
          </div>
        </section>

        {/* Preuve sociale (placeholder) */}
        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-ardoise">
            Pensé avec des pros de l&apos;équipement sportif à domicile
          </p>
          <blockquote className="mt-6 font-serif text-xl text-encre">
            « J&apos;arrête de chiffrer des demandes qui n&apos;aboutissent
            jamais. Le prix est déjà donné avant que la personne me
            contacte. »
          </blockquote>
          <p className="mt-3 text-sm text-ardoise">
            — Un installateur d&apos;équipements sportifs à domicile
          </p>
        </section>

        {/* CTA final */}
        <section className="border-t border-ligne bg-encre">
          <div className="mx-auto max-w-2xl px-6 py-16 text-center">
            <h2 className="font-serif text-2xl font-semibold text-ivoire sm:text-3xl">
              Arrête de chiffrer des demandes qui n&apos;aboutiront jamais.
            </h2>
            <div className="mt-8">
              <Link
                href="/inscription"
                className="inline-block rounded-md bg-corail px-6 py-3 text-base font-semibold text-ivoire hover:bg-corail-dark"
              >
                Essayer gratuitement
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ligne">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-ardoise">
          Estimation — l&apos;estimation immédiate pour les pros du sport.
        </div>
      </footer>
    </div>
  );
}

function BenefitCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-ligne bg-white p-6">
      <h3 className="font-serif text-lg font-semibold text-encre">{title}</h3>
      <p className="mt-2 text-sm text-ardoise">{text}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-corail font-serif text-base font-semibold text-ivoire">
        {number}
      </div>
      <h3 className="mt-4 font-serif text-base font-semibold text-encre">
        {title}
      </h3>
      <p className="mt-2 text-sm text-ardoise">{text}</p>
    </div>
  );
}
