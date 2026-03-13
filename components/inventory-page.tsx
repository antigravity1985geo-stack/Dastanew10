"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useWarehouseStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardCheck, Play, Save, XCircle, Search, ScanBarcode, ArrowRightCircle, Plus, Minus, History } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function InventoryPage() {
  const store = useWarehouseStore();
  const [mounted, setMounted] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionNotes, setNewSessionNotes] = useState("");

  useEffect(() => {
    setMounted(true);
    // Find active session
    const active = store.inventorySessions.find(s => s.status === 'active');
    if (active) setActiveSessionId(active.id);
  }, [store.inventorySessions]);

  const handleStartSession = async () => {
    if (!newSessionName) {
      toast.error("შეიყვანეთ ინვენტარიზაციის სახელი");
      return;
    }
    if (store.inventorySessions.some(s => s.status === 'active')) {
      toast.error("ჯერ დაასრულეთ მიმდინარე ინვენტარიზაცია");
      return;
    }
    
    try {
      const sessionId = await store.startInventorySession(newSessionName, newSessionNotes);
      setActiveSessionId(sessionId);
      setIsCreatingSession(false);
      setNewSessionName("");
      setNewSessionNotes("");
      toast.success("ინვენტარიზაცია დაიწყო");
    } catch (error: any) {
      toast.error(error.message || "შეცდომა სესიის დაწყებისას");
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50/50">
      <div className="flex-none">
        <PageHeader 
          title="ინვენტარიზაცია" 
          description="მარაგების აღწერა და კორექტირება"
          hideActions={!!activeSessionId}
          actions={
            !activeSessionId && (
              <Button onClick={() => setIsCreatingSession(true)} className="gap-2 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold h-10">
                <Play className="h-4 w-4" />
                ახალი აღწერა
              </Button>
            )
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {activeSessionId ? (
          <ActiveInventorySession sessionId={activeSessionId} onClose={() => setActiveSessionId(null)} />
        ) : (
          <InventoryHistory />
        )}
      </div>

      {/* CREATE SESSION DIALOG */}
      <Dialog open={isCreatingSession} onOpenChange={setIsCreatingSession}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">ახალი ინვენტარიზაცია</DialogTitle>
            <DialogDescription>
              ამ პროცესის დაწყებისას დაფიქსირდება ყველა პროდუქტის მიმდინარე ნაშთი.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-muted-foreground tracking-wider">სახელი/პერიოდი</Label>
              <Input
                placeholder="მაგ: მარტის აღწერა..."
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                autoFocus
                className="h-12 border-muted-foreground/20 bg-background rounded-xl font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-muted-foreground tracking-wider">შენიშვნა</Label>
              <Input
                placeholder="დამატებითი დეტალები..."
                value={newSessionNotes}
                onChange={(e) => setNewSessionNotes(e.target.value)}
                className="h-12 border-muted-foreground/20 bg-background rounded-xl font-medium"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreatingSession(false)}
              className="w-full rounded-xl h-12 font-bold"
            >
              გაუქმება
            </Button>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 gap-2"
              onClick={handleStartSession}
            >
              <Play className="h-4 w-4 fill-current" />
              დაწყება
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ACTIVE SESSION COMPONENT
function ActiveInventorySession({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const store = useWarehouseStore();
  const session = store.inventorySessions.find(s => s.id === sessionId);
  const counts = store.inventoryCounts.filter(c => c.sessionId === sessionId);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'discrepancy'
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCounts = useMemo(() => {
    return counts.filter(c => {
      const matchSearch = c.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          store.products.find(p => p.id === c.productId)?.barcode?.includes(searchTerm);
      if (!matchSearch) return false;
      if (activeTab === "discrepancy") return c.variance !== 0;
      return true;
    });
  }, [counts, searchTerm, activeTab, store.products]);

  const handleUpdateCount = async (productId: string, qty: number) => {
    if (qty < 0 || isNaN(qty)) return;
    try {
      await store.submitCount(sessionId, productId, qty);
    } catch (e: any) {
      toast.error(e.message || "რაოდენობის განახლება ვერ მოხერხდა");
    }
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
      const product = store.products.find(p => p.barcode === searchTerm || p.id === searchTerm);
      if (product) {
        const count = counts.find(c => c.productId === product.id);
        if (count) {
          handleUpdateCount(product.id, count.countedQty + 1);
          toast.success(`${product.name} + 1`);
        }
      } else {
        toast.error("პროდუქტი ბარკოდით არ მოიძებნა");
      }
      setSearchTerm(""); // clear scanner
    }
  };

  const handleComplete = async () => {
    try {
      await store.completeInventorySession(sessionId);
      toast.success("ინვენტარიზაცია წარმატებით დასრულდა", { description: "ნაშთები დაკორექტირდა" });
      onClose();
    } catch (e: any) {
      toast.error(e.message || "შეცდომა ინვენტარიზაციის დასრულებისას");
      setIsCompleting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await store.cancelInventorySession(sessionId);
      toast.success("ინვენტარიზაცია გაუქმდა");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "შეცდომა ინვენტარიზაციის გაუქმებისას");
      setIsCancelling(false);
    }
  };

  if (!session) return null;

  const totalExpected = counts.reduce((acc, c) => acc + c.expectedQty, 0);
  const totalCounted = counts.reduce((acc, c) => acc + c.countedQty, 0);
  const itemsWithDiscrepancy = counts.filter(c => c.variance !== 0).length;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Session Header Card */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm rounded-2xl flex-shrink-0 animate-in fade-in slide-in-from-top-4">
        <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">{session.name}</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mt-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                აქტიური აღწერა
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-8 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex flex-col min-w-max">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">სულ ნაშთი (სისტემა / რეალური)</span>
              <span className="text-2xl font-black text-slate-800 flex items-baseline gap-2">
                <span className="text-muted-foreground/50 text-xl">{totalExpected}</span>
                <span className="text-primary">/</span>
                {totalCounted}
              </span>
            </div>
            <div className="h-10 w-px bg-border/50 shrink-0" />
            <div className="flex flex-col min-w-max">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ცდომილება (პროდუქცია)</span>
              <span className={cn(
                "text-2xl font-black",
                itemsWithDiscrepancy > 0 ? "text-rose-500" : "text-emerald-500"
              )}>
                {itemsWithDiscrepancy}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
            <Button variant="outline" className="w-full md:w-auto border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl" onClick={() => setIsCancelling(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              გაუქმება
            </Button>
            <Button className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20" onClick={() => setIsCompleting(true)}>
              <Save className="h-4 w-4 mr-2" />
              დასრულება
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Count Area */}
      <Card className="flex-1 border-border/50 shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-10 bg-background border rounded-xl overflow-hidden p-1">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs">
                ყველა პროდუქტი
              </TabsTrigger>
              <TabsTrigger value="discrepancy" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs">
                ცდომილებით ({itemsWithDiscrepancy})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full sm:max-w-xs">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="ძებნა / ბარკოდის სკანერი (Enter)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleBarcodeScan}
              className="pl-9 h-10 border-muted-foreground/20 rounded-xl bg-white"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <Table>
            <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">დასახელება</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center hidden md:table-cell">ბარკოდი</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right w-24">სისტემაში</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary text-center w-40">რეალური ნაშთი</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right w-24">სხვაობა</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <Search className="h-8 w-8 mb-2" />
                      <span className="font-bold text-sm uppercase tracking-widest">ვერ მოიძებნა</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCounts.map(count => {
                  const varianceIsNegative = count.variance < 0;
                  const varianceIsPositive = count.variance > 0;
                  return (
                    <TableRow key={count.id} className={cn(
                      "transition-colors",
                      count.variance !== 0 ? "bg-rose-50/30 hover:bg-rose-50/50" : "hover:bg-muted/20"
                    )}>
                      <TableCell>
                        <span className="font-bold text-sm text-foreground">{count.productName}</span>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground hidden md:table-cell">
                        {store.products.find(p => p.id === count.productId)?.barcode || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-black text-slate-400">{count.expectedQty}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5 focus-within:ring-2 focus-within:ring-primary/20 rounded-xl p-1 relative">
                          <Button
                            variant="outline"
                            size="icon"
                            tabIndex={-1}
                            className="h-8 w-8 shrink-0 rounded-lg border-primary/20 hover:bg-primary hover:text-white"
                            onClick={() => handleUpdateCount(count.productId, count.countedQty - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input 
                            type="number" 
                            value={count.countedQty}
                            onChange={(e) => handleUpdateCount(count.productId, parseInt(e.target.value) || 0)}
                            className="h-10 w-20 text-center font-black text-lg border-2 border-primary/20 focus-visible:ring-0 focus-visible:border-primary px-0 rounded-xl"
                            onFocus={(e) => e.target.select()}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            tabIndex={-1}
                            className="h-8 w-8 shrink-0 rounded-lg border-primary/20 hover:bg-primary hover:text-white"
                            onClick={() => handleUpdateCount(count.productId, count.countedQty + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={cn(
                          "inline-flex items-center justify-end font-black text-sm",
                          varianceIsNegative ? "text-rose-500" : varianceIsPositive ? "text-emerald-500" : "text-slate-300"
                        )}>
                          {varianceIsPositive && "+"}
                          {count.variance}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Completion Dialog */}
      <Dialog open={isCompleting} onOpenChange={setIsCompleting}>
        <DialogContent className="sm:max-w-md rounded-2xl border-emerald-500/20">
          <DialogHeader>
            <DialogTitle className="font-black text-xl flex items-center gap-2">
              <ClipboardCheck className="text-emerald-500 h-5 w-5" />
              ინვენტარიზაციის დასრულება
            </DialogTitle>
            <DialogDescription>
              ამ მოქმედებით საწყობის მიმდინარე ნაშთები ჩანაცვლდება თქვენ მიერ აღწერილი რაოდენობებით. სხვაობა (დანაკლისი/ზედმეტობა) აისახება ბუღალტერიაში.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-muted-foreground border-dashed border-b pb-2">
              <span>სულ შემოწმდა:</span>
              <span className="text-foreground">{counts.length} პროდუქტი</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
              <span>ცდომილება აღმოჩნდა:</span>
              <span className={cn(
                "text-lg font-black",
                itemsWithDiscrepancy > 0 ? "text-rose-500" : "text-emerald-500"
              )}>
                {itemsWithDiscrepancy}
              </span>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={() => setIsCompleting(false)}>უკან</Button>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl font-black gap-2" onClick={handleComplete}>
              <Save className="h-4 w-4" />
              დადასტურება
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelling} onOpenChange={setIsCancelling}>
        <DialogContent className="sm:max-w-md rounded-2xl border-rose-500/20">
          <DialogHeader>
            <DialogTitle className="font-black text-xl text-rose-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              სესიის გაუქმება
            </DialogTitle>
            <DialogDescription>
              დარწმუნებული ხართ? აღწერილი მონაცემები დაიკარგება და ნაშთები დარჩება უცვლელი.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={() => setIsCancelling(false)}>არა</Button>
            <Button variant="destructive" className="w-full h-12 rounded-xl font-black" onClick={handleCancel}>დიახ, დახურვა</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// HISTORY COMPONENT
function InventoryHistory() {
  const store = useWarehouseStore();
  const history = store.inventorySessions.filter(s => s.status !== 'active');

  if (history.length === 0) {
    return (
      <Card className="h-full border-border/50 border-dashed bg-transparent shadow-none flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground opacity-50">
          <History className="h-16 w-16 mb-4 opacity-20" />
          <p className="font-bold text-lg">ისტორია ცარიელია</p>
          <p className="text-sm mt-1">ჯერ არცერთი ინვენტარიზაცია არ ჩატარებულა</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-[200px]">თარიღი</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">დასახელება</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">სტატუსი</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ავტორი</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">ქმედება</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((s) => (
              <TableRow key={s.id} className="hover:bg-muted/20 cursor-pointer group transition-colors">
                <TableCell className="font-medium text-sm">
                  {new Date(s.startedAt).toLocaleString("ka-GE", {
                    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </TableCell>
                <TableCell>
                  <p className="font-bold text-foreground">{s.name}</p>
                  {s.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{s.notes}</p>}
                </TableCell>
                <TableCell>
                  {s.status === 'completed' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">
                      დასრულებული
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                      გაუქმებული
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground font-medium text-xs">
                  {s.employeeName || "ადმინისტრატორი"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    დეტალები
                    <ArrowRightCircle className="h-4 w-4 ml-2" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
