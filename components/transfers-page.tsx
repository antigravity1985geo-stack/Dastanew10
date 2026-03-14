"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  ArrowLeftRight,
  ArrowRight,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import { useWarehouseStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useHeaderSetup } from "@/lib/header-store";

export function TransfersPage() {
  const store = useWarehouseStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fromBranchId: "",
    toBranchId: "",
    items: [{ productId: "", quantity: 0 }],
    notes: "",
  });

  useHeaderSetup(
    "შიდა გადაზიდვა",
    <Button
      size="sm"
      className="gap-2 font-bold h-9 rounded-xl shadow-lg shadow-primary/20"
      onClick={() => {
        setFormData({ 
          fromBranchId: store.currentBranchId || "", 
          toBranchId: "", 
          items: [{ productId: "", quantity: 0 }],
          notes: ""
        });
        setIsAddDialogOpen(true);
      }}
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">ახალი გადაზიდვა</span>
    </Button>
  );

  const handleAddTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromBranchId || !formData.toBranchId || formData.fromBranchId === formData.toBranchId) {
      toast.error("გთხოვთ სწორად შეარჩიოთ ფილიალები");
      return;
    }
    
    if (formData.items.some(i => !i.productId || i.quantity <= 0)) {
      toast.error("გთხოვთ სწორად მიუთითოთ პროდუქტები და რაოდენობა");
      return;
    }

    setIsSubmitting(true);
    try {
      await store.transferStock(formData);
      toast.success("გადაზიდვა წარმატებით შესრულდა");
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "შეცდომა გადაზიდვისას");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 0 }]
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const filteredTransfers = store.stockTransfers.filter(t => {
    const fromName = store.branches.find(b => b.id === t.fromBranchId)?.name.toLowerCase() || "";
    const toName = store.branches.find(b => b.id === t.toBranchId)?.name.toLowerCase() || "";
    const q = searchQuery.toLowerCase();
    return fromName.includes(q) || toName.includes(q) || (t.notes && t.notes.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="შიდა გადაზიდვა"
        description="საქონლის მოძრაობა ფილიალებს შორის"
        hideActions
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ძებნა..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-none bg-muted/30 rounded-xl"
          />
        </div>
      </div>

      <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">თარიღი</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">მარშრუტი</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">რაოდენობა</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">სტატუსი</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-6">მოქმედება</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.length > 0 ? (
                filteredTransfers.map((transfer) => {
                  const fromBranch = store.branches.find(b => b.id === transfer.fromBranchId);
                  const toBranch = store.branches.find(b => b.id === transfer.toBranchId);
                  const totalItems = transfer.items.reduce((sum, i) => sum + i.quantity, 0);

                  return (
                    <TableRow key={transfer.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">
                            {new Date(transfer.createdAt).toLocaleDateString("ka-GE")}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {new Date(transfer.createdAt).toLocaleTimeString("ka-GE", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-primary">{fromBranch?.name || "უცნობი"}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-primary">{toBranch?.name || "უცნობი"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-sm">{totalItems} ერთ.</span>
                      </TableCell>
                      <TableCell>
                        {transfer.status === "completed" ? (
                          <span className="inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-tight bg-green-50 text-green-700 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            დასრულებული
                          </span>
                        ) : transfer.status === "cancelled" ? (
                          <span className="inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-tight bg-red-50 text-red-700 gap-1">
                            <XCircle className="h-3 w-3" />
                            გაუქმებული
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-tight bg-yellow-50 text-yellow-700 gap-1">
                            <Clock className="h-3 w-3" />
                            პროცესში
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-20 text-muted-foreground"
                  >
                    <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-10" />
                    <p className="font-medium">გადაზიდვები არ მოიძებნა</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Transfer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
          <form onSubmit={handleAddTransfer}>
            <div className="p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ArrowLeftRight className="h-5 w-5 text-primary" />
                  </div>
                  ახალი გადაზიდვა
                </DialogTitle>
                <DialogDescription className="text-base font-medium">
                  გადაიტანეთ მარაგი ფილიალებს შორის
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-2xl border border-border/50">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">საიდან (წყარო)</Label>
                  <Select 
                    value={formData.fromBranchId} 
                    onValueChange={(val) => setFormData({ ...formData, fromBranchId: val })}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-background border-border/50 font-bold">
                      <SelectValue placeholder="აირჩიეთ ფილიალი" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {store.branches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right flex flex-col items-end">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">სად (დანიშნულება)</Label>
                   <Select 
                    value={formData.toBranchId} 
                    onValueChange={(val) => setFormData({ ...formData, toBranchId: val })}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-background border-border/50 font-bold">
                      <SelectValue placeholder="აირჩიეთ ფილიალი" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {store.branches.map(b => (
                        <SelectItem key={b.id} value={b.id} disabled={b.id === formData.fromBranchId}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary/70">პროდუქტები</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addItem}
                    className="h-8 rounded-lg font-bold text-[10px] uppercase gap-2 border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <Plus className="h-3 w-3" />
                    დამატება
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end group animate-in slide-in-from-right-2 fade-in duration-300">
                      <div className="flex-1 space-y-2">
                        <Select
                          value={item.productId}
                          onValueChange={(val) => updateItem(index, "productId", val)}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none font-medium text-sm">
                            <SelectValue placeholder="აირჩიეთ პროდუქტი" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl max-h-[300px]">
                            {store.products.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex flex-col">
                                  <span className="font-bold">{p.name}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase italic font-medium">ნაშთი: {p.quantity} ერთ.</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24 space-y-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                          placeholder="0"
                          className="h-12 rounded-xl bg-muted/30 border-none font-black text-center"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">შენიშვნა</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="მაგ: მარაგი ივსება გლდანის ფილიალისთვის"
                  className="h-12 rounded-xl bg-muted/30 border-none font-medium"
                />
              </div>
            </div>

            <div className="p-6 bg-muted/30 border-t border-border/50">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 text-base"
              >
                {isSubmitting ? "სრულდება..." : "გადაზიდვის დასრულება"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
