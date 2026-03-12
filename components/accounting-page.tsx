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
  Briefcase,
  AlertCircle,
  Filter,
  Users,
  Building2,
  Receipt,
  DownloadCloud,
  Trash2,
  Eye,
  ChevronRight,
  Printer,
  Calculator,
  Percent,
  MonitorSmartphone,
  Shield,
  Lock,
  History,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  ArrowRightLeft
} from "lucide-react";
import { nbgService } from "@/lib/nbg-service";
import { supabase } from "@/lib/supabase";
import { authStore } from "@/lib/auth";
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
import { DatePickerWithRange } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfMonth } from "date-fns";
import { toast } from "sonner";
import { useSettings } from "@/hooks/use-settings";
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
import { CHART_OF_ACCOUNTS, getAccountByCode } from "@/lib/coa";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function AccountingPage() {
  const store = useWarehouseStore();
  const settings = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = [
    "ქირა",
    "კომუნალური",
    "ხელფასი",
    "ტრანსპორტირება",
    "მარკეტინგი",
    "სხვადასხვა",
    "დივიდენდი" // Added for Owner's Equity
  ];

  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: categories[categories.length - 2], // Default to "სხვადასხვა"
    description: "",
    paymentMethod: "cash" as "cash" | "bank",
    currency: "GEL" as "GEL" | "USD" | "EUR",
    exchangeRate: "1",
    date: new Date().toISOString().split("T")[0]
  });

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState<string>("all");

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    amount: "",
    fromAccount: "cash" as "cash" | "bank",
    description: "",
    currency: "GEL" as "GEL" | "USD" | "EUR",
    exchangeRate: "1",
    date: new Date().toISOString().split("T")[0]
  });

  const [isBankImportOpen, setIsBankImportOpen] = useState(false);

  // ====== HELPER FUNCTIONS ======
  const isWithinRange = (dateString: string) => {
    if (!dateRange?.from) return true;
    const d = new Date(dateString);
    if (d < dateRange.from) return false;
    if (dateRange.to && d > dateRange.to) return false;
    return true;
  };

  const isInternalTransfer = (e: Expense) => e.category === 'შიდა გადარიცხვა';

  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [nbgRates, setNbgRates] = useState<{ USD: number; EUR: number } | null>(null);

  const handleUpdateRates = async () => {
    const res = await nbgService.fetchCurrentRates();
    if (res) {
      setNbgRates({ USD: res.USD, EUR: res.EUR });
      toast.success(`კურსები განახლდა: 1$ = ${res.USD} ₾, 1€ = ${res.EUR} ₾`);
    } else {
      toast.error("კურსების განახლება ვერ მოხერხდა");
    }
  };

  // Auto-fill exchange rates when currency changes
  useEffect(() => {
    if (!nbgRates) return;
    if (expenseForm.currency === "USD") setExpenseForm(prev => ({ ...prev, exchangeRate: nbgRates.USD.toString() }));
    else if (expenseForm.currency === "EUR") setExpenseForm(prev => ({ ...prev, exchangeRate: nbgRates.EUR.toString() }));
    else if (expenseForm.currency === "GEL") setExpenseForm(prev => ({ ...prev, exchangeRate: "1" }));
  }, [expenseForm.currency, nbgRates]);

  useEffect(() => {
    if (!nbgRates) return;
    if (transferForm.currency === "USD") setTransferForm(prev => ({ ...prev, exchangeRate: nbgRates.USD.toString() }));
    else if (transferForm.currency === "EUR") setTransferForm(prev => ({ ...prev, exchangeRate: nbgRates.EUR.toString() }));
    else if (transferForm.currency === "GEL") setTransferForm(prev => ({ ...prev, exchangeRate: "1" }));
  }, [transferForm.currency, nbgRates]);

  const cashFlowData = useMemo(() => {
    const cashAccounts = ["1110", "1210", "1120", "1220"]; // GEL/USD Cash/Bank
    let operating = 0;
    let investing = 0;
    let financing = 0;

    store.journalEntries.forEach(entry => {
      if (!isWithinRange(entry.date)) return;

      entry.transactions.forEach(t => {
        if (cashAccounts.includes(t.accountCode)) {
          const netEffect = t.debit - t.credit;
          if (entry.referenceType === 'sale' || entry.referenceType === 'expense' || entry.referenceType === 'purchase') {
            operating += netEffect;
          } else if (entry.referenceType === 'transfer') {
            // Internal transfers - net zero for total cash
          } else if (t.accountCode.startsWith('3')) {
            financing += netEffect;
          } else if (t.accountCode.startsWith('13') || t.accountCode.startsWith('14')) {
            investing += netEffect;
          } else {
            operating += netEffect;
          }
        }
      });
    });

    return { operating, investing, financing, total: operating + investing + financing };
  }, [store.journalEntries, isWithinRange]);

  const handleBankFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const previewData: any[] = [];

      // Basic CSV Parser (assuming Date, Desc, Amount)
      // TBC Header logic can be added here
      lines.slice(1).forEach((line, idx) => {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const date = parts[0]?.replace(/"/g, '').trim();
          const desc = parts[1]?.replace(/"/g, '').trim();
          const amount = parseFloat(parts[2]?.replace(/"/g, '').trim());
          if (!isNaN(amount)) {
            previewData.push({
              id: `idx-${idx}`,
              date,
              description: desc,
              amount: Math.abs(amount),
              type: amount > 0 ? 'income' : 'expense',
              category: amount > 0 ? 'გაყიდვა' : 'სხვადასხვა',
              paymentMethod: 'bank'
            });
          }
        }
      });
      setImportPreview(previewData);
      setImportLoading(false);
    };
    reader.readAsText(file);
  };

  const handleFinalImport = async () => {
    setImportLoading(true);
    try {
      for (const item of importPreview) {
        if (item.type === 'expense') {
          await store.addExpense({
            amount: item.amount,
            category: item.category,
            description: `[Bank Import] ${item.description}`,
            paymentMethod: 'bank',
            currency: 'GEL',
            exchangeRate: 1,
            date: item.date
          });
        }
        // Income/Sales logic can be expanded here
      }
      toast.success(`${importPreview.length} ტრანზაქცია იმპორტირებულია`);
      setIsBankImportOpen(false);
      setImportPreview([]);
    } catch (err) {
      toast.error("იმპორტის შეცდომა");
    } finally {
      setImportLoading(false);
    }
  };

  const COA_MAPPING: Record<string, string> = {
    "Revenue": "4000",
    "COGS": "5000",
    "ქირა": "6010",
    "კომუნალური": "6020",
    "ხელფასი": "6030",
    "ტრანსპორტირება": "6040",
    "მარკეტინგი": "6050",
    "სხვადასხვა": "6090",
    "დივიდენდი": "3020", // Owner's Equity Draw
    "Cash": "1010",
    "Bank": "1020",
  };

  // Static budgets for Phase 2 demonstration (could be moved to DB later)
  const BUDGETS: Record<string, number> = {
    "ქირა": 1500,
    "კომუნალური": 500,
    "ხელფასი": 5000,
    "მარკეტინგი": 1000,
  };


  const finances = useMemo(() => {
    // Filtered arrays for period metrics (Revenue, COGS, Expenses, Profit)
    const periodSales = store.sales.filter(s => isWithinRange(s.createdAt));
    const periodPurchases = store.purchaseHistory.filter(ph => isWithinRange(ph.createdAt));
    const periodExpenses = store.expenses.filter(e => isWithinRange(e.date));

    // Period metrics
    const totalSales = periodSales.reduce((sum, s) => sum + (s.totalAmount * (s.exchangeRate || 1)), 0);
    const totalPurchases = periodPurchases.reduce((sum, ph) => sum + (ph.purchasePrice * ph.quantity), 0); // Acts as COGS approx
    const totalExpenses = periodExpenses.filter(e => !isInternalTransfer(e)).reduce((sum, e) => sum + (e.amount * (e.exchangeRate || 1)), 0);
    const netProfit = totalSales - totalPurchases - totalExpenses;

    // All-time balances (should NOT be filtered by date range)
    const cashFromSales = store.sales.reduce((sum, s) => sum + (s.paidInCash * (s.exchangeRate || 1)), 0);
    const bankFromSales = store.sales.reduce((sum, s) => sum + (s.paidInCard * (s.exchangeRate || 1)), 0);

    const cashForPurchases = store.purchaseHistory.reduce((sum, ph) => sum + (ph.paidInCash * (ph.exchangeRate || 1)), 0);
    const bankForPurchases = store.purchaseHistory.reduce((sum, ph) => sum + (ph.paidInCard * (ph.exchangeRate || 1)), 0);

    const cashExpenses = store.expenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + (e.amount * (e.exchangeRate || 1)), 0);
    const bankExpenses = store.expenses.filter(e => e.paymentMethod === 'bank').reduce((sum, e) => sum + (e.amount * (e.exchangeRate || 1)), 0);

    const currentCashBalance = cashFromSales - cashForPurchases - cashExpenses;
    const currentBankBalance = bankFromSales - bankForPurchases - bankExpenses;

    // Debt calculations (All-time unpaid)
    const customerDebts = store.sales.reduce((sum, s) => {
      const total = s.quantity * s.salePrice * (s.exchangeRate || 1);
      const paid = (s.paidInCash + s.paidInCard) * (s.exchangeRate || 1);
      return sum + Math.max(0, total - paid);
    }, 0);

    const supplierDebts = store.purchaseHistory.reduce((sum, ph) => {
      const total = ph.quantity * ph.purchasePrice * (ph.exchangeRate || 1);
      const paid = (ph.paidInCash + ph.paidInCard) * (ph.exchangeRate || 1);
      return sum + Math.max(0, total - paid);
    }, 0);

    // --- TAX ESTIMATIONS (Georgian Model) ---
    // 1% Small Business Tax on Revenue
    const smallBusinessTax = totalSales * 0.01;

    // 18% VAT Approximation (Output VAT - Input VAT)
    // Assuming all local sales include VAT and purchases include deductible VAT
    const outputVat = totalSales - (totalSales / 1.18);
    const inputVat = totalPurchases - (totalPurchases / 1.18);
    const estimatedVatToPay = Math.max(0, outputVat - inputVat);

    // 15% Profit Tax (Estonian Model - payable only on distributed profits / dividends)
    const distributedDividends = periodExpenses.filter(e => e.category === 'დივიდენდი').reduce((sum, e) => sum + (e.amount * (e.exchangeRate || 1)), 0);
    const profitTaxOnDividends = distributedDividends * 0.15 / 0.85; // Gross up methodology

    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      currentCashBalance,
      currentBankBalance,
      customerDebts,
      supplierDebts,
      netProfit,
      taxes: {
        smallBusiness: smallBusinessTax,
        vat: estimatedVatToPay,
        profitOnDividends: profitTaxOnDividends,
        totalEstimated: smallBusinessTax + estimatedVatToPay + profitTaxOnDividends
      }
    };
  }, [store.sales, store.purchaseHistory, store.expenses, dateRange]);

  // Mock Fixed Assets Data (Phase 3)
  const [fixedAssets] = useState([
    { id: 1, name: "კომპიუტერი (MacBook Pro)", purchasePrice: 4500, usefulLifeYears: 4, purchaseDate: "2024-01-15", category: "IT" },
    { id: 2, name: "საოფისე ავეჯი", purchasePrice: 2000, usefulLifeYears: 5, purchaseDate: "2024-02-01", category: "ავეჯი" },
    { id: 3, name: "ყავის აპარატი", purchasePrice: 1200, usefulLifeYears: 3, purchaseDate: "2023-11-10", category: "ტექნიკა" },
  ]);

  const assetsWithDepreciation = useMemo(() => {
    return fixedAssets.map(asset => {
      const pDate = new Date(asset.purchaseDate);
      const now = new Date();
      const monthsElapsed = (now.getFullYear() - pDate.getFullYear()) * 12 + now.getMonth() - pDate.getMonth();
      const usefulLifeMonths = asset.usefulLifeYears * 12;

      const monthlyDepreciation = asset.purchasePrice / usefulLifeMonths;
      const accumulatedDepreciation = Math.min(monthsElapsed * monthlyDepreciation, asset.purchasePrice);
      const netBookValue = asset.purchasePrice - accumulatedDepreciation;

      return {
        ...asset,
        monthlyDepreciation,
        accumulatedDepreciation,
        netBookValue: Math.max(0, netBookValue)
      };
    });
  }, [fixedAssets]);

  // Grouped Debts & Ledger Logic
  const groupedCustomerDebts = useMemo(() => {
    const groups: Record<string, { client: string, totalDebt: number, transactions: Sale[], allTransactions: Sale[], oldestUnpaid: string, lastPaymentAt: string }> = {};

    store.sales.forEach(s => {
      const total = s.quantity * s.salePrice * (s.exchangeRate || 1);
      const paid = (s.paidInCash + s.paidInCard) * (s.exchangeRate || 1);
      const debt = total - paid;

      const client = s.client || "ანონიმური";
      if (!groups[client]) {
        groups[client] = { client, totalDebt: 0, transactions: [], allTransactions: [], oldestUnpaid: "", lastPaymentAt: "" };
      }

      groups[client].allTransactions.push(s);

      if (debt > 0) {
        groups[client].totalDebt += debt;
        groups[client].transactions.push(s);
        if (!groups[client].oldestUnpaid || new Date(s.createdAt) < new Date(groups[client].oldestUnpaid)) {
          groups[client].oldestUnpaid = s.createdAt;
        }
      }

      if (paid > 0) {
        if (!groups[client].lastPaymentAt || new Date(s.createdAt) > new Date(groups[client].lastPaymentAt)) {
          groups[client].lastPaymentAt = s.createdAt;
        }
      }
    });

    return Object.values(groups).filter(g => g.allTransactions.length > 0).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [store.sales]);

  const groupedSupplierDebts = useMemo(() => {
    const groups: Record<string, { supplier: string, totalDebt: number, transactions: PurchaseHistory[], allTransactions: PurchaseHistory[], oldestUnpaid: string, lastPaymentAt: string }> = {};

    store.purchaseHistory.forEach(ph => {
      const total = ph.quantity * ph.purchasePrice * (ph.exchangeRate || 1);
      const paid = (ph.paidInCash + ph.paidInCard) * (ph.exchangeRate || 1);
      const debt = total - paid;

      const supplier = ph.supplier || ph.client || "უცნობი";
      if (!groups[supplier]) {
        groups[supplier] = { supplier, totalDebt: 0, transactions: [], allTransactions: [], oldestUnpaid: "", lastPaymentAt: "" };
      }

      groups[supplier].allTransactions.push(ph);

      if (debt > 0) {
        groups[supplier].totalDebt += debt;
        groups[supplier].transactions.push(ph);
        if (!groups[supplier].oldestUnpaid || new Date(ph.createdAt) < new Date(groups[supplier].oldestUnpaid)) {
          groups[supplier].oldestUnpaid = ph.createdAt;
        }
      }

      if (paid > 0) {
        if (!groups[supplier].lastPaymentAt || new Date(ph.createdAt) > new Date(groups[supplier].lastPaymentAt)) {
          groups[supplier].lastPaymentAt = ph.createdAt;
        }
      }
    });

    return Object.values(groups).filter(g => g.allTransactions.length > 0).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [store.purchaseHistory]);

  const [selectedEntity, setSelectedEntity] = useState<{
    name: string;
    total: number;
    transactions: any[];
    allTransactions: any[];
    type: 'customer' | 'supplier';
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
        .reduce((sum, s) => sum + (s.totalAmount * (s.exchangeRate || 1)), 0);

      const monthExpenses = store.expenses
        .filter(e => new Date(e.date).getMonth() === mIdx && new Date(e.date).getFullYear() === d.getFullYear())
        .reduce((sum, e) => sum + (e.amount * (e.exchangeRate || 1)), 0);

      const monthPurchases = store.purchaseHistory
        .filter(ph => new Date(ph.createdAt).getMonth() === mIdx && new Date(ph.createdAt).getFullYear() === d.getFullYear())
        .reduce((sum, ph) => sum + (ph.purchasePrice * ph.quantity), 0);

      result.push({
        name: monthLabel,
        შემოსავალი: monthSales,
        ხარჯი: monthExpenses + monthPurchases
      });
    }
    return result;
  }, [store.sales, store.expenses, store.purchaseHistory]);

  const expenseDistribution = useMemo(() => {
    const periodExpenses = store.expenses.filter(e => isWithinRange(e.date) && !isInternalTransfer(e));
    const dist: Record<string, number> = {};
    periodExpenses.forEach(e => {
      dist[e.category] = (dist[e.category] || 0) + (e.amount * (e.exchangeRate || 1));
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [store.expenses, dateRange]);

  const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount) {
      toast.error("შეიყვანეთ თანხა");
      return;
    }

    let finalDescription = expenseForm.description;
    // Append employee name to description if salary is selected
    if (expenseForm.category === "ხელფასი" && selectedEmployeeForSalary !== "all") {
      const emp = store.employees.find(emp => emp.id === selectedEmployeeForSalary);
      if (emp) {
        finalDescription = `[${emp.name}] ${finalDescription}`;
      }
    }

    try {
      await store.addExpense({
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        description: finalDescription,
        paymentMethod: expenseForm.paymentMethod as "cash" | "bank",
        currency: expenseForm.currency,
        exchangeRate: parseFloat(expenseForm.exchangeRate) || 1,
        date: expenseForm.date
      });
      toast.success("ხარჯი დამატებულია");
      setIsExpenseOpen(false);
      setExpenseForm({
        amount: "",
        category: categories[0],
        description: "",
        paymentMethod: "cash",
        currency: "GEL",
        exchangeRate: "1",
        date: new Date().toISOString().split("T")[0]
      });
      setSelectedEmployeeForSalary("all");
    } catch (error) {
      toast.error("შეცდომა ხარჯის დამატებისას");
    }
  };

  const filteredExpenses = useMemo(() => {
    return store.expenses.filter(e => {
      if (!isWithinRange(e.date)) return false;
      if (expenseCategoryFilter !== "all" && isInternalTransfer(e)) return false; // Hide transfers from main view unless selected
      const matchesSearch = e.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        e.category.toLowerCase().includes(expenseSearch.toLowerCase());
      const matchesCategory = expenseCategoryFilter === "all" || e.category === expenseCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [store.expenses, expenseSearch, expenseCategoryFilter, dateRange]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.amount) {
      toast.error("შეიყვანეთ თანხა");
      return;
    }
    const amount = parseFloat(transferForm.amount);

    try {
      const exchangeRateNum = parseFloat(transferForm.exchangeRate) || 1;
      if (transferForm.fromAccount === 'cash') {
        // Send from Cash to Bank
        await store.addExpense({
          amount: amount,
          category: 'შიდა გადარიცხვა',
          description: transferForm.description || 'სალაროდან ბანკში',
          paymentMethod: 'cash', // Deducts from Cash
          currency: transferForm.currency,
          exchangeRate: exchangeRateNum,
          date: transferForm.date
        });
        await store.addExpense({
          amount: -amount,
          category: 'შიდა გადარიცხვა',
          description: transferForm.description || 'სალაროდან ბანკში',
          paymentMethod: 'bank', // Increases Bank
          currency: transferForm.currency,
          exchangeRate: exchangeRateNum,
          date: transferForm.date
        });
      } else {
        // Send from Bank to Cash
        await store.addExpense({
          amount: amount,
          category: 'შიდა გადარიცხვა',
          description: transferForm.description || 'ბანკიდან სალაროში',
          paymentMethod: 'bank', // Deducts from Bank
          currency: transferForm.currency,
          exchangeRate: exchangeRateNum,
          date: transferForm.date
        });
        await store.addExpense({
          amount: -amount,
          category: 'შიდა გადარიცხვა',
          description: transferForm.description || 'ბანკიდან სალაროში',
          paymentMethod: 'cash', // Increases Cash
          currency: transferForm.currency,
          exchangeRate: exchangeRateNum,
          date: transferForm.date
        });
      }

      toast.success("შიდა გადარიცხვა წარმატებით შესრულდა");
      setIsTransferOpen(false);
      setTransferForm({
        ...transferForm,
        amount: "",
        description: "",
        currency: "GEL",
        exchangeRate: "1"
      });
    } catch (error) {
      toast.error("შეცდომა გადარიცხვისას");
    }
  };

  if (!mounted) return null;

  return (
    <div id="print-area" className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="ბუღალტერია"
        description="ფინანსური მაჩვენებლები და ხარჯების მართვა"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdateRates}
              className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-bold h-9 sm:h-10 rounded-xl shrink-0"
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="hidden md:inline">NBG კურსები</span>
              <span className="md:hidden inline text-[10px]">NBG</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shadow-sm font-bold border-border/50 bg-white/50 hover:bg-white text-slate-700 h-9 sm:h-10 rounded-xl shrink-0"
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
              <span className="hidden md:inline">ანგარიში (PDF)</span>
              <span className="md:hidden inline text-[10px]">PDF</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 shadow-sm font-bold border-blue-100 bg-blue-50/30 hover:bg-blue-50 text-blue-700 h-9 sm:h-10 rounded-xl shrink-0"
              onClick={() => setIsBankImportOpen(true)}
            >
              <History className="h-4 w-4" />
              <span className="hidden md:inline">ბანკის იმპორტი</span>
              <span className="md:hidden inline text-[10px]">იმპორტი</span>
            </Button>

            <Button variant="outline" size="sm" className="gap-2 shadow-sm font-bold border-border/50 bg-white/50 hover:bg-white h-9 sm:h-10 rounded-xl shrink-0" onClick={() => setIsTransferOpen(true)}>
              <div className="flex -space-x-1.5 items-center">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
              </div>
              <span className="hidden md:inline">შიდა გადარიცხვა</span>
              <span className="md:hidden inline text-[10px]">გადარიცხვა</span>
            </Button>
            <div className="w-full sm:w-auto mt-2 sm:mt-0">
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </>
        }
      />

      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              შიდა გადარიცხვა
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">თანხა</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ვალუტა</Label>
                <select
                  value={transferForm.currency}
                  onChange={(e) => setTransferForm({ ...transferForm, currency: e.target.value as any })}
                  className="flex h-11 w-full rounded-xl border-none bg-muted/30 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  <option value="GEL">GEL (₾)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {transferForm.currency !== "GEL" && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">კურსი (1 {transferForm.currency} = ? GEL)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={transferForm.exchangeRate}
                  onChange={(e) => setTransferForm({ ...transferForm, exchangeRate: e.target.value })}
                  placeholder="კურსი"
                  className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">მიმართულება</Label>
              <Select
                value={transferForm.fromAccount}
                onValueChange={(v: any) => setTransferForm({ ...transferForm, fromAccount: v })}
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-medium">
                  <SelectValue placeholder="აირჩიეთ" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="cash">💵 სალაროდან ➡️ 💳 ბანკში</SelectItem>
                  <SelectItem value="bank">💳 ბანკიდან ➡️ 💵 სალაროში</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">თარიღი</Label>
              <Input
                type="date"
                value={transferForm.date}
                onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                className="h-11 rounded-xl bg-muted/30 border-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">კომენტარი</Label>
              <Input
                placeholder="მაგ: ინკასაცია..."
                value={transferForm.description}
                onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                className="h-11 rounded-xl bg-muted/30 border-none font-medium"
              />
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
              გადარიცხვა
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBankImportOpen} onOpenChange={setIsBankImportOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <History className="h-6 w-6 text-blue-600" />
              ბანკის ამონაწერის იმპორტი
            </DialogTitle>
            <CardDescription className="text-muted-foreground font-medium">
              ატვირთეთ TBC ან BOG-დან ექსპორტირებული CSV ფაილი ავტომატური აღრიცხვისთვის
            </CardDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!importPreview.length ? (
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-3xl p-12 text-center space-y-4 hover:border-primary/50 transition-colors bg-muted/5 group">
                <div className="h-20 w-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <DownloadCloud className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <p className="font-black text-xl">აირჩიეთ CSV ფაილი</p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">მხარდაჭერილია TBC და BOG ბიზნეს ამონაწერები</p>
                </div>
                <Input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="bank-file-upload"
                  onChange={handleBankFileChange}
                />
                <Button asChild className="rounded-xl px-10 h-12 font-bold shadow-lg shadow-primary/15">
                  <label htmlFor="bank-file-upload" className="cursor-pointer">ფაილის არჩევა</label>
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between bg-blue-50/80 p-5 rounded-2xl border border-blue-100 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-blue-900">აღმოჩენილია {importPreview.length} ტრანზაქცია</p>
                      <p className="text-xs text-blue-700/70 font-bold">გთხოვთ გადახედოთ მონაცემებს დადასტურებამდე</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setImportPreview([])} className="text-blue-700 hover:bg-blue-100/50 rounded-xl h-9 px-4 text-xs font-black uppercase tracking-widest">
                    გასუფთავება
                  </Button>
                </div>

                <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-card">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">თარიღი</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">აღწერა</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">თანხა</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">კატეგორია</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/10 transition-colors border-border/50">
                          <td className="p-4 text-[10px] font-black text-muted-foreground whitespace-nowrap">{item.date}</td>
                          <td className="p-4 text-xs font-bold truncate max-w-[180px]">{item.description}</td>
                          <td className={cn(
                            "p-4 text-xs font-black text-right",
                            item.type === 'income' ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(2)} ₾
                          </td>
                          <td className="p-4">
                            <select
                              value={item.category}
                              onChange={(e) => {
                                const newPreview = [...importPreview];
                                const idx = newPreview.findIndex(p => p.id === item.id);
                                if (idx !== -1) newPreview[idx].category = e.target.value;
                                setImportPreview(newPreview);
                              }}
                              className="text-[10px] font-black uppercase tracking-tighter bg-muted/50 hover:bg-muted rounded-lg px-2 py-1.5 border-none focus:ring-2 ring-primary/10 transition-all cursor-pointer"
                            >
                              {item.type === 'income' ? (
                                <option value="გაყიდვა">გაყიდვა</option>
                              ) : (
                                categories.map(c => <option key={c} value={c}>{c}</option>)
                              )}
                            </select>
                          </td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button
                  onClick={handleFinalImport}
                  disabled={importLoading}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 text-lg group"
                >
                  {importLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mr-3" />
                  ) : (
                    <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform" />
                  )}
                  იმპორტის დადასტურება
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* TABS OVERVIEW */}
      <Tabs defaultValue="dashboard" className="space-y-8" >
        <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 transition-colors">
          <TabsList className="bg-muted/30 p-1.5 rounded-2xl border border-border/50 h-auto inline-flex flex-nowrap min-w-max gap-1.5 justify-start">
            <TabsTrigger value="dashboard" className="rounded-xl px-6 font-bold gap-2 whitespace-nowrap">
              <PieChartIcon className="h-4 w-4" />
              დაშბორდი
            </TabsTrigger>
            <TabsTrigger value="pnl" className="rounded-xl px-6 font-bold gap-2 whitespace-nowrap">
              <TrendingUp className="h-4 w-4" />
              მოგება-ზარალი
            </TabsTrigger>
            <TabsTrigger value="cash-flow" className="rounded-xl px-6 font-bold gap-2 whitespace-nowrap">
              <ArrowRightLeft className="h-4 w-4" />
              ფულადი ნაკადები
            </TabsTrigger>
            <TabsTrigger value="journal" className="rounded-xl px-6 font-bold gap-2 whitespace-nowrap">
              <History className="h-4 w-4" />
              ჟურნალი
            </TabsTrigger>
            <TabsTrigger value="hr-budget" className="rounded-xl px-6 font-bold gap-2 whitespace-nowrap">
              <Briefcase className="h-4 w-4" />
              HR & ბიუჯეტი
            </TabsTrigger>
            <TabsTrigger value="tax-assets" className="rounded-xl px-6 font-bold gap-2 whitespace-nowrap">
              <Calculator className="h-4 w-4" />
              გადასახადები & ცვეთა
            </TabsTrigger>
            <TabsTrigger value="coa" className="rounded-xl px-6 font-bold gap-2 whitespace-nowrap">
              <Landmark className="h-4 w-4" />
              ანგარიშთა გეგმა
            </TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-xl px-6 font-bold gap-2 whitespace-nowrap">
              <Receipt className="h-4 w-4" />
              ხარჯები
            </TabsTrigger>
            <TabsTrigger value="debts" className="rounded-xl px-6 font-bold gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              ვალები & ნისიები
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 whitespace-nowrap">
              <Shield className="h-4 w-4 text-primary" />
              უსაფრთხოება
            </TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="pnl" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl font-black flex items-center justify-between">
                <span>მოგება და ზარალის უწყისი (P&L)</span>
                <span className={cn(
                  "px-4 py-2 rounded-xl text-lg",
                  finances.netProfit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                )}>
                  წმინდა მოგება: {finances.netProfit.toFixed(2)} ₾
                </span>
              </CardTitle>
              <CardDescription> არჩეული პერიოდის შემოსავლებისა და ხარჯების დეტალური ჩაშლა</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="font-black uppercase tracking-widest">დასახელება</TableHead>
                    <TableHead className="text-right font-black uppercase tracking-widest">თანხა (₾)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-primary/5 hover:bg-primary/5">
                    <TableCell className="font-black text-primary">[{COA_MAPPING["Revenue"]}] ოპერაციული შემოსავალი (Revenue)</TableCell>
                    <TableCell className="text-right font-black text-primary">{finances.totalSales.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground font-medium">პროდუქციის რეალიზაცია</TableCell>
                    <TableCell className="text-right font-medium">{finances.totalSales.toFixed(2)}</TableCell>
                  </TableRow>

                  <TableRow className="bg-rose-50/50 hover:bg-rose-50/50">
                    <TableCell className="font-black text-rose-700">[{COA_MAPPING["COGS"]}] რეალიზებული საქონლის თვითღირებულება (COGS)</TableCell>
                    <TableCell className="text-right font-black text-rose-700">-{finances.totalPurchases.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground font-medium">შესყიდვები</TableCell>
                    <TableCell className="text-right font-medium">-{finances.totalPurchases.toFixed(2)}</TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/30 hover:bg-muted/30 border-y-2 border-border/50">
                    <TableCell className="font-black text-lg">საერთო მოგება (Gross Profit)</TableCell>
                    <TableCell className="text-right font-black text-lg">
                      {(finances.totalSales - finances.totalPurchases).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-rose-50/50 hover:bg-rose-50/50 mt-4">
                    <TableCell className="font-black text-rose-700">6000 საოპერაციო ხარჯები (OPEX)</TableCell>
                    <TableCell className="text-right font-black text-rose-700">-{finances.totalExpenses.toFixed(2)}</TableCell>
                  </TableRow>
                  {expenseDistribution.map((ed, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-8 text-muted-foreground font-medium">[{COA_MAPPING[ed.name] || "6090"}] {ed.name}</TableCell>
                      <TableCell className="text-right font-medium">-{ed.value.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="bg-emerald-50 hover:bg-emerald-50 border-t-2 border-emerald-200">
                    <TableCell className="font-black text-xl text-emerald-800 tracking-tight">წმინდა მოგება (Net Profit)</TableCell>
                    <TableCell className="text-right font-black text-xl text-emerald-800">
                      {finances.netProfit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/50 shadow-md rounded-2xl bg-emerald-50/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-700">საოპერაციო საქმიანობა</CardDescription>
                <CardTitle className="text-2xl font-black">{cashFlowData.operating.toFixed(2)} ₾</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground font-medium">გაყიდვები, ხარჯები და შესყიდვები</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-md rounded-2xl bg-blue-50/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-blue-700">საინვესტიციო საქმიანობა</CardDescription>
                <CardTitle className="text-2xl font-black">{cashFlowData.investing.toFixed(2)} ₾</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground font-medium">ძირითადი საშუალებების შეძენა/რეალიზაცია</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-md rounded-2xl bg-purple-50/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-purple-700">ფინანსური საქმიანობა</CardDescription>
                <CardTitle className="text-2xl font-black">{cashFlowData.financing.toFixed(2)} ₾</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground font-medium">კაპიტალის ზრდა და დივიდენდები</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl font-black flex items-center justify-between">
                <span>ფულადი ნაკადების უწყისი (Cash Flow)</span>
                <span className={cn(
                  "px-4 py-2 rounded-xl text-lg",
                  cashFlowData.total >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                )}>
                  ფულის წმინდა ცვლილება: {cashFlowData.total.toFixed(2)} ₾
                </span>
              </CardTitle>
              <CardDescription>ფულადი სახსრების მოძრაობა პერიოდის ჭრილში</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="font-black uppercase tracking-widest">დასახელება</TableHead>
                    <TableHead className="text-right font-black uppercase tracking-widest">თანხა (₾)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/5 font-bold">
                    <TableCell>ნაღდი ფული პერიოდის დასაწყისში</TableCell>
                    <TableCell className="text-right">{(finances.currentCashBalance + finances.currentBankBalance - cashFlowData.total).toFixed(2)}</TableCell>
                  </TableRow>

                  <TableRow className="font-black text-emerald-700">
                    <TableCell>საოპერაციო საქმიანობიდან მიღებული სახსრები</TableCell>
                    <TableCell className="text-right">{cashFlowData.operating.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow className="font-black text-blue-700">
                    <TableCell>საინვესტიციო საქმიანობიდან მიღებული სახსრები</TableCell>
                    <TableCell className="text-right">{cashFlowData.investing.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow className="font-black text-purple-700">
                    <TableCell>ფინანსური საქმიანობიდან მიღებული სახსრები</TableCell>
                    <TableCell className="text-right">{cashFlowData.financing.toFixed(2)}</TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/10 font-bold border-t-2">
                    <TableCell className="text-lg">ნაღდი ფული პერიოდის ბოლოს</TableCell>
                    <TableCell className="text-right text-lg">{(finances.currentCashBalance + finances.currentBankBalance).toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coa" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-xl font-black">ანგარიშთა გეგმა (Chart of Accounts)</CardTitle>
                <CardDescription>აქტივების, ვალდებულებების, კაპიტალის, შემოსავლებისა და ხარჯების კლასიფიკაცია</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader className="bg-muted/10 sticky top-0 bg-white z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="font-black uppercase tracking-widest w-24 text-center">კოდი</TableHead>
                        <TableHead className="font-black uppercase tracking-widest">დასახელება</TableHead>
                        <TableHead className="font-black uppercase tracking-widest">ტიპი</TableHead>
                        <TableHead className="text-right font-black uppercase tracking-widest">ნაშთი (₾)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {CHART_OF_ACCOUNTS.map((acc) => {
                        const balance = store.getAccountBalance(acc.code);
                        return (
                          <TableRow key={acc.code} className={cn(acc.parentCode ? "bg-muted/5" : "font-bold")}>
                            <TableCell className="text-center font-mono">{acc.code}</TableCell>
                            <TableCell className={cn(acc.parentCode ? "pl-8" : "")}>{acc.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn(
                                "text-[10px] uppercase font-black",
                                acc.type === 'asset' ? "border-blue-200 text-blue-700 bg-blue-50" :
                                  acc.type === 'liability' ? "border-rose-200 text-rose-700 bg-rose-50" :
                                    acc.type === 'equity' ? "border-purple-200 text-purple-700 bg-purple-50" :
                                      acc.type === 'revenue' ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                                        "border-orange-200 text-orange-700 bg-orange-50"
                              )}>
                                {acc.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-black">
                              {balance.toLocaleString('ka-GE', { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-purple-600" />
                  მფლობელის კაპიტალი (Owner's Equity)
                </CardTitle>
                <CardDescription>საწყისი კაპიტალისა და გაუნაწილებელი მოგების აღრიცხვა</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm flex items-center justify-between border-l-4 border-l-purple-500">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">საწესდებო კაპიტალი (3110)</p>
                    <p className="text-3xl font-black mt-1">
                      {store.getAccountBalance('3110').toFixed(2)} ₾
                    </p>
                  </div>
                </div>

                <div className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm flex items-center justify-between border-l-4 border-l-emerald-500">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">გაუნაწილებელი მოგება (3210)</p>
                    <p className="text-3xl font-black mt-1 text-emerald-700">
                      {store.getAccountBalance('3210').toFixed(2)} ₾
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic px-2">
                  * ნაშთები ითვლება ავტომატურად ორმაგი ჩაწერის პრინციპით
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journal" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">სამემორიალო ორდერები (General Journal)</CardTitle>
                <CardDescription>ყველა ბიზნეს ოპერაციის საბუღალტრო გატარებები</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> ამონაწერის ბეჭდვა
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[700px]">
                <div className="divide-y divide-border/50">
                  {store.journalEntries.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">გატარებები ვერ მოიძებნა</div>
                  ) : (
                    store.journalEntries.map((entry) => (
                      <div key={entry.id} className="p-6 hover:bg-muted/5 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="font-mono text-xs">{entry.date}</Badge>
                            <span className="font-black text-sm">{entry.description}</span>
                          </div>
                          <Badge className={cn(
                            "uppercase text-[10px] font-black",
                            entry.referenceType === 'sale' ? "bg-emerald-500" :
                              entry.referenceType === 'purchase' ? "bg-blue-500" : "bg-orange-500"
                          )}>
                            {entry.referenceType}
                          </Badge>
                        </div>

                        <div className="bg-muted/30 rounded-xl overflow-hidden border border-border/50">
                          <Table>
                            <TableHeader className="bg-muted/10">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="text-[10px] font-black py-2 w-24">ანგარიში</TableHead>
                                <TableHead className="text-[10px] font-black py-2">დასახელება</TableHead>
                                <TableHead className="text-[10px] font-black py-2 text-right">დებეტი</TableHead>
                                <TableHead className="text-[10px] font-black py-2 text-right">კრედიტი</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entry.transactions.map((t, idx) => (
                                <TableRow key={idx} className="hover:bg-transparent border-none">
                                  <TableCell className="py-2 text-xs font-mono">{t.accountCode}</TableCell>
                                  <TableCell className="py-2 text-xs font-bold text-muted-foreground">{getAccountByCode(t.accountCode)?.name}</TableCell>
                                  <TableCell className="py-2 text-xs font-black text-right">{t.debit > 0 ? t.debit.toFixed(2) : ""}</TableCell>
                                  <TableCell className="py-2 text-xs font-black text-right">{t.credit > 0 ? t.credit.toFixed(2) : ""}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hr-budget" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* HR / Salary Tracking */}
            <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-indigo-900">
                  <Briefcase className="h-5 w-5" />
                  ხელფასები თანამშრომლებით
                </CardTitle>
                <CardDescription>შერჩეულ პერიოდში გაცემული ანაზღაურება პერსონალზე</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-black uppercase">თანამშრომელი</TableHead>
                      <TableHead className="font-black uppercase">პოზიცია</TableHead>
                      <TableHead className="font-black uppercase text-right">გაცემული ხელფასი</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {store.employees.map(emp => {
                      // Calculate salary from expenses where description contains [EmpName]
                      const empSalaries = store.expenses.filter(e =>
                        isWithinRange(e.date) &&
                        e.category === "ხელფასი" &&
                        e.description.includes(`[${emp.name}]`)
                      );
                      const totalSalaries = empSalaries.reduce((sum, e) => sum + (e.amount * (e.exchangeRate || 1)), 0);

                      return (
                        <TableRow key={emp.id}>
                          <TableCell className="font-bold">{emp.name}</TableCell>
                          <TableCell className="text-muted-foreground">{emp.position}</TableCell>
                          <TableCell className="text-right font-black text-indigo-700">
                            {totalSalaries > 0 ? `${totalSalaries.toFixed(2)} ₾` : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Budgeting vs Actuals */}
            <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-amber-50/50 border-b border-amber-100">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  ბიუჯეტი vs ფაქტიური
                </CardTitle>
                <CardDescription>საოპერაციო ხარჯების კონტროლი დადგენილ ლიმიტებთან</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                {Object.entries(BUDGETS).map(([cat, budget]) => {
                  const actual = expenseDistribution.find(ed => ed.name === cat)?.value || 0;
                  const percent = Math.min((actual / budget) * 100, 100);
                  const isOverBudget = actual > budget;

                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="font-bold">{cat}</span>
                        <div className="text-sm">
                          <span className={cn("font-black", isOverBudget ? "text-rose-600" : "text-emerald-600")}>
                            {actual.toFixed(0)} ₾
                          </span>
                          <span className="text-muted-foreground"> / {budget} ₾</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-1000", isOverBudget ? "bg-rose-500" : "bg-emerald-500")}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {isOverBudget && (
                        <p className="text-[10px] text-rose-500 font-bold text-right pt-1 flex items-center justify-end gap-1">
                          <AlertCircle className="h-3 w-3" /> გადახარჯვა: {(actual - budget).toFixed(0)} ₾
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tax-assets" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Taxes */}
            <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-rose-50/50 border-b border-rose-100">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-rose-900">
                  <Percent className="h-5 w-5" />
                  საგადასახადო ვალდებულებები
                </CardTitle>
                <CardDescription>შერჩეული პერიოდის საგადასახადო შეფასება (მიახლოებითი)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-black uppercase">გადასახადის ტიპი</TableHead>
                      <TableHead className="font-black uppercase">ბაზა (₾)</TableHead>
                      <TableHead className="font-black uppercase text-right">გადასახდელი (₾)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-bold">მცირე ბიზნესის საშემოსავლო (1%)</TableCell>
                      <TableCell className="text-muted-foreground">{finances.totalSales.toFixed(2)} (Bრუნვა)</TableCell>
                      <TableCell className="text-right font-black text-rose-700">{finances.taxes.smallBusiness.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">დღგ (VAT 18%) - სავარაუდო</TableCell>
                      <TableCell className="text-muted-foreground">ჩათვლების გამოკლებით</TableCell>
                      <TableCell className="text-right font-black text-rose-700">{finances.taxes.vat.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">მოგების გადასახადი (15%)</TableCell>
                      <TableCell className="text-muted-foreground">გაცემულ დივიდენდზე</TableCell>
                      <TableCell className="text-right font-black text-rose-700">{finances.taxes.profitOnDividends.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-rose-100/30">
                      <TableCell colSpan={2} className="font-black text-rose-900 text-lg">ჯამური სავარაუდო ვალდებულება</TableCell>
                      <TableCell className="text-right font-black text-rose-900 text-lg">{finances.taxes.totalEstimated.toFixed(2)} ₾</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Assets & Depreciation */}
            <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
                  <MonitorSmartphone className="h-5 w-5" />
                  ძირითადი საშუალებები & ცვეთა
                </CardTitle>
                <CardDescription>აქტივების რეესტრი და ამორტიზაციის კალკულაცია</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-black uppercase">დასახელება</TableHead>
                      <TableHead className="font-black uppercase">საწყისი (₾)</TableHead>
                      <TableHead className="font-black uppercase">აკუმ. ცვეთა</TableHead>
                      <TableHead className="font-black uppercase text-right">ნარჩენი (₾)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetsWithDepreciation.map(asset => (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <p className="font-bold">{asset.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{asset.category} • შეძ: {asset.purchaseDate}</p>
                        </TableCell>
                        <TableCell className="font-medium text-slate-600">{asset.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell className="font-medium text-rose-600">-{asset.accumulatedDepreciation.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-black text-emerald-700">
                          {asset.netBookValue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/20 border-t-2 border-border/50">
                      <TableCell className="font-black">ჯამი:</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-black text-lg">
                        {assetsWithDepreciation.reduce((sum, a) => sum + a.netBookValue, 0).toFixed(2)} ₾
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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

              <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 px-6 rounded-xl font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 bg-primary hover:scale-[1.02] active:scale-95 transition-all">
                    <Plus className="h-5 w-5" />
                    ხარჯის დამატება
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      ახალი ხარჯი
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddExpense} className="space-y-5 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">თანხა</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          placeholder="0.00"
                          className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ვალუტა</Label>
                        <select
                          value={expenseForm.currency}
                          onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value as any })}
                          className="flex h-11 w-full rounded-xl border-none bg-muted/30 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        >
                          <option value="GEL">GEL (₾)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                    </div>

                    {expenseForm.currency !== "GEL" && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">კურსი (1 {expenseForm.currency} = ? GEL)</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={expenseForm.exchangeRate}
                          onChange={(e) => setExpenseForm({ ...expenseForm, exchangeRate: e.target.value })}
                          placeholder="კურსი"
                          className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">კატეგორია</Label>
                        <Select
                          value={expenseForm.category}
                          onValueChange={(v) => {
                            setExpenseForm({ ...expenseForm, category: v });
                            if (v !== "ხელფასი") setSelectedEmployeeForSalary("all");
                          }}
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

                    {expenseForm.category === "ხელფასი" && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">თანამშრომელი (HR)</Label>
                        <Select
                          value={selectedEmployeeForSalary}
                          onValueChange={setSelectedEmployeeForSalary}
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-indigo-50 border-indigo-100 text-indigo-900 font-bold">
                            <SelectValue placeholder="აირჩიეთ თანამშრომელი" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-xl">
                            <SelectItem value="all">ზოგადი ხელფასი</SelectItem>
                            {store.employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>{emp.name} - {emp.position}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

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
                          -{(e.amount * (e.exchangeRate || 1)).toFixed(2)} ₾
                          {e.currency !== "GEL" && (
                            <div className="text-[10px] text-muted-foreground">
                              {e.amount.toFixed(2)} {e.currency}
                            </div>
                          )}
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
            <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-amber-50/50 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-900">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  კლიენტების დავალიანება
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase">კლიენტი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">ძველი ნისია</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-right">თანხა</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedCustomerDebts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-muted-foreground text-xs italic">
                          დავალიანება არ არსებობს
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedCustomerDebts.map((c) => (
                        <TableRow key={c.client} className="hover:bg-amber-50/30">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm tracking-tight">{c.client}</span>
                              {c.lastPaymentAt && (
                                <span className="text-[9px] text-muted-foreground font-medium">ბოლო გადახდა: {new Date(c.lastPaymentAt).toLocaleDateString("ka-GE")}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px] font-bold text-muted-foreground">
                            {c.oldestUnpaid ? new Date(c.oldestUnpaid).toLocaleDateString("ka-GE") : "-"}
                          </TableCell>
                          <TableCell className="text-right font-black text-amber-700">{c.totalDebt.toFixed(2)} ₾</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:bg-amber-100"
                              onClick={() => setSelectedEntity({
                                name: c.client,
                                total: c.totalDebt,
                                transactions: c.transactions,
                                allTransactions: c.allTransactions,
                                type: 'customer'
                              })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-blue-50/50 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-900">
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                  მომწოდებლების ვალი
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase">მომწოდებელი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-right">თანხა</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedSupplierDebts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-muted-foreground text-xs italic">
                          ვალი არ არსებობს
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedSupplierDebts.map((s) => (
                        <TableRow key={s.supplier} className="hover:bg-blue-50/30">
                          <TableCell className="font-bold text-sm tracking-tight">{s.supplier}</TableCell>
                          <TableCell className="text-right font-black text-blue-700">{s.totalDebt.toFixed(2)} ₾</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                              onClick={() => setSelectedEntity({
                                name: s.supplier,
                                total: s.totalDebt,
                                transactions: s.transactions,
                                allTransactions: s.allTransactions,
                                type: 'supplier'
                              })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden md:col-span-1">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-slate-600" />
                  პერიოდის ჩაკეტვა
                </CardTitle>
                <CardDescription className="text-xs">
                  ჩაკეტილ პერიოდში ტრანზაქციების დამატება ან რედაქტირება აკრძალულია.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ჩაკეტილია დღემდე:</Label>
                  <Input
                    type="date"
                    value={settings.closedUntil || ""}
                    onChange={(e) => store.setClosedUntil(e.target.value)}
                    className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                  />
                </div>
                {settings.closedUntil ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      ყველა ტრანზაქცია <strong>{new Date(settings.closedUntil).toLocaleDateString("ka-GE")}</strong>-მდე ჩაკეტილია რედაქტირებისთვის.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                      პერიოდი არ არის ჩაკეტილი. რეკომენდირებულია ყოველი თვის ბოლოს პერიოდის ჩაკეტვა.
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => store.setClosedUntil(undefined)}
                >
                  პერიოდის გახსნა
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden md:col-span-2">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-600" />
                  აუდიტის ისტორია
                </CardTitle>
                <CardDescription className="text-xs">
                  ბოლო 100 მოქმედება სისტემაში (შესწორებები, წაშლა, დამატება).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[600px] custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-[10px] font-black uppercase">თარიღი</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">ტიპი</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">ობიექტი</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">მომხმარებელი</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {store.auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                            ისტორია ცარიელია
                          </TableCell>
                        </TableRow>
                      ) : (
                        store.auditLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-muted/10 cursor-help" title={JSON.stringify(log.newData || log.oldData, null, 2)}>
                            <TableCell className="text-[10px] font-bold py-3">
                              {new Date(log.createdAt).toLocaleString("ka-GE")}
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase",
                                log.actionType === 'INSERT' ? "bg-emerald-50 text-emerald-700" :
                                  log.actionType === 'UPDATE' ? "bg-amber-50 text-amber-700" :
                                    "bg-rose-50 text-rose-700"
                              )}>
                                {log.actionType === 'INSERT' ? "დამატება" :
                                  log.actionType === 'UPDATE' ? "შესწორება" : "წაშლა"}
                              </span>
                            </TableCell>
                            <TableCell className="text-[10px] font-black text-muted-foreground uppercase">
                              {log.tableName === 'sales' ? "გაყიდვა" :
                                log.tableName === 'expenses' ? "ხარჯი" :
                                  log.tableName === 'products' ? "პროდუქტი" : log.tableName}
                            </TableCell>
                            <TableCell className="text-[9px] font-medium text-muted-foreground">
                              {log.userId?.split('-')[0] || "სისტემა"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Debt Details Modal */}
      <Dialog open={!!selectedEntity} onOpenChange={(open) => !open && setSelectedEntity(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
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
                  {selectedEntity.allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((t, idx) => {
                    const total = t.quantity * (t.salePrice || t.purchasePrice);
                    const paid = t.paidInCash + t.paidInCard;
                    const debt = total - paid;
                    const isFullyPaid = debt <= 0;

                    return (
                      <div key={t.id} className={cn(
                        "p-4 rounded-xl border flex justify-between items-center group transition-colors",
                        isFullyPaid ? "bg-muted/10 border-border/30 opacity-60" : "bg-muted/30 border-border/50 hover:bg-muted/50"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm",
                            isFullyPaid ? "bg-emerald-50 text-emerald-600" : "bg-white"
                          )}>
                            {isFullyPaid ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
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
                              {isFullyPaid && (
                                <Badge variant="secondary" className="text-[8px] bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-black uppercase">გადახდილია</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("font-black text-sm", isFullyPaid ? "text-muted-foreground" : "text-foreground")}>
                            {isFullyPaid ? "0.00" : debt.toFixed(2)} ₾
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                            {isFullyPaid ? "სრულად" : "დარჩენილი"}
                          </p>
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
                      const tenantId = authStore.getTenantId();
                      if (!tenantId || tenantId === "null" || tenantId === "undefined") {
                        toast.error("Tenant ID missing");
                        return;
                      }
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
