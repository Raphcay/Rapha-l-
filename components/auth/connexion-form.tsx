"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";

export function ConnexionForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="space-y-5">
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
          className="mt-1 w-full rounded-md border border-ligne bg-surface px-3 py-2 text-encre outline-none focus:border-corail"
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
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-ligne bg-surface px-3 py-2 text-encre outline-none focus:border-corail"
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-corail px-4 py-2.5 text-sm font-semibold text-ivoire hover:bg-corail-dark disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center text-sm text-ardoise">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-encre underline">
          Essai gratuit
        </Link>
      </p>
    </form>
  );
}
