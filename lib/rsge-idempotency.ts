/**
 * lib/rsge-idempotency.ts — RS.GE Idempotency Store
 *
 * Check-before-Send პრინციპი:
 * 1. ზედნადების გაგზავნამდე → ამოწმებს კი უკვე გაიგზავნა ეს `idempotencyKey`?
 * 2. თუ კი → დაუყოვნებლივ აბრუნებს cached waybillId-ს (SOAP-ს არ გამოიძახებს)
 * 3. თუ არა → გაგზავნის, შეინახავს შედეგს
 *
 * ინახება Supabase-ში (persistრენტული) + In-Memory ადგილობრივი cache.
 * სერვერის რესტარტის შემდეგ RS.GE-ზე დუბლიკატი ვერ გაიგზავნება.
 */

import { supabase } from "./supabase";

interface IdempotencyRecord {
    key: string;
    waybillId: string;
    status: "success" | "failed";
    createdAt: string;
    expiresAt: string;
}

// In-Memory L1 cache — სწრაფი შემოწმება (Supabase-მდე არ მიდის)
const memCache = new Map<string, IdempotencyRecord>();

// Idempotency-ის ვადა — 48 საათი (RS.GE-ს ზედნადების შექმნის window)
const TTL_MS = 48 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export const rsgeIdempotency = {
    /**
     * Check-before-Send:
     * შეამოწმე — კი უკვე გაიგზავნა ეს ზედნადები?
     * @returns waybillId თუ უკვე გაიგზავნა, null თუ ახალია
     */
    async check(key: string): Promise<string | null> {
        if (!key) return null;

        // L1: in-memory cache
        const cached = memCache.get(key);
        if (cached && cached.status === "success") {
            if (new Date(cached.expiresAt).getTime() > Date.now()) {
                console.log(`[Idempotency] L1 cache HIT for key: ${key} → ${cached.waybillId}`);
                return cached.waybillId;
            } else {
                memCache.delete(key);
            }
        }

        // L2: Supabase persistent store
        try {
            const { data } = await supabase
                .from("rsge_idempotency")
                .select("waybill_id, status, expires_at")
                .eq("key", key)
                .eq("status", "success")
                .single();

            if (data && new Date(data.expires_at).getTime() > Date.now()) {
                const record: IdempotencyRecord = {
                    key,
                    waybillId: data.waybill_id,
                    status: "success",
                    createdAt: "",
                    expiresAt: data.expires_at,
                };
                memCache.set(key, record); // populate L1 cache
                console.log(`[Idempotency] L2 Supabase HIT for key: ${key} → ${data.waybill_id}`);
                return data.waybill_id;
            }
        } catch {
            // Supabase unavailable → fallback to send (safe — RS.GE-ს SOAP-ს სხვა idempotency აქვს)
        }

        return null;
    },

    /**
     * წარმატებული გაგზავნის შედეგის შენახვა.
     */
    async markSuccess(key: string, waybillId: string): Promise<void> {
        if (!key || !waybillId) return;

        const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
        const record: IdempotencyRecord = {
            key,
            waybillId,
            status: "success",
            createdAt: new Date().toISOString(),
            expiresAt,
        };

        // L1 cache update
        memCache.set(key, record);

        // L2 Supabase persist (fire-and-forget)
        supabase
            .from("rsge_idempotency")
            .upsert({
                key,
                waybill_id: waybillId,
                status: "success",
                created_at: record.createdAt,
                expires_at: expiresAt,
            })
            .then(({ error }) => {
                if (error) {
                    console.warn("[Idempotency] Supabase persist failed:", error.message);
                }
            });
    },

    /**
     * Cache გასუფთავება (optional — ვადა გასულია)
     */
    cleanupExpired(): void {
        const now = Date.now();
        for (const [key, record] of memCache.entries()) {
            if (new Date(record.expiresAt).getTime() < now) {
                memCache.delete(key);
            }
        }
    },

    /**
     * In-memory cache-ის ზომა (debugging)
     */
    cacheSize(): number {
        return memCache.size;
    },
};
