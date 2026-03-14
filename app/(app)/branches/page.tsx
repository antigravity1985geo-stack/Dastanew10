import { BranchesPage } from "@/components/branches-page";
import { AccessGuard } from "@/components/access-guard";

export default function Page() {
  return (
    <AccessGuard requiredRole="ადმინისტრატორი">
      <BranchesPage />
    </AccessGuard>
  );
}
