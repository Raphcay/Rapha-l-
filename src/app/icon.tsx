import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// The actual logo icon's ink, not a redrawn interpretation — background
// removed and recolored to the site's light "ink" tone (see Mark.tsx) so it
// sits directly on a dark favicon instead of inside its own white canvas.
// Icon only (no wordmark text, which doesn't read at favicon size).
// ImageResponse can't use next/image, so it's embedded as a data URI.
const logoDataUrl = (() => {
  const buf = readFileSync(join(process.cwd(), "public/brand/la-rue-des-notres-icon-light.png"));
  return `data:image/png;base64,${buf.toString("base64")}`;
})();

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
        {/* ImageResponse (satori) needs a plain <img>, not next/image. */}
        <img src={logoDataUrl} width={400} height={400} alt="" />
      </div>
    ),
    { ...size },
  );
}
