import Link from "next/link";
import { Mark } from "./Mark";

const LINKS = [
  { href: "/collection", label: "Collection" },
  { href: "/a-propos", label: "À propos" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-lg uppercase tracking-wide"
        >
          <Mark className="h-6 w-6" />
          Arc
        </Link>
        <nav className="hidden gap-8 font-mono text-[11px] uppercase tracking-[0.12em] text-muted sm:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/collection"
          className="border border-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent"
        >
          Boutique
        </Link>
      </div>
      <nav className="flex gap-6 overflow-x-auto border-t border-line px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted sm:hidden">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
