"use client";

import { useRef, useState, type ReactNode, type UIEvent } from "react";

const GAP_PX = 24;

// Horizontal slider with native touch and trackpad swipe, arrow buttons, and a progress bar.
// Slides snap into place, so one swipe moves exactly one slide.
export function Slider({
  label,
  slides,
  slideClass,
}: {
  label: string;
  slides: ReactNode[];
  slideClass: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = slides.length;

  function onScroll(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    const first = track.firstElementChild as HTMLElement | null;
    if (!first) return;
    setIndex(Math.round(track.scrollLeft / (first.offsetWidth + GAP_PX)));
  }

  function go(target: number) {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null | undefined;
    if (!track || !first) return;
    const clamped = Math.min(count - 1, Math.max(0, target));
    track.scrollTo({ left: clamped * (first.offsetWidth + GAP_PX), behavior: "smooth" });
  }

  const arrowClass =
    "flex h-11 w-11 items-center justify-center border border-line font-mono text-sm transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink";

  return (
    <div aria-label={label} role="region">
      <div className="mb-6 flex items-center gap-6">
        <div className="relative h-px flex-1 overflow-hidden bg-line" aria-hidden="true">
          <span
            className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500"
            style={{ width: `${((index + 1) / count) * 100}%` }}
          />
        </div>
        <p className="font-mono text-[11px] tabular-nums text-muted">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Précédent"
            className={arrowClass}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === count - 1}
            aria-label="Suivant"
            className={arrowClass}
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div key={i} className={`${slideClass} shrink-0 snap-start`}>
            {slide}
          </div>
        ))}
      </div>
    </div>
  );
}
