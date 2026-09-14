import Link from "next/link";
import { Mark } from "./Mark";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 font-display text-lg uppercase tracking-wide">
            <Mark className="h-6 w-6" />
            Arc
          </div>
          <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-muted">
            Vêtements techniques conçus pour la ville. Première collection :
            des t-shirts pensés comme du matériel.
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            Navigation
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/collection" className="hover:text-accent">Collection</Link></li>
            <li><Link href="/a-propos" className="hover:text-accent">À propos</Link></li>
            <li><Link href="/journal" className="hover:text-accent">Journal</Link></li>
            <li><Link href="/contact" className="hover:text-accent">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            Suivre
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent"
              >
                Instagram
              </a>
            </li>
            <li>
              <a href="mailto:contact@arc-wear.com" className="hover:text-accent">
                contact@arc-wear.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-5 py-5 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          © {new Date().getFullYear()} Arc — Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
