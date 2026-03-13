"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useWarehouseStore } from "@/hooks/use-store";
import { useSettings } from "@/hooks/use-settings";
import { Product } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, Search, Tag, Settings, Plus, Minus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import bwipjs from "bwip-js/browser";

interface SelectedProduct extends Product {
  printQuantity: number;
}

type LabelSize = "small" | "medium" | "large";

export function PriceTagsPage() {
  const store = useWarehouseStore();
  const settings = useSettings();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Record<string, SelectedProduct>>({});
  const [labelSize, setLabelSize] = useState<LabelSize>("medium");

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return store.products;
    const lower = searchTerm.toLowerCase();
    return store.products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.barcode?.toLowerCase().includes(lower) || 
      p.category?.toLowerCase().includes(lower)
    );
  }, [store.products, searchTerm]);

  const handleSelectProduct = (product: Product, checked: boolean) => {
    setSelectedProducts(prev => {
      const next = { ...prev };
      if (checked) {
        next[product.id] = { ...product, printQuantity: 1 };
      } else {
        delete next[product.id];
      }
      return next;
    });
  };

  const updatePrintQuantity = (productId: string, qty: number) => {
    if (qty < 1) return;
    setSelectedProducts(prev => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          printQuantity: qty
        }
      };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allSelected: Record<string, SelectedProduct> = {};
      filteredProducts.forEach(p => {
        allSelected[p.id] = { ...p, printQuantity: 1 };
      });
      setSelectedProducts(allSelected);
    } else {
      setSelectedProducts({});
    }
  };

  const handlePrint = () => {
    if (Object.keys(selectedProducts).length === 0) {
      toast.error("მონიშნეთ მინიმუმ 1 პროდუქტი");
      return;
    }
    window.print();
  };

  const selectedCount = Object.keys(selectedProducts).length;
  const totalLabels = Object.values(selectedProducts).reduce((acc, curr) => acc + curr.printQuantity, 0);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50/50 print:bg-white print:h-auto overflow-hidden">
      {/* HEADER (Hidden in print) */}
      <div className="flex-none print:hidden">
        <PageHeader 
          title="ფასების ეტიკეტები" 
          description="ბეჭდვის მართვა"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0 custom-scrollbar print:overflow-visible flex flex-col xl:flex-row gap-6">
        
        {/* LEFT COLUMN: Selection (Hidden in print) */}
        <div className="w-full xl:w-2/3 flex flex-col gap-4 print:hidden">
          <Card className="border-border/50 shadow-sm rounded-2xl flex-shrink-0">
            <CardContent className="p-4 md:p-5 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
              <div className="w-full md:w-80 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ძებნა (დასახელება, ბარკოდი)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-muted-foreground/20 rounded-xl bg-white"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                {["small", "medium", "large"].map((size) => (
                  <Button
                    key={size}
                    variant={labelSize === size ? "default" : "outline"}
                    className={cn(
                      "rounded-xl h-10 px-4 whitespace-nowrap",
                      labelSize === size ? "bg-primary font-black shadow-md shadow-primary/20" : "font-bold text-muted-foreground"
                    )}
                    onClick={() => setLabelSize(size as LabelSize)}
                  >
                    {size === "small" && "30×20"}
                    {size === "medium" && "58×40"}
                    {size === "large" && "100×50"}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 border-border/50 shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
            <div className="flex-1 overflow-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="w-12 text-center">
                      <Checkbox 
                        checked={filteredProducts.length > 0 && selectedCount === filteredProducts.length}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        className="rounded-md"
                      />
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">დასახელება</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ბარკოდი</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">ფასი</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">მარაგი</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary text-center w-32">ბეჭდვის რაოდ.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => {
                    const isSelected = !!selectedProducts[product.id];
                    return (
                      <TableRow key={product.id} className={cn(
                        "transition-colors group",
                        isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/20"
                      )}>
                        <TableCell className="text-center">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectProduct(product, checked as boolean)}
                            className="rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">{product.name}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">{product.category || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{product.barcode || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-sm text-foreground">{product.salePrice.toFixed(2)} ₾</span>
                            {product.discountPrice && (
                              <span className="text-[9px] font-bold text-rose-500 line-through opacity-70">
                                ფასდაკლ: {product.discountPrice.toFixed(2)} ₾
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center min-w-[30px] h-6 rounded-md text-xs font-bold",
                            product.quantity <= (product.minStockLevel || 5) ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {product.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isSelected ? (
                            <div className="flex items-center justify-center gap-1.5 opacity-100 animate-in fade-in zoom-in duration-200">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-lg border-primary/20 hover:bg-primary/10 hover:text-primary"
                                onClick={() => updatePrintQuantity(product.id, selectedProducts[product.id].printQuantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input 
                                type="number" 
                                value={selectedProducts[product.id].printQuantity}
                                onChange={(e) => updatePrintQuantity(product.id, parseInt(e.target.value) || 1)}
                                className="h-7 w-12 text-center px-1 font-black text-xs border-primary/20 focus-visible:ring-primary/20"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-lg border-primary/20 hover:bg-primary/10 hover:text-primary"
                                onClick={() => updatePrintQuantity(product.id, selectedProducts[product.id].printQuantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="h-7 flex items-center justify-center text-muted-foreground opacity-30 group-hover:opacity-50 text-[10px] font-bold uppercase tracking-widest">
                              არჩეული არ არის
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
                        პროდუქცია არ მოიძებნა
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="bg-slate-50 border-t p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">მონიშნული პროდუქტი</span>
                  <span className="text-xl font-black text-foreground">{selectedCount}</span>
                </div>
                <div className="h-8 w-px bg-border/50" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">სულ ეტიკეტი</span>
                  <span className="text-xl font-black text-primary">{totalLabels}</span>
                </div>
              </div>
              
              <Button 
                className="h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black px-8 shadow-lg shadow-primary/20 transition-all active:scale-95 gap-2"
                onClick={handlePrint}
                disabled={selectedCount === 0}
              >
                <Printer className="h-5 w-5" />
                ბეჭდვა
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Preview / Print Area */}
        <div className="w-full xl:w-1/3 flex flex-col gap-4 print:w-full print:block">
          <div className="flex items-center justify-between pb-2 border-b print:hidden">
            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              პრივიუ
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1 rounded bg-muted/50">
              მოარგეთ ეტიკეტები პრინტერს
            </span>
          </div>

          <div className="flex-1 overflow-y-auto print:overflow-visible">
            {selectedCount === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground opacity-50 print:hidden border-2 border-dashed rounded-3xl border-border/50">
                <Printer className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-bold text-sm">მონიშნეთ პროდუქცია მარცხნივ</p>
                <p className="text-xs mt-1">დასაბეჭდად აუცილებელია მინიმუმ 1 პროდუქტის არჩევა</p>
              </div>
            )}

            {/* PRINT CONTAINER */}
            <div className={cn(
               "grid gap-2 print:gap-0 print:m-0 w-full place-items-center print:place-items-start",
               // Grid columns adjust based on label size + print mode
               "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 print:flex print:flex-wrap print:gap-[2mm]",
            )}>
              {Object.values(selectedProducts).map(product => {
                // Generate X number of labels per product
                return Array.from({ length: product.printQuantity }).map((_, idx) => (
                  <PriceTag 
                    key={`${product.id}-${idx}`}
                    product={product}
                    companyName={settings.companyName || "COMPANY"}
                    size={labelSize}
                  />
                ));
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: The actual label printed
function PriceTag({ product, companyName, size }: { product: Product; companyName: string; size: LabelSize }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barcode = product.barcode || product.id.substring(0, 12).toUpperCase();

  // Dimensions based on standard thermal label sizes
  const dimensions = {
    small: "w-[113px] h-[75px] print:w-[30mm] print:h-[20mm]",    // 30x20mm
    medium: "w-[219px] h-[151px] print:w-[58mm] print:h-[40mm]",  // 58x40mm
    large: "w-[378px] h-[189px] print:w-[100mm] print:h-[50mm]"   // 100x50mm
  };

  useEffect(() => {
    if (canvasRef.current && barcode) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "code128", 
          text: barcode,
          scale: size === "small" ? 1 : size === "medium" ? 2 : 3,
          height: size === "small" ? 8 : size === "medium" ? 12 : 20,
          includetext: true,
          textxalign: "center",
          textsize: size === "small" ? 6 : size === "medium" ? 10 : 12,
        });
      } catch (e) {
        console.error("Barcode generation error", e);
      }
    }
  }, [barcode, size]);

  const effectivePrice = product.discountPrice || product.salePrice;

  return (
    <div className={cn(
      "bg-white border-2 border-slate-200 print:border-none print:shadow-none shadow-sm rounded-lg flex flex-col justify-between overflow-hidden relative",
      "transition-all hover:border-primary/50",
      dimensions[size]
    )}>
      {/* Container spacing adjusts per size */}
      <div className={cn(
        "flex flex-col h-full w-full",
        size === "small" ? "p-1" : size === "medium" ? "p-2" : "p-4"
      )}>
        
        {/* Header / Company Name */}
        <div className={cn(
          "font-black tracking-widest uppercase text-center text-slate-800 line-clamp-1 border-b border-dashed border-slate-300",
          size === "small" ? "text-[6px] pb-[1px] mb-[1px]" : size === "medium" ? "text-[10px] pb-1 mb-1" : "text-sm pb-2 mb-2"
        )}>
          {companyName}
        </div>

        {/* Product Name */}
        <div className={cn(
          "font-bold text-center leading-tight text-slate-900 break-words flex-1 flex items-center justify-center",
          size === "small" ? "text-[7px] line-clamp-2" : size === "medium" ? "text-[11px] line-clamp-2" : "text-lg line-clamp-3"
        )}>
          {product.name}
        </div>

        {/* Price Area */}
        <div className="flex flex-col items-center justify-end mt-auto">
          {product.discountPrice ? (
            <div className="flex items-end justify-center w-full relative">
               <span className={cn(
                  "font-black text-slate-400 line-through absolute bottom-0 left-0",
                  size === "small" ? "text-[6px]" : size === "medium" ? "text-[9px]" : "text-sm"
               )}>
                 {product.salePrice.toFixed(2)}
               </span>
               <span className={cn(
                 "font-black text-slate-950 leading-none",
                 size === "small" ? "text-sm" : size === "medium" ? "text-2xl" : "text-4xl px-2 bg-black text-white"
               )}>
                 {effectivePrice.toFixed(2)} ₾
               </span>
            </div>
          ) : (
            <span className={cn(
              "font-black text-slate-950 leading-none",
              size === "small" ? "text-sm" : size === "medium" ? "text-2xl" : "text-4xl"
            )}>
              {effectivePrice.toFixed(2)} ₾
            </span>
          )}
          
          {/* Barcode Canvas */}
          <div className={cn(
            "w-full flex justify-center",
            size === "small" ? "mt-[2px] h-[15px]" : size === "medium" ? "mt-1 h-[25px]" : "mt-2 h-[45px]"
          )}>
            <canvas ref={canvasRef} className="max-w-full max-h-full" />
          </div>
        </div>

      </div>
    </div>
  );
}
