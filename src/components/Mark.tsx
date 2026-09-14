export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M50 8 L92 88 L66 88 L50 58 L34 88 L8 88 Z"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
