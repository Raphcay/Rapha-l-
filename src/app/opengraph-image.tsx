import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The actual logo ink, not a redrawn interpretation — background removed
// and recolored to the site's light "ink" tone (see Mark.tsx) so it sits
// directly on the dark card instead of inside its own white canvas. It
// already carries the brand name, so there's no separate text wordmark
// below it here.
const logoDataUrl = (() => {
  const buf = readFileSync(join(process.cwd(), "public/brand/la-rue-des-notres-logo-light.png"));
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
        {/* ImageResponse (satori) needs a plain <img>, not next/image.
           Logo is a wide rectangle (~2.15:1) — width/height kept in that
           ratio so it isn't stretched. */}
        <img src={logoDataUrl} width={560} height={260} alt="" />
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
