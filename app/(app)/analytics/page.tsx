"use client";

import { useState, useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Filter,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  FileText,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWarehouseStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ['#8b1a1a', '#e11d48', '#f43f5e', '#fb7185', '#fda4af'];

export default function AnalyticsPage() {
  const store = useWarehouseStore();
  const [range, setRange] = useState("30");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");

  const branches = store.branches;

  const analyticsData = useMemo(() => {
    const branchId = selectedBranchId === "all" ? undefined : selectedBranchId;
    return store.getAnalyticsData(parseInt(range), branchId);
  }, [store, range, selectedBranchId]);

  const topProducts = useMemo(() => {
    const branchId = selectedBranchId === "all" ? undefined : selectedBranchId;
    return store.getTopProducts(5, branchId);
  }, [store, selectedBranchId]);

  const categoryDist = useMemo(() => {
    const branchId = selectedBranchId === "all" ? undefined : selectedBranchId;
    return store.getCategoryDistribution(branchId);
  }, [store, selectedBranchId]);

  const totals = useMemo(() => {
    return analyticsData.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      profit: acc.profit + curr.profit,
      expenses: acc.expenses + curr.expenses,
      discounts: acc.discounts + (curr.discounts || 0)
    }), { revenue: 0, profit: 0, expenses: 0, discounts: 0 } as { revenue: number; profit: number; expenses: number; discounts: number });
  }, [analyticsData]);

  const cogs = totals.revenue - totals.profit;
  const netProfit = totals.profit - totals.expenses;

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">ანალიტიკა</h1>
          <p className="text-slate-500 font-medium">ბიზნესის ეფექტურობის ანალიზი (FIFO მეთოდით)</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <Layers className="h-4 w-4 text-slate-400" />
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="border-none shadow-none focus:ring-0 w-[160px] font-bold text-sm">
                <SelectValue placeholder="ფილიალი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა ფილიალი</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="border-none shadow-none focus:ring-0 w-[140px] font-bold text-sm">
                <SelectValue placeholder="პერიოდი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">ბოლო 7 დღე</SelectItem>
                <SelectItem value="30">ბოლო 30 დღე</SelectItem>
                <SelectItem value="90">ბოლო 90 დღე</SelectItem>
                <SelectItem value="365">ბოლო 1 წელი</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold bg-white h-10">
            <Download className="h-4 w-4 mr-2" />
            ექსპორტი
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="შემოსავალი" 
          value={totals.revenue} 
          icon={DollarSign} 
          color="blue"
          description="მთლიანი გაყიდვები"
          className="spring-up delay-100"
        />
        <StatsCard 
          title="მოგება" 
          value={totals.profit} 
          icon={TrendingUp} 
          color="green" 
          description="შემოსავალი - თვითღირ."
          className="spring-up delay-200"
        />
        <StatsCard 
          title="ხარჯები" 
          value={totals.expenses} 
          icon={TrendingDown} 
          color="red"
          description="სხვადასხვა ხარჯები"
          className="spring-up delay-300"
        />
        <StatsCard 
          title="ფასდაკლებები" 
          value={totals.discounts} 
          icon={Package} 
          color="orange"
          description="აქციების ჯამი"
          className="spring-up delay-400"
        />
        <StatsCard 
          title="სუფთა მოგება" 
          value={netProfit} 
          icon={TrendingUp} 
          color="primary"
          description="მოგება - ხარჯები"
          isHighlight
          className="spring-up delay-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-tight">შემოსავალი და მოგება</CardTitle>
              <CardDescription>ყოველდღიური სტატისტიკა</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="h-[400px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  dy={10}
                  tickFormatter={(str) => {
                    const d = new Date(str);
                    return d.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)'
                  }}
                  labelFormatter={(str) => new Date(str).toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="შემოსავალი" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={false} 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }} 
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  name="მოგება" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={false} 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">ტოპ პროდუქტები</CardTitle>
                <CardDescription>მოგების მიხედვით</CardDescription>
              </div>
              <ShoppingCart className="h-5 w-5 text-slate-300" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-[#8b1a1a]/5 group-hover:text-[#8b1a1a] transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">გაყიდულია: {p.sold} ცალი</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{p.profit.toFixed(2)} ₾</p>
                  <p className="text-[10px] text-green-600 font-bold">მოგება</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Category Distribution */}
        < Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-tight">კატეგორიების განაწილება</CardTitle>
              <CardDescription>მარაგების ღირებულება</CardDescription>
            </div>
            <PieChartIcon className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Breakdown Card */}
        <Card className="border-none shadow-xl rounded-3xl bg-slate-900 text-white aurora-border-glow">
          <CardHeader>
            <CardTitle className="text-white/60 text-xs font-bold uppercase tracking-widest">ფინანსური რეზიუმე</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-white/70 text-sm font-medium">თვითღირებულება (COGS)</span>
                <span className="text-2xl font-black text-white">{cogs.toFixed(2)} ₾</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 py-4">
                <span className="text-white/70 text-sm font-medium">საოპერაციო ხარჯები</span>
                <span className="text-2xl font-black text-white">{totals.expenses.toFixed(2)} ₾</span>
              </div>
              <div className="flex justify-between items-end py-4">
                <span className="text-white/70 text-sm font-medium">მთლიანი მოგების მარჟა</span>
                <span className="text-2xl font-black text-white">
                  {totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-xs text-primary font-black mb-1">INFO</p>
              <p className="text-xs leading-relaxed text-white/60 italic">
                გაანგარიშება ხდება **FIFO (First-In, First-Out)** პრინციპით. სისტემა თვლის მოგებას იმ შესყიდვის ფასებიდან გამომდინარე, რომელიც ყველაზე ადრეა განხორციელებული.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, description, isHighlight = false, className }: {
  title: string;
  value: number;
  icon: any;
  color: string;
  description: string;
  isHighlight?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(
      "premium-card spring-up shadow-xl",
      className
    )}>
      <div className="premium-border" />
      <div className="premium-content">
        <div className="flex items-center justify-between w-full px-6 mb-2">
          <div className="p-2 rounded-xl bg-white/5 backdrop-blur-sm">
            <Icon className="h-5 w-5 card-icon-main" />
          </div>
          {isHighlight && (
            <span className="text-[8px] font-black bg-[#bd9f67]/20 text-[#bd9f67] px-2 py-0.5 rounded-md border border-[#bd9f67]/30">NET PROFIT</span>
          )}
        </div>
        <div className="flex flex-col items-center">
          <p className="label-text">{title}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="value-text">{value.toLocaleString()}</h3>
            <span className="text-[#bd9f67] text-xs font-bold font-serif italic">₾</span>
          </div>
          <p className="text-[9px] text-white/30 font-medium mt-1">{description}</p>
        </div>
      </div>
      <span className="bottom-text">ANALYSIS REPORT</span>
      <span className="trail"></span>
    </div>
  );
}

function Badge({ children, className }: any) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
      {children}
    </span>
  );
}
