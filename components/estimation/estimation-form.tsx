"use client";

import { useMemo, useState, useActionState } from "react";
import { computeEstimate, formatPrice } from "@/lib/pricing";
import { submitLeadAction } from "@/lib/actions/leads";

type Option = {
  id: string;
  label: string;
  priceDeltaMin: number;
  priceDeltaMax: number;
};

type Question = {
  id: string;
  label: string;
  options: Option[];
};

export function EstimationForm({
  slug,
  basePriceMin,
  basePriceMax,
  questions,
}: {
  slug: string;
  basePriceMin: number;
  basePriceMax: number;
  questions: Question[];
}) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState(submitLeadAction, null);

  const selectedOptions = useMemo(
    () =>
      questions
        .map((q) => q.options.find((o) => o.id === selections[q.id]))
        .filter((o): o is Option => Boolean(o)),
    [questions, selections]
  );

  const estimate = useMemo(
    () => computeEstimate(basePriceMin, basePriceMax, selectedOptions),
    [basePriceMin, basePriceMax, selectedOptions]
  );

  const allAnswered = questions.every((q) => selections[q.id]);

  if (state?.status === "success") {
    return (
      <div className="rounded-lg border border-ligne bg-surface p-8 text-center">
        <p className="font-serif text-xl font-semibold text-encre">
          Merci, ta demande est envoyée.
        </p>
        <p className="mt-2 text-ardoise">
          Fourchette estimée :{" "}
          <span className="font-semibold text-encre">
            {formatPrice(state.min)} – {formatPrice(state.max)}
          </span>
          . Tu recevras un devis précis rapidement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-4 rounded-lg border border-ligne bg-surface px-5 py-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-ardoise">
          Ta fourchette estimée
        </p>
        <p className="mt-1 font-serif text-2xl font-semibold text-corail">
          {formatPrice(estimate.min)} – {formatPrice(estimate.max)}
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <fieldset
            key={question.id}
            className="rounded-lg border border-ligne bg-surface p-5"
          >
            <legend className="px-1 font-medium text-encre">
              {question.label}
            </legend>
            <div className="mt-3 space-y-2">
              {question.options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-ligne px-3 py-2 has-[:checked]:border-corail has-[:checked]:bg-corail/5"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={selections[question.id] === option.id}
                    onChange={() =>
                      setSelections((prev) => ({
                        ...prev,
                        [question.id]: option.id,
                      }))
                    }
                    className="accent-corail"
                  />
                  <span className="text-sm text-encre">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {allAnswered && (
        <form
          action={formAction}
          className="space-y-4 rounded-lg border border-ligne bg-surface p-6"
        >
          <input type="hidden" name="slug" value={slug} />
          <input
            type="hidden"
            name="answersJson"
            value={JSON.stringify(selections)}
          />

          <h2 className="font-serif text-lg font-semibold text-encre">
            Reçois ton devis précis
          </h2>

          <div>
            <label className="block text-sm font-medium text-encre">
              Nom
            </label>
            <input
              type="text"
              name="contactName"
              required
              className="mt-1 w-full rounded-md border border-ligne bg-surface px-3 py-2 text-encre outline-none focus:border-corail"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-encre">
              E-mail
            </label>
            <input
              type="email"
              name="contactEmail"
              required
              className="mt-1 w-full rounded-md border border-ligne bg-surface px-3 py-2 text-encre outline-none focus:border-corail"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-encre">
              Téléphone
            </label>
            <input
              type="tel"
              name="contactPhone"
              required
              className="mt-1 w-full rounded-md border border-ligne bg-surface px-3 py-2 text-encre outline-none focus:border-corail"
            />
          </div>

          {state?.status === "error" && (
            <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-corail px-4 py-2.5 text-sm font-semibold text-ivoire hover:bg-corail-dark disabled:opacity-60"
          >
            {pending ? "Envoi…" : "Recevoir mon devis précis"}
          </button>
        </form>
      )}
    </div>
  );
}
