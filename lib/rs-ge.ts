import { toast } from "sonner";
import { settingsStore } from "./settings";
import type { Sale } from "./store";

/**
 * RS.GE Integration Service
 * Handles waybill (ზედნადები) operations.
 */

export interface RSGEWaybillResponse {
    success: boolean;
    waybillId?: string;
    error?: string;
}

export const rsgeService = {
    /**
     * Sends a waybill to RS.GE for a given sale.
     * Note: This is a simulation focused on the integration flow.
     * Real integration requires SOAP/REST communication with RS.GE API.
     */
    async sendWaybill(sale: Sale): Promise<RSGEWaybillResponse> {
        const settings = settingsStore.getSettings();

        if (!settings.rsgeUsername || !settings.rsgePassword) {
            return {
                success: false,
                error: "RS.GE ავტორიზაციის მონაცემები არ არის შევსებული."
            };
        }

        try {
            console.log(`[RS.GE] Sending waybill for sale ${sale.id}...`);
            console.log(`[RS.GE] Product: ${sale.productName}, Quantity: ${sale.quantity}`);

            // Simulate network request
            await new Promise(resolve => setTimeout(resolve, 1500));

            const waybillId = `RS-${Math.floor(Math.random() * 1000000)}`;

            toast.success(`ზედნადები გაიგზავნა RS.GE-ზე: ${waybillId}`);

            return {
                success: true,
                waybillId
            };
        } catch (error: any) {
            const errMsg = error.message || "უცნობი შეცდომა RS.GE-სთან კავშირისას.";
            toast.error(errMsg);
            return {
                success: false,
                error: errMsg
            };
        }
    }
};
