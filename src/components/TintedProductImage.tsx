import Image from "next/image";

type TintedProductImageProps = {
  src: string;
  alt: string;
  colorHex: string;
  priority?: boolean;
};

// Tints a white-garment product photo toward another colorway entirely in
// CSS: the color layer is clipped to the photo's own alpha silhouette
// (mask-image) and multiplied over it, so only the garment pixels shift —
// the transparent background stays untouched. Skipped for the white
// colorway itself, where the real photo needs no adjustment.
export function TintedProductImage({ src, alt, colorHex, priority }: TintedProductImageProps) {
  const isWhite = colorHex.toLowerCase() === "#fefefe";

  return (
    <div className="absolute inset-0">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px"
        className="object-contain"
        priority={priority}
      />
      {!isWhite && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: colorHex,
            mixBlendMode: "multiply",
            WebkitMaskImage: `url(${src})`,
            maskImage: `url(${src})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
