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

const CHART_COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#f43f5e",
];

export function DashboardPage() {
  const store = useWarehouseStore();

  const stats = [
    {
      label: "პროდუქციის ტიპი",
      value: store.totalProducts,
      icon: Package,
      color: "text-sky-600",
      bgColor: "bg-sky-50/50",
      borderColor: "border-t-sky-500",
    },
    {
      label: "მთლიანი სტოკი",
      value: store.totalStock,
      icon: Boxes,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50/50",
      borderColor: "border-t-emerald-500",
    },
    {
      label: "შესყიდვის ღირებულება",
      value: `${store.totalPurchaseValue.toLocaleString()} ₾`,
      icon: ShoppingCart,
      color: "text-amber-600",
      bgColor: "bg-amber-50/50",
      borderColor: "border-t-amber-500",
    },
    {
      label: "გაყიდვების შემოსავალი",
      value: `${store.totalRevenue.toLocaleString()} ₾`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50/50",
      borderColor: "border-t-blue-500",
    },
    {
      label: "მოგება",
      value: `${store.totalProfit.toLocaleString()} ₾`,
      icon: DollarSign,
      color: "text-emerald-700",
      bgColor: "bg-emerald-100/30",
      borderColor: "border-t-emerald-600",
    },
    {
      label: "აქტივების ღირებულება",
      value: `${store.totalSaleValue.toLocaleString()} ₾`,
      icon: ArrowUpRight,
      color: "text-violet-600",
      bgColor: "bg-violet-50/50",
      borderColor: "border-t-violet-500",
    },
    {
      label: "თანამშრომლები",
      value: store.employees.length,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/5",
      borderColor: "border-t-primary",
    },
    {
      label: "ჯამური ხარჯი",
      value: `${store.totalExpenses.toLocaleString()} ₾`,
      icon: TrendingDown,
      color: "text-rose-600",
      bgColor: "bg-rose-50/50",
      borderColor: "border-t-rose-500",
    },
    {
      label: "წმინდა მოგება",
      value: `${(store.totalProfit - store.totalExpenses).toLocaleString()} ₾`,
      icon: DollarSign,
      color: "text-emerald-700",
      bgColor: "bg-emerald-100/30",
      borderColor: "border-t-emerald-600",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="დეშბორდი"
        description="ბიზნესის მთლიანი ანალიტიკა"
        printTitle="დეშბორდი - ანალიტიკა"
      />

      <div id="print-area">
        <AIInsightsCard />
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className={cn("border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden relative group border-t-4", stat.bgColor, stat.borderColor)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-black mt-2 text-card-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn("rounded-xl p-2.5", stat.bgColor)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Section: Low Stock & Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8 text-slate-800">
           {/* Recent Inventory */}
          <Card className="border-border/50 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-primary" />
                  მარაგების სტატუსი
                </CardTitle>
                <CardDescription>ბოლო დამატებული პროდუქტები</CardDescription>
              </div>
              <Link href="/mobile-warehouse">
                <Button variant="ghost" size="sm" className="text-primary font-bold text-xs h-8">
                  ყველას ნახვა
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {store.products.length > 0 ? (
                <div className="space-y-3">
                  {store.products.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-xl border border-border/50 p-3.5 hover:bg-muted/20 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold text-card-foreground">
                          {product.name}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                          {product.category || "კატეგორიის გარეშე"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-card-foreground">
                          {product.quantity} ერთ.
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground">
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
          <Card className="border-none bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-primary/10">
            <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-black text-primary mb-2">დეტალური ანალიტიკა</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              იხილეთ გაყიდვების დინამიკა, FIFO მოგება და ფინანსური რეპორტები ერთ გვერდზე.
            </p>
            <Link href="/analytics">
              <Button className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20">
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
