// Invoice generator - creates printable invoices
import { settingsStore } from "@/lib/settings";
import type { Sale, Expense } from "@/lib/store";

export interface InvoiceData {
  sale: Sale;
  invoiceNumber: string;
  purchasePrice?: number;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `INV-${year}${month}${day}-${random}`;
}

export function printInvoice(sale: Sale, purchasePrice?: number) {
  const invoiceNumber = generateInvoiceNumber();
  const settings = settingsStore.getSettings();
  const companyName = settings.companyName || "DASTA CLOUD JR";
  const currency = settings.currency || "₾";

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ინვოისი ${invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 32px;
          color: #1a1a2e;
          font-size: 14px;
          line-height: 1.5;
        }
        .invoice-container { max-width: 780px; margin: 0 auto; }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #2c3e7a;
          padding-bottom: 20px;
          margin-bottom: 28px;
        }
        .company-name { font-size: 22px; font-weight: 700; color: #2c3e7a; }
        .company-sub { font-size: 12px; color: #666; margin-top: 4px; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 28px; font-weight: 700; color: #2c3e7a; letter-spacing: 1px; }
        .invoice-number { font-size: 13px; color: #555; margin-top: 4px; }
        .invoice-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 28px;
        }
        .meta-section h3 {
          font-size: 11px;
          text-transform: uppercase;
          color: #888;
          letter-spacing: 1px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .meta-section p { font-size: 14px; line-height: 1.7; }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 28px;
        }
        .items-table th {
          background: #2c3e7a;
          color: #fff;
          padding: 10px 14px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .items-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        .items-table tr:nth-child(even) td { background: #f8f9fc; }
        .text-right { text-align: right; }
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 32px;
        }
        .totals-table {
          width: 280px;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 8px 14px;
          font-size: 14px;
        }
        .totals-table .total-row td {
          border-top: 2px solid #2c3e7a;
          font-weight: 700;
          font-size: 16px;
          padding-top: 12px;
          color: #2c3e7a;
        }
        .totals-table .label { color: #666; }
        .footer {
          text-align: center;
          border-top: 1px solid #ddd;
          padding-top: 20px;
          color: #888;
          font-size: 12px;
        }
        .footer p { margin-bottom: 4px; }
        .stamp-area {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          margin: 32px 0;
        }
        .stamp-box {
          border-top: 1px dashed #ccc;
          padding-top: 8px;
          text-align: center;
          font-size: 12px;
          color: #888;
        }
        @media print {
          body { padding: 16px; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div>
            <div class="company-name">${companyName}</div>
            <div class="company-sub">DASTA CLOUD JR - Digital SaaS</div>
          </div>
          <div class="invoice-title">
            <h1>ინვოისი</h1>
            <div class="invoice-number">${invoiceNumber}</div>
          </div>
        </div>

        <div class="invoice-meta">
          <div class="meta-section">
            <h3>ინვოისის დეტალები</h3>
            <p>
              <strong>ინვოისის ნომერი:</strong> ${invoiceNumber}<br>
              <strong>თარიღი:</strong> ${new Date(sale.createdAt).toLocaleDateString("ka-GE")}<br>
              <strong>გაცემის თარიღი:</strong> ${new Date().toLocaleDateString("ka-GE")}
            </p>
          </div>
          <div class="meta-section">
            <h3>მყიდველი</h3>
            <p>
              ${sale.client ? `<strong>${sale.client}</strong>` : "<em>მითითებული არ არის</em>"}
            </p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>პროდუქცია</th>
              <th>კატეგორია</th>
              <th class="text-right">რაოდენობა</th>
              <th class="text-right">ფასი</th>
              <th class="text-right">ჯამი</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>${sale.productName}</td>
              <td>${sale.category || "-"}</td>
              <td class="text-right">${sale.quantity}</td>
              <td class="text-right">${sale.salePrice.toLocaleString()} ${currency}</td>
              <td class="text-right">${sale.totalAmount.toLocaleString()} ${currency}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr>
              <td class="label">ქვეჯამი:</td>
              <td class="text-right">${sale.totalAmount.toLocaleString()} ${currency}</td>
            </tr>
            ${purchasePrice
      ? `
            <tr>
              <td class="label">თვითღირებულება:</td>
              <td class="text-right">${(purchasePrice * sale.quantity).toLocaleString()} ${currency}</td>
            </tr>
            <tr>
              <td class="label">მოგება:</td>
              <td class="text-right">${((sale.salePrice - purchasePrice) * sale.quantity).toLocaleString()} ${currency}</td>
            </tr>`
      : ""
    }
            <tr class="total-row">
              <td>ჯამი:</td>
              <td class="text-right">${sale.totalAmount.toLocaleString()} ${currency}</td>
            </tr>
          </table>
        </div>

        <div class="stamp-area">
          <div class="stamp-box">გამცემი / ხელმოწერა</div>
          <div class="stamp-box">მიმღები / ხელმოწერა</div>
        </div>

        <div class="footer">
          <p>${companyName} - DASTA CLOUD JR</p>
          <p>ინვოისი გენერირებულია ავტომატურად: ${new Date().toLocaleString("ka-GE")}</p>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}
export function printPayoffReceipt(name: string, amount: number, remaining: number, method: string, type: 'customer' | 'supplier') {
  const settings = settingsStore.getSettings();
  const companyName = settings.companyName || "DASTA CLOUD JR";
  const currency = settings.currency || "₾";
  const receiptNumber = `PAY-${Date.now().toString().slice(-6)}`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>გადახდის ქვითარი ${receiptNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          color: #1a1a2e;
          font-size: 13px;
        }
        .receipt {
          max-width: 300px;
          margin: 0 auto;
          border: 1px dashed #ccc;
          padding: 15px;
        }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .company { font-weight: 800; font-size: 16px; margin-bottom: 2px; }
        .title { text-transform: uppercase; font-weight: 700; font-size: 12px; color: #666; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .label { color: #666; }
        .value { font-weight: 700; }
        .total-row { margin-top: 10px; padding-top: 10px; border-top: 2px solid #1a1a2e; }
        .footer { margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 15px; text-align: center; }
        .signature { margin-top: 40px; display: flex; justify-content: space-between; gap: 20px; }
        .sig-box { flex: 1; border-top: 1px solid #000; font-size: 10px; padding-top: 4px; text-align: center; }
        @media print { body { padding: 0; } .receipt { border: none; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="receipt">
        <div class="header">
          <div class="company">${companyName}</div>
          <div class="title">გადახდის ქვითარი</div>
          <div style="font-size: 10px; margin-top: 5px;"># ${receiptNumber}</div>
        </div>
        
        <div class="row">
          <span class="label">თარიღი:</span>
          <span class="value">${new Date().toLocaleString("ka-GE")}</span>
        </div>
        <div class="row">
          <span class="label">${type === 'customer' ? 'მყიდველი' : 'მომწოდებელი'}:</span>
          <span class="value">${name}</span>
        </div>
        <div class="row">
          <span class="label">გადახდის მეთოდი:</span>
          <span class="value">${method === 'cash' ? '💵 ნაღდი' : '💳 ბანკი'}</span>
        </div>
        
        <div class="row total-row" style="font-size: 1.1em;">
          <span class="label" style="color: #1a1a2e; font-weight: 800;">გადახდილი:</span>
          <span class="value" style="color: #1a1a2e; font-size: 1.2em;">${amount.toFixed(2)} ${currency}</span>
        </div>
        
        <div class="row">
          <span class="label">დარჩენილი ვალი:</span>
          <span class="value">${remaining.toFixed(2)} ${currency}</span>
        </div>

        <div class="signature">
          <div class="sig-box">გამცემი</div>
          <div class="sig-box">მიმღები</div>
        </div>

        <div class="footer">
          <p style="font-size: 10px;">გმადლობთ!</p>
          <p style="font-size: 9px; color: #999; margin-top: 5px;">${new Date().toLocaleDateString("ka-GE")} ${new Date().toLocaleTimeString("ka-GE")}</p>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export function printFinancialReport(data: {
  revenue: number;
  profit: number;
  expenses: number;
  netProfit: number;
  cashBalance: number;
  bankBalance: number;
  expenseDistribution: { name: string; value: number }[];
  period?: string;
}) {
  const settings = settingsStore.getSettings();
  const companyName = settings.companyName || "DASTA CLOUD JR";
  const currency = settings.currency || "₾";

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ფინანსური ანგარიში - ${companyName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', 'Segoe UI', sans-serif;
          padding: 40px;
          color: #1e293b;
          font-size: 14px;
          line-height: 1.6;
          background: #fff;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-info h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
        .report-title { text-align: right; }
        .report-title h2 { font-size: 20px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .card {
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .card-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
        .card-value { font-size: 24px; font-weight: 800; color: #0f172a; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }

        .section-title {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
          color: #0f172a;
          text-transform: uppercase;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          text-align: left;
          padding: 12px;
          background: #f1f5f9;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .text-right { text-align: right; }
        
        .p-l-statement {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 40px;
        }
        .p-l-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .p-l-row.total {
          border-top: 2px solid #0f172a;
          border-bottom: none;
          margin-top: 10px;
          padding-top: 15px;
          font-weight: 800;
          font-size: 18px;
        }
        .p-l-label { font-weight: 600; }

        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }

        @media print {
          body { padding: 20px; }
          .card { background: #fff !important; border: 1px solid #ddd; }
        }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="container">
        <header class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <p style="color: #64748b;">ბიზნესის ფინანსური ანგარიში</p>
          </div>
          <div class="report-title">
            <h2>მოგება-ზარალი</h2>
            <p style="font-size: 12px; color: #64748b;">გენერირებულია: ${new Date().toLocaleDateString("ka-GE")}</p>
          </div>
        </header>

        <div class="summary-grid">
          <div class="card">
            <div class="card-label">სალარო (ნაღდი)</div>
            <div class="card-value">${data.cashBalance.toFixed(2)} ${currency}</div>
          </div>
          <div class="card">
            <div class="card-label">ბანკი (ბარათი)</div>
            <div class="card-value">${data.bankBalance.toFixed(2)} ${currency}</div>
          </div>
        </div>

        <div class="section-title">ფინანსური შედეგები (P&L)</div>
        <div class="p-l-statement">
          <div class="p-l-row">
            <span class="p-l-label">მთლიანი შემოსავალი (Sales)</span>
            <span>${data.revenue.toFixed(2)} ${currency}</span>
          </div>
          <div class="p-l-row">
            <span class="p-l-label">საოპერაციო მოგება (Gross Profit)</span>
            <span>${data.profit.toFixed(2)} ${currency}</span>
          </div>
          <div class="p-l-row">
            <span class="p-l-label text-destructive">საოპერაციო ხარჯები (Expenses)</span>
            <span class="text-destructive">- ${data.expenses.toFixed(2)} ${currency}</span>
          </div>
          <div class="p-l-row total">
            <span class="p-l-label">წმინდა მოგება (Net Profit)</span>
            <span class="${data.netProfit >= 0 ? 'positive' : 'negative'}">
              ${data.netProfit.toFixed(2)} ${currency}
            </span>
          </div>
        </div>

        <div class="section-title">ხარჯების კატეგორიები</div>
        <table>
          <thead>
            <tr>
              <th>კატეგორია</th>
              <th class="text-right">თანხა</th>
              <th class="text-right">წილი</th>
            </tr>
          </thead>
          <tbody>
            ${data.expenseDistribution.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-right">${item.value.toFixed(2)} ${currency}</td>
                <td class="text-right">${data.expenses > 0 ? ((item.value / data.expenses) * 100).toFixed(1) : 0}%</td>
              </tr>
            `).join('')}
            ${data.expenseDistribution.length === 0 ? '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">მონაცემები არ არის</td></tr>' : ''}
          </tbody>
        </table>

        <div class="footer">
          <p>${companyName} - DASTA CLOUD JR</p>
          <p>ანგარიში გენერირებულია ავტომატურად DASTA-ს მიერ</p>
          <p>${new Date().toLocaleString("ka-GE")}</p>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}
