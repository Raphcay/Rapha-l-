"use client";

import Link from "next/link";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useState } from "react";
import { Mark } from "./Mark";
import { MagneticButton } from "./MagneticButton";

const LINKS = [
  { href: "/collection", label: "Collection" },
  { href: "/a-propos", label: "À propos" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const [compact, setCompact] = useState(false);
  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setCompact(latest > 40);
  });

  const transitionClass = shouldReduceMotion
    ? ""
    : "transition-all duration-300 ease-out";

  return (
    <header className={`sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur ${transitionClass}`}>
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8 ${transitionClass} ${
          compact ? "py-2.5" : "py-4"
        }`}
      >
        <Link
          href="/"
          className={`flex items-center gap-2.5 font-display uppercase tracking-wide ${transitionClass} ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          <Mark className={`${transitionClass} ${compact ? "h-5 w-5" : "h-6 w-6"}`} />
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
        <MagneticButton>
          <Link
            href="/collection"
            className={`block border border-ink font-mono text-[10px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent ${transitionClass} ${
              compact ? "px-3.5 py-1.5" : "px-4 py-2"
            }`}
          >
            Boutique
          </Link>
        </MagneticButton>
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
