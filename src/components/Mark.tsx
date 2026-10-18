import Image from "next/image";

// The actual badge logo (public/brand/la-rue-des-notres-logo.webp), not a
// redrawn interpretation — cropped to a circle so it reads as a small badge
// in the nav/footer/chat widget instead of showing the square canvas it
// sits on. The full square version (with its own margin) is used as-is on
// /a-propos, where there's room for it.
export function Mark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full ${className}`}
      aria-hidden="true"
    >
      <Image
        src="/brand/la-rue-des-notres-logo.webp"
        alt=""
        fill
        sizes="48px"
        className="scale-[1.12] object-cover"
      />
    </span>
  );
}
