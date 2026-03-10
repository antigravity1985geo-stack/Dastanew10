/**
 * lib/rsge-actions.ts — RS.GE Server Actions
 *
 * Next.js Server Actions ("use server") — ჯავა სკრიპტის კოდი
 * კლიენტიდან ამ ფუნქციების გამოძახება შესაძლებელია პირდაპირ,
 * მაგრამ ისინი გაეშვება სერვერ-მხარეს — credentials გარეთ არ გადის.
 *
 * გამოყენება:
 *   import { serverCheckOrganization } from "@/lib/rsge-actions";
 *   const org = await serverCheckOrganization("202123456");
 */

"use server";

import { callSoap, extractTag, rsgeSession } from "./rsge-session";
import type { RsgeOrganizationResponse, RsgeLoginResponse, RsgeBaseResponse } from "./rsge-types";
import { RsgeErrorCode } from "./rsge-types";

// ─────────────────────────────────────────────────────────────
// Server Action: Login
// ─────────────────────────────────────────────────────────────

/**
 * RS.GE-ზე login — suid სერვერ-მხარეს ინახება.
 * კლიენტი მხოლოდ { success, sessionActive } ღებულობს.
 */
export async function serverLogin(username: string, password: string): Promise<RsgeLoginResponse> {
    if (!username || !password) {
        return { success: false, error: "username და password სავალდებულოა" };
    }

    try {
        // Validate credentials via get_waybills minimal call
        const soapBody = `<su>${username}</su><sp>${password}</sp><type>0</type><buyer_tin></buyer_tin><status></status><create_date_from></create_date_from><create_date_to></create_date_to>`;
        const result = await callSoap("get_waybills", soapBody, 8000);

        if (!result.ok) {
            return {
                success: false,
                error: result.error || "RS.GE ავტორიზაცია ვერ მოხდა",
                errorCode: result.errorCode,
            };
        }

        // Store session server-side (suid never leaves server)
        await rsgeSession.login(username, password).catch(() => {
            // RS.GE WayBillService doesn't return a suid token — credentials are validated per-request
            // Session store is used for tracking validity
        });

        return { success: true, sessionActive: true };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        return { success: false, error: msg, errorCode: RsgeErrorCode.NETWORK_ERROR };
    }
}

// ─────────────────────────────────────────────────────────────
// Server Action: checkOrganization — "Hello World"
// ─────────────────────────────────────────────────────────────

/**
 * ✅ Hello World — ს/ნ-ით ორგანიზაციის შემოწმება.
 *
 * RS.GE-ს check_tin_in_wbs SOAP მეთოდი.
 * suid / credentials კლიენტამდე ვერ მიდის.
 *
 * @example (Client Component)
 *   "use client";
 *   import { serverCheckOrganization } from "@/lib/rsge-actions";
 *
 *   const org = await serverCheckOrganization("202123456");
 *   console.log(org.organization?.name); // → "კომპანია შპს"
 */
export async function serverCheckOrganization(
    tin: string,
    username?: string,
    password?: string
): Promise<RsgeOrganizationResponse> {
    const user = username || process.env.RSGE_USERNAME || "";
    const pass = password || process.env.RSGE_PASSWORD || "";

    if (!tin?.trim()) {
        return { success: false, error: "ს/ნ სავალდებულოა", errorCode: RsgeErrorCode.INVALID_TIN };
    }

    if (!user || !pass) {
        return { success: false, error: "RS.GE credentials კონფიგურირებული არ არის." };
    }

    try {
        const soapBody = `<su>${user}</su><sp>${pass}</sp><tin>${tin.trim()}</tin>`;
        const result = await callSoap("check_tin_in_wbs", soapBody, 8000);

        if (!result.ok) {
            return {
                success: false,
                error: result.error || "ორგანიზაცია ვერ მოიძებნა",
                errorCode: result.errorCode,
            };
        }

        const resultCode = extractTag(result.xml, "check_tin_in_wbsResult");
        const orgName = extractTag(result.xml, "NAME") || extractTag(result.xml, "org_name") || "";
        const address = extractTag(result.xml, "ADDRESS") || extractTag(result.xml, "legal_address") || "";
        const isVatPayer =
            result.xml.includes("<VAT_PAYER>1</VAT_PAYER>") ||
            result.xml.includes("<is_vat_payer>true</is_vat_payer>");

        const isValid = resultCode === "1" || resultCode === "true" || !!orgName;

        if (!isValid) {
            return {
                success: false,
                error: `ს/ნ ${tin} RS.GE-ს ბაზაში ვერ მოიძებნა.`,
                errorCode: RsgeErrorCode.NOT_FOUND,
            };
        }

        return {
            success: true,
            organization: {
                tin: tin.trim(),
                name: orgName || `ს/ნ: ${tin}`,
                address,
                isVatPayer,
                isActive: true,
            },
        };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        return { success: false, error: msg, errorCode: RsgeErrorCode.NETWORK_ERROR };
    }
}

// ─────────────────────────────────────────────────────────────
// Server Action: Logout
// ─────────────────────────────────────────────────────────────

export async function serverLogout(username: string): Promise<RsgeBaseResponse> {
    rsgeSession.invalidate(username);
    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Server Action: Session Status
// ─────────────────────────────────────────────────────────────

export async function serverGetSessionStatus(username: string): Promise<{
    active: boolean;
    needsRefresh: boolean;
}> {
    return {
        active: !!rsgeSession.getSession(username),
        needsRefresh: rsgeSession.needsRefresh(username),
    };
}
