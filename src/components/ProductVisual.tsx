import { TShirtIllustration } from "./TShirtIllustration";
import type { Product } from "@/data/products";

export function ProductVisual({ product }: { product: Product }) {
  return (
    <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-surface">
      <div className="absolute bottom-[14%] h-4 w-[55%] rounded-full bg-ink/10 blur-md" aria-hidden="true" />
      <div className="relative h-[72%] w-[72%]">
        <TShirtIllustration product={product} />
      </div>
      <span
        className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.12em]"
        style={{ color: "var(--muted)" }}
      >
        Rendu illustré
      </span>
      <span
        className="absolute right-3 top-3 h-3 w-3 rounded-full ring-1 ring-black/10"
        style={{ backgroundColor: product.colorHex }}
        aria-hidden="true"
      />
    </div>
  );
}
