// Simplified line-art echo of the full badge logo (twin peaks, a sun/moon
// resting in the gap between them, a horizon line below) — small enough to
// read at 20px in the nav, unlike the illustrated badge itself. The full
// badge lives at public/brand/la-rue-des-notres-logo.webp for places with
// room to show it properly (about page, favicon-adjacent marketing use).
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="16" r="9" stroke="currentColor" strokeWidth="6" />
      <path
        d="M8 78 L32 32 L50 52 L68 22 L92 78"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M4 82 L96 82" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
