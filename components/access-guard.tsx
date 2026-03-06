"use client";

import { useWarehouseStore } from "@/hooks/use-store";
import { PINLoginOverlay } from "./pin-login-overlay";
import { Button } from "./ui/button";
import { ShieldAlert, LogOut } from "lucide-react";

interface AccessGuardProps {
    children: React.ReactNode;
    requiredRole?: string;
}

export function AccessGuard({ children, requiredRole = "ადმინისტრატორი" }: AccessGuardProps) {
    const store = useWarehouseStore();
    const currentEmployee = store.currentEmployee;
    const hasAdmin = store.employees.some(e => e.position === "ადმინისტრატორი");

    // 0. Emergency access: If no Administrator exists in the system, 
    // allow access to the Employees page so the user can create one.
    if (!hasAdmin) {
        return <>{children}</>;
    }

    // 1. If not logged in at all, show PIN Overlay
    if (!currentEmployee) {
        return <PINLoginOverlay />;
    }

    // 2. If logged in but doesn't have the required role
    if (requiredRole && currentEmployee.position !== requiredRole) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-500">
                <div className="bg-destructive/10 p-6 rounded-full shadow-inner">
                    <ShieldAlert className="w-16 h-16 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">წვდომა შეზღუდულია</h2>
                    <p className="text-muted-foreground max-w-[300px] mx-auto">
                        ამ გვერდის სანახავად საჭიროა <strong>{requiredRole}</strong>-ის უფლებები.
                        თქვენი მიმდინარე როლია: {currentEmployee.position}
                    </p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-[240px]">
                    <Button
                        variant="outline"
                        onClick={() => store.logoutEmployee()}
                        className="gap-2 rounded-xl"
                    >
                        <LogOut className="w-4 h-4" />
                        სხვა პროფილით შესვლა
                    </Button>
                </div>
            </div>
        );
    }

    // 3. Authorized
    return <>{children}</>;
}
