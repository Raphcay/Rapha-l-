"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { MagneticButton } from "./MagneticButton";
import { ScrollReveal } from "./ScrollReveal";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Parallax: the background drifts slower than the page as you scroll past
  // the hero.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? ["0%", "0%"] : ["0%", "26%"],
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[80vh] min-h-[560px] max-h-[760px] items-center justify-center overflow-hidden"
    >
      <motion.div className="absolute inset-0 scale-[1.2]" style={{ y: backgroundY }}>
        <Image
          src="/hero-mountain.jpg"
          alt="Sommet montagneux dans la brume, en noir et blanc"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,6,7,0.55) 0%, rgba(6,6,7,0.25) 30%, rgba(6,6,7,0.35) 70%, rgba(6,6,7,0.6) 100%)",
        }}
        aria-hidden="true"
      />

      <ScrollReveal className="relative z-10 flex flex-col items-center px-5 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/80">
          Arc — Première collection
        </p>
        <h1 className="mt-5 text-balance font-display text-[13vw] leading-[1.02] sm:text-6xl md:text-7xl">
          Plus qu&apos;un style,
          <br />
          une identité.
        </h1>
        <MagneticButton className="mt-9">
          <Link
            href="/collection"
            className="block border border-ink/80 bg-bg/20 px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
          >
            Découvrir
          </Link>
        </MagneticButton>
      </ScrollReveal>
    </section>
  );
}
