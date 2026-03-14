import { TransfersPage } from "@/components/transfers-page";
import { AccessGuard } from "@/components/access-guard";

export default function Page() {
  return (
    <AccessGuard requiredRole="ადმინისტრატორი">
      <TransfersPage />
    </AccessGuard>
  );
}
