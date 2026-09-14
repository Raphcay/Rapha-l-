export const SITE_NAME = "Arc";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = rawSiteUrl
  ? rawSiteUrl.replace(/\/$/, "")
  : "https://arc-wear.com";

export const SITE_DESCRIPTION =
  "Arc conçoit des vêtements techniques pensés pour la ville. Première collection : des t-shirts en coton épais, coupes précises, matières durables, produits en série limitée.";
