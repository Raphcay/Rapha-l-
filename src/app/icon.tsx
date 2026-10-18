import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
        }}
      >
        <svg width="352" height="352" viewBox="0 0 100 100" fill="none">
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
      </div>
    ),
    { ...size },
  );
}
