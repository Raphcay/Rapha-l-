import Image from "next/image";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-playfair",
});

// Isolated mockup — not wired into the real site. Option B: full pivot
// toward a warm, preppy/heritage look (Ralph Lauren direction) — cream
// background, navy ink, a serif display face, classic-fit language.
export default function PreviewStyleB() {
  return (
    <div
      className={`${playfair.variable} min-h-screen`}
      style={{ background: "#f4efe4", color: "#1c2a45" }}
    >
      <div
        className="fixed bottom-4 left-4 z-40 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] backdrop-blur-sm"
        style={{ borderColor: "#c9bda2", background: "rgba(244,239,228,0.9)", color: "#6b5f4c" }}
      >
        Preview — Option B : refonte direction artistique
      </div>

      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-24 sm:flex-row sm:gap-16">
        <div className="relative aspect-[4/5] w-full max-w-sm shrink-0">
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(60% 55% at 50% 42%, #ffffff, #ece4d3 72%)",
            }}
          />
          <Image
            src="/products/arc-tee-front.png"
            alt="Tee Arc"
            fill
            priority
            className="object-contain object-center p-10"
          />
          <div
            className="absolute inset-0"
            style={{ boxShadow: "inset 0 0 0 1px #c9bda2" }}
            aria-hidden="true"
          />
        </div>

        <div className="max-w-lg text-center sm:text-left">
          <p
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{ color: "#8a7a5c" }}
          >
            Arc — La collection essentielle
          </p>
          <h1
            className="mt-4 text-5xl leading-[1.05] sm:text-6xl"
            style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
          >
            L&apos;élégance de l&apos;essentiel.
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed" style={{ color: "#4b4536" }}>
            Un t-shirt pensé comme une pièce de vestiaire, pas comme un
            basique jetable. Coupe classique ajustée, coton premium, fini
            pour traverser les saisons.
          </p>
          <p
            className="mt-8 text-[11px] uppercase tracking-[0.14em]"
            style={{ color: "#8a7a5c" }}
          >
            Coupe classique ajustée · 100% coton premium 220g/m² ·
            Confectionné avec soin
          </p>
          <Link
            href="/preview-style-b"
            className="mt-10 inline-block border px-6 py-3 text-[11px] uppercase tracking-[0.14em] transition-colors"
            style={{ borderColor: "#1c2a45", color: "#1c2a45" }}
          >
            Découvrir la collection
          </Link>
        </div>
      </section>
    </div>
  );
}
