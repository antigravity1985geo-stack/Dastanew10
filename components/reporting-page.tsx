"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  Download, 
  ArrowUpRight,
  Table as TableIcon
} from "lucide-react";
import { useWarehouseStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ReportType = "sales" | "expenses" | "inventory" | "transfers";

export function ReportingPage() {
  const store = useWarehouseStore();
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [dateRange, setDateRange] = useState("30");

  const branches = store.branches;

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const rangeDays = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rangeDays);

    switch (reportType) {
      case "sales":
        return store.sales.filter(s => {
          const matchesBranch = selectedBranchId === "all" || s.branchId === selectedBranchId;
          const matchesQuery = s.productName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
          const matchesDate = new Date(s.createdAt) >= cutoffDate;
          return matchesBranch && matchesQuery && matchesDate;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      case "expenses":
        return store.expenses.filter(e => {
          const matchesBranch = selectedBranchId === "all" || e.branchId === selectedBranchId;
          const matchesQuery = e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
          const matchesDate = new Date(e.date) >= cutoffDate;
          return matchesBranch && matchesQuery && matchesDate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      case "inventory":
        return store.products.filter(p => {
          const matchesQuery = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
          return matchesQuery;
        });

      case "transfers":
        return store.stockTransfers.filter(t => {
          const matchesBranch = selectedBranchId === "all" || t.fromBranchId === selectedBranchId || t.toBranchId === selectedBranchId;
          const matchesQuery = t.notes?.toLowerCase().includes(q) || false;
          const matchesDate = new Date(t.createdAt) >= cutoffDate;
          return matchesBranch && matchesQuery && matchesDate;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      default:
        return [];
    }
  }, [reportType, searchQuery, selectedBranchId, dateRange, store]);

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error("ექსპორტისთვის მონაცემები არ არის");
      return;
    }

    try {
      let headers: string[] = [];
      let rows: any[] = [];

      if (reportType === "sales") {
        headers = ["ID", "თარიღი", "პროდუქტი", "რაოდენობა", "ჯამი", "ფილიალი"];
        rows = (filteredData as any[]).map(s => [
          s.id,
          new Date(s.createdAt).toLocaleDateString(),
          s.productName,
          s.quantity,
          s.totalAmount,
          store.branches.find(b => b.id === s.branchId)?.name || "უცნობი"
        ]);
      } else if (reportType === "expenses") {
        headers = ["ID", "თარიღი", "აღწერა", "კატეგორია", "თანხა", "ფილიალი"];
        rows = (filteredData as any[]).map(e => [
          e.id,
          e.date,
          e.description,
          e.category,
          e.amount,
          store.branches.find(b => b.id === e.branchId)?.name || "უცნობი"
        ]);
      } else if (reportType === "inventory") {
        headers = ["ID", "პროდუქტი", "კატეგორია", "რაოდენობა", "ფასი"];
        rows = (filteredData as any[]).map(p => [
          p.id,
          p.name,
          p.category,
          p.quantity,
          p.salePrice
        ]);
      }

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `dasta_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("ექსპორტი წარმატებით დასრულდა");
    } catch (error) {
      toast.error("ექსპორტისას მოხდა შეცდომა");
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <PageHeader 
        title="რეპორტინგი" 
        description="დეტალური მონაცემების ანალიზი და ექსპორტი"
        hideActions
      />

      {/* Controls */}
      <div className="premium-glass p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,224,166,0.5)' }}>რეპორტის ტიპი</label>
            <Select value={reportType} onValueChange={(val) => setReportType(val as ReportType)}>
              <SelectTrigger className="h-9 rounded-lg border-none font-bold text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-none shadow-2xl" style={{ background: '#1a1a1a' }}>
                <SelectItem value="sales" className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>გაყიდვები</SelectItem>
                <SelectItem value="expenses" className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>ხარჯები</SelectItem>
                <SelectItem value="inventory" className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>ინვენტარი</SelectItem>
                <SelectItem value="transfers" className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>გადაზიდვები</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,224,166,0.5)' }}>ფილიალი</label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="h-9 rounded-lg border-none font-bold text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-none shadow-2xl" style={{ background: '#1a1a1a' }}>
                <SelectItem value="all" className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>ყველა</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id} className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,224,166,0.5)' }}>პერიოდი</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-9 rounded-lg border-none font-bold text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-none shadow-2xl" style={{ background: '#1a1a1a' }}>
                <SelectItem value="7" className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>7 დღე</SelectItem>
                <SelectItem value="30" className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>30 დღე</SelectItem>
                <SelectItem value="90" className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>90 დღე</SelectItem>
                <SelectItem value="365" className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>1 წელი</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <input 
                placeholder="ძებნა..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="premium-search w-full h-9 pl-9 pr-3 text-sm"
              />
            </div>
            <button 
              onClick={exportToCSV}
              className="premium-btn h-9 px-3 flex items-center gap-1.5 text-[10px] shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="premium-glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="premium-table-header">
                {reportType === "sales" && (
                  <>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>თარიღი</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>პროდუქტი</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>რაოდენობა</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>ჯამი</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>ფილიალი</th>
                  </>
                )}
                {reportType === "expenses" && (
                  <>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>თარიღი</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>აღწერა</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>კატეგორია</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>თანხა</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>ფილიალი</th>
                  </>
                )}
                {reportType === "inventory" && (
                  <>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>პროდუქტი</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>კატეგორია</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>ნაშთი</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>ფასი</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>სტატუსი</th>
                  </>
                )}
                {reportType === "transfers" && (
                  <>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>თარიღი</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>მარშრუტი</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>პროდუქტები</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>შენიშვნა</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>სტატუსი</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item: any, idx) => (
                  <tr key={idx} className="premium-table-row">
                    {reportType === "sales" && (
                      <>
                        <td className="px-5 py-2.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {new Date(item.createdAt).toLocaleDateString("ka-GE")}
                        </td>
                        <td className="px-5 py-2.5 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.productName}</td>
                        <td className="px-5 py-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.quantity} ცალი</td>
                        <td className="px-5 py-2.5 text-sm font-black" style={{ color: '#ffe0a6' }}>{item.totalAmount.toFixed(2)} ₾</td>
                        <td className="px-5 py-2.5 text-[10px] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {store.branches.find(b => b.id === item.branchId)?.name || "უცნობი"}
                        </td>
                      </>
                    )}
                    {reportType === "expenses" && (
                      <>
                        <td className="px-5 py-2.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.date}</td>
                        <td className="px-5 py-2.5 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.description}</td>
                        <td className="px-5 py-2.5">
                          <span className="badge-blue">{item.category}</span>
                        </td>
                        <td className="px-5 py-2.5 text-sm font-black" style={{ color: '#f87171' }}>-{item.amount.toFixed(2)} ₾</td>
                        <td className="px-5 py-2.5 text-[10px] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {store.branches.find(b => b.id === item.branchId)?.name || "უცნობი"}
                        </td>
                      </>
                    )}
                    {reportType === "inventory" && (
                      <>
                        <td className="px-5 py-2.5 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.name}</td>
                        <td className="px-5 py-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.category}</td>
                        <td className="px-5 py-2.5 text-sm font-black" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.quantity} ერთ.</td>
                        <td className="px-5 py-2.5 text-sm font-bold" style={{ color: '#ffe0a6' }}>{item.salePrice.toFixed(2)} ₾</td>
                        <td className="px-5 py-2.5">
                          {item.quantity < (item.minStockLevel || 5) ? (
                            <span className="badge-red">კრიტიკული</span>
                          ) : (
                            <span className="badge-emerald">ნორმა</span>
                          )}
                        </td>
                      </>
                    )}
                    {reportType === "transfers" && (
                      <>
                        <td className="px-5 py-2.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {new Date(item.createdAt).toLocaleDateString("ka-GE")}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span style={{ color: '#ffe0a6' }}>
                              {store.branches.find(b => b.id === item.fromBranchId)?.name || "?"}
                            </span>
                            <ArrowUpRight className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                            <span style={{ color: '#ffe0a6' }}>
                              {store.branches.find(b => b.id === item.toBranchId)?.name || "?"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {item.items.length} ({item.items.reduce((sum: number, i: any) => sum + i.quantity, 0)} ერთ.)
                        </td>
                        <td className="px-5 py-2.5 text-xs italic truncate max-w-[130px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {item.notes || "-"}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="badge-emerald">{item.status}</span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-16" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    <TableIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">მონაცემები არ არის</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
