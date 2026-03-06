import { settingsStore } from "@/lib/settings";

export function printPage(title: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const content = document.getElementById("print-area");
  if (!content) return;

  const settings = settingsStore.getSettings();
  const companyName = settings.companyName || "DASTA CLOUD JR";
  const currency = settings.currency || "₾";
  const now = new Date();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ka">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        :root {
          --print-primary: #0f172a;
          --print-secondary: #475569;
          --print-muted: #94a3b8;
          --print-border: #e2e8f0;
          --print-bg: #ffffff;
          --print-accent: #f8fafc;
        }

        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
        }

        @page {
          size: A4;
          margin: 1.5cm;
        }

        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: var(--print-bg);
          color: var(--print-primary);
          font-size: 11pt;
          line-height: 1.5;
        }

        .print-container { 
          max-width: 100%; 
          margin: 0 auto; 
        }
        
        /* ----------------------------------
           HEADER
           ---------------------------------- */
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid var(--print-primary);
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }

        .header-left h1 { 
          font-size: 24pt; 
          font-weight: 800; 
          color: var(--print-primary); 
          letter-spacing: -0.03em;
          margin-bottom: 0.25rem;
          line-height: 1.1;
        }

        .header-left h2 { 
          font-size: 12pt; 
          color: var(--print-secondary); 
          font-weight: 600; 
        }

        .company-details {
          margin-top: 1rem;
          font-size: 9.5pt;
          color: var(--print-secondary);
          display: grid;
          gap: 0.25rem;
        }

        .company-details div {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-right {
          text-align: right;
          font-size: 9.5pt;
          color: var(--print-secondary);
          background: var(--print-accent);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid var(--print-border);
          min-width: 200px;
        }

        .header-right table {
          width: 100%;
          border: none;
          margin: 0;
        }
        
        .header-right td {
          border: none;
          padding: 0.15rem 0;
          font-size: 9.5pt;
        }
        
        .header-right td:first-child {
          text-align: left;
          color: var(--print-muted);
          font-weight: 500;
        }
        
        .header-right td:last-child {
          text-align: right;
          font-weight: 600;
          color: var(--print-primary);
        }

        /* ----------------------------------
           CONTENT LAYOUT (Tailwind mimics)
           ---------------------------------- */
        .grid { display: grid !important; }
        .grid-cols-1 { grid-template-columns: 1fr !important; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
        .gap-4 { gap: 1rem !important; }
        .gap-6 { gap: 1.5rem !important; }
        .mb-6 { margin-bottom: 1.5rem !important; }
        
        /* Summary Cards */
        .card {
          border: 1px solid var(--print-border) !important;
          border-radius: 8px !important;
          padding: 1.25rem !important;
          background: var(--print-bg) !important;
          page-break-inside: avoid;
        }
        
        .text-xs.uppercase {
          font-size: 8pt !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          color: var(--print-muted) !important;
          font-weight: 600 !important;
          margin-bottom: 0.5rem !important;
          display: block;
        }
        
        .text-xl.font-bold {
          font-size: 16pt !important;
          color: var(--print-primary) !important;
          margin: 0 !important;
        }

        /* ----------------------------------
           TABLES
           ---------------------------------- */
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 2rem;
          font-size: 9.5pt;
          width: 100%;
          border: 1px solid var(--print-border);
          border-radius: 8px;
          overflow: hidden;
        }

        thead {
          background-color: var(--print-accent);
          display: table-header-group;
        }

        th {
          padding: 0.75rem 1rem;
          text-align: left;
          color: var(--print-secondary);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 8pt;
          letter-spacing: 0.05em;
          border-bottom: 2px solid var(--print-border);
        }

        td {
          padding: 0.75rem 1rem;
          color: var(--print-primary);
          border-bottom: 1px solid var(--print-border);
        }

        tr:last-child td {
          border-bottom: none;
        }

        tbody tr {
          page-break-inside: avoid;
        }

        tbody tr:nth-child(even) { 
          background-color: #f8fafc55; 
        }

        /* ----------------------------------
           UTILITIES
           ---------------------------------- */
        .text-muted-foreground { color: var(--print-muted) !important; }
        .text-chart-2 { color: #10b981 !important; font-weight: 600; }
        .text-chart-3 { color: #f59e0b !important; font-weight: 600; }
        .text-destructive { color: #ef4444 !important; font-weight: 600; }
        
        /* Badges */
        .rounded-full {
          border-radius: 9999px !important;
          padding: 0.15rem 0.5rem !important;
          font-size: 8pt !important;
          display: inline-block;
          border: 1px solid currentColor;
          background: transparent !important;
        }

        .bg-chart-2\\/10 { color: #10b981 !important; border-color: #10b98133 !important; }
        .bg-chart-3\\/10 { color: #f59e0b !important; border-color: #f59e0b33 !important; }
        .bg-destructive\\/10 { color: #ef4444 !important; border-color: #ef444433 !important; }

        /* ----------------------------------
           FOOTER
           ---------------------------------- */
        .print-footer {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px dashed var(--print-border);
          display: flex;
          justify-content: space-between;
          font-size: 8.5pt;
          color: var(--print-muted);
          page-break-inside: avoid;
        }

        /* ----------------------------------
           HIDING UI ELEMENTS
           ---------------------------------- */
        .no-print, button, input, select, textarea, nav, .pagination, 
        [role="navigation"], .sr-only,
        th:last-child, td:last-child { 
          display: none !important; 
        }
        
        /* Print Specific Media Query (Safeguard) */
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .card { box-shadow: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        
        <!-- HEADER -->
        <header class="print-header">
          <div class="header-left">
            <h1>${title}</h1>
            <h2>${companyName} - ბიზნეს რეპორტი</h2>
            
            <div class="company-details">
              ${settings.address ? `<div><strong>📍</strong> <span>${settings.address}</span></div>` : ""}
              ${settings.phone ? `<div><strong>📞</strong> <span>${settings.phone}</span></div>` : ""}
              ${settings.email ? `<div><strong>✉️</strong> <span>${settings.email}</span></div>` : ""}
              ${settings.bankAccount ? `
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--print-border);">
                  <strong style="color: var(--print-primary)">🏦 ს/ა:</strong> 
                  <span style="font-family: monospace; font-size: 10pt;">${settings.bankAccount}</span>
                </div>
              ` : ""}
            </div>
          </div>
          
          <div class="header-right">
            <table>
              <tr>
                <td>თარიღი:</td>
                <td>${now.toLocaleDateString("ka-GE")}</td>
              </tr>
              <tr>
                <td>დრო:</td>
                <td>${now.toLocaleTimeString("ka-GE", { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
              <tr>
                <td style="padding-top: 0.5rem;">ვალუტა:</td>
                <td style="padding-top: 0.5rem; font-weight: 800;">${currency}</td>
              </tr>
            </table>
          </div>
        </header>

        <!-- Dynamic Content from Page -->
        <main>
          ${content.innerHTML}
        </main>

        <!-- FOOTER -->
        <footer class="print-footer">
          <div>გენერირებულია: <strong>DASTA</strong>-ს მიერ</div>
          <div>გვერდი 1/1</div>
        </footer>

      </div>
      
      <script>
        window.onload = function() {
          // Pre-process any dynamic UI elements that shouldn't display in print
          document.querySelectorAll('.lucide').forEach(icon => {
            if(icon.closest('th') || icon.closest('td')) {
              icon.style.display = 'none'; // hide sorting arrows
            }
          });
          
          setTimeout(() => {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
            // Fallback for browsers that don't support onafterprint
            setTimeout(() => {
              window.close();
            }, 1000);
          }, 250);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

