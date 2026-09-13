import { getCurrentUser } from "@/lib/auth";
import { requireActiveAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  updateBasePriceAction,
  addQuestionAction,
  updateQuestionLabelAction,
  deleteQuestionAction,
  addOptionAction,
  deleteOptionAction,
} from "@/lib/actions/questionnaire";

export default async function QuestionnairePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  requireActiveAccess(user);

  const questions = await prisma.question.findMany({
    where: { userId: user.id },
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Ton questionnaire de prix
        </h1>
        <p className="mt-1 text-ardoise">
          Le prix de départ, puis une question par critère qui fait varier ta
          fourchette.
        </p>
      </div>

      <section className="rounded-lg border border-ligne bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-encre">
          Prix de départ
        </h2>
        <p className="mt-1 text-sm text-ardoise">
          La fourchette avant toute réponse au questionnaire.
        </p>
        <form action={updateBasePriceAction} className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-ardoise">
              Minimum (€)
            </label>
            <input
              type="number"
              name="basePriceMin"
              min={0}
              defaultValue={user.basePriceMin}
              className="mt-1 w-32 rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-corail"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ardoise">
              Maximum (€)
            </label>
            <input
              type="number"
              name="basePriceMax"
              min={0}
              defaultValue={user.basePriceMax}
              className="mt-1 w-32 rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-corail"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-encre px-4 py-2 text-sm font-semibold text-ivoire hover:bg-encre/90"
          >
            Enregistrer
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-encre">
          Tes questions
        </h2>

        {questions.length === 0 && (
          <div className="rounded-lg border border-dashed border-ligne bg-white p-8 text-center text-ardoise">
            Aucune question pour l&apos;instant. Ajoute la première ci-dessous
            — par exemple « Quel type d&apos;équipement ? » ou « Quelle
            surface disponible ? ».
          </div>
        )}

        {questions.map((question) => (
          <div
            key={question.id}
            className="rounded-lg border border-ligne bg-white p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <form
                action={updateQuestionLabelAction}
                className="flex flex-1 items-center gap-2"
              >
                <input type="hidden" name="questionId" value={question.id} />
                <input
                  type="text"
                  name="label"
                  defaultValue={question.label}
                  className="flex-1 rounded-md border border-ligne bg-white px-3 py-2 font-medium text-encre outline-none focus:border-corail"
                />
                <button
                  type="submit"
                  className="rounded-md border border-ligne px-3 py-2 text-sm font-medium text-encre hover:border-encre"
                >
                  Renommer
                </button>
              </form>
              <form action={deleteQuestionAction}>
                <input type="hidden" name="questionId" value={question.id} />
                <button
                  type="submit"
                  className="text-sm font-medium text-ardoise hover:text-red-600"
                >
                  Supprimer
                </button>
              </form>
            </div>

            <div className="mt-4 space-y-2">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between rounded-md bg-ivoire px-3 py-2"
                >
                  <span className="text-sm text-encre">
                    {option.label}{" "}
                    <span className="text-ardoise">
                      ({option.priceDeltaMin >= 0 ? "+" : ""}
                      {option.priceDeltaMin}€ / {option.priceDeltaMax >= 0 ? "+" : ""}
                      {option.priceDeltaMax}€)
                    </span>
                  </span>
                  <form action={deleteOptionAction}>
                    <input type="hidden" name="optionId" value={option.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-ardoise hover:text-red-600"
                    >
                      Retirer
                    </button>
                  </form>
                </div>
              ))}
            </div>

            <form
              action={addOptionAction}
              className="mt-4 flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="questionId" value={question.id} />
              <div>
                <label className="block text-xs font-medium text-ardoise">
                  Réponse possible
                </label>
                <input
                  type="text"
                  name="label"
                  required
                  placeholder="Ex. Salle de sport complète"
                  className="mt-1 w-56 rounded-md border border-ligne bg-white px-3 py-2 text-sm text-encre outline-none focus:border-corail"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ardoise">
                  Ajoute au minimum (€)
                </label>
                <input
                  type="number"
                  name="priceDeltaMin"
                  defaultValue={0}
                  className="mt-1 w-28 rounded-md border border-ligne bg-white px-3 py-2 text-sm text-encre outline-none focus:border-corail"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ardoise">
                  Ajoute au maximum (€)
                </label>
                <input
                  type="number"
                  name="priceDeltaMax"
                  defaultValue={0}
                  className="mt-1 w-28 rounded-md border border-ligne bg-white px-3 py-2 text-sm text-encre outline-none focus:border-corail"
                />
              </div>
              <button
                type="submit"
                className="rounded-md border border-ligne px-3 py-2 text-sm font-medium text-encre hover:border-encre"
              >
                Ajouter la réponse
              </button>
            </form>
          </div>
        ))}

        <form
          action={addQuestionAction}
          className="flex items-end gap-2 rounded-lg border border-dashed border-ligne bg-white p-6"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium text-ardoise">
              Nouvelle question
            </label>
            <input
              type="text"
              name="label"
              required
              placeholder="Ex. Quelle surface disponible ?"
              className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-corail"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-corail px-4 py-2 text-sm font-semibold text-ivoire hover:bg-corail-dark"
          >
            Ajouter la question
          </button>
        </form>
      </section>
    </div>
  );
}
