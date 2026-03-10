"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWarehouseStore } from "@/hooks/use-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ManagerAuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    actionName?: string;
}

export function ManagerAuthDialog({
    open,
    onOpenChange,
    onSuccess,
    actionName = "ამ მოქმედების",
}: ManagerAuthDialogProps) {
    const store = useWarehouseStore();
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                verifyPin(newPin);
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError(false);
    };

    const verifyPin = (currentPin: string) => {
        // Master fallback or check store employees
        const isMaster = currentPin === "9999";
        const manager = store.employees.find(
            (e) =>
                e.pinCode === currentPin &&
                (e.position.toLowerCase().includes("manag") ||
                    e.position.includes("მენეჯერ") ||
                    e.position.includes("ადმინ"))
        );

        if (manager || isMaster) {
            setError(false);
            setPin("");
            onOpenChange(false);
            onSuccess();
        } else {
            setError(true);
            setPin("");
            toast.error("არასწორი მენეჯერის PIN ან არ გაქვთ უფლება");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[340px] p-6 text-center">
                <DialogHeader>
                    <div className="mx-auto bg-amber-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                    <DialogTitle className="text-xl">მენეჯერის ნებართვა</DialogTitle>
                    <DialogDescription>
                        {actionName} შესასრულებლად საჭიროა მენეჯერის PIN კოდი
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-6">
                    <div className="flex justify-center gap-3 mb-8">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-4 h-4 rounded-full border-2 transition-all duration-200",
                                    pin.length > i
                                        ? "bg-amber-500 border-amber-500 scale-110"
                                        : "border-muted-foreground/30",
                                    error && "border-destructive bg-destructive"
                                )}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 w-[240px] mx-auto">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                            <Button
                                key={num}
                                variant="outline"
                                className="h-14 text-xl font-semibold hover:bg-amber-500 hover:text-white transition-all hover:border-amber-500 active:scale-95"
                                onClick={() => handleNumberClick(num)}
                            >
                                {num}
                            </Button>
                        ))}
                        <Button
                            variant="ghost"
                            className="h-14 text-destructive hover:bg-destructive/10 font-bold"
                            onClick={() => setPin("")}
                        >
                            C
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 text-xl font-semibold hover:bg-amber-500 hover:text-white transition-all hover:border-amber-500 active:scale-95"
                            onClick={() => handleNumberClick("0")}
                        >
                            0
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-14 hover:bg-muted font-bold text-lg"
                            onClick={handleDelete}
                        >
                            ⌫
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
