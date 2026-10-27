import { AdminGate } from "@/components/admin/AdminGate";
import { ApplicationList } from "@/components/admin/ApplicationList";

export default function AdminPage() {
  return (
    <AdminGate>
      <ApplicationList />
    </AdminGate>
  );
}
