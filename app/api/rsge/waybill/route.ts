import { NextRequest, NextResponse } from "next/server";
import { callSoap, extractTag, RSGE_BASE_URL } from "@/lib/rsge-session";

const IS_PROD = process.env.NODE_ENV === "production";
const RSGE_URL = IS_PROD
    ? "http://services.rs.ge/WayBillService/WayBillService.asmx"
    : "http://testservices.rs.ge/WayBillService/WayBillService.asmx";

// ─────────────────────────────────────────────────────────────
// Idempotency Registry (In-Memory — Redis-ით შეიცვალოს Prod-ში)
// ─────────────────────────────────────────────────────────────

const idempotencyRegistry = new Map<string, unknown>();

// ─────────────────────────────────────────────────────────────
// SOAP Envelope Builders
// ─────────────────────────────────────────────────────────────

function buildWaybillXml(params: {
    sellerTin?: string;
    buyerTin?: string;
    buyerName?: string;
    deliveryAddress?: string;
    carNumber?: string;
    waybillType?: number;
    items?: Array<{ productName: string; quantity: number; unit: string; price: number; barcode?: string }>;
}): string {
    const now = new Date().toISOString();
    const itemsXml = (params.items || [])
        .map(
            (item) => `
    <goods>
      <name>${escapeXml(item.productName)}</name>
      <quantity>${item.quantity}</quantity>
      <unit_of_quantity>${escapeXml(item.unit || "ც")}</unit_of_quantity>
      <price>${item.price}</price>
      <bar_code>${item.barcode || ""}</bar_code>
    </goods>`
        )
        .join("");

    return `
    <begin_date>${now}</begin_date>
    <end_date>${now}</end_date>
    <delivery_date>${now}</delivery_date>
    <type>${params.waybillType ?? 1}</type>
    <seller_type>1</seller_type>
    <seller_tin>${params.sellerTin || ""}</seller_tin>
    <buyer_type>1</buyer_type>
    <buyer_tin>${params.buyerTin || ""}</buyer_tin>
    <buyer_name>${escapeXml(params.buyerName || "")}</buyer_name>
    <start_address>მაღაზია</start_address>
    <end_address>${escapeXml(params.deliveryAddress || "")}</end_address>
    <transportation_cost_payer>1</transportation_cost_payer>
    <driver_tin></driver_tin>
    <car_number>${escapeXml(params.carNumber || "")}</car_number>
    <goods_list>${itemsXml}</goods_list>
  `;
}

function buildFiscalReceiptXml(params: Record<string, unknown>): string {
    const items = (params.items as Array<{ productName: string; quantity: number; price: number }>) || [];
    const itemsXml = items
        .map(
            (item) => `
    <item>
      <name>${escapeXml(item.productName)}</name>
      <qty>${item.quantity}</qty>
      <price>${item.price}</price>
    </item>`
        )
        .join("");
    return `
    <receipt>
        <total>${params.totalValue}</total>
        <payment_method>${params.paymentMethod}</payment_method>
        <items>${itemsXml}</items>
    </receipt>`;
}

/** XML Injection Prevention */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

// ─────────────────────────────────────────────────────────────
// XML Response Parsers
// ─────────────────────────────────────────────────────────────

function parseWaybillListXml(xml: string): Record<string, string>[] {
    const items: Record<string, string>[] = [];
    const waybillRegex = /<Table[^>]*>([\s\S]*?)<\/Table>/g;
    let match;

    while ((match = waybillRegex.exec(xml)) !== null) {
        const tableXml = match[1];
        items.push({
            id: extractTag(tableXml, "ID"),
            w_id: extractTag(tableXml, "W_ID"),
            type: extractTag(tableXml, "TYPE"),
            status: extractTag(tableXml, "STATUS"),
            buyerTin: extractTag(tableXml, "BUYER_TIN"),
            buyerName: extractTag(tableXml, "BUYER_NAME"),
            sellerTin: extractTag(tableXml, "SELLER_TIN"),
            sellerName: extractTag(tableXml, "SELLER_NAME"),
            createDate: extractTag(tableXml, "CREATE_DATE"),
            beginDate: extractTag(tableXml, "BEGIN_DATE"),
            deliveryDate: extractTag(tableXml, "DELIVERY_DATE"),
            fullAmount: extractTag(tableXml, "FULL_AMOUNT"),
            waybillNumber: extractTag(tableXml, "WAYBILL_NUMBER"),
        });
    }

    return items;
}

function parseWaybillDetailsXml(xml: string): Record<string, string>[] {
    const goods: Record<string, string>[] = [];
    const goodsRegex = /<Table[^>]*>([\s\S]*?)<\/Table>/g;
    let match;

    while ((match = goodsRegex.exec(xml)) !== null) {
        const tableXml = match[1];
        const name = extractTag(tableXml, "GOODS_NAME");
        if (name) {
            goods.push({
                id: extractTag(tableXml, "ID"),
                name,
                unit: extractTag(tableXml, "UNIT_ID"),
                unitName: extractTag(tableXml, "UNIT_NAME"),
                quantity: extractTag(tableXml, "QUANTITY"),
                price: extractTag(tableXml, "PRICE"),
                amount: extractTag(tableXml, "AMOUNT"),
                barcode: extractTag(tableXml, "BAR_CODE") || extractTag(tableXml, "BARCODE"),
            });
        }
    }
    return goods;
}

