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
  ChevronRight,
} from "lucide-react";
import { useWarehouseStore } from "@/hooks/use-store";
import { AIInsightsCard } from "@/components/ai-assistant";
import Link from "next/link";
import { useHeaderSetup } from "@/lib/header-store";

export function DashboardPage() {
  const store = useWarehouseStore();
  useHeaderSetup("Overview", null);

  const netProfit = store.totalProfit - store.totalExpenses;

  const stats = [
    {
      label: "გაყიდვები",
      value: `${store.totalRevenue.toLocaleString()} ₾`,
      change: "+4.8%",
      up: true,
      sub: "vs. გასულ თვეს",
      color: "gold",
    },
    {
      label: "ხარჯები",
      value: `${store.totalExpenses.toLocaleString()} ₾`,
      change: "-2.1%",
      up: false,
      sub: "vs. გასულ თვეს",
      color: "silver",
    },
    {
      label: "წმინდა მოგება",
      value: `${Math.abs(netProfit).toLocaleString()} ₾`,
      change: netProfit >= 0 ? "+1.3%" : "-1.3%",
      up: netProfit >= 0,
      sub: netProfit >= 0 ? "დადებითი" : "უარყოფითი",
      color: netProfit >= 0 ? "gold" : "red",
    },
  ];

  // Mini bar chart data from recent sales
  const recentSales = store.sales.slice(-12);
  const maxAmount = Math.max(...recentSales.map(s => s.totalAmount || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* AI Insights */}
      <AIInsightsCard />

      {/* STAT ROW — .stat-row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {stats.map((stat, i) => (
          <div key={stat.label} className="erp-stat-card">
            <div className="erp-stat-label">
              {stat.label}
              <span style={{ opacity: 0.4, cursor: 'pointer', fontSize: 14 }}>···</span>
            </div>
            <div className={`erp-stat-value ${stat.color}`} style={{ fontSize: 20 }}>
              {stat.value}
            </div>
            <div className="erp-stat-change">
              <span className={stat.up ? "up" : "down"} style={{ fontSize: 10 }}>
                {stat.up ? "↗" : "↘"}
              </span>
              <span className={stat.up ? "up" : "down"}>{stat.change}</span>
              <span style={{ fontSize: 10, color: 'var(--erp-silver)', opacity: 0.5, marginLeft: 'auto' }}>
                {stat.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MID ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '12px' }}>

        {/* Balance-style card — recent products */}
        <div style={{
          background: 'linear-gradient(135deg, var(--erp-bg2) 0%, var(--erp-bg3) 100%)',
          border: '1px solid var(--erp-border2)',
          borderRadius: 12,
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--erp-silver)', opacity: 0.7, flex: 1, fontWeight: 500 }}>
              მთლიანი სტოკი
            </div>
            <div style={{
              background: 'var(--erp-bg4)',
              border: '1px solid var(--erp-border)',
              borderRadius: 6, padding: '3px 8px',
              fontSize: 10, color: 'var(--erp-silver2)', cursor: 'pointer',
            }}>
              GEL ⌄
            </div>
          </div>
          <div style={{
            fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, #f0d9a0, #d4b86a, #c9a84c)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: 14,
          }}>
            {store.totalSaleValue.toLocaleString()} ₾
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/sales" style={{ flex: 1 }}>
              <div className="erp-btn" style={{ textAlign: 'center', fontSize: 10 }}>↑ გაყიდვა</div>
            </Link>
            <Link href="/purchases" style={{ flex: 1 }}>
              <div className="erp-btn" style={{ textAlign: 'center', fontSize: 10 }}>↓ შეძენა</div>
            </Link>
            <Link href="/transfers">
              <div className="erp-btn" style={{ fontSize: 10, padding: '6px 10px' }}>⇄</div>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="erp-card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--erp-silver)', opacity: 0.7, flex: 1, fontWeight: 500 }}>
              სტატისტიკა
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { icon: Package, label: "პროდუქტი", val: store.totalProducts, color: '#60a5fa' },
              { icon: Boxes, label: "სტოკი", val: store.totalStock, color: '#3ecf8e' },
              { icon: Users, label: "თანამშ.", val: store.employees.length, color: '#a899ff' },
              { icon: ShoppingCart, label: "გაყიდვა", val: store.sales.length, color: '#e8c97a' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: 4, borderRadius: 8, cursor: 'pointer', transition: 'background 150ms',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--erp-bg3)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'var(--erp-bg3)', border: '1px solid var(--erp-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <item.icon style={{ width: 12, height: 12, color: item.color }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", color: item.color }}>
                  {item.val}
                </div>
                <div style={{ fontSize: 9, color: 'var(--erp-silver)', opacity: 0.6, textAlign: 'center' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="erp-card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--erp-silver)', opacity: 0.7, flex: 1, fontWeight: 500 }}>
              სწრაფი წვდომა
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: "ანალიტიკა", href: "/analytics", icon: TrendingUp, color: '#a899ff' },
              { label: "ინვენტარი", href: "/inventory", icon: Boxes, color: '#3ecf8e' },
              { label: "ფილიალები", href: "/branches", icon: ArrowUpRight, color: '#e8c97a' },
              { label: "კლიენტები", href: "/customers", icon: Users, color: '#60a5fa' },
            ].map(link => (
              <Link key={link.href} href={link.href}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  borderRadius: 7, transition: 'background 150ms', cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--erp-bg3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: 'var(--erp-bg3)', border: '1px solid var(--erp-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <link.icon style={{ width: 12, height: 12, color: link.color }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--erp-silver2)', flex: 1 }}>{link.label}</span>
                  <ChevronRight style={{ width: 12, height: 12, color: 'var(--erp-silver)', opacity: 0.4 }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '12px' }}>

        {/* Cashflow / mini bar chart */}
        <div className="erp-card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--erp-silver)', opacity: 0.7, flex: 1, fontWeight: 500 }}>
              გაყიდვების გრაფიკი
            </div>
            <div style={{
              display: 'flex', background: 'var(--erp-bg3)', borderRadius: 7, padding: '2px', gap: 2,
            }}>
              {["ბოლო 12"].map((p, i) => (
                <div key={p} style={{
                  padding: '3px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
                  fontWeight: 500, color: 'var(--erp-gold2)', background: 'var(--erp-bg1)',
                  border: '1px solid var(--erp-border)',
                }}>
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div style={{
            fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, #e8c97a, #c9a84c)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: 12,
          }}>
            {store.totalRevenue.toLocaleString()} ₾
          </div>

          {/* Mini bar chart */}
          <div style={{
            height: 55, display: 'flex', alignItems: 'flex-end', gap: 3, position: 'relative',
          }}>
            {recentSales.length > 0 ? recentSales.map((s, i) => (
              <div
                key={i}
                title={`${s.totalAmount?.toFixed(0)} ₾`}
                style={{
                  flex: 1,
                  borderRadius: '3px 3px 0 0',
                  cursor: 'pointer',
                  transition: 'filter 150ms',
                  height: `${((s.totalAmount || 0) / maxAmount) * 55}px`,
                  minHeight: 4,
                  background: i % 2 === 0
                    ? 'linear-gradient(180deg, rgba(232,201,122,0.8), rgba(201,168,76,0.4))'
                    : 'linear-gradient(180deg, rgba(200,212,222,0.5), rgba(168,180,192,0.2))',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = 'brightness(1.3)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = 'brightness(1)'}
              />
            )) : (
              // placeholder bars
              Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: '3px 3px 0 0',
                  height: `${[40, 25, 55, 30, 70, 45, 80, 50, 65, 35, 90, 60][i] * 0.55}px`,
                  background: i % 2 === 0
                    ? 'linear-gradient(180deg, rgba(232,201,122,0.3), rgba(201,168,76,0.15))'
                    : 'linear-gradient(180deg, rgba(200,212,222,0.2), rgba(168,180,192,0.08))',
                }} />
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="erp-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--erp-silver)', opacity: 0.7, flex: 1, fontWeight: 500 }}>
              ბოლო გაყიდვები
            </div>
            <Link href="/sales">
              <div style={{
                background: 'var(--erp-bg3)', border: '1px solid var(--erp-border)',
                borderRadius: 6, padding: '3px 8px', fontSize: 10, color: 'var(--erp-silver2)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                სულ ⌄
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {store.sales.length > 0 ? (
              store.sales.slice(0, 4).map((sale, i) => (
                <div key={sale.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                  borderBottom: i < 3 ? '1px solid rgba(42,47,69,0.6)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'var(--erp-bg3)', border: '1px solid var(--erp-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#3ecf8e',
                  }}>
                    {(sale.productName || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 500,
                      background: 'linear-gradient(135deg, #d4b86a, #a8b4c0)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {sale.productName}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--erp-silver)', opacity: 0.4, marginTop: 1 }}>
                      {new Date(sale.createdAt).toLocaleDateString("ka-GE")}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif",
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #6ee7b7, #3ecf8e)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    +{sale.totalAmount?.toFixed(0)} ₾
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--erp-silver)', opacity: 0.3 }}>
                <TrendingUp style={{ width: 24, height: 24, margin: '0 auto 6px' }} />
                <div style={{ fontSize: 12 }}>გაყიდვები არ არის</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {store.lowStockProducts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, var(--erp-bg2), var(--erp-bg3))',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            borderBottom: '1px solid rgba(248,113,113,0.1)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle style={{ width: 14, height: 14, color: 'var(--erp-red)' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--erp-red)' }}>
                მარაგი იწურება! ({store.lowStockProducts.length} პროდუქტი)
              </div>
              <div style={{ fontSize: 10, color: 'var(--erp-red)', opacity: 0.5 }}>
                ეს პროდუქტები მალე ამოიწურება
              </div>
            </div>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 8, padding: '12px 16px',
          }}>
            {store.lowStockProducts.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: 8, padding: '8px 12px',
                background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.1)',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--erp-silver2)' }}>{p.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--erp-silver)', opacity: 0.4, textTransform: 'uppercase' }}>
                    {p.category || "—"}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--erp-red)', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {p.quantity}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--erp-red)', opacity: 0.5, textTransform: 'uppercase' }}>
                    ნაშთი
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
