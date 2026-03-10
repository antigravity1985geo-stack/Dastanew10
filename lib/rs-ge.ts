/**
 * lib/rs-ge.ts — RS.GE SOAP Integration Service
 *
 * ❗ კლიენტის ფუნქციები API Routes-ს გამოიძახებენ.
 *    suid / credentials კლიენტის მხარეს ვერ ხვდება.
 *
 * Server-side ლოგიკა: lib/rsge-session.ts
 * TypeScript ინტერფეისები: lib/rsge-types.ts
 */
import { toast } from "sonner";
import { settingsStore } from "./settings";
import type { Sale } from "./store";
import { syncQueue } from "./sync-queue";
import { rsgeIdempotency } from "./rsge-idempotency";
import type {
    RsgeWaybillListResponse,
    RsgeSendWaybillResponse,
    RsgeInvoiceResponse,
    RsgeWaybillDetailsResponse,
    RsgeOrganizationResponse,
    RsgeFiscalReceiptResponse,
    RsgeBaseResponse,
    RsgeWaybillFilters,
    RsgeSendOptions,
    RsgeWaybillItemInput,
    RsgeLoginResponse,
} from "./rsge-types";
import { RsgeErrorCode } from "./rsge-types";

// Re-export types for backward compatibility
export type { RsgeWaybillItemInput as RSGEWaybillItem, RsgeSendOptions as RSGESendOptions };

export type RSGEWaybillRecord = {
    id: string;
    w_id: string;
    status: string;
    buyerName?: string;
    buyerTin?: string;
    sellerName?: string;
    sellerTin?: string;
    createDate?: string;
    beginDate?: string;
    deliveryDate?: string;
    fullAmount?: string;
    waybillNumber?: string;
    type?: string;
};

export type RSGEResponse = RsgeBaseResponse & {
    waybillId?: string;
    invoiceId?: string;
    waybills?: RSGEWaybillRecord[];
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** RS.GE კონფიგურაციის შემოწმება */
export function isRSGEConfigured(): boolean {
    const s = settingsStore.getSettings();
    return !!(s.rsgeUsername && s.rsgePassword);
}

function getCredentials(): { username: string; password: string; tin: string } | null {
    const s = settingsStore.getSettings();
    if (!s.rsgeUsername || !s.rsgePassword) return null;
    return {
        username: s.rsgeUsername,
        password: s.rsgePassword,
        // rsgeTin პირდაპირ Settings interface-ზეა — type cast არ სჭირდება
        tin: s.rsgeTin || "",
    };
}

// ─────────────────────────────────────────────────────────────
// Retry Logic — RS.GE-ს სერვერების არასტაბილურობის გამო
// ─────────────────────────────────────────────────────────────

interface RetryOptions {
    retries?: number;
    delayMs?: number;
    backoff?: boolean;
}

async function withRetry<T>(
    fn: () => Promise<T>,
    opts: RetryOptions = {}
): Promise<T> {
    const { retries = 3, delayMs = 800, backoff = true } = opts;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < retries) {
                const wait = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
                console.warn(`[RS.GE] Attempt ${attempt + 1} failed. Retrying in ${wait}ms...`);
                await new Promise((r) => setTimeout(r, wait));
            }
        }
    }

    throw lastError;
}

// ─────────────────────────────────────────────────────────────
// API Caller (Client → Server API Routes)
// ─────────────────────────────────────────────────────────────

async function apiPost<T = RSGEResponse>(
    endpoint: string,
    body: Record<string, unknown>
): Promise<T> {
    const creds = getCredentials();
    if (creds) {
        body = { ...body, username: creds.username, password: creds.password };
    }

    const res = await withRetry(() =>
        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }).then((r) => r.json())
    );
    return res as T;
}

async function apiGet<T = RSGEResponse>(
    endpoint: string,
    params: Record<string, string> = {}
): Promise<T> {
    const creds = getCredentials();
    const merged = creds
        ? { ...params, username: creds.username, password: creds.password }
        : params;
    const qs = new URLSearchParams(merged).toString();
    const res = await withRetry(() =>
        fetch(`${endpoint}?${qs}`).then((r) => r.json())
    );
    return res as T;
}

// ─────────────────────────────────────────────────────────────
// Auto-Sync State
// ─────────────────────────────────────────────────────────────

let _autoSyncInterval: ReturnType<typeof setInterval> | null = null;

// ─────────────────────────────────────────────────────────────
// Main Service
// ─────────────────────────────────────────────────────────────

