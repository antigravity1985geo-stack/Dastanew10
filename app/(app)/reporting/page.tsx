import { ReportingPage } from "@/components/reporting-page";
import { AccessGuard } from "@/components/access-guard";

export default function Page() {
  return (
    <AccessGuard requiredRole="ადმინისტრატორი">
      <ReportingPage />
    </AccessGuard>
  );
}
