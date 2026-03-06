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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const CHART_COLORS = [
  "oklch(0.45 0.18 250)",
  "oklch(0.55 0.15 160)",
  "oklch(0.65 0.2 40)",
  "oklch(0.6 0.15 300)",
  "oklch(0.7 0.15 80)",
];

export function DashboardPage() {
  const store = useWarehouseStore();

  const stats = [
    {
      label: "პროდუქციის ტიპი",
      value: store.totalProducts,
      icon: Package,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "მთლიანი სტოკი",
      value: store.totalStock,
      icon: Boxes,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "შესყიდვის ღირებულება",
      value: `${store.totalPurchaseValue.toLocaleString()} GEL`,
      icon: ShoppingCart,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "გაყიდვების შემოსავალი",
      value: `${store.totalRevenue.toLocaleString()} GEL`,
      icon: TrendingUp,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "მოგება",
      value: `${store.totalProfit.toLocaleString()} GEL`,
      icon: DollarSign,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "აქტივების ღირებულება",
      value: `${store.totalSaleValue.toLocaleString()} GEL`,
      icon: ArrowUpRight,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "თანამშრომლები",
      value: store.employees.length,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div>
      <PageHeader
        title="დეშბორდი"
        description="ბიზნესის მთლიანი ანალიტიკა"
        printTitle="დეშბორდი - ანალიტიკა"
      />

      <div id="print-area">
        <AIInsightsCard />
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-2 text-card-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sales by Month */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-card-foreground">
                გაყიდვები თვეების მიხედვით
              </CardTitle>
            </CardHeader>
            <CardContent>
              {store.salesByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={store.salesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      stroke="oklch(0.5 0.02 250)"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="oklch(0.5 0.02 250)"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid oklch(0.9 0.01 250)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      name="შემოსავალი"
                      fill="oklch(0.45 0.18 250)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="profit"
                      name="მოგება"
                      fill="oklch(0.55 0.15 160)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                  გაყიდვების მონაცემები არ არის
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-card-foreground">
                კატეგორიების განაწილება
              </CardTitle>
            </CardHeader>
            <CardContent>
              {store.categoryDistribution.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={280}>
                    <PieChart>
                      <Pie
                        data={store.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        nameKey="category"
                      >
                        {store.categoryDistribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {store.categoryDistribution.map((cat, index) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="text-card-foreground">{cat.category}</span>
                        </div>
                        <span className="font-medium text-card-foreground">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                  კატეგორიების მონაცემები არ არის
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Recent Sales */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-card-foreground">
                ტოპ პროდუქცია
              </CardTitle>
            </CardHeader>
            <CardContent>
              {store.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {store.topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            გაყიდული: {product.sold} ერთ.
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-card-foreground">
                        {product.revenue.toLocaleString()} GEL
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  გაყიდვების მონაცემები არ არის
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-card-foreground">
                საწყობის პროდუქცია
              </CardTitle>
            </CardHeader>
            <CardContent>
              {store.products.length > 0 ? (
                <div className="space-y-3">
                  {store.products.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.category || "კატეგორიის გარეშე"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-card-foreground">
                          {product.quantity} ერთ.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.salePrice.toLocaleString()} GEL
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  პროდუქცია არ არის დამატებული
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {store.lowStockProducts.length > 0 && (
          <Card className="mt-6 border-destructive/50 bg-destructive/5">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-sm font-semibold text-destructive">
                მარაგი იწურება! ({store.lowStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {store.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-md border border-destructive/20 bg-background p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.category || "კატეგორიის გარეშე"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">
                        {product.quantity} ერთ.
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
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
