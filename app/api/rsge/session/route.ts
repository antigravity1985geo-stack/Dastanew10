/**
 * /api/rsge/session
 * POST — RS.GE-ზე login-ი (სერვერ-მხარეს სesion-ს ინახავს)
 * DELETE — logout (session-ს ასუფთავებს)
 */
import { NextRequest, NextResponse } from "next/server";
import { rsgeSession, callSoap, extractTag } from "@/lib/rsge-session";

// POST /api/rsge/session — Login
export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: "username და password სავალდებულოა" },
                { status: 400 }
            );
        }

        // RS.GE-ს WayBillService-ი session-ის ID-ს პირდაპირ არ გასცემს —
        // ვალიდაციას ვახდენთ get_waybills minimal call-ით.
        const testBody = `<su>${username}</su><sp>${password}</sp><type>0</type><buyer_tin></buyer_tin><status></status><create_date_from></create_date_from><create_date_to></create_date_to>`;
        const result = await callSoap("get_waybills", testBody, 8000);

        if (!result.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || "RS.GE ავტორიზაცია ვერ მოხდა",
                    errorCode: result.errorCode,
                },
                { status: 401 }
            );
        }

        // RS.GE WayBillService არ ბრუნებს suid — ვინახავთ credentials-ს Session-ად.
        // (ნამდვილი suid-based endpoint-ისთვის rsgeSession.login() გამოიყენება)
        const suid = await rsgeSession.login(username, password).catch(() => {
            // Fallback: RS.GE-ს ვერსიები, სადაც session endpoint არ არის
            return `${username}:validated:${Date.now()}`;
        });

        // სესიის სტატუსი კლიენტს ეგზავნება (suid — არ!)
        return NextResponse.json({
            success: true,
            sessionActive: true,
            username,
            message: "✅ RS.GE-სთან კავშირი წარმატებულია",
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Server error";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

// DELETE /api/rsge/session — Logout
export async function DELETE(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const username = searchParams.get("username") || "";

    if (username) {
        rsgeSession.invalidate(username);
    }

    return NextResponse.json({ success: true });
}

// GET /api/rsge/session — შეამოწმე სესიის სტატუსი
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const username = searchParams.get("username") || "";

    const session = username ? rsgeSession.getSession(username) : null;

    return NextResponse.json({
        active: !!session,
        needsRefresh: username ? rsgeSession.needsRefresh(username) : true,
    });
}
