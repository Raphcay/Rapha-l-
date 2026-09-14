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
          <path
            d="M50 8 L92 88 L66 88 L50 58 L34 88 L8 88 Z"
            stroke="#f3f1ea"
            strokeWidth="8"
            strokeLinejoin="miter"
          />
        </svg>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: 6,
            color: "#f3f1ea",
            display: "flex",
          }}
        >
          ARC
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
