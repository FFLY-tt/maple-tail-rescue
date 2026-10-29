"use client";

import { useEffect, useRef } from "react";

import "./globals.css";

/**
 * Last resort: shown when the root layout itself fails, so it replaces the whole
 * page (including the header and footer) and must provide its own <html> and
 * <body>. It can't use the layout's fonts or Next's <Link>, so it falls back to
 * system fonts and a plain link.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error(error);
    headingRef.current?.focus(); // so screen reader users hear that the page changed
  }, [error]);

  const button =
    "inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2.5 text-base font-semibold";

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center px-4 text-center">
        <main>
          <p className="text-5xl" aria-hidden="true">
            🐾
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-3xl font-bold focus:outline-none">Something went wrong</h1>
          <p className="mx-auto mt-3 max-w-md text-lg text-muted">
            Sorry, the site ran into a problem. You can try again, or go back to the home page.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button type="button" onClick={reset} className={`${button} bg-primary text-primary-foreground hover:bg-primary-hover`}>
              Try again
            </button>
            {/* A plain link on purpose: the router may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={`${button} border-2 border-primary text-primary hover:bg-primary-soft`}>
              Back to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
