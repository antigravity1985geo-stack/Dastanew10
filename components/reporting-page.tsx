"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  FileText, 
  Download, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Calendar,
  Layers,
  Table as TableIcon
} from "lucide-react";
import { useWarehouseStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
        // For inventory, we show current stock
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
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="რეპორტინგი" 
        description="დეტალური მონაცემების ანალიზი და ექსპორტი"
        hideActions
      />

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-6 bg-card rounded-2xl border border-border/50 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">რეპორტის ტიპი</label>
          <Select value={reportType} onValueChange={(val) => setReportType(val as ReportType)}>
            <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="sales">გაყიდვების რეპორტი</SelectItem>
              <SelectItem value="expenses">ხარჯების რეპორტი</SelectItem>
              <SelectItem value="inventory">ინვენტარის ნაშთები</SelectItem>
              <SelectItem value="transfers">გადაზიდვების ისტორია</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ფილიალი</label>
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="all">ყველა ფილიალი</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">პერიოდი</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="7">ბოლო 7 დღე</SelectItem>
              <SelectItem value="30">ბოლო 30 დღე</SelectItem>
              <SelectItem value="90">ბოლო 90 დღე</SelectItem>
              <SelectItem value="365">ბოლო 1 წელი</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ძებნა..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 h-11 rounded-xl bg-muted/30 border-none font-medium"
            />
          </div>
          <Button 
            onClick={exportToCSV}
            className="h-11 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  {reportType === "sales" && (
                    <>
                      <TableHead className="text-[10px] font-black uppercase pl-6">თარიღი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">პროდუქტი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">რაოდენობა</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">ჯამი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase pr-6">ფილიალი</TableHead>
                    </>
                  )}
                  {reportType === "expenses" && (
                    <>
                      <TableHead className="text-[10px] font-black uppercase pl-6">თარიღი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">აღწერა</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">კატეგორია</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">თანხა</TableHead>
                      <TableHead className="text-[10px] font-black uppercase pr-6">ფილიალი</TableHead>
                    </>
                  )}
                  {reportType === "inventory" && (
                    <>
                      <TableHead className="text-[10px] font-black uppercase pl-6">პროდუქტი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">კატეგორია</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">ნაშთი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">ფასი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase pr-6">სტატუსი</TableHead>
                    </>
                  )}
                  {reportType === "transfers" && (
                    <>
                      <TableHead className="text-[10px] font-black uppercase pl-6">თარიღი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">მარშრუტი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">პროდუქტები</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">შენიშვნა</TableHead>
                      <TableHead className="text-[10px] font-black uppercase pr-6">სტატუსი</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item: any, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/10 transition-colors">
                      {reportType === "sales" && (
                        <>
                          <TableCell className="pl-6 font-medium text-sm">
                            {new Date(item.createdAt).toLocaleDateString("ka-GE")}
                          </TableCell>
                          <TableCell className="font-bold text-sm">{item.productName}</TableCell>
                          <TableCell className="text-sm">{item.quantity} ცალი</TableCell>
                          <TableCell className="font-black text-sm">{item.totalAmount.toFixed(2)} ₾</TableCell>
                          <TableCell className="pr-6 text-xs text-muted-foreground uppercase font-bold">
                            {store.branches.find(b => b.id === item.branchId)?.name || "უცნობი"}
                          </TableCell>
                        </>
                      )}
                      {reportType === "expenses" && (
                        <>
                          <TableCell className="pl-6 font-medium text-sm">{item.date}</TableCell>
                          <TableCell className="font-bold text-sm">{item.description}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold bg-muted text-muted-foreground uppercase">
                              {item.category}
                            </span>
                          </TableCell>
                          <TableCell className="font-black text-sm text-red-600">-{item.amount.toFixed(2)} ₾</TableCell>
                          <TableCell className="pr-6 text-xs text-muted-foreground uppercase font-bold">
                            {store.branches.find(b => b.id === item.branchId)?.name || "უცნობი"}
                          </TableCell>
                        </>
                      )}
                      {reportType === "inventory" && (
                        <>
                          <TableCell className="pl-6 font-bold text-sm">{item.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                          <TableCell className="font-black text-sm">{item.quantity} ერთ.</TableCell>
                          <TableCell className="font-bold text-sm">{item.salePrice.toFixed(2)} ₾</TableCell>
                          <TableCell className="pr-6">
                            {item.quantity < (item.minStockLevel || 5) ? (
                              <span className="text-[10px] font-black text-red-600 uppercase">კრიტიკული</span>
                            ) : (
                              <span className="text-[10px] font-black text-green-600 uppercase">ნორმა</span>
                            )}
                          </TableCell>
                        </>
                      )}
                      {reportType === "transfers" && (
                        <>
                          <TableCell className="pl-6 font-medium text-sm">
                            {new Date(item.createdAt).toLocaleDateString("ka-GE")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                              <span className="text-primary">
                                {store.branches.find(b => b.id === item.fromBranchId)?.name || "უცნობი"}
                              </span>
                              <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-primary">
                                {store.branches.find(b => b.id === item.toBranchId)?.name || "უცნობი"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {item.items.length} სახეობა ({item.items.reduce((sum: number, i: any) => sum + i.quantity, 0)} ერთ.)
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground italic truncate max-w-[150px]">
                            {item.notes || "-"}
                          </TableCell>
                          <TableCell className="pr-6">
                            <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                              {item.status}
                            </span>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      <TableIcon className="h-10 w-10 mx-auto mb-3 opacity-10" />
                      <p className="font-medium">მონაცემები არ არის</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
