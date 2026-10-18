import Image from "next/image";

// The actual logo's icon (mountains, sun, reflection — no wordmark text,
// which doesn't read at nav/favicon size), cropped from the real file
// (public/brand/la-rue-des-notres-logo.webp) via scripts/crop-logo-icon.py,
// not redrawn. The full wide logo (icon + wordmark) is used as-is on
// /a-propos, where there's room for it.
export function Mark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full ${className}`}
      aria-hidden="true"
    >
      <Image
        src="/brand/la-rue-des-notres-icon.png"
        alt=""
        fill
        sizes="48px"
        className="scale-[1.15] object-cover"
      />
    </span>
  );
}
