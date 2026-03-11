"use client";

import { useState, useMemo } from "react";
import { 
  Wallet, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Trash2, 
  Calendar,
  Filter,
  Users,
  Home,
  Zap,
  MoreHorizontal,
  Search,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useWarehouseStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const EXPENSE_CATEGORIES = [
  "ხელფასი",
  "ქირა",
  "კომუნალური",
  "მარკეტინგი",
  "სატრანსპორტო",
  "საკანცელარიო",
  "სხვა"
];

export function ExpensesPage() {
  const store = useWarehouseStore();
  const [activeTab, setActiveTab] = useState("general");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [form, setForm] = useState({
    amount: "",
    category: "ხელფასი",
    description: "",
    paymentMethod: "cash" as "cash" | "bank",
    date: new Date().toISOString().split('T')[0]
  });

  // Calculate Debts from Purchase History
  const debts = useMemo(() => {
    const suppliers: Record<string, { name: string, total: number, paid: number, items: any[] }> = {};
    
    store.purchaseHistory.forEach(ph => {
      if (!ph.supplier) return;
      
      const total = ph.purchasePrice * ph.quantity;
      const paid = ph.paidInCash + ph.paidInCard;
      const debt = total - paid;
      
      if (!suppliers[ph.supplier]) {
        suppliers[ph.supplier] = { name: ph.supplier, total: 0, paid: 0, items: [] };
      }
      
      suppliers[ph.supplier].total += total;
      suppliers[ph.supplier].paid += paid;
      suppliers[ph.supplier].items.push(ph);
    });
    
    return Object.values(suppliers).filter(s => s.total - s.paid > 0.01);
  }, [store.purchaseHistory]);

  const filteredExpenses = store.expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await store.addExpense({
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
        paymentMethod: form.paymentMethod,
        currency: "GEL",
        exchangeRate: 1,
        date: form.date
      });
      setIsAddOpen(false);
      setForm({
        amount: "",
        category: "ხელფასი",
        description: "",
        paymentMethod: "cash",
        date: new Date().toISOString().split('T')[0]
      });
      toast.success("ხარჯი დამატებულია");
    } catch (error) {
      toast.error("შეცდომა ხარჯის დამატებისას");
    }
  };

  const totalMonthlyExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return store.expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [store.expenses]);

  const totalDebt = debts.reduce((sum, d) => sum + (d.total - d.paid), 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <PageHeader 
        title="ხარჯები და ვალები" 
        description="ბიზნესის საოპერაციო ხარჯების და მომწოდებლებთან ანგარიშსწორების მართვა"
      >
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:opacity-90 shadow-lg shadow-primary/20 rounded-xl gap-2 h-11 px-6">
              <Plus className="h-4 w-4" />
              ხარჯის დამატება
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">ახალი ხარჯი</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="date">თარიღი</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={form.date} 
                  onChange={e => setForm({...form, date: e.target.value})}
                  required 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">თანხა (₾)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  value={form.amount} 
                  onChange={e => setForm({...form, amount: e.target.value})}
                  placeholder="0.00" 
                  required 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">კატეგორია</Label>
                <select 
                  id="category"
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">გადახდის მეთოდი</Label>
                <select 
                  id="method"
                  value={form.paymentMethod}
                  onChange={e => setForm({...form, paymentMethod: e.target.value as "cash" | "bank"})}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="cash">ნაღდი ფული</option>
                  <option value="bank">ბანკი / გადარიცხვა</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">აღწერა</Label>
                <Input 
                  id="description" 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="მაგ: ოფისის ქირა" 
                  required 
                  className="rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full rounded-xl h-11 font-bold mt-4">
                შენახვა
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/10 dark:to-background overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingDown className="h-12 w-12 text-rose-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-600 uppercase tracking-wider">თვის ხარჯი</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-700">{totalMonthlyExpenses.toFixed(2)} ₾</div>
            <p className="text-xs text-rose-600/60 mt-1">მიმდინარე თვე</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/10 dark:to-background overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="h-12 w-12 text-orange-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wider">ჯამური ვალი</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-700">{totalDebt.toFixed(2)} ₾</div>
            <p className="text-xs text-orange-600/60 mt-1">მომწოდებლებთან</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-background overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="h-12 w-12 text-slate-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wider">აქტიური მომწოდებელი</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-700">{debts.length}</div>
            <p className="text-xs text-slate-600/60 mt-1">დაუფარავი შესყიდვა</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-11">
            <TabsTrigger value="general" className="rounded-lg px-6 h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TrendingDown className="h-4 w-4 mr-2" />
              ზოგადი ხარჯები
            </TabsTrigger>
            <TabsTrigger value="debts" className="rounded-lg px-6 h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="h-4 w-4 mr-2" />
              მომწოდებლების ვალები
            </TabsTrigger>
          </TabsList>

          {activeTab === "general" && (
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="ძებნა..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-all"
              />
            </div>
          )}
        </div>

        <TabsContent value="general">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-xs font-bold uppercase py-4">თარიღი</TableHead>
                  <TableHead className="text-xs font-bold uppercase py-4">კატეგორია</TableHead>
                  <TableHead className="text-xs font-bold uppercase py-4">აღწერა</TableHead>
                  <TableHead className="text-xs font-bold uppercase py-4">მეთოდი</TableHead>
                  <TableHead className="text-xs font-bold uppercase py-4 text-right">თანხა</TableHead>
                  <TableHead className="text-xs font-bold uppercase py-4 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      ხარჯები არ მოიძებნა
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/20 transition-colors border-b border-border/50">
                      <TableCell className="font-medium text-xs">
                        {new Date(expense.date).toLocaleDateString('ka-GE')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 rounded-lg font-bold text-[10px]">
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground/80">{expense.description}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {expense.paymentMethod === 'cash' ? 'ნაღდი' : 'ბანკი'}
                      </TableCell>
                      <TableCell className="text-right font-black text-rose-600">
                        {expense.amount.toFixed(2)} ₾
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600 transition-colors"
                          onClick={() => {
                            if(confirm("დარწმუნებული ხართ?")) {
                              store.deleteExpense(expense.id);
                              toast.info("ხარჯი წაიშალა");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="debts">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-xs font-bold uppercase py-4">მომწოდებელი</TableHead>
                  <TableHead className="text-xs font-bold uppercase py-4 text-right">შესყიდვა</TableHead>
                  <TableHead className="text-xs font-bold uppercase py-4 text-right">გადახდილი</TableHead>
                  <TableHead className="text-xs font-bold uppercase py-4 text-right text-orange-600">დავალიანება</TableHead>
                  <TableHead className="text-xs font-bold uppercase py-4 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      დაუფარავი ვალები არ არის
                    </TableCell>
                  </TableRow>
                ) : (
                  debts.map((debt) => (
                    <TableRow key={debt.name} className="hover:bg-muted/20 transition-colors border-b border-border/50">
                      <TableCell className="font-bold">{debt.name}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{debt.total.toFixed(2)} ₾</TableCell>
                      <TableCell className="text-right text-emerald-600">{debt.paid.toFixed(2)} ₾</TableCell>
                      <TableCell className="text-right font-black text-orange-600">
                        {(debt.total - debt.paid).toFixed(2)} ₾
                      </TableCell>
                      <TableCell>
                         <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white transition-all font-bold gap-2"
                          onClick={() => {
                            const payoffAmount = prompt(`შეიყვანეთ თანხა ${debt.name}-სთვის:`, (debt.total - debt.paid).toFixed(2));
                            if (payoffAmount) {
                              store.payoffDebts(debt.items, parseFloat(payoffAmount), 'cash', 'supplier');
                              toast.success("ვალი დაიფარა");
                            }
                          }}
                        >
                          დაფარვა
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
