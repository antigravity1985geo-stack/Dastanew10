"use client";

import {
  Package,
  Boxes,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  AlertTriangle,
  Users,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useWarehouseStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { AIInsightsCard } from "@/components/ai-assistant";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useHeaderSetup } from "@/lib/header-store";
import { Printer } from "lucide-react";
import { printPage } from "@/lib/print";

const CHART_COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#f43f5e",
];

export function DashboardPage() {
  const store = useWarehouseStore();

  useHeaderSetup(
    "დეშბორდი",
    <Button
      variant="outline"
      size="sm"
      onClick={() => printPage("დეშბორდი - ანალიტიკა")}
      className="gap-2 shrink-0 border-border/50 bg-white/50 hover:bg-white text-slate-700 font-bold h-9 rounded-xl shadow-sm active:scale-95 transition-all"
    >
      <Printer className="h-4 w-4" />
      <span className="hidden sm:inline">ბეჭდვა</span>
    </Button>
  );

  const stats = [
    {
      label: "პროდუქციის ტიპი",
      value: store.totalProducts,
      icon: Package,
      gradient: "!bg-gradient-to-br !from-sky-500 !to-blue-600",
    },
    {
      label: "მთლიანი სტოკი",
      value: store.totalStock,
      icon: Boxes,
      gradient: "!bg-gradient-to-br !from-emerald-500 !to-teal-600",
    },
    {
      label: "შესყიდვის ღირებულება",
      value: `${store.totalPurchaseValue.toLocaleString()} ₾`,
      icon: ShoppingCart,
      gradient: "!bg-gradient-to-br !from-amber-500 !to-orange-600",
    },
    {
      label: "გაყიდვების შემოსავალი",
      value: `${store.totalRevenue.toLocaleString()} ₾`,
      icon: TrendingUp,
      gradient: "!bg-gradient-to-br !from-blue-600 !to-indigo-600",
    },
    {
      label: "აქტივების ღირებულება",
      value: `${store.totalSaleValue.toLocaleString()} ₾`,
      icon: ArrowUpRight,
      gradient: "!bg-gradient-to-br !from-violet-500 !to-purple-600",
    },
    {
      label: "თანამშრომლები",
      value: store.employees.length,
      icon: Users,
      gradient: "!bg-gradient-to-br !from-indigo-600 !to-blue-700",
    },
    {
      label: "ჯამური ხარჯი",
      value: `${store.totalExpenses.toLocaleString()} ₾`,
      icon: TrendingDown,
      gradient: "!bg-gradient-to-br !from-rose-500 !to-red-600",
    },
    {
      label: "წმინდა მოგება",
      value: `${(store.totalProfit - store.totalExpenses).toLocaleString()} ₾`,
      icon: DollarSign,
      gradient: (store.totalProfit - store.totalExpenses) >= 0 
        ? "!bg-gradient-to-br !from-emerald-600 !to-green-700" 
        : "!bg-gradient-to-br !from-red-600 !to-rose-700",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="დეშბორდი"
        description="სისტემის მიმოხილვა და სტატისტიკა"
        hideActions
        hideTitle
      />

      <div id="print-area">
        <AIInsightsCard />
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-10">
          {stats.map((stat, idx) => (
            <div 
              key={stat.label} 
              className={cn(
                "premium-card spring-up shadow-2xl",
                `delay-${(idx + 1) * 100}`
              )}
            >
              <div className="premium-border" />
              <div className="premium-content">
                <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-sm mb-2 group-hover:scale-110 transition-transform duration-500">
                  <stat.icon className="h-6 w-6 card-icon-main" />
                </div>
                <p className="label-text">{stat.label}</p>
                <p className="value-text">{stat.value}</p>
              </div>
              <span className="bottom-text">Dasta System ERP</span>
              <span className="trail"></span>
            </div>
          ))}
        </div>

        {/* Status Section: Low Stock & Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8 text-slate-800">
           {/* Recent Inventory */}
          <Card className="aurora-glass shadow-xl rounded-3xl spring-up delay-400">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-primary" />
                  მარაგების სტატუსი
                </CardTitle>
                <CardDescription className="text-xs font-bold text-muted-foreground">ბოლო დამატებული პროდუქტები</CardDescription>
              </div>
              <Link href="/mobile-warehouse">
                <Button variant="ghost" size="sm" className="text-primary font-black text-[10px] uppercase hover:bg-primary/5">
                  ყველას ნახვა
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {store.products.length > 0 ? (
                <div className="space-y-3">
                  {store.products.slice(0, 4).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-xl border border-border/40 bg-white/5 p-3.5 hover:bg-white/10 transition-all hover:scale-[1.01]"
                    >
                      <div>
                        <p className="text-sm font-black text-foreground">
                          {product.name}
                        </p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {product.category || "კატეგორიის გარეშე"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-foreground">
                          {product.quantity} ერთ.
                        </p>
                        <p className="text-[10px] font-black text-primary">
                          {product.salePrice.toLocaleString()} ₾
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Package className="h-10 w-10 opacity-10 mb-3" />
                  <p className="text-sm font-medium">პროდუქცია არ არის დამატებული</p>
                </div>
              )}
            </CardContent>
          </Card>

           {/* Analytics Shortcut */}
          <Card className="border-none bg-slate-900 border-border/40 shadow-2xl rounded-3xl flex flex-col items-center justify-center p-8 text-center aurora-border-glow spring-up delay-500">
            <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">დეტალური ანალიტიკა</h3>
            <p className="text-sm text-white/50 mb-6 max-w-xs font-medium italic">
              იხილეთ გაყიდვების დინამიკა, FIFO მოგება და ფინანსური რეპორტები ერთ გვერდზე.
            </p>
            <Link href="/analytics">
              <Button className="rounded-2xl px-10 h-14 font-black shadow-xl shadow-primary/30 uppercase tracking-widest text-xs transition-transform active:scale-95">
                ანალიტიკაზე გადასვლა
              </Button>
            </Link>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {store.lowStockProducts.length > 0 && (
          <Card className="mt-8 border-rose-200/50 bg-rose-50/30 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-rose-900">
                  მარაგი იწურება! ({store.lowStockProducts.length})
                </CardTitle>
                <CardDescription className="text-rose-600/70">ეს პროდუქტები მალე ამოიწურება</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {store.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-xl border border-rose-200/40 bg-white/60 p-3.5 hover:bg-white transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {product.name}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                        {product.category || "კატეგორიის გარეშე"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-rose-600">
                        {product.quantity} ერთ.
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                        ნაშთი
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
