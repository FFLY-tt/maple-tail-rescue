/**
 * Site-wide settings a real rescue fills in once: its public address and its
 * social accounts. Nothing here is a real account; the URLs are placeholders.
 */

/**
 * Public address of the deployed site, with no trailing slash. Set
 * NEXT_PUBLIC_SITE_URL when building for production so share previews get
 * absolute image URLs. The default is a placeholder (".example" is reserved).
 */
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mapletailrescue.example").replace(/\/+$/, "");

export const SITE = {
  name: "Maple Tail Rescue",
  url: siteUrl,
  title: "Maple Tail Rescue | Dog and cat adoption in Toronto",
  description:
    "Maple Tail Rescue is a small, foster-based dog and cat rescue in Toronto. Meet our animals and apply to adopt.",
};

export type SocialLink = {
  id: "instagram" | "facebook";
  label: string;
  /** Profile address. "#" means "not set up yet": it renders a link that goes nowhere. */
  href: string;
};

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { id: "instagram", label: "Maple Tail Rescue on Instagram", href: "#" },
  { id: "facebook", label: "Maple Tail Rescue on Facebook", href: "#" },
];
