import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ligne bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/tableau-de-bord" className="font-serif text-lg font-semibold text-encre">
            Sprix
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-ardoise">
            <Link href="/tableau-de-bord" className="hover:text-encre">
              Tableau de bord
            </Link>
            <Link href="/questionnaire" className="hover:text-encre">
              Questionnaire
            </Link>
            <Link href="/demandes" className="hover:text-encre">
              Demandes
            </Link>
            <Link href="/parametres" className="hover:text-encre">
              Réglages
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="hover:text-encre">
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
