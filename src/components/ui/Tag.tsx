import type { ReactNode } from "react";

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-secondary-soft px-3 py-1 text-sm font-semibold text-secondary">
      {children}
    </span>
  );
}
