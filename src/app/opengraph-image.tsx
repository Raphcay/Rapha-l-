import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The actual badge logo, not a redrawn interpretation — it already carries
// the brand name, so there's no separate text wordmark below it here. PNG
// rather than the source webp: Satori (ImageResponse's renderer) can't
// decode webp and fails the whole route with an opaque error.
const logoDataUrl = (() => {
  const buf = readFileSync(join(process.cwd(), "public/brand/la-rue-des-notres-logo.png"));
  return `data:image/png;base64,${buf.toString("base64")}`;
})();

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
        {/* ImageResponse (satori) needs a plain <img>, not next/image. */}
        <img src={logoDataUrl} width={340} height={340} alt="" />
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
