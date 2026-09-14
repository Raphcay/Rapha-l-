import { Mark } from "./Mark";
import type { Product } from "@/data/products";

const TONE_STYLES: Record<Product["tone"], string> = {
  night: "bg-[#e3e0d5] text-[#c7c2b2]",
  raw: "bg-[#efece4] text-[#d6d1c2]",
  clay: "bg-[#ece4d7] text-[#d9c9ad]",
  steel: "bg-[#e6e7df] text-[#c9cabf]",
};

export function ProductVisual({ product }: { product: Product }) {
  return (
    <div
      className={`relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden ${TONE_STYLES[product.tone]}`}
    >
      <Mark className="h-16 w-16 opacity-70" />
      <span
        className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.12em]"
        style={{ color: "var(--muted)" }}
      >
        Visuel à venir
      </span>
      <span
        className="absolute right-3 top-3 h-3 w-3 rounded-full ring-1 ring-black/10"
        style={{ backgroundColor: product.colorHex }}
        aria-hidden="true"
      />
    </div>
  );
}
