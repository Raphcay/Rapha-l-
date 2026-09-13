import Link from "next/link";
import { InscriptionForm } from "@/components/auth/inscription-form";

export default function InscriptionPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-serif text-xl font-semibold text-encre">
          Estimation
        </Link>
        <h1 className="mt-6 font-serif text-2xl font-semibold text-encre">
          Essaie gratuitement
        </h1>
        <p className="mt-1 text-sm text-ardoise">
          14 jours d&apos;essai, sans carte bancaire.
        </p>
        <div className="mt-8">
          <InscriptionForm />
        </div>
      </div>
    </div>
  );
}
