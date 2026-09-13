"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/lib/actions/auth";

export function InscriptionForm() {
  const [state, formAction, pending] = useActionState(signupAction, null);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="businessName"
          className="block text-sm font-medium text-encre"
        >
          Nom de ton entreprise
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          placeholder="Ex. Sport & Maison"
          className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-corail"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-encre">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-corail"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-encre"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-corail"
        />
        <p className="mt-1 text-xs text-ardoise">8 caractères minimum.</p>
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-corail px-4 py-2.5 text-sm font-semibold text-ivoire hover:bg-corail-dark disabled:opacity-60"
      >
        {pending ? "Création du compte…" : "Créer mon compte gratuitement"}
      </button>

      <p className="text-center text-sm text-ardoise">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-medium text-encre underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
