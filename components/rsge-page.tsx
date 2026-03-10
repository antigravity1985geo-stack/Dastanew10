"use client";

import { useState, useEffect, useCallback } from "react";
import {
    RefreshCcw,
    CheckCircle2,
    XCircle,
    Clock,
    Trash2,
    ShieldCheck,
    AlertTriangle,
    FileText,
    Send,
    Eye,
    Loader2,
    Filter,
    Link2,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { rsgeService, isRSGEConfigured, RSGEWaybillRecord } from "@/lib/rs-ge";
import { cn } from "@/lib/utils";
import { useWarehouseStore } from "@/hooks/use-store";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    "0": { label: "სამუშაო", color: "text-blue-500 bg-blue-50" },
    "1": { label: "გაგზავნილი", color: "text-emerald-500 bg-emerald-50" },
    "2": { label: "დადასტურებული", color: "text-green-600 bg-green-50" },
    "3": { label: "უარყოფილი", color: "text-red-500 bg-red-50" },
    "4": { label: "დახურული", color: "text-gray-500 bg-gray-100" },
};

export function RSGEPage() {
    const store = useWarehouseStore();
    const configured = isRSGEConfigured();
    const [waybills, setWaybills] = useState<RSGEWaybillRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
    });
    const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
    const [filterStatus, setFilterStatus] = useState("");
    const [filterTin, setFilterTin] = useState("");
    const [selected, setSelected] = useState<RSGEWaybillRecord | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Goods Mapping state
    const [showGoodsDialog, setShowGoodsDialog] = useState(false);
    const [currentGoods, setCurrentGoods] = useState<any[]>([]);
    const [goodsLoading, setGoodsLoading] = useState(false);
    const [mappingData, setMappingData] = useState<Record<string, { category: string }>>({});
    const [importing, setImporting] = useState(false);

    // Invoice dialog
    const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
    const [invoiceBuyerTin, setInvoiceBuyerTin] = useState("");
    const [invoiceBuyerName, setInvoiceBuyerName] = useState("");
    const [invoiceItems, setInvoiceItems] = useState([{ name: "", quantity: 1, price: 0 }]);

    const handleViewGoods = async (waybill: RSGEWaybillRecord) => {
        setSelected(waybill);
        setGoodsLoading(true);
        setShowGoodsDialog(true);
        try {
            const res = await rsgeService.getWaybillDetails(waybill.id);
            if (res.success && res.goods) {
                // Auto-match items with existing products
                const mapped = res.goods.map((item: any) => {
                    const match = store.products.find(p =>
                        (p.barcode && p.barcode === item.barcode) ||
                        (p.name && p.name.toLowerCase() === item.name.toLowerCase())
                    );
                    return { ...item, matchId: match?.id, matchName: match?.name };
                });
                setCurrentGoods(mapped);

                // Initialize mapping data with default category
                const mapper: Record<string, { category: string }> = {};
                mapped.forEach((item: any) => {
                    mapper[item.id] = { category: item.matchId ? (store.products.find(p => p.id === item.matchId)?.category || "სხვადასხვა") : "სხვადასხვა" };
                });
                setMappingData(mapper);
            }
        } finally {
            setGoodsLoading(false);
        }
    };

    const handleImportToWarehouse = async () => {
        if (!selected) return;
        setImporting(true);
        try {
            const itemsToImport = currentGoods.map(item => ({
                productId: item.matchId,
                name: item.name,
                quantity: Number(item.quantity) || 0,
                price: Number(item.price) || 0,
                barcode: item.barcode,
                category: mappingData[item.id]?.category || "სხვადასხვა",
                supplier: selected.sellerName || "RS.GE სინქრონიზაცია",
            }));

            await store.importWaybillToWarehouse(itemsToImport);
            setShowGoodsDialog(false);
        } finally {
            setImporting(false);
        }
    };

    const fetchWaybills = useCallback(async () => {
        if (!configured) return;
        setLoading(true);
        try {
            const res = await rsgeService.getWaybills({
                from: fromDate,
                to: toDate,
                status: filterStatus,
                buyerTin: filterTin,
            });
            setWaybills(res.waybills || []);
        } finally {
            setLoading(false);
        }
    }, [configured, fromDate, toDate, filterStatus, filterTin]);

    useEffect(() => {
        if (configured) fetchWaybills();
    }, [configured]);

    const handleAction = async (action: "confirm" | "reject" | "close" | "delete", waybillId: string) => {
        setActionLoading(waybillId + action);
        try {
            if (action === "delete") {
                await rsgeService.deleteWaybill(waybillId);
            } else if (action === "confirm") {
                await rsgeService.confirmWaybill(waybillId);
            } else if (action === "reject") {
                await rsgeService.rejectWaybill(waybillId);
            } else if (action === "close") {
                await rsgeService.closeWaybill(waybillId);
            }
            await fetchWaybills();
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendInvoice = async () => {
        await rsgeService.sendStandaloneInvoice({
            buyerTin: invoiceBuyerTin,
            buyerName: invoiceBuyerName,
            items: invoiceItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        });
        setShowInvoiceDialog(false);
    };

    // Not configured state
    if (!configured) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700 max-w-2xl mx-auto py-20">
                <div className="text-center space-y-6">
                    <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                        <Link2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">RS.GE სინქრონიზაცია</h2>
                        <p className="text-muted-foreground mt-2 text-base font-medium">
                            RS.GE-სთან ინტეგრაც ამ მომენტში არ არის კონფიგურირებული.
                        </p>
                    </div>
                    <Card className="border-amber-200 bg-amber-50/50 rounded-2xl">
                        <CardContent className="pt-6 pb-5 flex flex-col gap-3 text-left">
                            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                                <AlertTriangle className="h-5 w-5" />
                                RS.GE პარამეტრები შევსებული არ არის
                            </div>
                            <p className="text-sm text-amber-700/80 leading-relaxed">
                                გადადით <strong>ადმინ პანელი → RS.GE ინტეგრაცია</strong> და შეიყვანეთ:
                            </p>
                            <ul className="text-sm text-amber-700 space-y-1 font-medium list-disc ml-4">
                                <li>სერვის-მომხმარებელი (Username)</li>
                                <li>პაროლი (Password)</li>
                                <li>საიდენტიფიკაციო ნომერი (ს/ნ)</li>
                            </ul>
                            <p className="text-xs text-amber-600/70 mt-2">
                                მონაცემების შეყვანის შემდეგ, ეს გვერდი ავტომატურად ჩაირთვება.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20" id="print-area">
            <PageHeader
                title="RS.GE სინქრონიზაცია"
                description="ზედნადებების და ანგარიშ-ფაქტურების სრული მართვა RS.GE-სთან"
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "სულ ზედნადები", value: waybills.length, icon: FileText, color: "text-blue-500 bg-blue-500/10" },
                    { label: "დადასტურებული", value: waybills.filter(w => w.status === "2").length, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10" },
                    { label: "მოლოდინში", value: waybills.filter(w => w.status === "0" || w.status === "1").length, icon: Clock, color: "text-amber-500 bg-amber-500/10" },
                    { label: "უარყოფილი", value: waybills.filter(w => w.status === "3").length, icon: XCircle, color: "text-red-500 bg-red-500/10" },
                ].map((stat) => (
                    <Card key={stat.label} className="border-border/50 shadow-sm rounded-2xl">
                        <CardContent className="pt-5 pb-4 flex items-center gap-3">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{stat.value}</p>
                                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Actions bar */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">თარიღიდან</Label>
                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                        className="h-10 rounded-xl bg-muted/30 border-none font-medium w-36" />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">თარიღამდე</Label>
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                        className="h-10 rounded-xl bg-muted/30 border-none font-medium w-36" />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">სტატუსი</Label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="flex h-10 rounded-xl border-none bg-muted/30 px-3 text-sm font-medium w-36">
                        <option value="">ყველა</option>
                        <option value="0">სამუშაო</option>
                        <option value="1">გაგზავნილი</option>
                        <option value="2">დადასტურებული</option>
                        <option value="3">უარყოფილი</option>
                        <option value="4">დახურული</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">მყიდველის ს/ნ</Label>
                    <Input placeholder="TIN..." value={filterTin} onChange={(e) => setFilterTin(e.target.value)}
                        className="h-10 rounded-xl bg-muted/30 border-none font-medium w-32" />
                </div>
                <Button onClick={fetchWaybills} disabled={loading}
                    className="h-10 rounded-xl font-bold flex items-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    სინქრონიზაცია
                </Button>
                <Button variant="outline" onClick={() => setShowInvoiceDialog(true)}
                    className="h-10 rounded-xl font-bold flex items-center gap-2 ml-auto border-2">
                    <FileText className="h-4 w-4" />
                    ანგარიშ-ფაქტურა
                </Button>
            </div>

            {/* Waybills Table */}
            <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-500" />
                        ზედნადებები
                    </CardTitle>
                    <CardDescription>{waybills.length} ჩანაწერი</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {waybills.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">
                                {loading ? "იტვირთება..." : "ზედნადები ვერ მოიძებნა. სცადეთ სინქრონიზაცია."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/30 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3 text-left">ID</th>
                                        <th className="px-4 py-3 text-left">სტატუსი</th>
                                        <th className="px-4 py-3 text-left">მყიდველი</th>
                                        <th className="px-4 py-3 text-left">ს/ნ</th>
                                        <th className="px-4 py-3 text-left">თარიღი</th>
                                        <th className="px-4 py-3 text-right">მოქმედება</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {waybills.map((w) => {
                                        const statusInfo = STATUS_LABELS[w.status] || { label: w.status, color: "text-gray-500 bg-gray-100" };
                                        const isLoading = actionLoading?.startsWith(w.id);
                                        return (
                                            <tr key={w.id} className="hover:bg-muted/20 transition-colors group">
                                                <td className="px-4 py-3 font-mono font-bold text-sm">{w.id}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn("px-2 py-1 rounded-lg text-xs font-bold", statusInfo.color)}>
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium">{w.buyerName || "—"}</td>
                                                <td className="px-4 py-3 font-mono text-xs">{w.buyerTin || "—"}</td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">{w.createDate || "—"}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg font-bold text-blue-600 hover:bg-blue-50"
                                                            onClick={() => handleViewGoods(w)}>
                                                            ნახვა
                                                        </Button>
                                                        {(w.status === "0" || w.status === "1") && (
                                                            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg font-bold text-emerald-600 hover:bg-emerald-50"
                                                                disabled={!!isLoading}
                                                                onClick={() => handleAction("confirm", w.id)}>
                                                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "დადასტური"}
                                                            </Button>
                                                        )}
                                                        {(w.status === "0" || w.status === "1") && (
                                                            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg font-bold text-amber-600 hover:bg-amber-50"
                                                                disabled={!!isLoading}
                                                                onClick={() => handleAction("reject", w.id)}>
                                                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "უარყოფა"}
                                                            </Button>
                                                        )}
                                                        {w.status === "2" && (
                                                            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg font-bold text-gray-600 hover:bg-gray-100"
                                                                disabled={!!isLoading}
                                                                onClick={() => handleAction("close", w.id)}>
                                                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "დახურვა"}
                                                            </Button>
                                                        )}
                                                        {w.status === "0" && (
                                                            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg font-bold text-red-500 hover:bg-red-50"
                                                                disabled={!!isLoading}
                                                                onClick={() => handleAction("delete", w.id)}>
                                                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Goods View & Mapping Dialog */}
            <Dialog open={showGoodsDialog} onOpenChange={setShowGoodsDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
                    <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-8 text-white relative overflow-hidden">
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">ზედნადების საქონელი</h2>
                                <p className="text-blue-100 mt-1 font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {selected?.waybillNumber || selected?.w_id} — {selected?.sellerName}
                                </p>
                            </div>
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none py-1.5 px-3 rounded-full font-bold">
                                {currentGoods.length} პროდუქტი
                            </Badge>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    </div>

                    <div className="p-8 space-y-8">
                        {goodsLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                                <p className="text-muted-foreground font-bold animate-pulse">მონაცემები იკითხება RS.GE-დან...</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-tight">
                                            <Link2 className="h-5 w-5 text-blue-500" />
                                            პროდუქციის დაკავშირება
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium italic">
                                            პროდუქტები შტრიხკოდით ან სახელით ავტომატურად მოიძებნა
                                        </p>
                                    </div>

                                    <div className="overflow-hidden border border-border/50 rounded-2xl shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border/50 bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <th className="px-5 py-4 text-left">დასახელება / შტრიხკოდი</th>
                                                    <th className="px-5 py-4 text-left">რაოდენობა</th>
                                                    <th className="px-5 py-4 text-left">ფასი</th>
                                                    <th className="px-5 py-4 text-left">კატეგორია</th>
                                                    <th className="px-5 py-4 text-center">სტატუსი</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                                {currentGoods.map((item) => (
                                                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                                        <td className="px-5 py-4">
                                                            <div className="font-bold text-sm leading-tight">{item.name}</div>
                                                            <div className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-tighter">
                                                                {item.barcode || "შტრიხკოდის გარეშე"}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 font-black">{item.quantity} {item.unitName || "ც"}</td>
                                                        <td className="px-5 py-4 font-black text-blue-600">₾ {item.price}</td>
                                                        <td className="px-5 py-4">
                                                            <select
                                                                value={mappingData[item.id]?.category}
                                                                onChange={(e) => {
                                                                    setMappingData(prev => ({
                                                                        ...prev,
                                                                        [item.id]: { category: e.target.value }
                                                                    }));
                                                                }}
                                                                className="h-9 w-full rounded-xl bg-muted/50 border-none text-xs font-bold px-3 focus:ring-2 ring-blue-500/20"
                                                            >
                                                                {store.categories.map(cat => (
                                                                    <option key={cat} value={cat}>{cat}</option>
                                                                ))}
                                                                <option value="სხვადასხვა">სხვადასხვა</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex justify-center">
                                                                {item.matchId ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-1">
                                                                            <CheckCircle2 className="h-4 w-4" />
                                                                        </div>
                                                                        <span className="text-[8px] font-black text-emerald-600 uppercase">ნაპოვნია</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center opacity-40">
                                                                        <div className="h-7 w-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-1">
                                                                            <ShieldCheck className="h-4 w-4" />
                                                                        </div>
                                                                        <span className="text-[8px] font-black text-amber-700 uppercase">ახალი</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-blue-900 leading-tight">მზად არის იმპორტისთვის</h4>
                                        <p className="text-xs text-blue-800/70 mt-0.5">
                                            "იმპორტი" ავტომატურად დაამატებს ამ საქონელს საწყობში და გაატარებს შესყიდვის ისტორიას.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <Button variant="ghost" onClick={() => setShowGoodsDialog(false)} className="h-12 rounded-2xl font-bold flex-1">
                                        გაუქმება
                                    </Button>
                                    <Button onClick={handleImportToWarehouse} disabled={importing}
                                        className="h-12 rounded-2xl font-black flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-xl shadow-blue-500/20 gap-2">
                                        {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                                        საწყობში ასახვა (იმპორტი)
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Standalone Invoice Dialog */}
            <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">ანგარიშ-ფაქტურა</DialogTitle>
                        <DialogDescription>ზედნადების გარეშე ანგარიშ-ფაქტურის გაგზავნა</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">მყიდველის ს/ნ</Label>
                                <Input value={invoiceBuyerTin} onChange={(e) => setInvoiceBuyerTin(e.target.value)}
                                    placeholder="200000000" className="h-10 rounded-xl bg-muted/30 border-none" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">მყიდველი</Label>
                                <Input value={invoiceBuyerName} onChange={(e) => setInvoiceBuyerName(e.target.value)}
                                    placeholder="კომპანიის სახელი" className="h-10 rounded-xl bg-muted/30 border-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">პროდუქცია</Label>
                            {invoiceItems.map((item, i) => (
                                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                                    <Input placeholder="სახელი" value={item.name}
                                        onChange={(e) => { const arr = [...invoiceItems]; arr[i].name = e.target.value; setInvoiceItems(arr); }}
                                        className="col-span-2 h-9 rounded-lg bg-muted/30 border-none text-sm" />
                                    <Input type="number" placeholder="რაოდ." value={item.quantity}
                                        onChange={(e) => { const arr = [...invoiceItems]; arr[i].quantity = Number(e.target.value); setInvoiceItems(arr); }}
                                        className="h-9 rounded-lg bg-muted/30 border-none text-sm" />
                                    <Input type="number" placeholder="ფასი" value={item.price}
                                        onChange={(e) => { const arr = [...invoiceItems]; arr[i].price = Number(e.target.value); setInvoiceItems(arr); }}
                                        className="h-9 rounded-lg bg-muted/30 border-none text-sm" />
                                    <Button size="sm" variant="ghost" onClick={() => setInvoiceItems(items => items.filter((_, idx) => idx !== i))}
                                        className="h-9 rounded-lg text-red-500 hover:bg-red-50 px-2">
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button size="sm" variant="outline" onClick={() => setInvoiceItems(items => [...items, { name: "", quantity: 1, price: 0 }])}
                                className="w-full h-8 rounded-lg text-xs font-bold">
                                + სტრიქონის დამატება
                            </Button>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setShowInvoiceDialog(false)} className="rounded-xl font-bold">გაუქმება</Button>
                        <Button onClick={handleSendInvoice} className="rounded-xl font-bold flex items-center gap-2">
                            <Send className="h-4 w-4" /> გაგზავნა RS.GE-ზე
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
