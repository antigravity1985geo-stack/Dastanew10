"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Building2,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useHeaderSetup } from "@/lib/header-store";

export function BranchesPage() {
  const store = useWarehouseStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    isMain: false,
  });

  useHeaderSetup(
    "ფილიალები",
    <button
      className="premium-btn flex items-center gap-1.5 h-8 px-3"
      onClick={() => {
        setFormData({ name: "", location: "", isMain: false });
        setIsAddDialogOpen(true);
      }}
    >
      <Plus className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">დამატება</span>
    </button>
  );

  const filteredBranches = store.branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.location && b.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("შეიყვანეთ ფილიალის სახელი");
      return;
    }

    setIsSubmitting(true);
    try {
      await store.addBranch(formData);
      toast.success("ფილიალი დაემატა");
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Add branch failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    setIsSubmitting(true);
    try {
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error("შეცდომა განახლებისას");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (branch: any) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location || "",
      isMain: branch.isMain || false,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <PageHeader
        title="ფილიალები"
        description="მართეთ თქვენი მაღაზიები და საწყობები"
        hideActions
      />

      {/* Search Bar */}
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
              <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>დასახელება</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3 hidden sm:table-cell" style={{ color: 'rgba(255,224,166,0.5)' }}>მდებარეობა</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>სტატუსი</th>
              <th className="text-right text-[10px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: 'rgba(255,224,166,0.5)' }}>მოქმედება</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.length > 0 ? (
              filteredBranches.map((branch) => (
                <tr key={branch.id} className="premium-table-row">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,224,166,0.08)', border: '1px solid rgba(255,224,166,0.12)' }}>
                        <Building2 className="h-3.5 w-3.5" style={{ color: '#ffe0a6' }} />
                      </div>
                      <span className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{branch.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <MapPin className="h-3 w-3" />
                      <span>{branch.location || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {branch.isMain ? (
                      <span className="badge-emerald">
                        <CheckCircle2 className="h-3 w-3" />
                        მთავარი
                      </span>
                    ) : (
                      <span className="badge-blue">
                        <AlertCircle className="h-3 w-3" />
                        ფილიალი
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-lg border-none shadow-2xl" style={{ background: '#1a1a1a' }}>
                        <DropdownMenuItem onClick={() => openEdit(branch)} className="gap-2 text-xs cursor-pointer" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          <Pencil className="h-3.5 w-3.5" />
                          რედაქტირება
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 text-xs cursor-pointer text-red-400 focus:text-red-400"
                          onClick={() => {
                            toast.info("წაშლის ფუნქცია მალე დაემატება");
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          წაშლა
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-16" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">ფილიალები არ მოიძებნა</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl border-none" style={{ background: '#141414' }}>
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <Plus className="h-4 w-4" style={{ color: '#ffe0a6' }} />
                ახალი ფილიალი
              </DialogTitle>
              <DialogDescription style={{ color: 'rgba(255,255,255,0.35)' }}>
                შეიყვანეთ ფილიალის მონაცემები
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,224,166,0.5)' }}>დასახელება *</Label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="მაგ: გლდანის ფილიალი"
                  className="premium-search w-full h-10 px-3 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,224,166,0.5)' }}>მდებარეობა</Label>
                <input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="მაგ: ხიზანიშვილის 5"
                  className="premium-search w-full h-10 px-3 text-sm rounded-lg"
                />
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox 
                  id="isMain" 
                  checked={formData.isMain}
                  onCheckedChange={(checked) => setFormData({ ...formData, isMain: !!checked })}
                  className="rounded border-white/10 data-[state=checked]:bg-primary"
                />
                <Label 
                  htmlFor="isMain"
                  className="text-xs font-medium cursor-pointer" style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  მთავარი ფილიალი
                </Label>
              </div>
            </div>
            <DialogFooter>
              <button type="submit" disabled={isSubmitting} className="premium-btn w-full h-10 text-xs">
                {isSubmitting ? "ინახება..." : "შენახვა"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
