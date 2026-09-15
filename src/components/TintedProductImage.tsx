import Image from "next/image";

type TintedProductImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
};

export function TintedProductImage({ src, alt, priority }: TintedProductImageProps) {
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
    </div>
  );
}
