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
  Zap,
  ChevronRight,
} from "lucide-react";
import { useWarehouseStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { AIInsightsCard } from "@/components/ai-assistant";
import Link from "next/link";
import { useHeaderSetup } from "@/lib/header-store";

const GOLD = "#ffe0a6";
const GOLD_DIM = "rgba(255,224,166,0.5)";
const SURFACE = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.06)";

const STAT_GRADIENTS = [
  ["#3b82f6", "#1d4ed8"],   // blue
  ["#10b981", "#059669"],   // green
  ["#f59e0b", "#d97706"],   // amber
  ["#ffe0a6", "#c9a96e"],   // gold
  ["#8b5cf6", "#7c3aed"],   // violet
  ["#06b6d4", "#0891b2"],   // cyan
  ["#f43f5e", "#e11d48"],   // rose
  ["#34d399", "#10b981"],   // emerald
];

export function DashboardPage() {
  const store = useWarehouseStore();

  useHeaderSetup("დეშბორდი", null);

  const netProfit = store.totalProfit - store.totalExpenses;

  const stats = [
    {
      label: "პროდუქციის ტიპი",
      value: store.totalProducts,
      subLabel: "სულ პოზიცია",
      icon: Package,
      gradient: STAT_GRADIENTS[0],
    },
    {
      label: "მთლიანი სტოკი",
      value: `${store.totalStock.toLocaleString()} ერთ.`,
      subLabel: "ყველა ფილიალი",
      icon: Boxes,
      gradient: STAT_GRADIENTS[1],
    },
    {
      label: "შესყიდვის ღირებ.",
      value: `${store.totalPurchaseValue.toLocaleString()} ₾`,
      subLabel: "ჯამური ღირებულება",
      icon: ShoppingCart,
      gradient: STAT_GRADIENTS[2],
    },
    {
      label: "გაყიდვები",
      value: `${store.totalRevenue.toLocaleString()} ₾`,
      subLabel: "შემოსავლები",
      icon: TrendingUp,
      gradient: STAT_GRADIENTS[3],
    },
    {
      label: "აქტივები",
      value: `${store.totalSaleValue.toLocaleString()} ₾`,
      subLabel: "მარაგის ღირებ.",
      icon: ArrowUpRight,
      gradient: STAT_GRADIENTS[4],
    },
    {
      label: "თანამშრომლები",
      value: store.employees.length,
      subLabel: "აქტიური",
      icon: Users,
      gradient: STAT_GRADIENTS[5],
    },
    {
      label: "ჯამური ხარჯი",
      value: `${store.totalExpenses.toLocaleString()} ₾`,
      subLabel: "პერიოდისთვის",
      icon: TrendingDown,
      gradient: STAT_GRADIENTS[6],
    },
    {
      label: "წმინდა მოგება",
      value: `${netProfit.toLocaleString()} ₾`,
      subLabel: netProfit >= 0 ? "დადებითი" : "უარყოფითი",
      icon: DollarSign,
      gradient: netProfit >= 0 ? STAT_GRADIENTS[7] : ["#f43f5e", "#e11d48"],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="დეშბორდი"
        description="სისტემის მიმოხილვა და სტატისტიკა"
        hideActions
        hideTitle
      />

      {/* AI Insights */}
      <AIInsightsCard />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-xl p-4 group cursor-default"
            style={{
              background: `linear-gradient(145deg, ${stat.gradient[0]}14, ${stat.gradient[1]}08)`,
              border: `1px solid ${stat.gradient[0]}22`,
              transition: "transform 200ms ease, box-shadow 200ms ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${stat.gradient[0]}20`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {/* Icon */}
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center mb-3"
              style={{ background: `${stat.gradient[0]}20` }}
            >
              <stat.icon className="h-4 w-4" style={{ color: stat.gradient[0] }} />
            </div>

            {/* Value */}
            <p className="text-lg sm:text-xl font-black leading-none mb-1" style={{ color: "rgba(255,255,255,0.95)" }}>
              {stat.value}
            </p>

            {/* Label */}
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${stat.gradient[0]}99` }}>
              {stat.label}
            </p>

            {/* Bottom accent line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: `linear-gradient(90deg, transparent, ${stat.gradient[0]}40, transparent)` }}
            />
          </div>
        ))}
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Products */}
        <div className="premium-glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div>
              <h3 className="text-sm font-black flex items-center gap-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                <Boxes className="h-4 w-4" style={{ color: GOLD }} />
                მარაგების სტატუსი
              </h3>
              <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: GOLD_DIM }}>
                ბოლო პროდუქტები
              </p>
            </div>
            <Link href="/mobile-warehouse">
              <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors" style={{ color: GOLD_DIM }}>
                ყველა <ChevronRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {store.products.length > 0 ? (
              store.products.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-5 py-3 transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,224,166,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div>
                    <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {product.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {product.category || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {product.quantity} ერთ.
                    </p>
                    <p className="text-[11px] font-bold" style={{ color: GOLD }}>
                      {product.salePrice.toLocaleString()} ₾
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-14" style={{ color: "rgba(255,255,255,0.15)" }}>
                <Package className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">პროდუქცია არ არის</p>
              </div>
            )}
          </div>
        </div>

        {/* Analytics CTA */}
        <div
          className="rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-8 text-center"
          style={{
            background: "linear-gradient(145deg, rgba(255,224,166,0.06) 0%, rgba(255,224,166,0.01) 100%)",
            border: "1px solid rgba(255,224,166,0.08)",
          }}
        >
          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 50% 80%, rgba(255,224,166,0.06) 0%, transparent 70%)",
            }}
          />

          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5 relative"
            style={{ background: "rgba(255,224,166,0.1)", border: "1px solid rgba(255,224,166,0.15)" }}
          >
            <TrendingUp className="h-8 w-8" style={{ color: GOLD }} />
          </div>

          <h3 className="text-xl font-black mb-2 tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
            დეტალური ანალიტიკა
          </h3>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            გაყიდვების დინამიკა, FIFO მოგება და ფინანსური რეპორტები ერთ გვერდზე.
          </p>
          <Link href="/analytics">
            <button className="premium-btn flex items-center gap-2 px-6 py-3">
              <Zap className="h-4 w-4" />
              ანალიტიკაზე გადასვლა
            </button>
          </Link>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {store.lowStockProducts.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)",
            border: "1px solid rgba(239,68,68,0.15)",
          }}
        >
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-red-400">
                მარაგი იწურება! ({store.lowStockProducts.length})
              </h3>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(239,68,68,0.5)" }}>
                ეს პროდუქტები მალე ამოიწურება
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
            {store.lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg px-4 py-3"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {product.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {product.category || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-red-400">
                    {product.quantity}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "rgba(239,68,68,0.5)" }}>
                    ნაშთი
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales */}
      {store.sales.length > 0 && (
        <div className="premium-glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div>
              <h3 className="text-sm font-black flex items-center gap-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                <TrendingUp className="h-4 w-4" style={{ color: "#34d399" }} />
                ბოლო გაყიდვები
              </h3>
              <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "rgba(52,211,153,0.5)" }}>
                უახლესი ტრანზაქციები
              </p>
            </div>
            <Link href="/sales">
              <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD_DIM }}>
                ყველა <ChevronRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {store.sales.slice(0, 5).map((sale, i) => (
              <div key={sale.id || i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {sale.productName}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {new Date(sale.createdAt).toLocaleDateString("ka-GE")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: "#34d399" }}>
                    +{sale.totalAmount?.toFixed(2)} ₾
                  </p>
                  <p className="text-[10px] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {sale.quantity} ცალი
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
