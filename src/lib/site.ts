export const SITE_NAME = "La Rue des Nôtres";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = rawSiteUrl
  ? rawSiteUrl.replace(/\/$/, "")
  : "https://laruedesnotres.com";

export const SITE_DESCRIPTION =
  "La Rue des Nôtres conçoit des vêtements techniques pensés pour la ville. La première pièce : un t-shirt oversize en coton premium 220g, taillé pour durer et produit en série limitée.";

// Shown to visitors everywhere on the site (footer, contact page, chat
// assistant). Not a real deliverable address on its own — CONTACT_EMAIL_REAL
// below is the actual inbox behind the mailto links and the contact form,
// until a real @laruedesnotres domain mailbox exists.
export const CONTACT_EMAIL_DISPLAY = "contact@laruedesnotres";

// Real inbox that mailto links and the contact form actually deliver to.
// Never render this directly in visitor-facing copy — use
// CONTACT_EMAIL_DISPLAY for that.
export const CONTACT_EMAIL_REAL = "rcay.pro@gmail.com";

// Instagram handles can't carry spaces or accents, so this is a slugified
// guess at "la rue des nôtres textile" — swap it for the real @handle once
// the account exists if this isn't it.
export const INSTAGRAM_HANDLE = "laruedesnotrestextile";
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;
