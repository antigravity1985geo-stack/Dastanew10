import { EmployeesPage } from "@/components/employees-page";
import { AccessGuard } from "@/components/access-guard";

export default function Page() {
    return (
        <AccessGuard requiredRole="ადმინისტრატორი">
            <EmployeesPage />
        </AccessGuard>
    );
}
