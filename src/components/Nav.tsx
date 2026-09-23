"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { Mark } from "./Mark";

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

export function Nav() {
  const [compact, setCompact] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();

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
          Arc
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
