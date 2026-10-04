"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { Mark } from "./Mark";
import { useCart } from "./CartProvider";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/collection", label: "Boutique" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

// `motion-reduce:` (a CSS media query) instead of a JS useReducedMotion()
// check: the JS hook resolves to null on the server and the very first
// client render, then true/false once mounted — building a className from
// it caused a real hydration mismatch. The CSS variant reads the same
// media query but purely in CSS, so server and client markup always match.
const TRANSITION = "transition-all duration-300 ease-out motion-reduce:transition-none";

const ICON_CLASS = "relative flex h-9 w-9 items-center justify-center text-muted transition-colors hover:text-ink";

// Search, account and cart as icons, with the cart count as a small badge.
function NavIcons({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      <Link href="/recherche" aria-label="Rechercher" title="Rechercher" className={ICON_CLASS}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </Link>
      <Link href="/compte" aria-label="Mon compte" title="Mon compte" className={ICON_CLASS}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </svg>
      </Link>
      <Link href="/panier" aria-label={`Panier, ${count} pièce${count > 1 ? "s" : ""}`} title="Panier" className={ICON_CLASS}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 8h14l-1 13H6L5 8z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
        {count > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center bg-accent px-1 font-mono text-[9px] leading-none text-bg">
            {count}
          </span>
        )}
      </Link>
    </div>
  );
}

export function Nav() {
  const [compact, setCompact] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const { count } = useCart();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setCompact(latest > 40);
  });

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur ${TRANSITION} ${
        compact ? "border-line bg-bg/95" : "border-line/40 bg-bg/50"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8 ${TRANSITION} ${
          compact ? "py-2.5" : "py-4"
        }`}
      >
        <Link
          href="/"
          className={`flex items-center gap-2.5 font-display tracking-wide ${TRANSITION} ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          <Mark className={`${TRANSITION} ${compact ? "h-5 w-5" : "h-6 w-6"}`} />
          ARC
        </Link>
        <nav className="hidden gap-8 font-mono text-[11px] uppercase tracking-[0.12em] sm:flex">
          {LINKS.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative pb-0.5 transition-colors hover:text-ink ${
                  isActive ? "text-ink" : "text-muted"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-2 h-px bg-accent" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>
        <NavIcons count={count} />
      </div>
      <nav className="flex gap-6 overflow-x-auto border-t border-line/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] sm:hidden">
        {LINKS.map((link) => {
          const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`whitespace-nowrap ${isActive ? "text-ink" : "text-muted"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
