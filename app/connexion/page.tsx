import Link from "next/link";
import { ConnexionForm } from "@/components/auth/connexion-form";

export default function ConnexionPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-serif text-xl font-semibold text-encre">
          Estimation
        </Link>
        <h1 className="mt-6 font-serif text-2xl font-semibold text-encre">
          Content de te revoir
        </h1>
        <div className="mt-8">
          <ConnexionForm />
        </div>
      </div>
    </div>
  );
}
