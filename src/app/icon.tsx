import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// The actual badge logo, not a redrawn interpretation — ImageResponse can't
// use next/image, so it's embedded as a data URI read from disk at request
// time. PNG rather than the source webp: Satori (ImageResponse's renderer)
// can't decode webp and fails the whole route with an opaque error.
const logoDataUrl = (() => {
  const buf = readFileSync(join(process.cwd(), "public/brand/la-rue-des-notres-logo.png"));
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
        }}
      >
        {/* ImageResponse (satori) needs a plain <img>, not next/image. */}
        <img src={logoDataUrl} width={512} height={512} alt="" />
      </div>
    ),
    { ...size },
  );
}
