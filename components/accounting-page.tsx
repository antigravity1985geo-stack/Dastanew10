"use client";

import { useState, useMemo, useEffect } from "react";
import { Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useWarehouseStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { exportToExcel } from "@/lib/excel";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Calculator, CalendarDays } from "lucide-react";

export function AccountingPage() {
  const store = useWarehouseStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  // Global Accounting Filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [taxRate, setTaxRate] = useState<number>(1); // e.g. 1% small business tax

  // Expenses Modal State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "საოპერაციო",
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount) {
      toast.error("მიუთითეთ თანხა");
      return;
    }
    await store.addExpense({
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      description: expenseForm.description,
      date: expenseForm.date,
    });
    toast.success("ხარჯი დამატებულია");
    setExpenseModalOpen(false);
    setExpenseForm({ amount: "", category: "საოპერაციო", description: "", date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("ნამდვილად გსურთ ხარჯის წაშლა?")) {
      await store.deleteExpense(id);
      toast.success("ხარჯი წაიშალა");
    }
  };

  // Filtered Data based on Dates
  const filteredSales = useMemo(() => {
    return store.sales.filter((s) => {
      if (!startDate && !endDate) return true;
      const d = new Date(s.createdAt);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date("2100-01-01");
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });
  }, [store.sales, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return store.expenses.filter((e) => {
      if (!startDate && !endDate) return true;
      const d = new Date(e.date);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date("2100-01-01");
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });
  }, [store.expenses, startDate, endDate]);

  // Derived Accounting Metrics
  const accRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const accCogs = filteredSales.reduce((sum, s) => {
    const p = store.products.find(prod => prod.id === s.productId);
    return sum + (p?.purchasePrice || 0) * s.quantity;
  }, 0);
  const accGrossProfit = accRevenue - accCogs;
  const accTotalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const accNetProfit = accGrossProfit - accTotalExpenses;
  const accTaxLiability = accRevenue * (taxRate / 100);

  // Debtor Data (Sales that are not fully paid)
  const debtors = useMemo(() => {
    return store.sales.filter(s => s.status !== "paid");
  }, [store.sales]);

  // General Store Totals (for Warehouse)
  const totalPurchaseCost = store.products.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);
  const totalStockSaleValue = store.products.reduce((acc, p) => acc + p.salePrice * p.quantity, 0);
  const unrealizedProfit = totalStockSaleValue - totalPurchaseCost;
  const totalSoldQuantity = store.sales.reduce((acc, s) => acc + s.quantity, 0);

  // Inventory Table State
  const [invSortColumn, setInvSortColumn] = useState("name");
  const [invSortDirection, setInvSortDirection] = useState<"asc" | "desc">("asc");
  const [invCurrentPage, setInvCurrentPage] = useState(1);
  const invItemsPerPage = 10;

  // Sales Table State (using filteredSales now for accounting view)
  const [salesSortColumn, setSalesSortColumn] = useState("createdAt");
  const [salesSortDirection, setSalesSortDirection] = useState<"asc" | "desc">("desc");
  const [salesCurrentPage, setSalesCurrentPage] = useState(1);
  const salesItemsPerPage = 10;

  // Expenses Table State
  const [expCurrentPage, setExpCurrentPage] = useState(1);
  const expItemsPerPage = 5;

  // Debtors Table State
  const [debtCurrentPage, setDebtCurrentPage] = useState(1);
  const debtItemsPerPage = 5;

  // Sorting Logic Extracted...
  const sortedProducts = useMemo(() => {
    return [...store.products].sort((a, b) => {
      const aVal = a[invSortColumn as keyof typeof a];
      const bVal = b[invSortColumn as keyof typeof b];
      if (aVal === bVal) return 0;
      const order = invSortDirection === "asc" ? 1 : -1;
      return (aVal ?? "") < (bVal ?? "") ? -1 * order : 1 * order;
    });
  }, [store.products, invSortColumn, invSortDirection]);

  // Inventory Pagination Logic
  const invTotalPages = Math.ceil(sortedProducts.length / invItemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (invCurrentPage - 1) * invItemsPerPage;
    return sortedProducts.slice(start, start + invItemsPerPage);
  }, [sortedProducts, invCurrentPage]);

  // Sales Sorting Logic
  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      const aVal = a[salesSortColumn as keyof typeof a];
      const bVal = b[salesSortColumn as keyof typeof b];
      if (aVal === bVal) return 0;
      const order = salesSortDirection === "asc" ? 1 : -1;
      return (aVal ?? "") < (bVal ?? "") ? -1 * order : 1 * order;
    });
  }, [filteredSales, salesSortColumn, salesSortDirection]);

  // Sales Pagination Logic
  const salesTotalPages = Math.ceil(sortedSales.length / salesItemsPerPage);
  const paginatedSales = useMemo(() => {
    const start = (salesCurrentPage - 1) * salesItemsPerPage;
    return sortedSales.slice(start, start + salesItemsPerPage);
  }, [sortedSales, salesCurrentPage]);

  // Expenses Pagination Logic
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredExpenses]);
  const expTotalPages = Math.ceil(sortedExpenses.length / expItemsPerPage);
  const paginatedExpenses = useMemo(() => {
    const start = (expCurrentPage - 1) * expItemsPerPage;
    return sortedExpenses.slice(start, start + expItemsPerPage);
  }, [sortedExpenses, expCurrentPage]);

  // Debtors Pagination Logic
  const sortedDebtors = useMemo(() => {
    return [...debtors].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [debtors]);
  const debtTotalPages = Math.ceil(sortedDebtors.length / debtItemsPerPage);
  const paginatedDebtors = useMemo(() => {
    const start = (debtCurrentPage - 1) * debtItemsPerPage;
    return sortedDebtors.slice(start, start + debtItemsPerPage);
  }, [sortedDebtors, debtCurrentPage]);

  const handleInvSort = (column: string) => {
    if (invSortColumn === column) {
      setInvSortDirection(invSortDirection === "asc" ? "desc" : "asc");
    } else {
      setInvSortColumn(column);
      setInvSortDirection("asc");
    }
  };

  const handleSalesSort = (column: string) => {
    if (salesSortColumn === column) {
      setSalesSortDirection(salesSortDirection === "asc" ? "desc" : "asc");
    } else {
      setSalesSortColumn(column);
      setSalesSortDirection("asc");
    }
  };

  const getSortIcon = (currentCol: string, targetCol: string, direction: "asc" | "desc") => {
    if (currentCol !== targetCol) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const handleExportInventory = () => {
    if (store.products.length === 0) {
      toast.error("ექსპორტისთვის მონაცემები არ არის");
      return;
    }
    exportToExcel(
      store.products.map((p) => {
        const totalPurchase = p.purchasePrice * p.quantity;
        const totalSale = p.salePrice * p.quantity;
        const margin = totalSale - totalPurchase;
        return {
          name: p.name,
          category: p.category || "",
          quantity: p.quantity,
          purchasePrice: p.purchasePrice,
          salePrice: p.salePrice,
          totalPurchase,
          totalSale,
          margin,
          marginPercent:
            totalPurchase > 0
              ? ((margin / totalPurchase) * 100).toFixed(1) + "%"
              : "0%",
        };
      }),
      [
        { header: "პროდუქცია", key: "name" },
        { header: "კატეგორია", key: "category" },
        { header: "ნაშთი", key: "quantity" },
        { header: "შესყიდვის ფასი", key: "purchasePrice" },
        { header: "გაყიდვის ფასი", key: "salePrice" },
        { header: "მთლიანი შესყიდვა", key: "totalPurchase" },
        { header: "მთლიანი გაყიდვა", key: "totalSale" },
        { header: "მარჟა", key: "margin" },
        { header: "მარჟა %", key: "marginPercent" },
      ],
      "საწყობის_ანგარიშგება"
    );
    toast.success("ექსპორტი წარმატებით დასრულდა");
  };

  const handleExportSalesHistory = () => {
    if (store.sales.length === 0) {
      toast.error("ექსპორტისთვის მონაცემები არ არის");
      return;
    }
    exportToExcel(
      store.sales.map((s) => ({
        date: new Date(s.createdAt).toLocaleDateString("ka-GE"),
        productName: s.productName,
        category: s.category || "",
        quantity: s.quantity,
        salePrice: s.salePrice,
        totalAmount: s.totalAmount,
        client: s.client || "",
      })),
      [
        { header: "თარიღი", key: "date" },
        { header: "პროდუქცია", key: "productName" },
        { header: "კატეგორია", key: "category" },
        { header: "რაოდენობა", key: "quantity" },
        { header: "ფასი", key: "salePrice" },
        { header: "ჯამი", key: "totalAmount" },
        { header: "მყიდველი", key: "client" },
      ],
      "გაყიდვების_ისტორია"
    );
    toast.success("ექსპორტი წარმატებით დასრულდა");
  };

  const handleExportExpenses = () => {
    if (store.expenses.length === 0) {
      toast.error("ექსპორტისთვის მონაცემები არ არის");
      return;
    }
    exportToExcel(
      store.expenses.map((e) => ({
        date: new Date(e.date).toLocaleDateString("ka-GE"),
        category: e.category,
        description: e.description || "",
        amount: e.amount,
      })),
      [
        { header: "თარიღი", key: "date" },
        { header: "კატეგორია", key: "category" },
        { header: "აღწერა", key: "description" },
        { header: "თანხა", key: "amount" },
      ],
      "საოპერაციო_ხარჯები"
    );
    toast.success("ექსპორტი წარმატებით დასრულდა");
  };

  const handleExportDebtors = () => {
    if (debtors.length === 0) {
      toast.error("ექსპორტისთვის მონაცემები არ არის");
      return;
    }
    exportToExcel(
      debtors.map((d) => ({
        client: d.client || "უცნობი",
        productName: d.productName,
        totalAmount: d.totalAmount,
        paidAmount: d.paidAmount || 0,
        debt: d.totalAmount - (d.paidAmount || 0),
        date: new Date(d.createdAt).toLocaleDateString("ka-GE"),
      })),
      [
        { header: "მყიდველი", key: "client" },
        { header: "პროდუქცია", key: "productName" },
        { header: "ჯამური თანხა", key: "totalAmount" },
        { header: "გადახდილი", key: "paidAmount" },
        { header: "დავალიანება", key: "debt" },
        { header: "თარიღი", key: "date" },
      ],
      "დებიტორები"
    );
    toast.success("ექსპორტი წარმატებით დასრულდა");
  };

  if (!mounted) return null;

  return (
    <div>
      <PageHeader
        title="ბუღალტერია"
        description="ფინანსური ინფორმაცია და საწყობის ანგარიშგება"
        printTitle="ბუღალტრული ანგარიშგება"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                ექსპორტი
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportInventory} className="cursor-pointer">
                საწყობის ანგარიშგება
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSalesHistory} className="cursor-pointer">
                გაყიდვების ისტორია
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExpenses} className="cursor-pointer">
                საოპერაციო ხარჯები
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportDebtors} className="cursor-pointer">
                დებიტორული დავალიანებები
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div id="print-area">
        {/* Global Date Filter & Tax */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-end bg-card p-4 rounded-xl border shadow-sm print:hidden">
          <div>
            <Label className="text-foreground">საწყისი თარიღი</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-foreground">საბოლოო თარიღი</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1.5" />
          </div>
          <div className="flex-1"></div>
          <div>
            <Label className="text-foreground">საშემოსავლო / მოგების გადასახადი (%)</Label>
            <Input type="number" min="0" step="0.1" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="mt-1.5 w-full sm:w-32" />
          </div>
        </div>

        {/* Print Only Date Info */}
        <div className="hidden print:block mb-6 space-y-2 text-sm border-b pb-4">
          <p><strong>საანგარიშო პერიოდი:</strong> {startDate ? new Date(startDate).toLocaleDateString("ka-GE") : 'ყველა დრო'} - {endDate ? new Date(endDate).toLocaleDateString("ka-GE") : 'დღემდე'}</p>
          <p><strong>მოგების გადასახადის განაკვეთი:</strong> {taxRate}%</p>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-4 mb-6">
          <Card className="print:shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                მთლიანი შემოსავალი (Rev)
              </p>
              <p className="text-xl font-bold mt-1 text-card-foreground">
                {accRevenue.toLocaleString()} GEL
              </p>
            </CardContent>
          </Card>
          <Card className="print:shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                თვითღირებულება (COGS)
              </p>
              <p className="text-xl font-bold mt-1 text-card-foreground">
                {accCogs.toLocaleString()} GEL
              </p>
            </CardContent>
          </Card>
          <Card className="print:shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                საოპერაციო ხარჯები
              </p>
              <p className="text-xl font-bold mt-1 text-card-foreground">
                {accTotalExpenses.toLocaleString()} GEL
              </p>
            </CardContent>
          </Card>
          <Card className="print:shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                წმინდა მოგება
              </p>
              <p className={`text-xl font-bold mt-1 ${accNetProfit - accTaxLiability >= 0 ? "text-chart-2" : "text-destructive"}`}>
                {(accNetProfit - accTaxLiability).toLocaleString()} GEL
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Accounting Info */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6 print:grid-cols-2 print:gap-6">
          {/* Profit & Loss Statement */}
          <Card>
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                მოგება-ზარალის ანგარიშგება (P&L)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">გაყიდვების შემოსავალი (Revenue)</span>
                <span className="font-semibold text-foreground">{accRevenue.toLocaleString()} GEL</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">გაყიდვების თვითღირებულება (COGS)</span>
                <span className="font-semibold text-destructive">-{accCogs.toLocaleString()} GEL</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-card-foreground">საერთო მოგება (Gross Profit)</span>
                <span className={`text-sm font-bold ${accGrossProfit >= 0 ? "text-chart-2" : "text-destructive"}`}>
                  {accGrossProfit.toLocaleString()} GEL
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-4">
                <span className="text-muted-foreground">საოპერაციო ხარჯები (Expenses)</span>
                <span className="font-semibold text-destructive">-{accTotalExpenses.toLocaleString()} GEL</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-card-foreground">საოპერაციო მოგება (Operating Profit)</span>
                <span className={`text-sm font-bold ${accNetProfit >= 0 ? "text-chart-2" : "text-destructive"}`}>
                  {accNetProfit.toLocaleString()} GEL
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-4">
                <span className="text-muted-foreground">გადასახადი ({taxRate}%)</span>
                <span className="font-semibold text-destructive">-{accTaxLiability.toLocaleString()} GEL</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg">
                <span className="text-base font-bold text-card-foreground">სუფთა მოგება (Net Income)</span>
                <span className={`text-base font-bold ${accNetProfit - accTaxLiability >= 0 ? "text-chart-2" : "text-destructive"}`}>
                  {(accNetProfit - accTaxLiability).toLocaleString()} GEL
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-card-foreground">
                საწყობის ზოგადი ინფორმაცია
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-card-foreground">
                  პროდუქციის ტიპი
                </span>
                <span className="text-sm font-semibold text-card-foreground">
                  {store.totalProducts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-card-foreground">
                  მთლიანი სტოკი (ნაშთი)
                </span>
                <span className="text-sm font-semibold text-card-foreground">
                  {store.totalStock} ერთეული
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-card-foreground">
                  კატეგორიების რაოდენობა
                </span>
                <span className="text-sm font-semibold text-card-foreground">
                  {store.categories.length}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-card-foreground">
                  მთლიანი გაყიდვების რაოდენობა
                </span>
                <span className="text-sm font-semibold text-card-foreground">
                  {store.sales.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-card-foreground">
                  გაყიდული ერთეულები
                </span>
                <span className="text-sm font-semibold text-card-foreground">
                  {totalSoldQuantity}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-card-foreground">
                  საშუალო გაყიდვის თანხა
                </span>
                <span className="text-sm font-semibold text-card-foreground">
                  {store.sales.length > 0
                    ? (
                      store.totalRevenue / store.sales.length
                    ).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                    : "0"}{" "}
                  GEL
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses and Debtors side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 print:grid-cols-2 print:gap-6">
          {/* Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-card-foreground">საოპერაციო ხარჯები</CardTitle>
              <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2 print:hidden">
                    <Plus className="h-4 w-4" /> დამატება
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>ახალი ხარჯის დამატება</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddExpense} className="space-y-4 pt-4">
                    <div>
                      <Label>თანხა (GEL) *</Label>
                      <Input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                    </div>
                    <div>
                      <Label>კატეგორია</Label>
                      <Input value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} />
                    </div>
                    <div>
                      <Label>აღწერა</Label>
                      <Input value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                    </div>
                    <div>
                      <Label>თარიღი</Label>
                      <Input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
                    </div>
                    <Button type="submit" className="w-full mt-2">დამატება</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>თარიღი</TableHead>
                    <TableHead>კატეგორია</TableHead>
                    <TableHead>თანხა</TableHead>
                    <TableHead className="w-10 print:hidden"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenses.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">ხარჯები არ მოიძებნა</TableCell></TableRow>
                  ) : paginatedExpenses.map((exp: any) => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString('ka-GE')}</TableCell>
                      <TableCell>
                        <div className="font-medium">{exp.category}</div>
                        {exp.description && <div className="text-xs text-muted-foreground line-clamp-1">{exp.description}</div>}
                      </TableCell>
                      <TableCell className="font-semibold text-destructive">-{exp.amount.toLocaleString()} ₾</TableCell>
                      <TableCell className="print:hidden">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteExpense(exp.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {expTotalPages > 1 && (
                <div className="p-3 border-t print:hidden">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem><PaginationPrevious onClick={() => setExpCurrentPage(p => Math.max(1, p - 1))} className={expCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                      <PaginationItem><PaginationNext onClick={() => setExpCurrentPage(p => Math.min(expTotalPages, p + 1))} className={expCurrentPage === expTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debtors */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold text-card-foreground">დებიტორული დავალიანებები</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>მყიდველი</TableHead>
                    <TableHead>პროდუქცია</TableHead>
                    <TableHead>დავალიანება</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDebtors.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">დავალიანებები არ მოიძებნა</TableCell></TableRow>
                  ) : paginatedDebtors.map((debt: any) => (
                    <TableRow key={debt.id}>
                      <TableCell className="font-medium text-foreground">{debt.client || "უცნობი"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{debt.productName}</TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {(debt.totalAmount - (debt.paidAmount || 0)).toLocaleString()} ₾
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {debtTotalPages > 1 && (
                <div className="p-3 border-t print:hidden">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem><PaginationPrevious onClick={() => setDebtCurrentPage(p => Math.max(1, p - 1))} className={debtCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                      <PaginationItem><PaginationNext onClick={() => setDebtCurrentPage(p => Math.min(debtTotalPages, p + 1))} className={debtCurrentPage === debtTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory Detail Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-card-foreground">
              საწყობის დეტალური ანგარიშგება
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground w-12">#</TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleInvSort("name")}
                  >
                    <div className="flex items-center">
                      პროდუქცია
                      {getSortIcon(invSortColumn, "name", invSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleInvSort("category")}
                  >
                    <div className="flex items-center">
                      კატეგორია
                      {getSortIcon(invSortColumn, "category", invSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleInvSort("quantity")}
                  >
                    <div className="flex items-center">
                      ნაშთი
                      {getSortIcon(invSortColumn, "quantity", invSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleInvSort("purchasePrice")}
                  >
                    <div className="flex items-center">
                      შესყიდვის ფასი
                      {getSortIcon(invSortColumn, "purchasePrice", invSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleInvSort("salePrice")}
                  >
                    <div className="flex items-center">
                      გაყიდვის ფასი
                      {getSortIcon(invSortColumn, "salePrice", invSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead className="text-foreground">
                    მთლიანი შესყიდვა
                  </TableHead>
                  <TableHead className="text-foreground">
                    მთლიანი გაყიდვა
                  </TableHead>
                  <TableHead className="text-foreground">მარჟა</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground"
                    >
                      მონაცემები არ არის
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product, index) => {
                    const totalPurchase =
                      product.purchasePrice * product.quantity;
                    const totalSale = product.salePrice * product.quantity;
                    const margin = totalSale - totalPurchase;
                    const marginPercent =
                      totalPurchase > 0
                        ? ((margin / totalPurchase) * 100).toFixed(1)
                        : "0";
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium text-foreground">
                          {(invCurrentPage - 1) * invItemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {product.category || "-"}
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
                            {product.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {product.purchasePrice.toLocaleString()} GEL
                        </TableCell>
                        <TableCell className="text-foreground">
                          {product.salePrice.toLocaleString()} GEL
                        </TableCell>
                        <TableCell className="text-foreground">
                          {totalPurchase.toLocaleString()} GEL
                        </TableCell>
                        <TableCell className="text-foreground">
                          {totalSale.toLocaleString()} GEL
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${margin >= 0
                              ? "text-chart-2"
                              : "text-destructive"
                              }`}
                          >
                            {margin.toLocaleString()} GEL ({marginPercent}%)
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {/* Totals row */}
                {store.products.length > 0 && (
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={3} className="text-foreground">
                      ჯამი
                    </TableCell>
                    <TableCell className="text-foreground">
                      {store.totalStock}
                    </TableCell>
                    <TableCell className="text-foreground"></TableCell>
                    <TableCell className="text-foreground"></TableCell>
                    <TableCell className="text-foreground">
                      {totalPurchaseCost.toLocaleString()} GEL
                    </TableCell>
                    <TableCell className="text-foreground">
                      {totalStockSaleValue.toLocaleString()} GEL
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          unrealizedProfit >= 0
                            ? "text-chart-2"
                            : "text-destructive"
                        }
                      >
                        {unrealizedProfit.toLocaleString()} GEL
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Inventory Pagination */}
        {invTotalPages > 1 && (
          <div className="mt-4 print:hidden">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setInvCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      invCurrentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: invTotalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={invCurrentPage === i + 1}
                      onClick={() => setInvCurrentPage(i + 1)}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setInvCurrentPage((p) => Math.min(invTotalPages, p + 1))
                    }
                    className={
                      invCurrentPage === invTotalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}


        {/* Sales History for Accounting */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-card-foreground">
              გაყიდვების ბუღალტრული ჩანაწერები
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground w-12">#</TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSalesSort("createdAt")}
                  >
                    <div className="flex items-center">
                      თარიღი
                      {getSortIcon(salesSortColumn, "createdAt", salesSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSalesSort("productName")}
                  >
                    <div className="flex items-center">
                      პროდუქცია
                      {getSortIcon(salesSortColumn, "productName", salesSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSalesSort("quantity")}
                  >
                    <div className="flex items-center">
                      რაოდენობა
                      {getSortIcon(salesSortColumn, "quantity", salesSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSalesSort("salePrice")}
                  >
                    <div className="flex items-center">
                      ფასი
                      {getSortIcon(salesSortColumn, "salePrice", salesSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSalesSort("totalAmount")}
                  >
                    <div className="flex items-center">
                      ჯამი
                      {getSortIcon(salesSortColumn, "totalAmount", salesSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSalesSort("client")}
                  >
                    <div className="flex items-center">
                      მყიდველი
                      {getSortIcon(salesSortColumn, "client", salesSortDirection)}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      გაყიდვების ჩანაწერები არ არის
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSales.map((sale, index) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium text-foreground">
                        {(salesCurrentPage - 1) * salesItemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {new Date(sale.createdAt).toLocaleDateString("ka-GE")}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {sale.productName}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {sale.quantity}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {sale.salePrice.toLocaleString()} GEL
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {sale.totalAmount.toLocaleString()} GEL
                      </TableCell>
                      <TableCell className="text-foreground">
                        {sale.client || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {store.sales.length > 0 && (
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={4} className="text-foreground">
                      ჯამი
                    </TableCell>
                    <TableCell className="text-foreground"></TableCell>
                    <TableCell className="text-foreground">
                      {store.totalRevenue.toLocaleString()} GEL
                    </TableCell>
                    <TableCell className="text-foreground"></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sales Pagination */}
        {salesTotalPages > 1 && (
          <div className="mt-4 print:hidden">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setSalesCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      salesCurrentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: salesTotalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={salesCurrentPage === i + 1}
                      onClick={() => setSalesCurrentPage(i + 1)}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setSalesCurrentPage((p) => Math.min(salesTotalPages, p + 1))
                    }
                    className={
                      salesCurrentPage === salesTotalPages
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
    </div>
  );
}
