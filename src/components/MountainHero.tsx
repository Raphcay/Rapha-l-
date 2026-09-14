const STARS = [
  [120, 60, 1.4], [260, 110, 1], [340, 50, 1.2], [480, 90, 0.9], [620, 40, 1.3],
  [760, 100, 1], [900, 60, 1.4], [1040, 120, 0.9], [1180, 50, 1.2], [1320, 90, 1],
  [1460, 45, 1.3], [80, 160, 0.8], [400, 150, 0.8], [980, 160, 0.8], [1250, 140, 1],
];

export function MountainHero() {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0a0a0d" />
          <stop offset="55%" stopColor="#111114" />
          <stop offset="100%" stopColor="#1c1c1f" />
        </linearGradient>
        <linearGradient id="water" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#131315" />
          <stop offset="100%" stopColor="#0a0a0c" />
        </linearGradient>
        <linearGradient id="peakFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#232327" />
          <stop offset="100%" stopColor="#131315" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="1600" height="900" fill="url(#sky)" />

      {/* Stars */}
      {STARS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#f3f1ea" opacity="0.5" />
      ))}

      {/* Far ridge — most faded, atmospheric */}
      <polygon
        points="0,560 140,500 300,545 460,470 640,530 820,480 1000,540 1180,490 1360,535 1600,500 1600,620 0,620"
        fill="#26262a"
        opacity="0.55"
      />

      {/* Mid ridge */}
      <polygon
        points="0,600 220,510 420,570 560,480 780,555 980,500 1180,565 1400,505 1600,560 1600,640 0,640"
        fill="#1a1a1d"
        opacity="0.75"
      />

      {/* Main peak — echoes the Arc mark */}
      <path
        d="M800,220 L1010,600 L860,600 L800,470 L740,600 L590,600 Z"
        fill="url(#peakFill)"
      />

      {/* Foreground ridge — darkest, frames the base */}
      <polygon
        points="0,640 180,600 380,635 600,590 800,630 1000,590 1220,635 1440,600 1600,635 1600,680 0,680"
        fill="#0e0e10"
      />

      {/* Mist band at the mountain base */}
      <g className="mist-layer" style={{ transformOrigin: "800px 620px" }}>
        <rect x="-100" y="580" width="1800" height="90" fill="#c9c4b3" opacity="0.06" />
      </g>

      {/* Water */}
      <rect x="0" y="680" width="1600" height="220" fill="url(#water)" />

      {/* Reflected peak, faint */}
      <path
        d="M800,720 L1010,680 L860,680 L800,760 L740,680 L590,680 Z"
        fill="#1c1c1f"
        opacity="0.35"
      />

      {/* Water ripple lines */}
      <line x1="200" y1="760" x2="600" y2="760" stroke="#f3f1ea" strokeWidth="1" opacity="0.06" />
      <line x1="900" y1="790" x2="1350" y2="790" stroke="#f3f1ea" strokeWidth="1" opacity="0.06" />
      <line x1="300" y1="830" x2="750" y2="830" stroke="#f3f1ea" strokeWidth="1" opacity="0.05" />

      {/* Overlay for text legibility */}
      <rect x="0" y="0" width="1600" height="900" fill="#08080a" opacity="0.28" />
    </svg>
  );
}
