import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md">
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="size-9 shrink-0 text-primary"
        fill="currentColor"
      >
        {/* Paw print */}
        <ellipse cx="16" cy="21" rx="7.5" ry="6" />
        <ellipse cx="6.5" cy="14" rx="3" ry="3.8" />
        <ellipse cx="12.5" cy="8.5" rx="3" ry="3.8" />
        <ellipse cx="19.5" cy="8.5" rx="3" ry="3.8" />
        <ellipse cx="25.5" cy="14" rx="3" ry="3.8" />
      </svg>
      <span className="font-display text-xl font-bold leading-tight text-foreground">
        Maple Tail Rescue
      </span>
    </Link>
  );
}
