import Image from "next/image";
import type { Product } from "@/data/products";

// Plain product photo for listings: no overlay, no hotspots.
export function ProductVisual({ product, priority }: { product: Product; priority?: boolean }) {
  return (
    <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-surface">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(60% 55% at 50% 42%, var(--surface-raised), var(--surface) 72%)",
        }}
        aria-hidden="true"
      />
      <div className="relative h-[80%] w-[80%]">
        <Image
          src={product.images.front}
          alt={`${product.name} ${product.colorName}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain"
          priority={priority}
        />
      </div>
    </div>
  );
}
