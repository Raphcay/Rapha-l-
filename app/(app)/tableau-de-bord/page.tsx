import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { requireActiveAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function TableauDeBordPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  requireActiveAccess(user);

  const [questionCount, leadCount, newLeadCount] = await Promise.all([
    prisma.question.count({ where: { userId: user.id } }),
    prisma.lead.count({ where: { userId: user.id } }),
    prisma.lead.count({ where: { userId: user.id, status: "NEW" } }),
  ]);

  const publicUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? "") + `/e/${user.slug}`;

  if (questionCount === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-ligne bg-surface p-8 text-center">
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Bienvenue, {user.businessName}
        </h1>
        <p className="mt-3 text-ardoise">
          Il te reste une seule étape avant de pouvoir recevoir des
          demandes : configure ton questionnaire de prix.
        </p>
        <Link
          href="/questionnaire"
          className="mt-6 inline-block rounded-md bg-corail px-5 py-2.5 text-sm font-semibold text-ivoire hover:bg-corail-dark"
        >
          Configurer mon questionnaire
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Bonjour {user.businessName}
        </h1>
        <p className="mt-1 text-ardoise">
          Voici l&apos;essentiel de ton activité.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-ligne bg-surface p-6">
          <p className="text-sm text-ardoise">Nouvelles demandes</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-encre">
            {newLeadCount}
          </p>
        </div>
        <div className="rounded-lg border border-ligne bg-surface p-6">
          <p className="text-sm text-ardoise">Demandes reçues au total</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-encre">
            {leadCount}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-ligne bg-surface p-6">
        <p className="text-sm font-medium text-encre">
          Ton lien d&apos;estimation
        </p>
        <p className="mt-1 text-sm text-ardoise">
          Partage ce lien sur ton site, tes réseaux ou tes devis.
        </p>
        <code className="mt-3 block break-all rounded-md bg-ivoire px-3 py-2 text-sm text-encre">
          {publicUrl}
        </code>
      </div>

      <div className="flex gap-3">
        <Link
          href="/demandes"
          className="rounded-md border border-ligne bg-surface px-4 py-2 text-sm font-medium text-encre hover:border-encre"
        >
          Voir les demandes
        </Link>
        <Link
          href="/questionnaire"
          className="rounded-md border border-ligne bg-surface px-4 py-2 text-sm font-medium text-encre hover:border-encre"
        >
          Modifier le questionnaire
        </Link>
      </div>
    </div>
  );
}
