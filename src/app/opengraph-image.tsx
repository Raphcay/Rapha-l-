import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          gap: 28,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="16" r="9" stroke="#f3f1ea" strokeWidth="6" />
          <path
            d="M8 78 L32 32 L50 52 L68 22 L92 78"
            stroke="#f3f1ea"
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path d="M4 82 L96 82" stroke="#f3f1ea" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#f3f1ea",
            display: "flex",
            textAlign: "center",
            maxWidth: 1000,
          }}
        >
          LA RUE DES NÔTRES
        </div>
        <div
          style={{
            fontSize: 26,
            letterSpacing: 3,
            color: "#9a978d",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          {"Plus qu'un style, une identité"}
        </div>
      </div>
    ),
    { ...size },
  );
}
