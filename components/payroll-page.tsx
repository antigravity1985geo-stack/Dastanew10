"use client";

import { useState } from "react";
import {
  Wallet,
  Users,
  Calendar,
  CreditCard,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  History,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useWarehouseStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import { useHeaderSetup } from "@/lib/header-store";

export function PayrollPage() {
  const store = useWarehouseStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentData, setPaymentData] = useState({
    employeeId: "",
    amount: 0,
    paymentMethod: "cash" as "cash" | "bank",
    paymentDate: new Date().toISOString().split("T")[0],
    periodStart: new Date().toISOString().split("T")[0],
    periodEnd: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useHeaderSetup(
    "ხელფასები",
    <Button
      size="sm"
      className="gap-2 font-bold h-9 rounded-xl shadow-lg shadow-primary/20"
      onClick={() => setIsPaymentDialogOpen(true)}
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">ხელფასის გაცემა</span>
    </Button>
  );

  const filteredPayments = store.payrollPayments.filter(
    (p) =>
      p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPaid = store.payrollPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthlyBudget = store.employees.reduce((sum, e) => sum + (e.baseSalary || 0), 0);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.employeeId || paymentData.amount <= 0) {
      toast.error("გთხოვთ შეავსოთ ყველა აუცილებელი ველი");
      return;
    }

    const employee = store.employees.find((emp) => emp.id === paymentData.employeeId);
    if (!employee) return;

    setIsSubmitting(true);
    try {
      await store.processSalaryPayment({
        employeeId: employee.id,
        employeeName: employee.name,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate,
        periodStart: paymentData.periodStart,
        periodEnd: paymentData.periodEnd,
        notes: paymentData.notes,
      });
      setIsPaymentDialogOpen(false);
      setPaymentData({
        employeeId: "",
        amount: 0,
        paymentMethod: "cash",
        paymentDate: new Date().toISOString().split("T")[0],
        periodStart: new Date().toISOString().split("T")[0],
        periodEnd: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeChange = (id: string) => {
    const employee = store.employees.find((e) => e.id === id);
    if (employee) {
      setPaymentData({
        ...paymentData,
        employeeId: id,
        amount: employee.baseSalary || 0,
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="ხელფასების მართვა"
        description="თანამშრომელთა ანაზღაურება და საბუღალტრო აღრიცხვა"
        hideActions
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl rounded-3xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Wallet className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              გაცემული ხელფასები
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black mb-1">{totalPaid.toLocaleString()} ₾</div>
            <p className="text-xs opacity-70 font-medium tracking-wide">ჯამური დანახარჯი</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl rounded-3xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Users className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              ყოველთვიური ბიუჯეტი
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black mb-1">{monthlyBudget.toLocaleString()} ₾</div>
            <p className="text-xs opacity-70 font-medium tracking-wide">ფიქსირებული განაკვეთი</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-none shadow-xl rounded-3xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <CreditCard className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              გაუცემელი (მიმდინარე)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black mb-1">{(monthlyBudget - totalPaid > 0 ? monthlyBudget - totalPaid : 0).toLocaleString()} ₾</div>
            <p className="text-xs opacity-70 font-medium tracking-wide">სავარაუდო ნაშთი</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ძებნა (თანამშრომელი, შენიშვნა...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-none bg-muted/30 rounded-xl font-medium"
          />
        </div>

        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl">
            <form onSubmit={handleProcessPayment}>
              <DialogHeader>
                <DialogTitle className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  ხელფასის გაცემა
                </DialogTitle>
                <DialogDescription className="font-medium tracking-tight">
                  შეავსეთ მონაცემები ხელფასის დასადასტურებლად
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">თანამშრომელი *</Label>
                  <Select
                    value={paymentData.employeeId}
                    onValueChange={handleEmployeeChange}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none font-bold">
                      <SelectValue placeholder="აირჩიეთ თანამშრომელი" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {store.employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="font-bold">
                          {emp.name} ({emp.position}) - {emp.baseSalary} ₾
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">თანხა *</Label>
                    <Input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                      className="h-12 rounded-xl bg-muted/30 border-none font-black text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">მეთოდი</Label>
                    <Select
                      value={paymentData.paymentMethod}
                      onValueChange={(val: any) => setPaymentData({ ...paymentData, paymentMethod: val })}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="cash">ნაღდი (სალარო)</SelectItem>
                        <SelectItem value="bank">უნაღდო (ბანკი)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">პერიოდი (დან)</Label>
                    <Input
                      type="date"
                      value={paymentData.periodStart}
                      onChange={(e) => setPaymentData({ ...paymentData, periodStart: e.target.value })}
                      className="h-12 rounded-xl bg-muted/30 border-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">პერიოდი (მდე)</Label>
                    <Input
                      type="date"
                      value={paymentData.periodEnd}
                      onChange={(e) => setPaymentData({ ...paymentData, periodEnd: e.target.value })}
                      className="h-12 rounded-xl bg-muted/30 border-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">შენიშვნა</Label>
                  <Input
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder="მაგ: ბონუსი, პრემია..."
                    className="h-12 rounded-xl bg-muted/30 border-none font-medium"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-base shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? "მუშავდება..." : "ანგარიშსწორება"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/50 shadow-xl rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                გადახდების ისტორია
              </CardTitle>
              <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2">
                <FileText className="h-4 w-4" />
                ექსპორტი
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">თანამშრომელი</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">პერიოდი</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-right">თანხა</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">მეთოდი</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-right">თარიღი</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => (
                    <TableRow key={p.id} className="group hover:bg-muted/40 transition-all duration-300 border-border/50">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-black text-sm">{p.employeeName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">{p.notes || "ხელფასი"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground">
                            {p.periodStart ? format(new Date(p.periodStart), "dd MMM", { locale: ka }) : "—"} - {p.periodEnd ? format(new Date(p.periodEnd), "dd MMM", { locale: ka }) : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <span className="font-black text-base text-emerald-600">
                          {p.amount.toLocaleString()} ₾
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          p.paymentMethod === 'cash' 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' 
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                        }`}>
                          {p.paymentMethod === 'cash' ? 'ნაღდი' : 'ბანკი'}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <p className="text-xs font-bold text-muted-foreground">
                          {p.createdAt ? format(new Date(p.createdAt), "dd.MM.yyyy") : "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground opacity-60">
                          {p.createdAt ? format(new Date(p.createdAt), "HH:mm") : ""}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-5" />
                      <p className="font-bold text-lg opacity-40 uppercase tracking-widest">ისტორია ცარიელია</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Employee Summary */}
        <Card className="border-border/50 shadow-xl rounded-3xl h-fit sticky top-24 overflow-hidden">
          <CardHeader className="bg-muted/20 pb-4">
            <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-emerald-500" />
              თანამშრომლების ნუსხა
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {store.employees.map((emp) => (
                <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black leading-tight">{emp.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase leading-tight">{emp.position}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-indigo-600">{emp.baseSalary} ₾</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{emp.salaryType === 'monthly' ? 'თვე' : emp.salaryType === 'daily' ? 'დღე' : 'სთ'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
