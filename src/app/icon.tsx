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
          <path
            d="M50 8 L92 88 L66 88 L50 58 L34 88 L8 88 Z"
            stroke="#f3f1ea"
            strokeWidth="9"
            strokeLinejoin="miter"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
