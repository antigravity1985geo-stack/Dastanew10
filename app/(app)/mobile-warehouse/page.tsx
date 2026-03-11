"use client";

import { useState, useMemo } from "react";
import { Search, Package, ArrowLeft, Building2, QrCode, Minus, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWarehouseStore } from "@/hooks/use-store";
import { MobileScanner } from "@/components/mobile-scanner";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MobileWarehousePage() {
  const store = useWarehouseStore();
  const [search, setSearch] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustment, setAdjustment] = useState(0);

  // Filter products based on search or scanned barcode
  const filteredProducts = useMemo(() => {
    if (!search) return [];
    return store.products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.barcode?.includes(search)
    ).slice(0, 10);
  }, [search, store.products]);

  const handleScan = (barcode: string) => {
    setScannerOpen(false);
    setSearch(barcode);
    
    const product = store.products.find(p => p.barcode === barcode);
    if (product) {
      setSelectedProduct(product);
      setAdjustment(0);
      toast.success("პროდუქტი ნაპოვნია!");
    } else {
      toast.error("პროდუქტი ამ ბარკოდით ვერ მოიძებნა");
    }
  };

  const handleApplyAdjustment = () => {
    if (!selectedProduct) return;
    
    const newStock = (selectedProduct.quantity || 0) + adjustment;
    if (newStock < 0) {
      toast.error("მარაგი არ შეიძლება იყოს უარყოფითი");
      return;
    }

    store.updateProduct(selectedProduct.id, { quantity: newStock });
    toast.success("მარაგი განახლდა");
    setSelectedProduct(null);
    setAdjustment(0);
    setSearch("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <div className="bg-[#8b1a1a] text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 opacity-80" />
            <h1 className="text-lg font-black tracking-tight">საწყობის მობილური</h1>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ძებნა (ბარკოდი ან სახელი)..."
            className="pl-10 pr-12 h-12 bg-white text-slate-900 rounded-xl border-none shadow-inner"
          />
          <button
            onClick={() => setScannerOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-100 text-slate-600 rounded-lg active:scale-95 transition-all"
          >
            <QrCode className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        {selectedProduct ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <Card className="overflow-hidden border-none shadow-lg">
              <div className="h-32 bg-slate-200 relative">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Package className="h-12 w-12" />
                  </div>
                )}
                <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 border-none">
                  {selectedProduct.category}
                </Badge>
              </div>
              <CardContent className="p-5">
                <h2 className="text-xl font-black mb-1">{selectedProduct.name}</h2>
                <p className="text-slate-500 text-sm mb-4">SKU: {selectedProduct.sku || "N/A"}</p>
                
                <div className="flex items-center justify-between p-4 bg-slate-100 rounded-2xl mb-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-500 uppercase">ამჟამინდელი მარაგი</span>
                    <span className="text-2xl font-black text-slate-900">{selectedProduct.quantity || 0}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wider">მარაგის კორექტირება</h3>
                  <div className="flex items-center justify-between gap-4">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-14 w-14 rounded-2xl bg-white shadow-sm border-slate-200 text-slate-600"
                      onClick={() => setAdjustment(prev => prev - 1)}
                    >
                      <Minus className="h-6 w-6" />
                    </Button>
                    <div className="flex-1 text-center">
                      <span className={cn(
                        "text-3xl font-black transition-colors",
                        adjustment > 0 ? "text-green-600" : adjustment < 0 ? "text-red-600" : "text-slate-400"
                      )}>
                        {adjustment > 0 ? `+${adjustment}` : adjustment}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-14 w-14 rounded-2xl bg-white shadow-sm border-slate-200 text-slate-600"
                      onClick={() => setAdjustment(prev => prev + 1)}
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <Button 
                      variant="ghost" 
                      className="flex-1 h-12 rounded-xl text-slate-500 font-bold"
                      onClick={() => setSelectedProduct(null)}
                    >
                      გაუქმება
                    </Button>
                    <Button 
                      className="flex-1 h-12 rounded-xl bg-[#8b1a1a] hover:bg-[#a12323] text-white font-bold shadow-lg shadow-red-900/20"
                      onClick={handleApplyAdjustment}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      შენახვა
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-3">
            {search ? (
              filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden border-none shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex items-center p-3 gap-3">
                      <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Package className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{product.name}</h4>
                        <p className="text-xs text-slate-500">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black">{product.quantity}</span>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="py-20 text-center space-y-3">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Search className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-medium">პროდუქტი ვერ მოიძებნა</p>
                </div>
              )
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl rotate-3">
                  <Package className="h-10 w-10 text-[#8b1a1a]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-800">დაიწყეთ მუშაობა</h3>
                  <p className="text-sm text-slate-500 max-w-[240px] mx-auto">
                    მოძებნეთ პროდუქტი ან გამოიყენეთ სკანერი მარაგის შესამოწმებლად
                  </p>
                </div>
                <Button 
                  onClick={() => setScannerOpen(true)}
                  className="bg-[#8b1a1a] hover:bg-[#a12323] text-white px-8 h-12 rounded-2xl font-bold shadow-lg shadow-red-900/10 active:scale-95 transition-all"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  სკანირება
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {scannerOpen && (
        <MobileScanner 
          onScan={handleScan} 
          onClose={() => setScannerOpen(false)} 
        />
      )}
    </div>
  );
}
