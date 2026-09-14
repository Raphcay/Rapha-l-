import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Vêtements techniques`,
    short_name: SITE_NAME,
    description:
      "Vêtements techniques en série limitée. Découvre la première collection Arc.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/icon", sizes: "any", type: "image/png", purpose: "maskable" },
    ],
  };
}
