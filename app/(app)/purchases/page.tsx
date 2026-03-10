"use client";

import { PurchasesPage } from "@/components/purchases-page";
import { AccessGuard } from "@/components/access-guard";

export default function Purchases() {
  return (
    <AccessGuard requiredRole="ადმინისტრატორი">
      <PurchasesPage />
    </AccessGuard>
  );
}
