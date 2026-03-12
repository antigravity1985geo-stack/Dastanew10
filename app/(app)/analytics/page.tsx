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

  const analyticsData = useMemo(() => store.getAnalyticsData(parseInt(range)), [store, range]);
  const topProducts = useMemo(() => store.getTopProducts(5), [store]);
  const categoryDist = useMemo(() => store.getCategoryDistribution(), [store]);

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
        
        <div className="flex items-center gap-3">
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
          className="spring-up delay-500 aurora-border-glow"
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
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(str) => new Date(str).toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="revenue" name="შემოსავალი" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="profit" name="მოგება" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
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
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50",
    orange: "text-orange-600 bg-orange-50",
    primary: "text-[#8b1a1a] bg-[#8b1a1a]/5"
  };

  return (
    <Card className={cn(
      "border-none shadow-sm rounded-2xl overflow-hidden active:scale-95 transition-all cursor-default",
      isHighlight ? "ring-2 ring-primary/20 bg-white" : "bg-white",
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl", colorMap[color])}>
            <Icon className="h-5 w-5" />
          </div>
          {isHighlight && (
            <Badge className="badge-aurora">
              NET
            </Badge>
          )}
        </div>
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value.toFixed(2)}</h3>
            <span className="text-slate-400 text-sm font-bold">₾</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Badge({ children, className }: any) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
      {children}
    </span>
  );
}
