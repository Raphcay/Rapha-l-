"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction } from "@/lib/actions/account";

export function DeleteAccountForm() {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccountAction, null);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-red-700 hover:underline"
      >
        Supprimer mon compte
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <label className="block text-sm font-medium text-encre">
        Confirme ton mot de passe pour continuer
      </label>
      <input
        type="password"
        name="password"
        required
        className="w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-red-400"
      />
      {state?.error && (
        <p className="text-sm text-red-700">{state.error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
        >
          {pending ? "Suppression…" : "Confirmer la suppression"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm font-medium text-ardoise hover:text-encre"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
