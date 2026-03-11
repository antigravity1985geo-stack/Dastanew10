"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Plus, Trash2, Download, Upload, FileSpreadsheet, Pencil, ArrowUpDown, ArrowUp, ArrowDown, X, Camera, ImageIcon, Package, Search } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useWarehouseStore } from "@/hooks/use-store";
import { Product, PurchaseHistory } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import {
  exportToExcel,
  parseCSV,
  readFileAsText,
  downloadImportTemplate,
} from "@/lib/excel";
import { uploadProductImage } from "@/lib/image-upload";
import { generateBarcodeDataURL, printBarcodeLabel, generateInternalBarcode } from "@/lib/barcode-utils";
import { Tag, Zap, FileText, ArrowRight } from "lucide-react";
import { 
  calculateSalesVelocity, 
  recommendOrderQuantity, 
  generatePurchaseOrderPDF 
} from "@/lib/purchase-orders";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

export function PurchasesPage() {
  const store = useWarehouseStore();
  const { companyName } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    barcode: "",
    purchasePrice: "",
    salePrice: "",
    wholesalePrice: "",
    quantity: "",
    supplier: "",
    client: "", // Keep for compatibility
    paidInCash: "",
    paidInCard: "",
    discountPrice: "",
    currency: "GEL" as "GEL" | "USD" | "EUR",
    exchangeRate: "1",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    barcode: "",
    purchasePrice: "",
    salePrice: "",
    discountPrice: "",
    wholesalePrice: "",
    quantity: "",
    client: "",
  });

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const lowStockThreshold = 10; // Default threshold

  const recommendations = useMemo(() => {
    return store.products.map(p => {
      const velocity = calculateSalesVelocity(p.id, store.sales);
      const recommendedQty = recommendOrderQuantity(p.quantity, velocity);
      
      return {
        ...p,
        velocity,
        recommendedQty,
        daysLeft: velocity > 0 ? Math.floor(p.quantity / velocity) : Infinity
      };
    }).filter(p => p.recommendedQty > 0 || p.quantity <= lowStockThreshold)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [store.products, store.sales]);

  const recommendationsBySupplier = useMemo(() => {
    const groups: Record<string, typeof recommendations> = {};
    recommendations.forEach(p => {
      const supplier = p.supplier || "უცნობი მომწოდებელი";
      if (!groups[supplier]) groups[supplier] = [];
      groups[supplier].push(p);
    });
    return groups;
  }, [recommendations]);

  const [activeTab, setActiveTab] = useState("all");

  // Sorting and Pagination state
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleExportExcel = () => {
    if (store.products.length === 0) {
      toast.error("ექსპორტისთვის მონაცემები არ არის");
      return;
    }
    exportToExcel(
      store.products.map((p: Product) => ({
        name: p.name,
        category: p.category || "",
        barcode: p.barcode || "",
        purchasePrice: p.purchasePrice,
        salePrice: p.salePrice,
        quantity: p.quantity,
        client: p.client || "",
        createdAt: new Date(p.createdAt).toLocaleDateString("ka-GE"),
      })),
      [
        { header: "პროდუქციის სახელი", key: "name" },
        { header: "კატეგორია", key: "category" },
        { header: "შტრიხკოდი", key: "barcode" },
        { header: "შესყიდვის ფასი", key: "purchasePrice" },
        { header: "გაყიდვის ფასი", key: "salePrice" },
        { header: "რაოდენობა", key: "quantity" },
        { header: "კლიენტი", key: "client" },
        { header: "თარიღი", key: "createdAt" },
      ],
      "შესყიდვები"
    );
    toast.success("ექსპორტი წარმატებით დასრულდა");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error("ფაილი ცარიელია ან არასწორი ფორმატია");
        return;
      }

      let imported = 0;
      for (const row of rows) {
        const name =
          row["პროდუქციის სახელი"] || row["name"] || row["სახელი"] || "";
        const purchasePrice = parseFloat(
          row["შესყიდვის ფასი"] || row["purchasePrice"] || "0"
        );
        const salePrice = parseFloat(
          row["გაყიდვის ფასი"] || row["salePrice"] || "0"
        );
        const quantity = parseInt(
          row["რაოდენობა"] || row["quantity"] || "0"
        );

        if (!name || purchasePrice <= 0 || salePrice <= 0 || quantity <= 0) {
          continue;
        }

        store.addProduct({
          name: name.trim(),
          category: (row["კატეგორია"] || row["category"] || "").trim(),
          purchasePrice,
          salePrice,
          wholesalePrice: parseFloat(row["საბითუმო ფასი"] || row["wholesalePrice"] || String(salePrice)),
          quantity,
          client: (row["კლიენტი"] || row["client"] || "").trim(),
        });
        imported++;
      }

      if (imported > 0) {
        toast.success(`წარმატებით აიტვირთა ${imported} პროდუქცია`);
      } else {
        toast.error(
          "ვერცერთი პროდუქცია ვერ აიტვირთა. შეამოწმეთ ფაილის ფორმატი."
        );
      }
    } catch {
      toast.error("ფაილის წაკითხვა ვერ მოხერხდა");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.purchasePrice || !form.salePrice || !form.quantity) {
      toast.error("შეავსეთ სავალდებულო ველები");
      return;
    }

    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      await store.addProduct({
        name: form.name.trim(),
        category: form.category.trim(),
        barcode: form.barcode.trim(),
        purchasePrice: parseFloat(form.purchasePrice),
        salePrice: parseFloat(form.salePrice),
        wholesalePrice: form.wholesalePrice ? parseFloat(form.wholesalePrice) : parseFloat(form.salePrice),
        quantity: parseInt(form.quantity),
        client: form.supplier.trim() || form.client.trim(),
        supplier: form.supplier.trim() || form.client.trim(),
        paidInCash: parseFloat(form.paidInCash || "0"),
        paidInCard: parseFloat(form.paidInCard || "0"),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : undefined,
        imageUrl,
        currency: form.currency,
        exchangeRate: parseFloat(form.exchangeRate) || 1,
      });

      toast.success("პროდუქცია წარმატებით დაემატა");
      setForm({
        name: "",
        category: "",
        barcode: "",
        purchasePrice: "",
        salePrice: "",
        wholesalePrice: "",
        quantity: "",
        supplier: "",
        client: "",
        paidInCash: "",
        paidInCard: "",
        discountPrice: "",
        currency: "GEL",
        exchangeRate: "1",
      });
      setImageFile(null);
      setImagePreview(null);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateBarcode = () => {
    const existingBarcodes = store.products.map(p => p.barcode).filter(Boolean) as string[];
    const newBarcode = generateInternalBarcode(existingBarcodes);
    setForm({ ...form, barcode: newBarcode });
    toast.success("ბარკოდი დაგენერირდა");
  };

  const handlePrintBarcode = async (product: Partial<Product>) => {
    if (!product.barcode) {
      toast.error("პროდუქტს არ აქვს ბარკოდი");
      return;
    }
    try {
      const dataURL = await generateBarcodeDataURL(product.barcode);
      printBarcodeLabel(dataURL, product.name || "პროდუქტი", product.salePrice || 0);
    } catch (error) {
      toast.error("შეცდომა ბარკოდის გენერირებისას");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ნამდვილად გსურთ წაშლა?")) return;
    try {
      await store.deleteProduct(id);
      toast.success("პროდუქცია წაიშალა");
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "შეცდომა წაშლისას");
    }
  };

  const handleEditOpen = (id: string) => {
    const product = store.products.find((p: Product) => p.id === id);
    if (!product) return;
    setEditingId(id);
    setEditForm({
      name: product.name,
      category: product.category,
      barcode: product.barcode || "",
      purchasePrice: String(product.purchasePrice),
      salePrice: String(product.salePrice),
      discountPrice: product.discountPrice !== undefined ? String(product.discountPrice) : "",
      wholesalePrice: product.wholesalePrice !== undefined ? String(product.wholesalePrice) : "",
      quantity: String(product.quantity),
      client: product.client || "",
    });
    setEditImagePreview(product.imageUrl || null);
    setEditImageFile(null);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm.name || !editForm.purchasePrice || !editForm.salePrice || !editForm.quantity) {
      toast.error("შეავსეთ სავალდებულო ველები");
      return;
    }
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (editImageFile) {
        imageUrl = await uploadProductImage(editImageFile);
      }

      const updates: any = {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        barcode: editForm.barcode.trim(),
        purchasePrice: parseFloat(editForm.purchasePrice),
        salePrice: parseFloat(editForm.salePrice),
        discountPrice: editForm.discountPrice ? parseFloat(editForm.discountPrice) : null, // Use null to clear discount
        quantity: parseInt(editForm.quantity),
        client: editForm.client.trim(),
      };

      if (editForm.wholesalePrice) {
        updates.wholesalePrice = parseFloat(editForm.wholesalePrice);
      }

      if (imageUrl) {
        updates.imageUrl = imageUrl;
      }

      await store.updateProduct(editingId, updates);
      toast.success("პროდუქცია წარმატებით განახლდა");
      setEditOpen(false);
      setEditingId(null);
      setEditImageFile(null);
      setEditImagePreview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "შეცდომა");
    } finally {
      setUploading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return store.products.filter(
      (p: Product) =>
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [store.products, searchTerm]);

  // Sorting logic
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts].sort((a: Product, b: Product) => {
      const aVal = a[sortColumn as keyof typeof a];
      const bVal = b[sortColumn as keyof typeof b];

      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      const order = sortDirection === "asc" ? 1 : -1;
      return aVal < bVal ? -1 * order : 1 * order;
    });
    return sorted;
  }, [filteredProducts, sortColumn, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  // Purchase History state
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const historyItemsPerPage = 8;

  const filteredHistory = useMemo(() => {
    return (store.purchaseHistory || []).filter(
      (ph: PurchaseHistory) =>
        (ph.productName || "").toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        (ph.category || "").toLowerCase().includes(historySearchTerm.toLowerCase())
    );
  }, [store.purchaseHistory, historySearchTerm]);

  const sortedHistory = useMemo(() => {
    return [...filteredHistory].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredHistory]);

  const historyTotalPages = Math.ceil(sortedHistory.length / historyItemsPerPage);
  const paginatedHistory = useMemo(() => {
    const start = (historyCurrentPage - 1) * historyItemsPerPage;
    return sortedHistory.slice(start, start + historyItemsPerPage);
  }, [sortedHistory, historyCurrentPage]);

  if (!mounted) return null;

  return (
    <div>
      <PageHeader
        title="შესყიდვები"
        description="პროდუქციის შესყიდვა და ისტორია"
        printTitle="შესყიდვების რეესტრი"
        actions={
          <>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              className="hidden"
              onChange={handleImportExcel}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadImportTemplate()}
            >
              <FileSpreadsheet className="h-4 w-4" />
              შაბლონი
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              იმპორტი
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportExcel}
            >
              <Download className="h-4 w-4" />
              ექსპორტი
            </Button>
          </>
        }
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              პროდუქციის დამატება
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                ახალი პროდუქციის დამატება
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name" className="text-foreground">
                    პროდუქციის სახელი *
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="მაგ: ტელეფონი Samsung"
                    className="mt-1.5"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="col-span-2">
                  <Label className="text-foreground">პროდუქციის ფოტო</Label>
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div
                    className="mt-1.5 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("image/")) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg mx-auto" />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs"
                          onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Camera className="h-8 w-8 opacity-30" />
                        <span className="text-xs">ფოტოს ატვირთვა (არასავალდებულო)</span>
                        <span className="text-[10px] opacity-60">JPEG, PNG, WebP — მაქს. 5MB</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="category" className="text-foreground">
                    კატეგორია
                  </Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    placeholder="არასავალდებულო"
                    className="mt-1.5"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="barcode" className="flex justify-between items-center text-foreground">
                    <span>შტრიხკოდი</span>
                    <button 
                      type="button" 
                      onClick={handleGenerateBarcode}
                      className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                    >
                      ავტო-გენერაცია
                    </button>
                  </Label>
                  <Input
                    id="barcode"
                    value={form.barcode}
                    onChange={(e) => {
                      const newBarcode = e.target.value;
                      setForm((prev) => ({ ...prev, barcode: newBarcode }));

                      // Auto-fill logic
                      if (newBarcode.trim().length >= 3) {
                        const existingProduct = store.getProductByBarcode(newBarcode);
                        if (existingProduct) {
                          setForm({
                            name: existingProduct.name,
                            category: existingProduct.category,
                            barcode: existingProduct.barcode || newBarcode,
                            purchasePrice: String(existingProduct.purchasePrice),
                            salePrice: String(existingProduct.salePrice),
                            wholesalePrice: existingProduct.wholesalePrice !== undefined ? String(existingProduct.wholesalePrice) : "",
                            quantity: "", // Leave quantity empty for new purchase
                            client: existingProduct.client || "",
                            supplier: "",
                            paidInCash: "",
                            paidInCard: "",
                            discountPrice: existingProduct.discountPrice !== undefined ? String(existingProduct.discountPrice) : "",
                            currency: "GEL",
                            exchangeRate: "1",
                          });
                          toast.success(`პროდუქტი ამოცნობილია: ${existingProduct.name}`);
                        }
                      }
                    }}
                    placeholder="დასასკანერებლად დააჭირეთ აქ"
                    className="mt-1.5"
                    autoFocus
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="supplier" className="text-foreground">
                    მომწოდებელი
                  </Label>
                  <Input
                    id="supplier"
                    value={form.supplier}
                    onChange={(e) =>
                      setForm({ ...form, supplier: e.target.value })
                    }
                    placeholder="მაგ: შპს დასტა"
                    className="mt-1.5"
                  />
                </div>
                <div className="col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="paidInCash" className="text-foreground text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">გადახდილი ნაღდით</Label>
                      <Input
                        id="paidInCash"
                        type="number"
                        step="0.01"
                        value={form.paidInCash}
                        onChange={(e) => setForm({ ...form, paidInCash: e.target.value })}
                        placeholder="0.00"
                        className="h-10 rounded-xl bg-primary/5 border-none px-4 font-black text-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="paidInCard" className="text-foreground text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">გადახდილი ბარათით</Label>
                      <Input
                        id="paidInCard"
                        type="number"
                        step="0.01"
                        value={form.paidInCard}
                        onChange={(e) => setForm({ ...form, paidInCard: e.target.value })}
                        placeholder="0.00"
                        className="h-10 rounded-xl bg-primary/5 border-none px-4 font-black text-primary"
                      />
                    </div>
                  </div>
                  {form.quantity && form.purchasePrice && (
                    <div className="mt-2 text-[10px] font-bold text-muted-foreground flex justify-between px-1">
                      <span>სულ ჯამი: {(parseFloat(form.quantity) * parseFloat(form.purchasePrice)).toFixed(2)} ₾</span>
                      {(() => {
                        const total = parseFloat(form.quantity) * parseFloat(form.purchasePrice);
                        const paid = parseFloat(form.paidInCash || "0") + parseFloat(form.paidInCard || "0");
                        const debt = total - paid;
                        if (debt > 0) return <span className="text-amber-600">ვალი: {debt.toFixed(2)} ₾</span>;
                        if (debt < 0) return <span className="text-emerald-600">ზედმეტობა: {Math.abs(debt).toFixed(2)} ₾</span>;
                        return <span className="text-emerald-600">სრულად გადახდილი</span>;
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">შესყიდვის ფასი *</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        step="0.01"
                        value={form.purchasePrice}
                        onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">ვალუტა</Label>
                      <select
                        id="currency"
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value as any })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="GEL">GEL (₾)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>

                  {form.currency !== "GEL" && (
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="exchangeRate">კურსი (1 {form.currency} = ? GEL) *</Label>
                      <Input
                        id="exchangeRate"
                        type="number"
                        step="0.0001"
                        value={form.exchangeRate}
                        onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })}
                        placeholder="მაგ: 2.65"
                        required
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="salePrice" className="text-foreground">
                    გაყიდვის ფასი (GEL) *
                  </Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.salePrice}
                    onChange={(e) =>
                      setForm({ ...form, salePrice: e.target.value })
                    }
                    placeholder="0.00"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="wholesalePrice" className="text-foreground text-muted-foreground">
                    საბითუმო ფასი (GEL)
                  </Label>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.wholesalePrice}
                    onChange={(e) =>
                      setForm({ ...form, wholesalePrice: e.target.value })
                    }
                    placeholder="არასავალდებულო"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="discountPrice" className="text-foreground text-red-500 font-bold">
                    აქციის (ახალი) ფასი
                  </Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discountPrice}
                    onChange={(e) =>
                      setForm({ ...form, discountPrice: e.target.value })
                    }
                    placeholder="დროებითი ფასი"
                    className="mt-1.5 border-red-100 bg-red-50/20"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="quantity" className="text-foreground">
                    რაოდენობა *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    placeholder="1"
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  გაუქმება
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "იტვირთება..." : "დამატება"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <div id="print-area" className="animate-in fade-in duration-700">
        <Tabs defaultValue="stock" className="space-y-8" onValueChange={setActiveTab}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/50 max-w-md">
              <TabsTrigger value="stock" className="rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-background font-bold px-6">
                <Package className="h-4 w-4 mr-2" />
                მიმდინარე ნაშთი
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-background font-bold px-6">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                შესყიდვების ისტორია
              </TabsTrigger>
              <TabsTrigger value="recommended" className="rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-background font-bold px-6">
                <Zap className="h-4 w-4 mr-2 text-amber-500" />
                რეკომენდირებული
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="stock">
            <div id="print-area">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
                <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow bg-blue-50/30 border-t-4 border-t-blue-500">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest border-b border-blue-100 pb-1 mb-2">
                      პროდუქციის ტიპი
                    </p>
                    <p className="text-2xl font-black text-blue-950">
                      {store.totalProducts}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow bg-emerald-50/30 border-t-4 border-t-emerald-500">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest border-b border-emerald-100 pb-1 mb-2">
                      მთლიანი სტოკი
                    </p>
                    <p className="text-2xl font-black text-emerald-950">
                      {store.totalStock} <span className="text-sm font-bold text-emerald-700/60">ერთ.</span>
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow bg-amber-50/30 border-t-4 border-t-amber-500">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest border-b border-amber-100 pb-1 mb-2">
                      მთლიანი შესყიდვის ღირებულება
                    </p>
                    <p className="text-2xl font-black text-amber-600">
                      {store.totalPurchaseValue.toLocaleString()} ₾
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="ძებნა (სახელი, კატეგორია, შტრიხკოდი...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 border-none bg-muted/30 rounded-xl font-medium focus-visible:ring-primary/20"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    className="gap-2 rounded-xl font-bold border-border/50 hover:bg-muted/50"
                  >
                    <Download className="h-4 w-4 text-emerald-600" />
                    Excel-ში ექსპორტი
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 rounded-xl font-bold border-border/50 hover:bg-muted/50"
                  >
                    <Upload className="h-4 w-4 text-sky-600" />
                    Excel-დან იმპორტი
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleImportExcel}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadImportTemplate}
                    className="gap-2 rounded-xl font-bold hover:bg-muted"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    შაბლონი
                  </Button>
                </div>
              </div>

              <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/50">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    შესყიდული პროდუქცია ({filteredProducts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest w-12">#</TableHead>
                        <TableHead
                          className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center">
                            პროდუქცია
                            {getSortIcon("name")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort("category")}
                        >
                          <div className="flex items-center">
                            კატეგორია
                            {getSortIcon("category")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort("barcode")}
                        >
                          <div className="flex items-center">
                            შტრიხკოდი
                            {getSortIcon("barcode")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-colors text-right"
                          onClick={() => handleSort("purchasePrice")}
                        >
                          <div className="flex items-center justify-end">
                            შესყიდვის ფასი
                            {getSortIcon("purchasePrice")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-colors text-right"
                          onClick={() => handleSort("salePrice")}
                        >
                          <div className="flex items-center justify-end">
                            გაყიდვის ფასი
                            {getSortIcon("salePrice")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-colors text-center"
                          onClick={() => handleSort("quantity")}
                        >
                          <div className="flex items-center justify-center">
                            ნაშთი
                            {getSortIcon("quantity")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort("client")}
                        >
                          <div className="flex items-center">
                            კლიენტი
                            {getSortIcon("client")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort("createdAt")}
                        >
                          <div className="flex items-center">
                            თარიღი
                            {getSortIcon("createdAt")}
                          </div>
                        </TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-12 text-muted-foreground"
                          >
                            პროდუქცია არ არის დამატებული
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedProducts.map((product: Product, index: number) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium text-foreground">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                {product.imageUrl ? (
                                  <div className="h-8 w-8 rounded-md overflow-hidden border border-border/50 flex-shrink-0">
                                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="h-8 w-8 rounded-md bg-primary/5 flex items-center justify-center flex-shrink-0">
                                    <ImageIcon className="h-4 w-4 text-primary/30" />
                                  </div>
                                )}
                                {product.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {product.category || (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {product.barcode || (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {product.purchasePrice.toLocaleString()} GEL
                            </TableCell>
                            <TableCell className="text-foreground">
                              {product.salePrice.toLocaleString()} GEL
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.quantity > 10
                                  ? "bg-chart-2/10 text-chart-2"
                                  : product.quantity > 0
                                    ? "bg-chart-3/10 text-chart-3"
                                    : "bg-destructive/10 text-destructive"
                                  }`}
                              >
                                {product.quantity} ერთ.
                              </span>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {product.client || (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(product.createdAt).toLocaleDateString(
                                "ka-GE"
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 text-slate-600 hover:text-primary hover:bg-primary/5 border-border/50 rounded-xl transition-all shadow-sm"
                                  title="ბარკოდის ბეჭდვა"
                                  onClick={() => handlePrintBarcode(product)}
                                >
                                  <Tag className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 text-slate-600 hover:text-primary hover:bg-primary/5 border-border/50 rounded-xl transition-all shadow-sm"
                                  onClick={() => handleEditOpen(product.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">რედაქტირება</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 text-rose-600 hover:text-white hover:bg-rose-500 border-rose-100 bg-rose-50/30 rounded-xl transition-all shadow-sm"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">წაშლა</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Pagination UI */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }).map((_, i: number) => {
                        const page = i + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={currentPage === page}
                                onClick={() => setCurrentPage(page)}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {/* History Search */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="ძიება ისტორიაში..."
                    value={historySearchTerm}
                    onChange={(e) => {
                      setHistorySearchTerm(e.target.value);
                      setHistoryCurrentPage(1);
                    }}
                    className="pr-10"
                  />
                  {historySearchTerm && (
                    <button
                      onClick={() => {
                        setHistorySearchTerm("");
                        setHistoryCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-card-foreground">
                    შესყიდვების ლოგი ({filteredHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-foreground w-12">#</TableHead>
                        <TableHead className="text-foreground">პროდუქცია</TableHead>
                        <TableHead className="text-foreground">რაოდენობა</TableHead>
                        <TableHead className="text-foreground">შესყიდვის ფასი</TableHead>
                        <TableHead className="text-foreground">გადახდილი</TableHead>
                        <TableHead className="text-foreground">მომწოდებელი</TableHead>
                        <TableHead className="text-foreground">თარიღი</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                            ისტორია ცარიელია
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedHistory.map((ph: PurchaseHistory, index: number) => (
                          <TableRow key={ph.id}>
                            <TableCell className="font-medium text-foreground">
                              {(historyCurrentPage - 1) * historyItemsPerPage + index + 1}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              <div className="flex flex-col">
                                <span>{ph.productName}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{ph.category || "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground font-semibold text-emerald-600">
                              +{ph.quantity}
                            </TableCell>
                            <TableCell className="text-foreground font-bold">{ph.purchasePrice.toLocaleString()} GEL</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-black text-primary">{(ph.paidInCash + ph.paidInCard).toLocaleString()} ₾</span>
                                {((ph.purchasePrice * ph.quantity) > (ph.paidInCash + ph.paidInCard)) && (
                                  <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">ვალი: {((ph.purchasePrice * ph.quantity) - (ph.paidInCash + ph.paidInCard)).toFixed(2)}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground text-sm font-medium">{ph.supplier || ph.client || "-"}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(ph.createdAt).toLocaleString("ka-GE")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* History Pagination */}
              {historyTotalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setHistoryCurrentPage((p) => Math.max(1, p - 1))}
                          className={historyCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: historyTotalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={historyCurrentPage === i + 1}
                            onClick={() => setHistoryCurrentPage(i + 1)}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setHistoryCurrentPage((p) => Math.min(historyTotalPages, p + 1))}
                          className={historyCurrentPage === historyTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </TabsContent>
        <TabsContent value="recommended" className="animate-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 gap-6">
            {Object.keys(recommendationsBySupplier).length === 0 ? (
              <Card className="border-none shadow-sm py-12">
                <CardContent className="flex flex-col items-center justify-center text-muted-foreground">
                  <Zap className="h-12 w-12 opacity-10 mb-4" />
                  <p>შესასყიდი პროდუქცია არ არის (ყველაფერი საკმარისია)</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(recommendationsBySupplier).map(([supplier, items]) => (
                <Card key={supplier} className="border-none shadow-sm rounded-2xl overflow-hidden mb-6">
                  <CardHeader className="bg-muted/30 flex flex-row items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">{supplier}</CardTitle>
                        <p className="text-xs text-muted-foreground">{items.length} პროდუქტი საჭიროებს შევსებას</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-xl gap-2 font-bold border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                      onClick={() => generatePurchaseOrderPDF(
                        supplier, 
                        items.map(i => ({ name: i.name, quantity: i.recommendedQty, currentStock: i.quantity })),
                        companyName || "My Store"
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      PDF ორდერი
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/10">
                        <TableRow className="hover:bg-transparent border-none">
                          <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6 py-4">პროდუქტი</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">ნაშთი</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">დღიური გაყიდვა</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">პროგნოზი</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right pr-6">რეკომენდირებული</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/20 transition-colors border-b border-border/50">
                            <TableCell className="font-bold pl-6 py-4">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant={item.quantity <= 5 ? "destructive" : "outline"} className="rounded-lg">
                                {item.quantity} ერთ.
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-medium">
                              {item.velocity.toFixed(2)} ერთ/დღე
                            </TableCell>
                            <TableCell>
                              {item.daysLeft === Infinity ? (
                                <span className="text-xs text-muted-foreground">მონაცემები არ არის</span>
                              ) : (
                                <span className={cn(
                                  "text-xs font-bold",
                                  item.daysLeft < 3 ? "text-rose-600 font-black" : "text-amber-600"
                                )}>
                                  {item.daysLeft} დღის მარაგი
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-lg font-black text-primary">{item.recommendedQty}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                პროდუქციის რედაქტირება
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="editName" className="text-foreground">
                    პროდუქციის სახელი *
                  </Label>
                  <Input
                    id="editName"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editCategory" className="text-foreground">
                    კატეგორია
                  </Label>
                  <Input
                    id="editCategory"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    placeholder="არასავალდებულო"
                    className="mt-1.5"
                  />
                </div>
                 <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="editBarcode" className="flex justify-between items-center text-foreground">
                    <span>შტრიხკოდი</span>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          const existingBarcodes = store.products.map(p => p.barcode).filter(Boolean) as string[];
                          const newBarcode = generateInternalBarcode(existingBarcodes);
                          setEditForm({ ...editForm, barcode: newBarcode });
                          toast.success("ბარკოდი დაგენერირდა");
                        }}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                      >
                        გენერაცია
                      </button>
                      {editForm.barcode && (
                        <button 
                          type="button" 
                          onClick={async () => {
                            try {
                              const dataURL = await generateBarcodeDataURL(editForm.barcode);
                              printBarcodeLabel(dataURL, editForm.name || "პროდუქტი", parseFloat(editForm.salePrice) || 0);
                            } catch (error) {
                              toast.error("შეცდომა ბეჭდვისას");
                            }
                          }}
                          className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-tighter border-l pl-2 border-border"
                        >
                          ბეჭდვა
                        </button>
                      )}
                    </div>
                  </Label>
                  <Input
                    id="editBarcode"
                    value={editForm.barcode}
                    onChange={(e) =>
                      setEditForm({ ...editForm, barcode: e.target.value })
                    }
                    placeholder="დასასკანერებლად დააჭირეთ აქ"
                    className="mt-1.5"
                  />
                </div>

                {/* Edit Image Upload */}
                <div className="col-span-2">
                  <Label className="text-foreground">პროდუქციის ფოტო</Label>
                  <input
                    type="file"
                    ref={editImageInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setEditImagePreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div
                    className="mt-1.5 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    onClick={() => editImageInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("image/")) {
                        setEditImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setEditImagePreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    {editImagePreview ? (
                      <div className="relative inline-block">
                        <img src={editImagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg mx-auto" />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs"
                          onClick={(e) => { e.stopPropagation(); setEditImageFile(null); setEditImagePreview(null); }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Camera className="h-8 w-8 opacity-30" />
                        <span className="text-xs">ფოტოს ატვირთვა (არასავალდებულო)</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="editClient" className="text-foreground">
                    კლიენტი / მომწოდებელი
                  </Label>
                  <Input
                    id="editClient"
                    value={editForm.client}
                    onChange={(e) =>
                      setEditForm({ ...editForm, client: e.target.value })
                    }
                    placeholder="არასავალდებულო"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="editPurchasePrice" className="text-foreground">
                    შესყიდვის ფასი (GEL) *
                  </Label>
                  <Input
                    id="editPurchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.purchasePrice}
                    onChange={(e) =>
                      setEditForm({ ...editForm, purchasePrice: e.target.value })
                    }
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editSalePrice" className="text-foreground">
                    გაყიდვის ფასი (GEL) *
                  </Label>
                  <Input
                    id="editSalePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.salePrice}
                    onChange={(e) =>
                      setEditForm({ ...editForm, salePrice: e.target.value })
                    }
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editWholesalePrice" className="text-foreground text-muted-foreground">
                    საბითუმო ფასი (GEL)
                  </Label>
                  <Input
                    id="editWholesalePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.wholesalePrice}
                    onChange={(e) =>
                      setEditForm({ ...editForm, wholesalePrice: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="editDiscountPrice" className="text-foreground text-red-500 font-bold">
                    აქციის (ახალი) ფასი
                  </Label>
                  <Input
                    id="editDiscountPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.discountPrice}
                    onChange={(e) =>
                      setEditForm({ ...editForm, discountPrice: e.target.value })
                    }
                    placeholder="ცარიელი ნიშნავს აქციის გარეშე"
                    className="mt-1.5 border-red-100 bg-red-50/20"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="editQuantity" className="text-foreground">
                    რაოდენობა *
                  </Label>
                  <Input
                    id="editQuantity"
                    type="number"
                    min="0"
                    value={editForm.quantity}
                    onChange={(e) =>
                      setEditForm({ ...editForm, quantity: e.target.value })
                    }
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  გაუქმება
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "იტვირთება..." : "შენახვა"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
