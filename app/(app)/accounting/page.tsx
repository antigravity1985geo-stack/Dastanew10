"use client";

import { AccountingPage } from "@/components/accounting-page";
import { AccessGuard } from "@/components/access-guard";

export default function Accounting() {
  return (
    <AccessGuard requiredRole="ადმინისტრატორი">
      <AccountingPage />
    </AccessGuard>
  );
}
