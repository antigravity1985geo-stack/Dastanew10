"use client";

import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  PieChart as PieChartIcon,
  Plus,
  Search,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Users,
  Building2,
  Receipt,
  DownloadCloud,
  Trash2,
  Eye,
  ChevronRight,
  Printer
} from "lucide-react";
import { printPayoffReceipt, printFinancialReport } from "@/lib/invoice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWarehouseStore } from "@/hooks/use-store";
import { Sale, Expense, PurchaseHistory } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

export function AccountingPage() {
  const store = useWarehouseStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "სხვადასხვა",
    description: "",
    paymentMethod: "cash" as "cash" | "bank",
    date: new Date().toISOString().split("T")[0],
  });

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");

  const categories = [
    "ქირა",
    "კომუნალური",
    "ხელფასი",
    "ტრანსპორტირება",
    "მარკეტინგი",
    "სხვადასხვა",
  ];

  // ====== FINANCIAL CALCULATIONS ======

  const finances = useMemo(() => {
    const totalSales = store.sales.reduce((sum, s) => sum + (s.paidInCash + s.paidInCard), 0);
    const totalPurchases = store.purchaseHistory.reduce((sum, ph) => sum + (ph.paidInCash + ph.paidInCard), 0);
    const totalExpenses = store.expenses.reduce((sum, e) => sum + e.amount, 0);

    const cashFromSales = store.sales.reduce((sum, s) => sum + s.paidInCash, 0);
    const bankFromSales = store.sales.reduce((sum, s) => sum + s.paidInCard, 0);

    const cashForPurchases = store.purchaseHistory.reduce((sum, ph) => sum + ph.paidInCash, 0);
    const bankForPurchases = store.purchaseHistory.reduce((sum, ph) => sum + ph.paidInCard, 0);

    const cashExpenses = store.expenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + e.amount, 0);
    const bankExpenses = store.expenses.filter(e => e.paymentMethod === 'bank').reduce((sum, e) => sum + e.amount, 0);

    const currentCashBalance = cashFromSales - cashForPurchases - cashExpenses;
    const currentBankBalance = bankFromSales - bankForPurchases - bankExpenses;

    // Debt calculations
    const customerDebts = store.sales.reduce((sum, s) => {
      const total = s.quantity * s.salePrice;
      const paid = s.paidInCash + s.paidInCard;
      return sum + Math.max(0, total - paid);
    }, 0);

    const supplierDebts = store.purchaseHistory.reduce((sum, ph) => {
      const total = ph.quantity * ph.purchasePrice;
      const paid = ph.paidInCash + ph.paidInCard;
      return sum + Math.max(0, total - paid);
    }, 0);

    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      currentCashBalance,
      currentBankBalance,
      customerDebts,
      supplierDebts,
      netProfit: totalSales - totalPurchases - totalExpenses
    };
  }, [store.sales, store.purchaseHistory, store.expenses]);

  // Grouped Debts Logic
  const groupedCustomerDebts = useMemo(() => {
    const groups: Record<string, { client: string, totalDebt: number, transactions: Sale[] }> = {};

    store.sales.forEach(s => {
      const total = s.quantity * s.salePrice;
      const paid = s.paidInCash + s.paidInCard;
      const debt = total - paid;

      if (debt > 0) {
        const client = s.client || "ანონიმური";
        if (!groups[client]) {
          groups[client] = { client, totalDebt: 0, transactions: [] };
        }
        groups[client].totalDebt += debt;
        groups[client].transactions.push(s);
      }
    });

    return Object.values(groups).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [store.sales]);

  const groupedSupplierDebts = useMemo(() => {
    const groups: Record<string, { supplier: string, totalDebt: number, transactions: PurchaseHistory[] }> = {};

    store.purchaseHistory.forEach(ph => {
      const total = ph.quantity * ph.purchasePrice;
      const paid = ph.paidInCash + ph.paidInCard;
      const debt = total - paid;

      if (debt > 0) {
        const supplier = ph.supplier || ph.client || "უცნობი";
        if (!groups[supplier]) {
          groups[supplier] = { supplier, totalDebt: 0, transactions: [] };
        }
        groups[supplier].totalDebt += debt;
        groups[supplier].transactions.push(ph);
      }
    });

    return Object.values(groups).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [store.purchaseHistory]);

  const [selectedEntity, setSelectedEntity] = useState<{
    name: string,
    total: number,
    transactions: any[],
    type: 'customer' | 'supplier'
  } | null>(null);

  // Chart Data: Last 6 months trend
  const trendData = useMemo(() => {
    const months = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const monthLabel = months[mIdx];

      const monthSales = store.sales
        .filter(s => new Date(s.createdAt).getMonth() === mIdx && new Date(s.createdAt).getFullYear() === d.getFullYear())
        .reduce((sum, s) => sum + (s.paidInCash + s.paidInCard), 0);

      const monthExpenses = store.expenses
        .filter(e => new Date(e.date).getMonth() === mIdx && new Date(e.date).getFullYear() === d.getFullYear())
        .reduce((sum, e) => sum + e.amount, 0);

      const monthPurchases = store.purchaseHistory
        .filter(ph => new Date(ph.createdAt).getMonth() === mIdx && new Date(ph.createdAt).getFullYear() === d.getFullYear())
        .reduce((sum, ph) => sum + (ph.paidInCash + ph.paidInCard), 0);

      result.push({
        name: monthLabel,
        შემოსავალი: monthSales,
        ხარჯი: monthExpenses + monthPurchases
      });
    }
    return result;
  }, [store.sales, store.expenses, store.purchaseHistory]);

  const expenseDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    store.expenses.forEach(e => {
      dist[e.category] = (dist[e.category] || 0) + e.amount;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [store.expenses]);

  const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.category) {
      toast.error("შეავსეთ სავალდებულო ველები");
      return;
    }

    try {
      await store.addExpense({
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description,
        paymentMethod: expenseForm.paymentMethod,
        date: expenseForm.date,
      });
      toast.success("ხარჯი წარმატებით დაემატა");
      setExpenseForm({
        amount: "",
        category: "სხვადასხვა",
        description: "",
        paymentMethod: "cash",
        date: new Date().toISOString().split("T")[0],
      });
      setIsExpenseOpen(false);
    } catch (error) {
      toast.error("შეცდომა ხარჯის დამატებისას");
    }
  };

  const filteredExpenses = useMemo(() => {
    return store.expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        e.category.toLowerCase().includes(expenseSearch.toLowerCase());
      const matchesCategory = expenseCategoryFilter === "all" || e.category === expenseCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [store.expenses, expenseSearch, expenseCategoryFilter]);

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="ბუღალტერია"
        description="ფინანსური მაჩვენებლები და ხარჯების მართვა"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => printFinancialReport({
                revenue: finances.totalSales,
                profit: finances.totalSales - finances.totalPurchases,
                expenses: finances.totalExpenses,
                netProfit: finances.netProfit,
                cashBalance: finances.currentCashBalance,
                bankBalance: finances.currentBankBalance,
                expenseDistribution: expenseDistribution
              })}
            >
              <DownloadCloud className="h-4 w-4" />
              ანგარიში (PDF)
            </Button>
            <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  ხარჯის დამატება
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    ახალი ხარჯი
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddExpense} className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">თანხა (GEL) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="h-12 rounded-xl bg-muted/30 border-none px-4 font-black text-lg text-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">კატეგორია</Label>
                      <Select
                        value={expenseForm.category}
                        onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-medium">
                          <SelectValue placeholder="აირჩიეთ" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          {categories.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">გადახდის მეთოდი</Label>
                      <Select
                        value={expenseForm.paymentMethod}
                        onValueChange={(v: any) => setExpenseForm({ ...expenseForm, paymentMethod: v })}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-medium">
                          <SelectValue placeholder="აირჩიეთ" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="cash">💵 ნაღდი</SelectItem>
                          <SelectItem value="bank">💳 ბანკი</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">თარიღი</Label>
                    <Input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">აღწერა</Label>
                    <Input
                      placeholder="დამატებითი ინფორმაცია..."
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                    შენახვა
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* TABS OVERVIEW */}
      <Tabs defaultValue="dashboard" className="space-y-8">
        <TabsList className="bg-muted/30 p-1 rounded-2xl border border-border/50">
          <TabsTrigger value="dashboard" className="rounded-xl px-6 font-bold gap-2">
            <PieChartIcon className="h-4 w-4" />
            დაშბორდი
          </TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-xl px-6 font-bold gap-2">
            <Receipt className="h-4 w-4" />
            ხარჯები
          </TabsTrigger>
          <TabsTrigger value="debts" className="rounded-xl px-6 font-bold gap-2">
            <Users className="h-4 w-4" />
            ვალები & ნისიები
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">სალარო (ნაღდი)</span>
                </div>
                <h3 className="text-3xl font-black mb-1">{finances.currentCashBalance.toFixed(2)} ₾</h3>
                <p className="text-xs font-medium opacity-60">მიმდინარე ნაღდი ფული</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">ბანკი (ბარათი)</span>
                </div>
                <h3 className="text-3xl font-black mb-1">{finances.currentBankBalance.toFixed(2)} ₾</h3>
                <p className="text-xs font-medium opacity-60">უნაღდო ანგარიში</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">წმინდა მოგება</span>
                </div>
                <h3 className={cn("text-3xl font-black mb-1", finances.netProfit >= 0 ? "text-emerald-600" : "text-destructive")}>
                  {finances.netProfit.toFixed(2)} ₾
                </h3>
                <div className="flex items-center gap-1">
                  {finances.netProfit >= 0 ? <ArrowUpRight className="h-3 w-3 text-emerald-600" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                  <span className="text-xs font-bold text-muted-foreground">მთლიანი პერიოდი</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ხარჯები</span>
                </div>
                <h3 className="text-3xl font-black mb-1 text-rose-600">{(finances.totalExpenses + finances.totalPurchases).toFixed(2)} ₾</h3>
                <p className="text-xs font-medium text-muted-foreground italic">შესყიდვები + ხარჯები</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Area Chart */}
            <Card className="lg:col-span-2 border-border/50 shadow-md rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  ფინანსური ტრენდი
                </CardTitle>
                <CardDescription>ბოლო 6 თვის შემოსავლებისა და ხარჯების ანალიზი</CardDescription>
              </CardHeader>
              <CardContent className="p-2 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      tickFormatter={(value) => `${value} ₾`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#0ea5e9', strokeWidth: 2 }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      name="შემოსავალი"
                      type="monotone"
                      dataKey="შემოსავალი"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                    <Area
                      name="ხარჯი"
                      type="monotone"
                      dataKey="ხარჯი"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense Pie Chart */}
            <Card className="border-border/50 shadow-md rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  ხარჯების სტრუქტურა
                </CardTitle>
                <CardDescription>ხარჯების განაწილება კატეგორიების მიხედვით</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ძებნა ხარჯებში..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="pl-10 h-10 border-none bg-muted/30 rounded-xl"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-10 border-none bg-muted/30 rounded-xl font-medium">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    <SelectValue placeholder="ყველა კატეგორია" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="all">ყველა კატეგორია</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center w-12">#</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">აღწერა / კატეგორია</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">გადახდა</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">თანხა</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">თარიღი</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                        <Receipt className="h-10 w-10 mx-auto mb-3 opacity-10" />
                        <p className="font-medium">ხარჯები არ მოიძებნა</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((e, i) => (
                      <TableRow key={e.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="text-center font-bold text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{e.description || "აღწერის გარეშე"}</span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{e.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-tight",
                            e.paymentMethod === 'cash' ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                          )}>
                            {e.paymentMethod === 'cash' ? "💵 ნაღდი" : "💳 ბანკი"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-black text-rose-600">
                          -{e.amount.toFixed(2)} ₾
                        </TableCell>
                        <TableCell className="text-right text-[10px] font-bold text-muted-foreground">
                          {new Date(e.date).toLocaleDateString("ka-GE")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => store.deleteExpense(e.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debts" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Debts (Receivables) */}
            <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-amber-50/50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-900">
                    <TrendingDown className="h-4 w-4" />
                    მყიდველის ვალები (ნისიები)
                  </CardTitle>
                  <span className="bg-amber-100 text-amber-800 text-xs font-black px-2 py-1 rounded-lg">
                    {finances.customerDebts.toFixed(2)} ₾
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold text-amber-900/50">სახელი</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-amber-900/50 text-right">დარჩენილი</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-amber-900/50 text-right">თარიღი</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedCustomerDebts.map(group => (
                      <TableRow key={group.client}>
                        <TableCell className="text-xs font-bold">{group.client}</TableCell>
                        <TableCell className="text-right text-xs font-black text-amber-600">
                          {group.totalDebt.toFixed(2)} ₾
                        </TableCell>
                        <TableCell className="text-right p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:bg-amber-100 rounded-lg"
                            onClick={() => setSelectedEntity({
                              name: group.client,
                              total: group.totalDebt,
                              transactions: group.transactions,
                              type: 'customer'
                            })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {groupedCustomerDebts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic text-xs">
                          აქტიური ნისიები არ არის
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Supplier Debts (Payables) */}
            <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-blue-50/50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-900">
                    <Building2 className="h-4 w-4" />
                    მომწოდებლის ვალები
                  </CardTitle>
                  <span className="bg-blue-100 text-blue-800 text-xs font-black px-2 py-1 rounded-lg">
                    {finances.supplierDebts.toFixed(2)} ₾
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold text-blue-900/50">მომწოდებელი</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-blue-900/50 text-right">დასაფარი</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-blue-900/50 text-right">თარიღი</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedSupplierDebts.map(group => (
                      <TableRow key={group.supplier}>
                        <TableCell className="text-xs font-bold">{group.supplier}</TableCell>
                        <TableCell className="text-right text-xs font-black text-rose-600">
                          {group.totalDebt.toFixed(2)} ₾
                        </TableCell>
                        <TableCell className="text-right p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-100 rounded-lg"
                            onClick={() => setSelectedEntity({
                              name: group.supplier,
                              total: group.totalDebt,
                              transactions: group.transactions,
                              type: 'supplier'
                            })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {groupedSupplierDebts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic text-xs">
                          მომწოდებლის ვალი არ გაქვთ
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Debt Details Modal */}
      <Dialog open={!!selectedEntity} onOpenChange={(open) => !open && setSelectedEntity(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedEntity && (
            <>
              <DialogHeader className={cn(
                "p-6 text-white",
                selectedEntity.type === 'customer' ? "bg-amber-600" : "bg-blue-600"
              )}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
                      {selectedEntity.type === 'customer' ? "მყიდველის ნისია" : "მომწოდებლის ვალი"}
                    </p>
                    <DialogTitle className="text-2xl font-black">{selectedEntity.name}</DialogTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">ჯამური დავალიანება</p>
                    <p className="text-2xl font-black">{selectedEntity.total.toFixed(2)} ₾</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-6">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedEntity.transactions.map((t, idx) => {
                    const total = t.quantity * (t.salePrice || t.purchasePrice);
                    const paid = t.paidInCash + t.paidInCard;
                    const debt = total - paid;

                    return (
                      <div key={t.id} className="p-4 rounded-xl bg-muted/30 border border-border/50 flex justify-between items-center group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm tracking-tight">{t.productName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {new Date(t.createdAt).toLocaleDateString("ka-GE")}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                              <span className="text-[10px] font-bold text-primary">
                                {t.quantity} ცალი
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-foreground">{debt.toFixed(2)} ₾</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">დარჩენილი</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 p-4 rounded-2xl bg-muted/20 border-2 border-dashed border-border flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">თანხა</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-11 rounded-xl bg-white border-none font-black text-lg text-primary"
                        id="payoff-amount"
                      />
                    </div>
                    <div className="w-[140px] space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">მეთოდი</Label>
                      <select
                        id="payoff-method"
                        className="w-full h-11 rounded-xl bg-white border-none font-bold px-3 text-sm focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                      >
                        <option value="cash">💵 ნაღდი</option>
                        <option value="bank">💳 ბანკი</option>
                      </select>
                    </div>
                  </div>

                  <Button className={cn(
                    "w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg",
                    selectedEntity.type === 'customer' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                  )} onClick={async () => {
                    const amountInput = document.getElementById('payoff-amount') as HTMLInputElement;
                    const methodSelect = document.getElementById('payoff-method') as HTMLSelectElement;
                    const amount = parseFloat(amountInput.value);

                    if (!amount || amount <= 0) {
                      toast.error("შეიყვანეთ ვალიდური თანხა");
                      return;
                    }
                    if (amount > selectedEntity.total) {
                      toast.error("თანხა აღემატება არსებულ ვალს");
                      return;
                    }

                    try {
                      await store.payoffDebts(
                        selectedEntity.transactions,
                        amount,
                        methodSelect.value as 'cash' | 'bank',
                        selectedEntity.type
                      );
                      const remaining = selectedEntity.total - amount;
                      toast.success("ვალი წარმატებით დაიფარა");

                      if (confirm("გსურთ გადახდის ქვითრის ამობეჭდვა?")) {
                        printPayoffReceipt(selectedEntity.name, amount, remaining, methodSelect.value, selectedEntity.type);
                      }

                      setSelectedEntity(null);
                    } catch (err) {
                      toast.error("შეცდომა ვალის დაფარვისას");
                    }
                  }}>
                    დაფარვა & ბეჭდვა
                  </Button>
                </div>

                <div className="mt-4 flex gap-3">
                  <Button variant="outline" className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => setSelectedEntity(null)}>
                    დახურვა
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
