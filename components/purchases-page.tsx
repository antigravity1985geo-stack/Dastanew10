"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Plus, Trash2, Download, Upload, FileSpreadsheet, Pencil, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
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

export function PurchasesPage() {
  const store = useWarehouseStore();
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
    quantity: "",
    supplier: "",
    client: "", // Keep for compatibility
    paidInCash: "",
    paidInCard: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    barcode: "",
    purchasePrice: "",
    salePrice: "",
    quantity: "",
    client: "",
  });

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

    await store.addProduct({
      name: form.name.trim(),
      category: form.category.trim(),
      barcode: form.barcode.trim(),
      purchasePrice: parseFloat(form.purchasePrice),
      salePrice: parseFloat(form.salePrice),
      quantity: parseInt(form.quantity),
      client: form.supplier.trim() || form.client.trim(), // Map supplier to client
      supplier: form.supplier.trim() || form.client.trim(),
      paidInCash: parseFloat(form.paidInCash || "0"),
      paidInCard: parseFloat(form.paidInCard || "0"),
    });

    toast.success("პროდუქცია წარმატებით დაემატა");
    setForm({
      name: "",
      category: "",
      barcode: "",
      purchasePrice: "",
      salePrice: "",
      quantity: "",
      supplier: "",
      client: "",
      paidInCash: "",
      paidInCard: "",
    });
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await store.deleteProduct(id);
    toast.success("პროდუქცია წაიშალა");
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
      quantity: String(product.quantity),
      client: product.client || "",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm.name || !editForm.purchasePrice || !editForm.salePrice || !editForm.quantity) {
      toast.error("შეავსეთ სავალდებულო ველები");
      return;
    }
    try {
      await store.updateProduct(editingId, {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        barcode: editForm.barcode.trim(),
        purchasePrice: parseFloat(editForm.purchasePrice),
        salePrice: parseFloat(editForm.salePrice),
        quantity: parseInt(editForm.quantity),
        client: editForm.client.trim(),
      });
      toast.success("პროდუქცია წარმატებით განახლდა");
      setEditOpen(false);
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "შეცდომა");
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
          <DialogContent className="sm:max-w-[500px]">
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
                  <Label htmlFor="barcode" className="text-foreground">
                    შტრიხკოდი
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
                            quantity: "", // Leave quantity empty for new purchase
                            client: existingProduct.client,
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
                  <Label htmlFor="purchasePrice" className="text-foreground">
                    შესყიდვის ფასი (GEL) *
                  </Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.purchasePrice}
                    onChange={(e) =>
                      setForm({ ...form, purchasePrice: e.target.value })
                    }
                    placeholder="0.00"
                    className="mt-1.5"
                    required
                  />
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
                <Button type="submit">დამატება</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">მიმდინარე ნაშთი</TabsTrigger>
          <TabsTrigger value="history">შესყიდვების ისტორია</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <div id="print-area">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    პროდუქციის ტიპი
                  </p>
                  <p className="text-xl font-bold mt-1 text-card-foreground">
                    {store.totalProducts}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    მთლიანი სტოკი
                  </p>
                  <p className="text-xl font-bold mt-1 text-card-foreground">
                    {store.totalStock} ერთეული
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    მთლიანი შესყიდვის ღირებულება
                  </p>
                  <p className="text-xl font-bold mt-1 text-card-foreground">
                    {store.totalPurchaseValue.toLocaleString()} GEL
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Input
                  placeholder="ძიება პროდუქციის სახელით ან კატეგორიით..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Products Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-card-foreground">
                  შესყიდული პროდუქცია ({filteredProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground w-12">#</TableHead>
                      <TableHead
                        className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          პროდუქცია
                          {getSortIcon("name")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("category")}
                      >
                        <div className="flex items-center">
                          კატეგორია
                          {getSortIcon("category")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("barcode")}
                      >
                        <div className="flex items-center">
                          შტრიხკოდი
                          {getSortIcon("barcode")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("purchasePrice")}
                      >
                        <div className="flex items-center">
                          შესყიდვის ფასი
                          {getSortIcon("purchasePrice")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("salePrice")}
                      >
                        <div className="flex items-center">
                          გაყიდვის ფასი
                          {getSortIcon("salePrice")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("quantity")}
                      >
                        <div className="flex items-center">
                          ნაშთი (სტოკი)
                          {getSortIcon("quantity")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("client")}
                      >
                        <div className="flex items-center">
                          კლიენტი
                          {getSortIcon("client")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center">
                          თარიღი
                          {getSortIcon("createdAt")}
                        </div>
                      </TableHead>
                      <TableHead className="text-foreground w-10"></TableHead>
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
                            {product.name}
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
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => handleEditOpen(product.id)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">რედაქტირება</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
              <CardContent className="p-0">
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
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
                <Label htmlFor="editBarcode" className="text-foreground">
                  შტრიხკოდი
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
              <Button type="submit">შენახვა</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