// ─────────────────────────────────────────────────────────────
// POST /api/rsge/waybill
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const { action, idempotencyKey, username: reqUsername, password: reqPassword, ...params } = await req.json();

        // Security: env-variables მიიღება პრიორიტეტით, შემდეგ request body-დან
        const username = process.env.RSGE_USERNAME || reqUsername;
        const password = process.env.RSGE_PASSWORD || reqPassword;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: "RS.GE credentials კონფიგურირებული არ არის. შეიყვანეთ პარამეტრები ადმინ პანელში." },
                { status: 500 }
            );
        }

        // Idempotency Check
        if (idempotencyKey && idempotencyRegistry.has(idempotencyKey)) {
            console.log(`[RS.GE] Idempotency hit for key: ${idempotencyKey}`);
            return NextResponse.json(idempotencyRegistry.get(idempotencyKey));
        }

        let soapBody = "";
        let soapMethod = "";

        switch (action) {
            case "save_waybill": {
                soapMethod = "save_waybill";
                const waybillXml = buildWaybillXml(params);
                soapBody = `<su>${username}</su><sp>${password}</sp><waybill>${waybillXml}</waybill>`;
                break;
            }

            case "del_waybill": {
                soapMethod = "del_waybill";
                soapBody = `<su>${username}</su><sp>${password}</sp><waybill_id>${params.waybillId}</waybill_id>`;
                break;
            }

            case "confirm_waybill": {
                soapMethod = "confirm_waybill";
                soapBody = `<su>${username}</su><sp>${password}</sp><waybill_id>${params.waybillId}</waybill_id>`;
                break;
            }

            case "activate_waybill": {
                // RS.GE-ზე activate = confirm + transport start (status → 1)
                soapMethod = "confirm_waybill";
                soapBody = `<su>${username}</su><sp>${password}</sp><waybill_id>${params.waybillId}</waybill_id>`;
                break;
            }

            case "reject_waybill": {
                soapMethod = "reject_waybill";
                soapBody = `<su>${username}</su><sp>${password}</sp><waybill_id>${params.waybillId}</waybill_id><comment>${escapeXml(params.comment || "")}</comment>`;
                break;
            }

            case "close_waybill": {
                soapMethod = "close_waybill";
                soapBody = `<su>${username}</su><sp>${password}</sp><waybill_id>${params.waybillId}</waybill_id>`;
                break;
            }

            case "save_fiscal_receipt": {
                const fiscalXml = buildFiscalReceiptXml(params);
                console.log("[Fiscal] RS.GE XML:", fiscalXml.substring(0, 200));

                // Simulation — Real fiscal device endpoint differs by provider
                const mockReceiptNumber = `RS-${Math.floor(Math.random() * 899999 + 100000)}`;
                if (idempotencyKey) {
                    idempotencyRegistry.set(idempotencyKey, { success: true, receiptNumber: mockReceiptNumber });
                }
                return NextResponse.json({ success: true, receiptNumber: mockReceiptNumber });
            }

            case "get_waybill": {
                soapMethod = "get_waybill";
                soapBody = `<su>${username}</su><sp>${password}</sp><waybill_id>${params.waybillId}</waybill_id>`;
                const result = await callSoap(soapMethod, soapBody);
                if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 502 });
                const goods = parseWaybillDetailsXml(result.xml);
                return NextResponse.json({ success: true, goods });
            }

            default:
                return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
        }

        const result = await callSoap(soapMethod, soapBody);

        if (!result.ok) {
            return NextResponse.json({ success: false, error: result.error, errorCode: result.errorCode }, { status: 502 });
        }

        const responseData: Record<string, unknown> = { success: true };

        if (action === "save_waybill") {
            const waybillId = extractTag(result.xml, "save_waybillResult");
            responseData.waybillId = waybillId;
        }

        if (idempotencyKey) {
            idempotencyRegistry.set(idempotencyKey, responseData);
        }

        return NextResponse.json(responseData);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────
// GET /api/rsge/waybill — ზედნადებების სია
// ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const status = searchParams.get("status") || "";
        const fromDate = searchParams.get("from") || "";
        const toDate = searchParams.get("to") || "";
        const buyerTin = searchParams.get("buyerTin") || "";

        const username = process.env.RSGE_USERNAME || searchParams.get("username") || "";
        const password = process.env.RSGE_PASSWORD || searchParams.get("password") || "";

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: "RS.GE credentials კონფიგურირებული არ არის.", waybills: [] },
                { status: 500 }
            );
        }

        const soapBody = `
      <su>${username}</su>
      <sp>${password}</sp>
      <type>0</type>
      <buyer_tin>${buyerTin}</buyer_tin>
      <status>${status}</status>
      <create_date_from>${fromDate}</create_date_from>
      <create_date_to>${toDate}</create_date_to>
    `;

        const result = await callSoap("get_waybills", soapBody);

        if (!result.ok) {
            return NextResponse.json({ success: false, error: result.error, waybills: [] }, { status: 502 });
        }

        const items = parseWaybillListXml(result.xml);
        return NextResponse.json({ success: true, waybills: items });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        return NextResponse.json({ success: false, error: msg, waybills: [] }, { status: 500 });
    }
}
