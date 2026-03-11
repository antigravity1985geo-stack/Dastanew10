import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Product } from "./store";

// Add support for Georgian characters (requires a font file usually)
// For now we will use standard fonts, but in a real-world scenario with jsPDF, 
// we need to embed a UTF-8 font for Georgian labels.

export async function generatePurchaseOrderPDF(
  supplierName: string,
  items: Array<{ name: string; quantity: number; currentStock: number }>,
  companyName: string
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("PURCHASE ORDER", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Company: ${companyName}`, 14, 35);
  doc.text(`Supplier: ${supplierName}`, 14, 42);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 49);

  // Table
  const tableData = items.map((item, index) => [
    index + 1,
    item.name,
    item.currentStock,
    item.quantity,
  ]);

  (doc as any).autoTable({
    startY: 60,
    head: [["#", "Product Name", "Current Stock", "Order Quantity"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillStyle: [14, 165, 233] }, // Primary color
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text("Authorized Signature: __________________", 14, finalY + 20);

  doc.save(`Order_${supplierName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Calculates sales velocity (units per day) based on sales history
 */
export function calculateSalesVelocity(
  productId: string,
  sales: any[],
  days = 14
): number {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - days);

  const periodSales = sales.filter(
    (s) => s.productId === productId && new Date(s.createdAt) >= startDate
  );

  const totalSold = periodSales.reduce((sum, s) => sum + s.quantity, 0);
  return totalSold / days;
}

/**
 * Recommends order quantity based on velocity and target days of stock
 */
export function recommendOrderQuantity(
  currentStock: number,
  velocity: number,
  targetDays = 30
): number {
  const needed = Math.ceil(velocity * targetDays);
  const toOrder = Math.max(0, needed - currentStock);
  return toOrder;
}
