import { settingsStore } from "@/lib/settings";

export function printPage(title: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const content = document.getElementById("print-area");
  if (!content) return;

  const settings = settingsStore.getSettings();
  const companyName = settings.companyName || "საწყობი";
  const currency = settings.currency || "₾";
  const now = new Date();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        html, body { 
          background: #fff;
          color: #0f172a;
          overflow-x: hidden;
        }
        body {
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          font-size: 11px;
          line-height: 1.5;
        }
        .print-wrapper { max-width: 1000px; margin: 0 auto; }
        
        /* Typography */
        h1 { font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -0.025em; }
        h2 { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 4px; }
        
        /* Layout Utilities */
        .flex { display: flex !important; }
        .flex-col { flex-direction: column !important; }
        .justify-between { justify-content: space-between !important; }
        .items-center { align-items: center !important; }
        .gap-1 { gap: 4px !important; }
        .gap-2 { gap: 8px !important; }
        .gap-4 { gap: 16px !important; }
        .gap-6 { gap: 24px !important; }
        .grid { display: grid !important; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
        
        .mb-2 { margin-bottom: 8px !important; }
        .mb-4 { margin-bottom: 16px !important; }
        .mb-6 { margin-bottom: 24px !important; }
        .mt-1 { margin-top: 4px !important; }
        .mt-4 { margin-top: 16px !important; }
        .mt-6 { margin-top: 24px !important; }
        
        .p-4 { padding: 16px !important; }
        .p-6 { padding: 24px !important; }
        .pb-3 { padding-bottom: 12px !important; }
        
        /* Shadcn Component Mimicry */
        .rounded-xl { border-radius: 8px !important; }
        .border { border: 1px solid #e2e8f0 !important; }
        .bg-card { background-color: #fff !important; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; }
        
        /* Specific elements */
        .text-xs { font-size: 9px !important; }
        .text-sm { font-size: 11px !important; }
        .text-xl { font-size: 18px !important; }
        .font-bold { font-weight: 700 !important; }
        .font-semibold { font-weight: 600 !important; }
        .uppercase { text-transform: uppercase !important; }
        .tracking-wider { letter-spacing: 0.05em !important; }
        .text-muted-foreground { color: #64748b !important; }
        .text-chart-2 { color: #10b981 !important; }
        .text-chart-3 { color: #f59e0b !important; }
        .text-destructive { color: #ef4444 !important; }
        .text-foreground { color: #0f172a !important; }
        .text-card-foreground { color: #0f172a !important; }
        
        /* Table styles */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 10px;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: #f8fafc;
          color: #475569;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 9px;
        }
        tr:nth-child(even) { background-color: #fcfdfe; }
        .bg-muted\/50 { background-color: #f1f5f9 !important; }
        
        /* Separator */
        .h-px { height: 1px !important; }
        .bg-border { background-color: #e2e8f0 !important; }
        hr, .border-b { border-bottom: 1px solid #e2e8f0 !important; }

        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-info {
          font-size: 10px;
          color: #475569;
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .print-meta {
          text-align: right;
          font-size: 10px;
          color: #64748b;
        }
        .print-footer {
          margin-top: 40px;
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #94a3b8;
        }
        
        @media print {
          body { 
            padding: 20px; 
            margin: 0;
          }
          /* Hide actions and common UI elements */
          .no-print, button, nav, .pagination, [role="navigation"], 
          th:last-child, td:last-child, .sr-only { 
            display: none !important; 
          }
          .page-break { page-break-after: always; }
          table { page-break-inside: auto; border: 1px solid #e2e8f0 !important; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          .card, .rounded-xl { page-break-inside: avoid; border: 1px solid #e2e8f0 !important; margin-bottom: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="print-wrapper">
        <div class="print-header">
          <div>
            <h1>${title}</h1>
            <h2>${companyName} - მართვის სისტემა</h2>
            <div class="company-info">
              ${settings.address ? `<span>📍 ${settings.address}</span>` : ""}
              ${settings.phone ? `<span>📞 ${settings.phone}</span>` : ""}
              ${settings.email ? `<span>✉️ ${settings.email}</span>` : ""}
              ${settings.bankAccount ? `<span style="margin-top: 4px; font-weight: 600;">🏦 IBAN: ${settings.bankAccount}</span>` : ""}
            </div>
          </div>
          <div class="print-meta">
            თარიღი: ${now.toLocaleDateString("ka-GE")}<br>
            დრო: ${now.toLocaleTimeString("ka-GE")}<br>
            ვალუტა: ${currency}
          </div>
        </div>
        ${content.innerHTML}
        <div class="print-footer">
          <span>${companyName} - საწყობის მართვის სისტემა</span>
          <span>დაბეჭდილია: ${now.toLocaleString("ka-GE")}</span>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          // Delay closing to ensure print dialog doesn't block it in some browsers
          setTimeout(() => {
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
