"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  ArrowLeftRight,
  ArrowRight,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useWarehouseStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useHeaderSetup } from "@/lib/header-store";
import { useLanguage } from "@/lib/language-context";

export function TransfersPage() {
  const store = useWarehouseStore();
  const { t } = useLanguage();
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
    t("pages.transfers.title"),
    <button
      className="premium-btn flex items-center gap-1.5 h-8 px-3"
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
      <Plus className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{t("pages.transfers.newTransfer")}</span>
    </button>
  );

  const handleAddTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromBranchId || !formData.toBranchId || formData.fromBranchId === formData.toBranchId) {
      toast.error(t("pages.transfers.branchError"));
      return;
    }
    
    if (formData.items.some(i => !i.productId || i.quantity <= 0)) {
      toast.error(t("pages.transfers.productError"));
      return;
    }

    setIsSubmitting(true);
    try {
      const transferItems = formData.items.map(item => {
        const product = store.products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productName: product?.name || "უცნობი",
          quantity: item.quantity
        };
      });

      await store.transferStock({
        fromBranchId: formData.fromBranchId,
        toBranchId: formData.toBranchId,
        items: transferItems,
        notes: formData.notes,
        employeeId: store.currentEmployee?.id
      });
      
      toast.success(t("pages.transfers.success"));
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
    <div className="space-y-5 animate-in fade-in duration-500">
      <PageHeader
        title="შიდა გადაზიდვა"
        description="საქონლის მოძრაობა ფილიალებს შორის"
        hideActions
      />

      {/* Search */}
      <div className="premium-glass p-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <input
            placeholder="ძებნა..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="premium-search w-full h-9 pl-9 pr-4 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="premium-glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="premium-table-header">
              <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>თარიღი</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>მარშრუტი</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3 hidden sm:table-cell" style={{ color: 'rgba(255,224,166,0.5)' }}>რაოდენობა</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>სტატუსი</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransfers.length > 0 ? (
              filteredTransfers.map((transfer) => {
                const fromBranch = store.branches.find(b => b.id === transfer.fromBranchId);
                const toBranch = store.branches.find(b => b.id === transfer.toBranchId);
                const totalItems = transfer.items.reduce((sum, i) => sum + i.quantity, 0);

                return (
                  <tr key={transfer.id} className="premium-table-row">
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                          {new Date(transfer.createdAt).toLocaleDateString("ka-GE")}
                        </span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {new Date(transfer.createdAt).toLocaleTimeString("ka-GE", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium" style={{ color: '#ffe0a6' }}>{fromBranch?.name || "?"}</span>
                        <ArrowRight className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                        <span className="font-medium" style={{ color: '#ffe0a6' }}>{toBranch?.name || "?"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{totalItems} ერთ.</span>
                    </td>
                    <td className="px-5 py-3">
                      {transfer.status === "completed" ? (
                        <span className="badge-emerald">
                          <CheckCircle2 className="h-3 w-3" />
                          დასრულებული
                        </span>
                      ) : transfer.status === "cancelled" ? (
                        <span className="badge-red">
                          <XCircle className="h-3 w-3" />
                          გაუქმებული
                        </span>
                      ) : (
                        <span className="badge-amber">
                          <Clock className="h-3 w-3" />
                          პროცესში
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-16" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">გადაზიდვები არ მოიძებნა</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transfer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 border-none" style={{ background: '#141414' }}>
          <form onSubmit={handleAddTransfer}>
            <div className="p-5 space-y-5">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,224,166,0.1)' }}>
                    <ArrowLeftRight className="h-4 w-4" style={{ color: '#ffe0a6' }} />
                  </div>
                  ახალი გადაზიდვა
                </DialogTitle>
                <DialogDescription style={{ color: 'rgba(255,255,255,0.3)' }}>
                  გადაიტანეთ მარაგი ფილიალებს შორის
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,224,166,0.5)' }}>საიდან</Label>
                  <Select 
                    value={formData.fromBranchId} 
                    onValueChange={(val) => setFormData({ ...formData, fromBranchId: val })}
                  >
                    <SelectTrigger className="h-10 rounded-lg border-none font-bold text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' }}>
                      <SelectValue placeholder="ფილიალი" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-none shadow-2xl" style={{ background: '#1a1a1a' }}>
                      {store.branches.map(b => (
                        <SelectItem key={b.id} value={b.id} className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,224,166,0.5)' }}>სად</Label>
                   <Select 
                    value={formData.toBranchId} 
                    onValueChange={(val) => setFormData({ ...formData, toBranchId: val })}
                  >
                    <SelectTrigger className="h-10 rounded-lg border-none font-bold text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' }}>
                      <SelectValue placeholder="ფილიალი" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-none shadow-2xl" style={{ background: '#1a1a1a' }}>
                      {store.branches.map(b => (
                        <SelectItem key={b.id} value={b.id} disabled={b.id === formData.fromBranchId} className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,224,166,0.5)' }}>პროდუქტები</h3>
                  <button 
                    type="button" 
                    onClick={addItem}
                    className="premium-btn h-7 px-2.5 text-[10px] flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    დამატება
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end group animate-in fade-in duration-200">
                      <div className="flex-1">
                        <Select
                          value={item.productId}
                          onValueChange={(val) => updateItem(index, "productId", val)}
                        >
                          <SelectTrigger className="h-10 rounded-lg border-none font-medium text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' }}>
                            <SelectValue placeholder="პროდუქტი" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-none shadow-2xl max-h-[250px]" style={{ background: '#1a1a1a' }}>
                            {store.products.map(p => (
                              <SelectItem key={p.id} value={p.id} className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                {p.name} ({p.quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                          placeholder="0"
                          className="premium-search w-full h-10 px-2 text-sm text-center rounded-lg"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(239,68,68,0.05)' }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,224,166,0.5)' }}>შენიშვნა</Label>
                <input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="მაგ: მარაგი ივსება გლდანის ფილიალისთვის"
                  className="premium-search w-full h-10 px-3 text-sm rounded-lg"
                />
              </div>
            </div>

            <div className="p-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="premium-btn w-full h-11 text-xs tracking-[0.15em]"
              >
                {isSubmitting ? "სრულდება..." : "გადაზიდვის დასრულება"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
