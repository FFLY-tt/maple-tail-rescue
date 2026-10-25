import Link from "next/link";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { Container } from "@/components/ui/Container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-alt">
      <Container className="grid gap-8 py-10 sm:grid-cols-2">
        <div>
          <p className="font-display text-xl font-bold">Maple Tail Rescue</p>
          <p className="mt-2 max-w-sm text-muted">
            A small, foster-based dog and cat rescue in Toronto, Ontario. Every
            animal spends time in a loving home before finding their forever one.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="font-semibold">Explore</p>
          <ul className="mt-2 space-y-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-8 items-center text-muted underline-offset-4 hover:text-primary hover:underline"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <div className="border-t border-border">
        <Container className="py-4 text-sm text-muted">
          Maple Tail Rescue is a fictional rescue created for a demo project.
        </Container>
      </div>
    </footer>
  );
}
