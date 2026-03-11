import { ExpensesPage } from "@/components/expenses-page";
import { AccessGuard } from "@/components/access-guard";

export default function Page() {
    return (
        <AccessGuard requiredRole="ადმინისტრატორი">
            <ExpensesPage />
        </AccessGuard>
    );
}
