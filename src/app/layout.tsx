import type { Metadata } from "next";
import localFont from "next/font/local";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SITE } from "@/content/site";
import "./globals.css";

// Self-hosted (Latin subset, variable fonts, SIL Open Font License; see the *-OFL.txt files next
// to them), so builds never need to reach Google. Weight ranges are the fonts' full ranges.
const bodyFont = localFont({
  src: "./fonts/nunito-sans-latin-wght-normal.woff2",
  variable: "--font-body",
  weight: "200 1000",
  display: "swap",
  adjustFontFallback: "Arial",
});

const headingFont = localFont({
  src: "./fonts/fraunces-latin-wght-normal.woff2",
  variable: "--font-heading",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  // Resolves relative image URLs in every page's metadata to absolute ones.
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  // A page that sets its own openGraph/twitter replaces these wholesale, not field by field.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_CA",
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
