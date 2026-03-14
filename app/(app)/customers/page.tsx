import { CustomersPage } from "@/components/customers-page";
import { AccessGuard } from "@/components/access-guard";

export default function Page() {
  return (
    <AccessGuard requiredRole="ადმინისტრატორი">
      <CustomersPage />
    </AccessGuard>
  );
}
