import { NextRequest, NextResponse } from "next/server";
import { callSoap, extractTag } from "@/lib/rsge-session";

const RSGE_URL_PROD = "http://services.rs.ge/WayBillService/WayBillService.asmx";
const ORG_CHECK_URL = "http://services.rs.ge/WayBillService/WayBillService.asmx"; // same WSDL

/**
 * GET /api/rsge/test
 *
 * Actions:
 *  - (default)           — კავშირის ტესტი (credentials validation)
 *  - ?action=check_organization&tin=XXX — ორგანიზაციის შემოწმება ს/ნ-ით
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action") || "test";
    const username = process.env.RSGE_USERNAME || searchParams.get("username") || "";
    const password = process.env.RSGE_PASSWORD || searchParams.get("password") || "";

    // ──────────────────────────────────────────────────────────
    // checkOrganization — ს/ნ-ით ორგანიზაციის შემოწმება
    // ──────────────────────────────────────────────────────────
    if (action === "check_organization") {
        const tin = searchParams.get("tin") || "";

        if (!tin) {
            return NextResponse.json({ success: false, error: "tin პარამეტრი სავალდებულოა" }, { status: 400 });
        }

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: "RS.GE credentials კონფიგურირებული არ არის." },
                { status: 500 }
            );
        }

        try {
            // RS.GE: check_tin_in_wbs SOAP მეთოდი — საიდენტიფიკაციო ნომრის შემოწმება
            const soapBody = `<su>${username}</su><sp>${password}</sp><tin>${tin}</tin>`;
            const result = await callSoap("check_tin_in_wbs", soapBody, 8000);

            if (!result.ok) {
                return NextResponse.json({
                    success: false,
                    error: result.error || "ორგანიზაცია ვერ მოიძებნა",
                    errorCode: result.errorCode,
                });
            }

            // XML პასუხის პარსინგი
            const orgName = extractTag(result.xml, "NAME") || extractTag(result.xml, "org_name") || "";
            const isVatPayer = result.xml.includes("<is_vat_payer>true</is_vat_payer>") ||
                result.xml.includes("<VAT_PAYER>1</VAT_PAYER>");
            const address = extractTag(result.xml, "ADDRESS") || extractTag(result.xml, "legal_address") || "";

            // check_tin_in_wbs-ის 1 = ვალიდური, 0 = არა
            const resultCode = extractTag(result.xml, "check_tin_in_wbsResult");
            const isValid = resultCode === "1" || resultCode === "true" || !!orgName;

            if (!isValid && !orgName) {
                return NextResponse.json({
                    success: false,
                    error: `ს/ნ ${tin} — RS.GE-ს ბაზაში ვერ მოიძებნა.`,
                });
            }

            return NextResponse.json({
                success: true,
                organization: {
                    tin,
                    name: orgName || `ორგანიზაცია (${tin})`,
                    address,
                    isVatPayer,
                    isActive: isValid,
                },
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Server error";
            return NextResponse.json({ success: false, error: msg }, { status: 500 });
        }
    }

    // ──────────────────────────────────────────────────────────
    // default — კავშირის ტესტი (credentials validation)
    // ──────────────────────────────────────────────────────────
    if (!username || !password) {
        return NextResponse.json(
            { success: false, error: "Username და password სავალდებულოა." },
            { status: 400 }
        );
    }

    try {
        const soapBody = `
      <su>${username}</su>
      <sp>${password}</sp>
      <type>0</type>
      <buyer_tin></buyer_tin>
      <status></status>
      <create_date_from></create_date_from>
      <create_date_to></create_date_to>
    `;

        const result = await callSoap("get_waybills", soapBody, 8000);

        if (!result.ok) {
            return NextResponse.json({
                success: false,
                error: result.error || "RS.GE ავტორიზაცია ვერ მოხდა",
                errorCode: result.errorCode,
            });
        }

        return NextResponse.json({
            success: true,
            message: "RS.GE კავშირი წარმატებულია.",
            sessionActive: true,
        });
    } catch (e: unknown) {
        const isTimeout = e instanceof Error && e.name === "TimeoutError";
        const msg = isTimeout ? "კავშირის ვადა ამოიწურა (timeout)" : (e instanceof Error ? e.message : "Error");
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
