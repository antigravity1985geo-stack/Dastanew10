"use client";

import { useState, useEffect } from "react";
import { Lock, Delete, ChevronRight, User, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWarehouseStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Hashing function for initial PIN creation
async function hashPIN(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function PINLoginOverlay() {
    const store = useWarehouseStore();
    const auth = useAuth();
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // If already logged in, don't show
    if (store.currentEmployee) return null;

    const hasEmployees = store.employees.length > 0;

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 6) {
                if (!hasEmployees) {
                    handleCreateInitial(newPin);
                } else {
                    handleLogin(newPin);
                }
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError(false);
    };

    const handleCreateInitial = async (currentPin: string) => {
        setIsCreating(true);
        try {
            const hashedPin = await hashPIN(currentPin);
            await store.addEmployee({
                name: auth.currentUser?.displayName || "ადმინისტრატორი",
                position: "ადმინისტრატორი",
                phone: auth.currentUser?.email || "",
                pinCode: hashedPin,
            });
            toast.success("PIN კოდი წარმატებით შეიქმნა!");
            await store.loginEmployee(currentPin);
        } catch (err: any) {
            toast.error(err.message || "შეცდომა PIN-ის შექმნისას");
            setPin("");
            setError(true);
        } finally {
            setIsCreating(false);
        }
    };

    const handleLogin = async (currentPin: string) => {
        const employee = await store.loginEmployee(currentPin);
        if (employee) {
            toast.success(`გამარჯობა, ${employee.name}!`);
        } else {
            setError(true);
            setPin("");
            toast.error("არასწორი PIN კოდი");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-sm p-6 space-y-8 text-center animate-in zoom-in-95 duration-300">
                <div className="space-y-2">
                    <div className={cn("mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors", hasEmployees ? "bg-primary/10" : "bg-emerald-500/10")}>
                        {hasEmployees ? <Lock className="w-8 h-8 text-primary" /> : <KeyRound className="w-8 h-8 text-emerald-500" />}
                    </div>
                    <h2 className="text-2xl font-bold">
                        {hasEmployees ? "თანამშრომლის ავტორიზაცია" : "პირველი PIN-ის შექმნა"}
                    </h2>
                    <p className="text-muted-foreground">
                        {hasEmployees ? "შეიყვანეთ 6-ციფრიანი PIN კოდი მუშაობის დასაწყებად" : "რადგან ახალი მომხმარებელი ხართ, შექმენით 6-ციფრიანი სამუშაო PIN კოდი"}
                    </p>
                </div>

                <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-4 h-4 rounded-full border-2 transition-all duration-200",
                                pin.length > i ? "bg-primary border-primary scale-110" : "border-muted-foreground/30",
                                error && "border-destructive bg-destructive"
                            )}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                        <Button
                            key={num}
                            variant="outline"
                            size="lg"
                            className="h-16 text-xl font-semibold hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                            onClick={() => handleNumberClick(num)}
                        >
                            {num}
                        </Button>
                    ))}
                    <Button
                        variant="ghost"
                        size="lg"
                        className="h-16 text-destructive hover:bg-destructive/10"
                        onClick={() => setPin("")}
                    >
                        C
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-16 text-xl font-semibold hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                        onClick={() => handleNumberClick("0")}
                    >
                        0
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="h-16 hover:bg-muted"
                        onClick={handleDelete}
                    >
                        <Delete className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
