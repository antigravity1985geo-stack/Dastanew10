"use client";

import { useState, useMemo } from "react";
import { Tag, Search, Plus, X, Pencil, Trash2, ShoppingCart, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWarehouseStore } from "@/hooks/use-store";
import { Product } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

export function PromotionsPage() {
  const store = useWarehouseStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountValue, setDiscountValue] = useState("");

  const activePromotions = useMemo(() => {
    return store.products.filter(p => p.discountPrice !== undefined && p.discountPrice !== null);
  }, [store.products]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return store.products
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.barcode && p.barcode.includes(searchTerm))
      )
      .slice(0, 5);
  }, [store.products, searchTerm]);

  const handleSetDiscount = async () => {
    if (!selectedProduct || !discountValue) return;

    try {
      await store.updateProduct(selectedProduct.id, {
        discountPrice: parseFloat(discountValue)
      });
      toast.success("ფასდაკლება დაწესდა");
      setAddDialogOpen(false);
      setEditDialogOpen(false);
      setDiscountValue("");
      setSelectedProduct(null);
      setSearchTerm("");
    } catch (error) {
      toast.error("შეცდომა ფასის განახლებისას");
    }
  };

  const handleRemoveDiscount = async (id: string) => {
    try {
      await store.updateProduct(id, {
        discountPrice: null as any // Sending null to clear in store logic
      });
      toast.success("ფასდაკლება გაუქმდა");
    } catch (error) {
      toast.error("შეცდომა ფასდაკლების გაუქმებისას");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="აქციები და ფასდაკლებები" 
        description="მართეთ თქვენი პროდუქციის დროებითი ფასები და აქციები"
        actions={
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all">
                <Plus className="h-4 w-4" />
                აქციის დამატება
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>ახალი აქციის დამატება</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>მოძებნეთ პროდუქტი</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="დასახელება ან ბარკოდი..." 
                      className="pl-10 h-11 rounded-xl"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {searchResults.length > 0 && !selectedProduct && (
                    <div className="mt-2 border rounded-xl overflow-hidden shadow-sm bg-card">
                      {searchResults.map(product => (
                        <div 
                          key={product.id}
                          className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center border-b last:border-0"
                          onClick={() => {
                            setSelectedProduct(product);
                            setDiscountValue("");
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold truncate max-w-[180px]">{product.name}</p>
                              <p className="text-[10px] text-muted-foreground">{product.salePrice} ₾</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">არჩევა</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <div className="space-y-4 p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 animate-in zoom-in-95">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black uppercase text-red-600/70 tracking-widest">შერჩეული პროდუქტი</p>
                        <p className="font-bold text-lg">{selectedProduct.name}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedProduct(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs opacity-70">ჩვეულებრივი ფასი</Label>
                        <div className="h-10 flex items-center px-3 bg-background border rounded-lg font-bold">
                          {selectedProduct.salePrice} ₾
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-red-600">აქციის (ახალი) ფასი</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          className="h-10 font-bold border-red-200 focus-visible:ring-red-500"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleSetDiscount}>
                       აქციის დაწყება
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 border-border/50 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/50 py-4 px-6">
            <CardTitle className="text-lg font-black flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-200 dark:shadow-none">
                <Tag className="h-4 w-4" />
              </div>
              აქტიური აქციები
              <span className="ml-auto text-xs font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full">
                {activePromotions.length} პროდუქტი
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">პროდუქცია</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">ძველი ფასი</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-red-600">აქციის ფასი</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">მოგება (ერთ.)</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePromotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                          <ShoppingCart className="h-12 w-12 opacity-10" />
                          <p className="font-medium">ამჟამად აქტიური აქციები არ გაქვთ</p>
                          <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
                            დაამატეთ პირველი აქცია
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activePromotions.map((product) => (
                      <TableRow key={product.id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell className="pl-6 font-bold text-foreground">
                          {product.name}
                          {product.barcode && (
                             <p className="text-[10px] text-muted-foreground font-medium">{product.barcode}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground line-through font-medium">
                            {product.salePrice} ₾
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-red-600 font-black text-lg">
                            {product.discountPrice} ₾
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-emerald-600">
                          {((product.discountPrice || 0) - product.purchasePrice).toFixed(2)} ₾
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg"
                              onClick={() => {
                                setSelectedProduct(product);
                                setDiscountValue(String(product.discountPrice));
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-red-500 hover:text-white hover:bg-red-500 border-red-100"
                              onClick={() => handleRemoveDiscount(product.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 text-white border-none">
            <CardContent className="p-6">
              <h3 className="text-lg font-black mb-1">მოკლე რჩევა</h3>
              <p className="text-sm opacity-90 leading-relaxed font-medium">
                აქციები გეხმარებათ გაზარდოთ გაყიდვები იმ პროდუქტებზე, რომლებიც დიდხანს გიდევთ საწყობში. 
                აქ მითითებული ფასი ავტომატურად აისახება მოლარის ეკრანზე.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">სტატისტიკა</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between items-center p-3 rounded-2xl bg-muted/30">
                  <span className="text-sm font-bold opacity-70">აქტიური აქციები</span>
                  <span className="text-lg font-black">{activePromotions.length}</span>
               </div>
               <div className="flex justify-between items-center p-3 rounded-2xl bg-muted/30">
                  <span className="text-sm font-bold opacity-70">საშ. ფასდაკლება</span>
                  <span className="text-lg font-black text-red-600">
                    {activePromotions.length > 0 
                      ? (activePromotions.reduce((acc, p) => acc + (p.salePrice - (p.discountPrice || 0)), 0) / activePromotions.length).toFixed(2)
                      : "0.00"} ₾
                  </span>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>აქციის რედაქტირება</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedProduct && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">პროდუქტი</p>
                    <p className="font-bold">{selectedProduct.name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">ჩვეულებრივი ფასი</Label>
                    <div className="h-10 flex items-center px-3 bg-muted/30 rounded-lg font-bold">
                      {selectedProduct.salePrice} ₾
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-red-600">აქციის ფასი</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      className="h-10 font-bold border-red-200"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                   <Button variant="outline" className="rounded-xl font-bold" onClick={() => setEditDialogOpen(false)}>
                      გაუქმება
                   </Button>
                   <Button className="bg-red-600 hover:bg-red-700 rounded-xl font-bold" onClick={handleSetDiscount}>
                      შენახვა
                   </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
