import bwipjs from 'bwip-js';

/**
 * Generates a PNG data URL for a given barcode text using BWIP-JS
 */
export async function generateBarcodeDataURL(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    try {
      bwipjs.toCanvas(canvas, {
        bcid: 'code128',       // Barcode type
        text: text,            // Text to encode
        scale: 3,              // 3x scaling factor
        height: 10,            // Bar height, in millimeters
        includetext: true,     // Show human-readable text
        textxalign: 'center',  // Center the text
      });
      resolve(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error('Barcode generation error:', e);
      reject(e);
    }
  });
}

/**
 * Opens a print window with the barcode label
 */
export function printBarcodeLabel(dataURL: string, name: string, price: number) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('გთხოვთ დაუშვათ pop-ups ბეჭდვისთვის');
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>ბარკოდის ბეჭდვა - ${name}</title>
        <style>
          @page { size: 50mm 30mm; margin: 0; }
          body { 
            margin: 0; 
            padding: 2mm; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center;
            font-family: 'Inter', sans-serif;
            height: 26mm;
            width: 46mm;
          }
          .label {
            text-align: center;
            width: 100%;
          }
          .name { 
            font-size: 10px; 
            font-weight: 800; 
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-transform: uppercase;
          }
          .price { 
            font-size: 14px; 
            font-weight: 900; 
            margin-top: 2px; 
          }
          .barcode-img { 
            width: 100%;
            height: 12mm;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="name">${name}</div>
          <img class="barcode-img" src="${dataURL}" />
          <div class="price">${price.toFixed(2)} GEL</div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Generates a unique internal barcode (starts with 200...)
 */
export function generateInternalBarcode(existingBarcodes: string[]): string {
  let attempts = 0;
  while (attempts < 100) {
    // Generate a random 12-digit number starting with 200 (internal prefix)
    const randomPart = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const barcode = '200' + randomPart;
    
    // Simple checksum-like check if we wanted EAN-13, but Code128 handles any text.
    // For now, let's just make sure it's unique.
    if (!existingBarcodes.includes(barcode)) {
      return barcode;
    }
    attempts++;
  }
  return '200' + Date.now().toString().slice(-9); // Fallback
}
