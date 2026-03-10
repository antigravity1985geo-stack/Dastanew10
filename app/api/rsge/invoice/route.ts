import { NextRequest, NextResponse } from "next/server";

const RSGE_INVOICE_URL = "http://services.rs.ge/WayBillService/WayBillService.asmx";

function buildSoapEnvelope(methodName: string, body: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <${methodName} xmlns="http://tempuri.org/">
      ${body}
    </${methodName}>
  </soap12:Body>
</soap12:Envelope>`;
}

function extractTag(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, "s"));
    return match ? match[1].trim() : "";
}

async function callSoap(action: string, body: string) {
    const envelope = buildSoapEnvelope(action, body);
    const response = await fetch(RSGE_INVOICE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
            SOAPAction: `http://tempuri.org/${action}`,
        },
        body: envelope,
    });
    const xml = await response.text();
    if (xml.includes("<faultstring>")) {
        throw new Error(extractTag(xml, "faultstring"));
    }
    return xml;
}

// POST /api/rsge/invoice
// Body: { action, username, password, waybillId?, invoiceId?, ...saleData }
export async function POST(req: NextRequest) {
    try {
        const { action, username, password, ...params } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ success: false, error: "RS.GE credentials are missing." }, { status: 400 });
        }

        switch (action) {
            case "save_invoice": {
                // Create tax invoice linked to a waybill
                const soapBody = `
          <su>${username}</su>
          <sp>${password}</sp>
          <waybill_id>${params.waybillId}</waybill_id>
          <in_inv_id>0</in_inv_id>
        `;
                const xml = await callSoap("save_invoice", soapBody);
                const invoiceId = extractTag(xml, "save_invoiceResult");
                return NextResponse.json({ success: true, invoiceId });
            }

            case "del_invoice": {
                const soapBody = `
          <su>${username}</su>
          <sp>${password}</sp>
          <invoice_id>${params.invoiceId}</invoice_id>
        `;
                await callSoap("del_invoice", soapBody);
                return NextResponse.json({ success: true });
            }

            case "save_standalone_invoice": {
                // Invoice without a waybill (standalone, e.g. for services)
                const itemsXml = (params.items || [])
                    .map(
                        (item: { name: string; quantity: number; price: number; vatRate?: number }) => `
          <invoice_items>
            <name>${item.name}</name>
            <quantity>${item.quantity}</quantity>
            <price>${item.price}</price>
            <vat_rate>${item.vatRate ?? 18}</vat_rate>
          </invoice_items>`
                    )
                    .join("");

                const soapBody = `
          <su>${username}</su>
          <sp>${password}</sp>
          <buyer_tin>${params.buyerTin || ""}</buyer_tin>
          <buyer_name>${params.buyerName || ""}</buyer_name>
          <invoice_date>${new Date().toISOString()}</invoice_date>
          <invoice_items_list>${itemsXml}</invoice_items_list>
        `;
                const xml = await callSoap("save_invoice", soapBody);
                const invoiceId = extractTag(xml, "save_invoiceResult");
                return NextResponse.json({ success: true, invoiceId });
            }

            default:
                return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
