"use client";

import Link from "next/link";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useState } from "react";
import { Mark } from "./Mark";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/collection", label: "Boutique" },
  { href: "/a-propos", label: "À propos" },
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
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur ${transitionClass} ${
        compact ? "border-line bg-bg/95" : "border-line/40 bg-bg/50"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8 ${transitionClass} ${
          compact ? "py-2.5" : "py-4"
        }`}
      >
        <Link
          href="/"
          className={`flex items-center gap-2.5 font-display tracking-wide ${transitionClass} ${
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
      </div>
      <nav className="flex gap-6 overflow-x-auto border-t border-line/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted sm:hidden">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
