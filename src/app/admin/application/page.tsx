import { Suspense } from "react";

import { AdminGate } from "@/components/admin/AdminGate";
import { ApplicationDetail } from "@/components/admin/ApplicationDetail";

export default function AdminApplicationPage() {
  // A query parameter (?id=) instead of a dynamic route: this is a static export.
  // useSearchParams needs a Suspense boundary for that.
  return (
    <AdminGate>
      <Suspense fallback={null}>
        <ApplicationDetail />
      </Suspense>
    </AdminGate>
  );
}
