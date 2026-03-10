/**
 * RS.GE Session Manager — SERVER ONLY
 *
 * ეს მოდული მართავს RS.GE-ს session ID (suid)-ს სიცოცხლის ციკლს.
 * suid **არასდროს** გადაეცემა კლიენტს — ინახება მხოლოდ სერვერ-მხარეს.
 *
 * გამოყენება:
 *   import { rsgeSession } from "@/lib/rsge-session";  // Server Actions / API Routes ONLY
 */

import type { RsgeSessionState } from "./rsge-types";
import { RsgeErrorCode } from "./rsge-types";

// სესიის სიცოცხლის ხანგრძლივობა — RS.GE-ს session 8 საათი გრძელდება.
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 hours
// სესიის განახლება 30 წუთი ადრე ვადის გასვლამდე
const REFRESH_BEFORE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// In-memory registry (Next.js Edge Runtime-ისთვის Map-ი საკმარისია)
// Multi-instance deploy-ისთვის შეიცვალოთ Redis-ით.
const sessionStore: Map<string, RsgeSessionState> = new Map();

// ─────────────────────────────────────────────────────────────
// SOAP Helper (Server-side only)
// ─────────────────────────────────────────────────────────────

const IS_PROD = process.env.NODE_ENV === "production";
const RSGE_BASE_URL = IS_PROD
    ? "http://services.rs.ge/WayBillService/WayBillService.asmx"
    : "http://testservices.rs.ge/WayBillService/WayBillService.asmx";

function buildEnvelope(method: string, body: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <${method} xmlns="http://tempuri.org/">
      ${body}
    </${method}>
  </soap12:Body>
</soap12:Envelope>`;
}

function extractTag(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, "s"));
    return match ? match[1].trim() : "";
}

/**
 * RS.GE-ს session-related შეცდომების პარსინგი XML-დან.
 */
function detectSessionError(xml: string): RsgeErrorCode | null {
    if (xml.includes("AuthorizationException") || xml.includes("Invalid user")) {
        return RsgeErrorCode.AUTH_FAILED;
    }
    if (xml.includes("SessionExpiredException") || xml.includes("session expired")) {
        return RsgeErrorCode.SESSION_EXPIRED;
    }
    if (xml.includes("PermissionDeniedException")) {
        return RsgeErrorCode.PERMISSION_DENIED;
    }
    return null;
}

async function callSoap(
    method: string,
    body: string,
    timeoutMs = 10000
): Promise<{ ok: boolean; xml: string; errorCode?: RsgeErrorCode; error?: string }> {
    try {
        const resp = await fetch(RSGE_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8",
                SOAPAction: `http://tempuri.org/${method}`,
            },
            body: buildEnvelope(method, body),
            signal: AbortSignal.timeout(timeoutMs),
        });

        const xml = await resp.text();

        const sessionErr = detectSessionError(xml);
        if (sessionErr) {
            return { ok: false, xml, errorCode: sessionErr, error: sessionErr };
        }

        if (xml.includes("<faultstring>")) {
            const fault = extractTag(xml, "faultstring");
            return { ok: false, xml, error: fault };
        }

        if (!resp.ok) {
            return {
                ok: false,
                xml,
                error: `HTTP ${resp.status}: ${resp.statusText}`,
            };
        }

        return { ok: true, xml };
    } catch (e: unknown) {
        const error = e instanceof Error ? e.message : "Unknown error";
        const isTimeout =
            e instanceof Error &&
            (e.name === "TimeoutError" || e.message.includes("timeout"));
        return {
            ok: false,
            xml: "",
            errorCode: isTimeout ? RsgeErrorCode.NETWORK_ERROR : RsgeErrorCode.UNKNOWN,
            error: isTimeout ? "კავშირის ვადა ამოიწურა (timeout)" : error,
        };
    }
}

// ─────────────────────────────────────────────────────────────
// Session Manager
// ─────────────────────────────────────────────────────────────

class RsgeSessionManager {
    /**
     * RS.GE-ზე login-ი — ამაბრუნებს suid-ს სერვერ-მხარეს.
     * @throws Error თუ ავტორიზაცია ვერ მოხდება
     */
    async login(username: string, password: string): Promise<string> {
        const body = `<su>${username}</su><sp>${password}</sp>`;
        const result = await callSoap("get_session_id", body);

        if (!result.ok) {
            // RS.GE-ს ზოგი ვერსია პირდაპირ username/password-ით მუშაობს (ბრძანების-based).
            // სესიის ID-ს ვერ ამოიღებს — ვატარებთ validation-only ტესტს.
            throw new Error(result.error || "RS.GE login ვერ მოხდა");
        }

        const suid = extractTag(result.xml, "get_session_idResult") || extractTag(result.xml, "suid");

        if (!suid) {
            // RS.GE-ს ზოგი endpoint-ი session-ის მაგივრად პირდაპირ username/password ახდენს validate-ს.
            // ასეთ შემთხვევაში ვინახავთ username-ს session-ის ნაცვლად.
            const fallbackKey = `${username}:${Date.now()}`;
            const session: RsgeSessionState = {
                suid: fallbackKey,
                username,
                createdAt: Date.now(),
                expiresAt: Date.now() + SESSION_LIFETIME_MS,
            };
            sessionStore.set(username, session);
            return fallbackKey;
        }

        const session: RsgeSessionState = {
            suid,
            username,
            createdAt: Date.now(),
            expiresAt: Date.now() + SESSION_LIFETIME_MS,
        };
        sessionStore.set(username, session);
        console.log(`[RS.GE] Session created for user: ${username}`);
        return suid;
    }

    /**
     * username-ისთვის აქტიური session-ის ამოღება.
     * თუ სესია გაძველებულია — null.
     */
    getSession(username: string): RsgeSessionState | null {
        const session = sessionStore.get(username);
        if (!session) return null;

        if (Date.now() >= session.expiresAt) {
            sessionStore.delete(username);
            console.warn(`[RS.GE] Session expired for user: ${username}`);
            return null;
        }

        return session;
    }

    /**
     * შეამოწმება — სჭირდება თუ არა session-ის განახლება (30 წუთი ადრე).
     */
    needsRefresh(username: string): boolean {
        const session = sessionStore.get(username);
        if (!session) return true;
        return Date.now() >= session.expiresAt - REFRESH_BEFORE_EXPIRY_MS;
    }

    /**
     * Session-ის ინვალიდირება (logout).
     */
    invalidate(username: string): void {
        sessionStore.delete(username);
        console.log(`[RS.GE] Session invalidated for user: ${username}`);
    }

    /**
     * ყველა ამოვარდნილი session-ის გასუფთავება.
     */
    cleanupExpired(): void {
        const now = Date.now();
        for (const [key, session] of sessionStore.entries()) {
            if (now >= session.expiresAt) {
                sessionStore.delete(key);
            }
        }
    }
}

// Singleton export — Server Actions/API Routes-ში გამოყენებისთვის
export const rsgeSession = new RsgeSessionManager();

// ─────────────────────────────────────────────────────────────
// Exported SOAP caller (for use in API routes)
// ─────────────────────────────────────────────────────────────

export { callSoap, extractTag, RSGE_BASE_URL };
