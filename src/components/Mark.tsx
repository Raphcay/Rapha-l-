import Image from "next/image";

// The actual logo's icon (mountains, sun, reflection — no wordmark text,
// which doesn't read at nav/favicon size), with its cream background
// removed so the ink sits directly on the page instead of inside a white
// circle or box, and recolored from navy to the site's light "ink" tone so
// it reads against the dark nav/footer/chat widget. Isolated from the real
// file, not redrawn — see scripts/crop-logo-icon.py and the recolor step
// documented in README.md.
export function Mark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} aria-hidden="true">
      <Image
        src="/brand/la-rue-des-notres-icon-light.png"
        alt=""
        fill
        sizes="48px"
        className="object-contain"
      />
    </span>
  );
}
