import { ProductionPage } from "@/components/production-page";
import { AccessGuard } from "@/components/access-guard";

export const metadata = {
  title: "წარმოება | DASTA Cloud",
  description: "პროდუქციის წარმოება და რეცეპტების მართვა",
};

export default function Page() {
  return (
    <AccessGuard requiredRole="ადმინისტრატორი">
      <ProductionPage />
    </AccessGuard>
  );
}