export const rsgeService = {
    // ──────────────────────────────────────────────
    // 1. LOGIN — კავშირის ტესტი
    // ──────────────────────────────────────────────

    /**
     * RS.GE-ზე ავტორიზაციის ტესტი.
     * suid სერვერ-მხარეს ინახება — კლიენტს არ ეგზავნება.
     */
    async testConnection(username: string, password: string): Promise<RsgeLoginResponse> {
        try {
            const res = await fetch(
                `/api/rsge/test?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
            ).then((r) => r.json());

            if (res.success) {
                toast.success("✅ RS.GE-სთან კავშირი წარმატებულია!");
            } else {
                toast.error(`❌ RS.GE შეცდომა: ${res.error}`);
            }
            return { ...res, sessionActive: res.success };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Connection error";
            toast.error(`კავშირის შეცდომა: ${msg}`);
            return { success: false, error: msg, errorCode: RsgeErrorCode.NETWORK_ERROR };
        }
    },

    // ──────────────────────────────────────────────
    // 2. checkOrganization — "Hello World" ტესტი
    // ──────────────────────────────────────────────

    /**
     * ✅ ორგანიზაციის შემოწმება ს/ნ-ით — RS.GE კავშირის "Hello World".
     *
     * RS.GE-ს GetOrganization SOAP მეთოდს სერვერ-მხარით გამოიძახებს.
     * კლიენტი მხოლოდ JSON პასუხს ღებულობს — credentials არ გადადის.
     *
     * @example
     *   const org = await rsgeService.checkOrganization("202123456");
     *   // → { success: true, organization: { tin, name, isVatPayer } }
     */
    async checkOrganization(tin: string): Promise<RsgeOrganizationResponse> {
        if (!tin || tin.trim().length < 9) {
            return {
                success: false,
                error: "ს/ნ სავალდებულოა (მინიმუმ 9 სიმბოლო)",
                errorCode: RsgeErrorCode.INVALID_TIN,
            };
        }

        try {
            const res = await apiGet<RsgeOrganizationResponse>("/api/rsge/test", {
                action: "check_organization",
                tin: tin.trim(),
            });
            return res;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "RS.GE error";
            return { success: false, error: msg, errorCode: RsgeErrorCode.NETWORK_ERROR };
        }
    },

    // ──────────────────────────────────────────────
    // 3. getWaybillDetails — ზედნადების დეტალები
    // ──────────────────────────────────────────────

    async getWaybillDetails(waybillId: string): Promise<RsgeWaybillDetailsResponse> {
        try {
            return await apiPost<RsgeWaybillDetailsResponse>("/api/rsge/waybill", {
                action: "get_waybill",
                waybillId,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Error";
            return { success: false, error: msg, errorCode: RsgeErrorCode.NETWORK_ERROR };
        }
    },

    // ──────────────────────────────────────────────
    // 4. getWaybills — ზედნადებების სია
    // ──────────────────────────────────────────────

    async getWaybills(filters: RsgeWaybillFilters = {}): Promise<RsgeWaybillListResponse> {
        const creds = getCredentials();
        if (!creds) return { success: false, error: "Credentials not configured", waybills: [] };

        try {
            const params = new URLSearchParams({
                status: filters.status || "",
                from: filters.from || "",
                to: filters.to || "",
                buyerTin: filters.buyerTin || "",
                username: creds.username,
                password: creds.password,
            });
            const data = await withRetry(() =>
                fetch(`/api/rsge/waybill?${params}`).then((r) => r.json())
            );
            return data as RsgeWaybillListResponse;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Error";
            return { success: false, error: msg, waybills: [], errorCode: RsgeErrorCode.NETWORK_ERROR };
        }
    },

    // ──────────────────────────────────────────────
    // 5. sendWaybill — ზედნადების გაგზავნა
    // ──────────────────────────────────────────────

    async sendWaybill(
        sale: Sale,
        options: RsgeSendOptions = {},
        cartItems?: RsgeWaybillItemInput[],
        skipQueue = false
    ): Promise<RsgeSendWaybillResponse> {
        const creds = getCredentials();
        if (!creds) {
            toast.error("RS.GE პარამეტრები შეავსეთ ადმინ პანელში.");
            return { success: false, error: "Credentials not configured." };
        }

        const items: RsgeWaybillItemInput[] = cartItems || [
            {
                productName: sale.productName,
                quantity: sale.quantity,
                unit: "ც",
                price: sale.salePrice,
            },
        ];

        // ─── ✅ CHECK-BEFORE-SEND (Idempotency) ───────────────────────
        // გაგზავნამდე: კი უკვე გავაგზავნეთ ეს ზედნადები?
        // თუ კი — SOAP-ს არ გამოვიძახებთ, cached waybillId-ს ვაბრუნებთ.
        const idempotencyKey = options.idempotencyKey;
        if (idempotencyKey) {
            const existingWaybillId = await rsgeIdempotency.check(idempotencyKey);
            if (existingWaybillId) {
                console.log(
                    `[RS.GE] Idempotency: ზედნადები უკვე გაიგზავნა. waybillId=${existingWaybillId}`
                );
                if (!skipQueue) {
                    toast.info(`ℹ️ ეს ზედნადები უკვე გაიგზავნა: ${existingWaybillId}`);
                }
                return { success: true, waybillId: existingWaybillId };
            }
        }
        // ─────────────────────────────────────────────────────────────

        try {
            const data = await withRetry(() =>
                fetch("/api/rsge/waybill", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "save_waybill",
                        idempotencyKey,
                        username: creds.username,
                        password: creds.password,
                        sellerTin: creds.tin,
                        buyerTin: options.buyerTin || "",
                        buyerName: options.buyerName || sale.client || "",
                        deliveryAddress: options.deliveryAddress || "",
                        carNumber: options.carNumber || "",
                        waybillType: options.waybillType || 1,
                        items,
                    }),
                }).then((r) => r.json())
            );

            if (!data.success) {
                if (!skipQueue) {
                    syncQueue.add(sale.id, "waybill", { sale, options, items });
                    toast.error("RS.GE-ზე გაგზავნა ვერ მოხერხდა. სისტემა თავიდან სცდის ფონურ რეჟიმში.");
                }
                return data;
            }

            // ─── ✅ MARK SUCCESS ──────────────────────────────────────
            // წარმატებული გაგზავნის დაფიქსირება (L1 cache + Supabase)
            if (idempotencyKey && data.waybillId) {
                await rsgeIdempotency.markSuccess(idempotencyKey, data.waybillId);
            }
            // ─────────────────────────────────────────────────────────

            if (!skipQueue) toast.success(`✅ ზედნადები გაიგზავნა: ${data.waybillId}`);

            if (options.sendInvoice && data.waybillId) {
                this.sendInvoiceForWaybill(data.waybillId);
            }

            return data;
        } catch (e: unknown) {
            if (!skipQueue) {
                syncQueue.add(sale.id, "waybill", { sale, options, items });
                toast.error("ქსელის შეცდომა. გაგზავნა მოხდება ფონურ რეჟიმში.");
            }
            const msg = e instanceof Error ? e.message : "Error";
            return { success: false, error: msg };
        }
    },

    // ──────────────────────────────────────────────
    // 6. Waybill Status Actions
    // ──────────────────────────────────────────────

    async confirmWaybill(waybillId: string): Promise<RsgeBaseResponse> {
        if (!getCredentials()) return { success: false, error: "Not configured" };
        const data = await apiPost("/api/rsge/waybill", { action: "confirm_waybill", waybillId });
        if (data.success) toast.success("✅ ზედნადები დადასტურდა.");
        else toast.error(`შეცდომა: ${data.error}`);
        return data;
    },

    async rejectWaybill(waybillId: string, comment = ""): Promise<RsgeBaseResponse> {
        if (!getCredentials()) return { success: false, error: "Not configured" };
        const data = await apiPost("/api/rsge/waybill", { action: "reject_waybill", waybillId, comment });
        if (data.success) toast.success("ზედნადები უარყოფილია.");
        else toast.error(`შეცდომა: ${data.error}`);
        return data;
    },

    async closeWaybill(waybillId: string): Promise<RsgeBaseResponse> {
        if (!getCredentials()) return { success: false, error: "Not configured" };
        const data = await apiPost("/api/rsge/waybill", { action: "close_waybill", waybillId });
        if (data.success) toast.success("ზედნადები დაიხურა.");
        else toast.error(`შეცდომა: ${data.error}`);
        return data;
    },

    async deleteWaybill(waybillId: string): Promise<RsgeBaseResponse> {
        if (!getCredentials()) return { success: false, error: "Not configured" };
        const data = await apiPost("/api/rsge/waybill", { action: "del_waybill", waybillId });
        if (data.success) toast.success("ზედნადები წაიშალა.");
        else toast.error(`შეცდომა: ${data.error}`);
        return data;
    },

    /**
     * ActivateWaybill — ზედნადების გააქტიურება / ტრანსპორტირების დაწყება.
     */
    async activateWaybill(waybillId: string): Promise<RsgeBaseResponse> {
        if (!getCredentials()) return { success: false, error: "Not configured" };
        const data = await apiPost("/api/rsge/waybill", { action: "activate_waybill", waybillId });
        if (data.success) toast.success("🚛 ტრანსპორტირება დაიწყო.");
        else toast.error(`ვერ გააქტიურდა: ${data.error}`);
        return data;
    },

    // ──────────────────────────────────────────────
    // 7. Fiscal Receipt
    // ──────────────────────────────────────────────

    async sendFiscalReceipt(
        sale: Sale,
        cartItems?: RsgeWaybillItemInput[],
        skipQueue = false
    ): Promise<RsgeFiscalReceiptResponse> {
        const creds = getCredentials();
        if (!creds) return { success: false, error: "Not configured" };

        const items: RsgeWaybillItemInput[] = cartItems || [
            { productName: sale.productName, quantity: sale.quantity, unit: "ც", price: sale.salePrice },
        ];

        try {
            const data = await withRetry(() =>
                fetch("/api/rsge/waybill", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "save_fiscal_receipt",
                        idempotencyKey: `FIS-${sale.id}`,
                        username: creds.username,
                        password: creds.password,
                        sellerTin: creds.tin,
                        items,
                        totalValue: sale.totalAmount,
                        paymentMethod: sale.paymentMethod || "cash",
                    }),
                }).then((r) => r.json())
            );

            if (!data.success && !skipQueue) {
                syncQueue.add(`FIS-${sale.id}`, "fiscal_receipt", { sale, items });
            }

            if (data.receiptNumber) {
                console.log(`[Fiscal] RS.GE Receipt: ${data.receiptNumber}`);
            }

            return data;
        } catch (e: unknown) {
            if (!skipQueue) syncQueue.add(`FIS-${sale.id}`, "fiscal_receipt", { sale, items });
            const msg = e instanceof Error ? e.message : "Error";
            return { success: false, error: msg };
        }
    },

    // ──────────────────────────────────────────────
    // 8. Invoice
    // ──────────────────────────────────────────────

    async sendInvoiceForWaybill(waybillId: string): Promise<RsgeInvoiceResponse> {
        if (!getCredentials()) return { success: false, error: "Not configured" };
        const data = await apiPost<RsgeInvoiceResponse>("/api/rsge/invoice", {
            action: "save_invoice",
            waybillId,
        });
        if (data.success) toast.success(`📄 ანგარიშ-ფაქტურა გაიგზავნა: ${data.invoiceId}`);
        else toast.error(`ფაქტურის შეცდომა: ${data.error}`);
        return data;
    },

    async sendStandaloneInvoice(params: {
        buyerTin?: string;
        buyerName?: string;
        items: Array<{ name: string; quantity: number; price: number; vatRate?: number }>;
    }): Promise<RsgeInvoiceResponse> {
        if (!getCredentials()) return { success: false, error: "Not configured" };
        const data = await apiPost<RsgeInvoiceResponse>("/api/rsge/invoice", {
            action: "save_standalone_invoice",
            ...params,
        });
        if (data.success) toast.success(`📄 ანგარიშ-ფაქტურა გაიგზავნა: ${data.invoiceId}`);
        else toast.error(`ფაქტურის შეცდომა: ${data.error}`);
        return data;
    },

    // ──────────────────────────────────────────────
    // 9. Auto-Sync — პერიოდული სინქრონიზაცია
    // ──────────────────────────────────────────────

    /**
     * Auto-Sync-ის დაწყება.
     * ყოველ `intervalMs` მილიწამში RS.GE-ს ახალ ზედნადებებს ამოიღებს.
     *
     * @param onUpdate callback ახალი waybill-ების სიით
     * @param filters  ფილტრი (status, from, to, buyerTin)
     * @param intervalMs ინტერვალი, default: 5 წუთი
     *
     * @example
     *   rsgeService.startAutoSync((waybills) => setWaybills(waybills));
     */
    startAutoSync(
        onUpdate: (waybills: RSGEWaybillRecord[]) => void,
        filters: RsgeWaybillFilters = {},
        intervalMs = 5 * 60 * 1000
    ): void {
        if (_autoSyncInterval) this.stopAutoSync();

        const sync = async () => {
            if (!isRSGEConfigured()) return;
            try {
                const res = await this.getWaybills(filters);
                if (res.success && res.waybills) {
                    onUpdate(res.waybills as RSGEWaybillRecord[]);
                }
            } catch {
                console.warn("[RS.GE AutoSync] Sync failed — will retry next interval.");
            }
        };

        sync(); // პირველი გამოძახება დაუყოვნებლივ
        _autoSyncInterval = setInterval(sync, intervalMs);
        console.log(`[RS.GE AutoSync] Started — interval: ${intervalMs / 1000}s`);
    },

    stopAutoSync(): void {
        if (_autoSyncInterval) {
            clearInterval(_autoSyncInterval);
            _autoSyncInterval = null;
            console.log("[RS.GE AutoSync] Stopped.");
        }
    },

    isAutoSyncRunning(): boolean {
        return _autoSyncInterval !== null;
    },
};
