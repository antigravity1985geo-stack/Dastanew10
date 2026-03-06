import { toast } from "sonner";
import { settingsStore } from "./settings";
import type { Sale } from "./store";

/**
 * Fiscal Printer / Cash Register Service
 * Handles digital and physical receipt printing.
 */

export interface FiscalResponse {
    success: boolean;
    receiptNumber?: string;
    error?: string;
}

export const fiscalService = {
    /**
     * Prints a fiscal receipt for a given sale.
     */
    async printReceipt(sale: Sale[] | Sale): Promise<FiscalResponse> {
        const settings = settingsStore.getSettings();
        const sales = Array.isArray(sale) ? sale : [sale];

        if (settings.fiscalType === "none" || !settings.fiscalType) {
            return { success: true }; // No action needed
        }

        try {
            if (settings.fiscalType === "digital") {
                return this.printDigital(sales);
            } else if (settings.fiscalType === "physical") {
                return this.printPhysical(sales);
            }

            return { success: false, error: "არასწორი საკასო აპარატის ტიპი." };
        } catch (error: any) {
            const errMsg = error.message || "შეცდომა ჩეკის ამობეჭდვისას.";
            toast.error(errMsg);
            return { success: false, error: errMsg };
        }
    },

    printDigital(sales: Sale[]): Promise<FiscalResponse> {
        console.log("[Fiscal] Printing digital receipt...", sales);
        return new Promise(async (resolve) => {
            await new Promise(r => setTimeout(r, 800));
            const receiptNumber = `DIG-${Date.now()}`;
            toast.success(`ციფრული ჩეკი გენერირებულია: ${receiptNumber}`);
            // In a real app, this might open a popup with a QR code or email it
            resolve({ success: true, receiptNumber });
        });
    },

    printPhysical(sales: Sale[]): Promise<FiscalResponse> {
        console.log("[Fiscal] Connecting to physical printer...", sales);
        return new Promise(async (resolve) => {
            // Simulation of hardware connection
            await new Promise(r => setTimeout(r, 2000));
            const receiptNumber = `FIS-${Math.floor(Math.random() * 900000 + 100000)}`;
            toast.success(`ფიზიკური ჩეკი ამობეჭდილია: ${receiptNumber}`);
            resolve({ success: true, receiptNumber });
        });
    }
};
