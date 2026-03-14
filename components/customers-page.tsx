"use client";

import { useState, useMemo } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Award, 
  TrendingUp, 
  Wallet, 
  Pencil, 
  Trash2, 
  MoreVertical,
  History,
  ArrowRight
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CustomersPage() {
  const store = useWarehouseStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    balance: 0,
    loyaltyPoints: 0
  });

  const filteredCustomers = useMemo(() => {
    return store.customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [store.customers, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("გთხოვთ მიუთითოთ სახელი");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && selectedCustomer) {
        await store.updateCustomer(selectedCustomer.id, formData);
        toast.success("კლიენტის მონაცემები განახლდა");
      } else {
        await store.addCustomer(formData);
        toast.success("კლიენტი წარმატებით დაემატა");
      }
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "შეცდომა ოპერაციისას");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      balance: customer.balance,
      loyaltyPoints: customer.loyaltyPoints
    });
    setIsEditing(true);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ნამდვილად გსურთ კლიენტის წაშლა?")) return;
    try {
      await store.deleteCustomer(id);
      toast.success("კლიენტი წაიშალა");
    } catch (error: any) {
      toast.error(error.message || "შეცდომა წაშლისას");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", phone: "", email: "", balance: 0, loyaltyPoints: 0 });
    setSelectedCustomer(null);
    setIsEditing(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="კლიენტების ბაზა" 
        description="მართეთ თქვენი ერთგული მომხმარებლები და მათი ბალანსი"
        hideActions
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group transition-all duration-500 hover:scale-[1.02]">
           <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">სულ კლიენტი</p>
                <p className="text-3xl font-black">{store.customers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Users className="h-6 w-6" />
              </div>
              <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-500" />
           </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group transition-all duration-500 hover:scale-[1.02]">
           <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">ჯამური ქულები</p>
                <p className="text-3xl font-black">
                  {store.customers.reduce((sum, c) => sum + c.loyaltyPoints, 0).toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Award className="h-6 w-6" />
              </div>
              <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-500" />
           </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white overflow-hidden relative group transition-all duration-500 hover:scale-[1.02]">
           <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">ჯამური ნისია</p>
                <p className="text-3xl font-black">
                  {store.customers.reduce((sum, c) => sum + c.balance, 0).toFixed(2)} ₾
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-500" />
           </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-2xl border border-border/50 shadow-sm transition-all hover:shadow-md">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ძებნა (სახელი, ტელეფონი...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-none bg-muted/30 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>
          <Button 
            className="h-11 rounded-xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
            onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
          >
            <Plus className="h-4 w-4" />
            კლიენტის დამატება
          </Button>
        </div>

        <Card className="border-border/50 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-md bg-card/80">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6 py-4">კლიენტი</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">კონტაქტი</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">ლოიალობა</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">ბალანსი</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-6">მოქმედება</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="group hover:bg-primary/5 transition-all duration-300 border-border/50">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-lg">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm leading-tight">{customer.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase mt-0.5">ID: {customer.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {customer.phone && (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/70 lowercase">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <Award className="h-4 w-4 text-emerald-500" />
                             <span className="font-black text-sm">{customer.loyaltyPoints}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-tight",
                            customer.balance > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                             {customer.balance.toFixed(2)} ₾
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-primary/10">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[160px]">
                              <DropdownMenuItem 
                                className="rounded-xl font-bold text-xs gap-2 py-2.5 cursor-pointer"
                                onClick={() => handleEdit(customer)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                რედაქტირება
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl font-bold text-xs gap-2 py-2.5 cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-50">
                                <History className="h-3.5 w-3.5" />
                                ისტორია
                              </DropdownMenuItem>
                              <div className="h-px bg-muted my-1" />
                              <DropdownMenuItem 
                                className="rounded-xl font-bold text-xs gap-2 py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => handleDelete(customer.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                წაშლა
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-3 opacity-20">
                           <Users className="h-16 w-16" />
                           <p className="font-bold uppercase tracking-widest text-sm">კლიენტები არ მოიძებნა</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 border-none shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  {isEditing ? "კლიენტის რედაქტირება" : "ახალი კლიენტი"}
                </DialogTitle>
                <DialogDescription className="font-medium text-muted-foreground/70">
                  შეიყვანეთ კლიენტის საკონტაქტო მონაცემები
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">სახელი და გვარი</Label>
                   <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="მაგ: გიორგი ბერიძე"
                    className="h-12 border-none bg-muted/30 rounded-xl font-bold focus-visible:ring-1 focus-visible:ring-primary/20"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">ტელეფონი</Label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="5xx xxx xxx"
                      className="h-12 border-none bg-muted/30 rounded-xl font-bold focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">ელ-ფოსტა</Label>
                    <Input 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="mail@example.com"
                      className="h-12 border-none bg-muted/30 rounded-xl font-bold focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">ლოიალობის ქულები</Label>
                      <Input 
                        type="number"
                        value={formData.loyaltyPoints}
                        onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })}
                        className="h-12 border-none bg-muted/30 rounded-xl font-black text-emerald-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">ბალანსი (ნისია)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                        className="h-12 border-none bg-muted/30 rounded-xl font-black text-red-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-muted/20 border-t border-border/50">
               <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 text-base"
                disabled={isSubmitting}
               >
                 {isSubmitting ? "სრულდება..." : isEditing ? "ცვლილების შენახვა" : "დამატება და შენახვა"}
               </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
