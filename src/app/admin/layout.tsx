import type { Metadata } from "next";
import type { ReactNode } from "react";

// Staff pages stay out of search results. (They are also not linked from the public nav.)
export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
