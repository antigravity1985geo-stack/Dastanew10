"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWarehouseStore } from "@/hooks/use-store";
import { Sale } from "@/lib/store";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface ReturnDialogProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReturnDialog({ sale, isOpen, onClose }: ReturnDialogProps) {
  const store = useWarehouseStore();
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group sale items by product if it's a multi-item sale (in Dasta currently 1 sale row = 1 item by default, but let's be robust)
  // Actually, in the current data model, a `Sale` is a single product transaction.
  // Wait, let's verify Sales data model. Yes, `productId` is on `Sale`.

  if (!sale) return null;

  const existingReturns = store.getReturnsBySale(sale.id);
  const alreadyReturnedQty = existingReturns.reduce((sum, r) => sum + r.quantity, 0);
  const maxReturnable = sale.quantity - alreadyReturnedQty;

  const handleReturnAmountChange = (val: string) => {
    let qty = parseInt(val, 10);
    if (isNaN(qty)) qty = 0;
    if (qty < 0) qty = 0;
    if (qty > maxReturnable) qty = maxReturnable;

    setReturnQuantities({ [sale.productId]: qty });
  };

  const qtyToReturn = returnQuantities[sale.productId] || 0;
  const refundAmount = qtyToReturn * sale.salePrice;

  const handleSubmit = async () => {
    if (qtyToReturn <= 0) {
      toast.error("მიუთითეთ დასაბრუნებელი რაოდენობა");
      return;
    }

    setIsSubmitting(true);
    try {
      await store.addReturn(
        sale.id,
        [
          {
            productId: sale.productId,
            productName: sale.productName,
            quantity: qtyToReturn,
            refundAmount: refundAmount,
          }
        ],
        reason
      );
      onClose();
    } catch (error) {
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFullyReturned = maxReturnable <= 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>პროდუქტის უკან დაბრუნება (Refund)</DialogTitle>
          <DialogDescription>
            {isFullyReturned ? (
              <span className="text-destructive font-medium">ეს გაყიდვა უკვე სრულად დაბრუნებულია.</span>
            ) : (
              "მიუთითეთ რაოდენობა და დაბრუნების მიზეზი. მარაგი ავტომატურად აღდგება."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-md border p-3 bg-muted/30">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">გაყიდვის ID:</span>
              <span className="font-mono">{sale.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">პროდუქტი:</span>
              <span className="font-medium">{sale.productName}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">ფასი:</span>
              <span>{sale.salePrice.toFixed(2)} ₾</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">გაიყიდა / დაბრუნდა:</span>
              <span>{sale.quantity} ცალი / {alreadyReturnedQty} ცალი</span>
            </div>
          </div>

          {!isFullyReturned && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="qty">დასაბრუნებელი რაოდენობა (მაქს {maxReturnable})</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="qty"
                    type="number"
                    min="0"
                    max={maxReturnable}
                    value={qtyToReturn || ""}
                    onChange={(e) => handleReturnAmountChange(e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">ცალი</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>უკან დასაბრუნებელი თანხა (Refund Amount)</Label>
                <div className="text-xl font-bold text-primary">
                  {refundAmount.toFixed(2)} ₾
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reason">დაბრუნების მიზეზი (არასავალდებულო)</Label>
                <Textarea
                  id="reason"
                  placeholder="მაგ: წუნდებული, არ მოეწონა..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>გაუქმება</Button>
          {!isFullyReturned && (
            <Button onClick={handleSubmit} disabled={isSubmitting || qtyToReturn <= 0}>
              {isSubmitting ? "მუშავდება..." : "დაბრუნების დადასტურება"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
