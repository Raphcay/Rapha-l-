import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EstimationForm } from "@/components/estimation/estimation-form";

export default async function EstimationPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { slug },
    include: { questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } } },
  });

  if (!user) {
    notFound();
  }

  if (user.questions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-center text-ardoise">
          {user.businessName} n&apos;a pas encore configuré son
          questionnaire de prix.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-ardoise">
          {user.businessName}
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-encre sm:text-3xl">
          Estime le prix de ton projet
        </h1>
        <p className="mt-2 text-ardoise">
          Réponds à quelques questions pour voir une fourchette de prix
          immédiatement.
        </p>

        <div className="mt-8">
          <EstimationForm
            slug={user.slug}
            basePriceMin={user.basePriceMin}
            basePriceMax={user.basePriceMax}
            questions={user.questions.map((q) => ({
              id: q.id,
              label: q.label,
              options: q.options.map((o) => ({
                id: o.id,
                label: o.label,
                priceDeltaMin: o.priceDeltaMin,
                priceDeltaMax: o.priceDeltaMax,
              })),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
