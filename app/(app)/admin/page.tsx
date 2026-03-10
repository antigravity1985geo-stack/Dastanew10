import { AdminPage } from "@/components/admin-page";
import { AccessGuard } from "@/components/access-guard";

export default function Admin() {
  return (
    <AccessGuard requiredRole="ადმინისტრატორი">
      <AdminPage />
    </AccessGuard>
  );
}
