export const SITE_NAME = "Arc";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = rawSiteUrl
  ? rawSiteUrl.replace(/\/$/, "")
  : "https://arc-wear.com";

export const SITE_DESCRIPTION =
  "Arc conçoit des vêtements techniques pensés pour la ville. La première pièce : un t-shirt oversize en coton premium 220g, taillé pour durer et produit en série limitée.";

// Shown to visitors everywhere on the site (footer, contact page, chat
// assistant). Not a real deliverable address on its own — CONTACT_EMAIL_REAL
// below is the actual inbox behind the mailto links and the contact form,
// until a real @arc-wear domain mailbox exists.
export const CONTACT_EMAIL_DISPLAY = "contact@arc-wear";

// Real inbox that mailto links and the contact form actually deliver to.
// Never render this directly in visitor-facing copy — use
// CONTACT_EMAIL_DISPLAY for that.
export const CONTACT_EMAIL_REAL = "rcay.pro@gmail.com";
