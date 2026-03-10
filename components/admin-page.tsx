"use client";

import { useState, useRef } from "react";
import {
  Users,
  Settings,
  Database,
  Plus,
  Trash2,
  Pencil,
  Download,
  Upload,
  AlertTriangle,
  Save,
  Printer,
  ShieldCheck,
  UserPlus,
  Globe,
  Wallet,
  MapPin,
  RefreshCcw,
  Phone,
  Package,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useWarehouseStore } from "@/hooks/use-store";
import { warehouseStore } from "@/lib/store";
import { authStore } from "@/lib/auth";
import { settingsStore } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { printPage } from "@/lib/print";
import { cn } from "@/lib/utils";

export function AdminPage() {
  const auth = useAuth();
  const settings = useSettings();
  const store = useWarehouseStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="ადმინ პანელი"
        description="მომხმარებლების მართვა, სისტემის პარამეტრები და მონაცემთა მართვა"
      />

      <div id="print-area">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50 mb-8 max-w-lg">
            <TabsTrigger value="users" className="gap-2 rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-background">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">მომხმარებლები</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-background">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">პარამეტრები</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2 rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-background">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">მონაცემები</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0 outline-none">
            <UsersTab auth={auth} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 outline-none">
            <SettingsTab settings={settings} />
          </TabsContent>

          <TabsContent value="data" className="mt-0 outline-none">
            <DataTab store={store} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ========== Users Tab ==========

interface UsersTabProps {
  auth: ReturnType<typeof useAuth>;
}

function UsersTab({ auth }: UsersTabProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const handleAddUser = async () => {
    const result = await auth.addUser(newUsername, newPassword, newDisplayName);
    if (result.success) {
      toast.success("მომხმარებელი დაემატა");
      setNewUsername("");
      setNewPassword("");
      setNewDisplayName("");
      setAddOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await auth.deleteUser(userId);
    if (result.success) {
      toast.success("მომხმარებელი წაიშალა");
    } else {
      toast.error(result.error);
    }
  };

  const handleEditUser = async () => {
    if (!editUserId) return;
    const updates: { displayName?: string; password?: string } = {};
    if (editDisplayName.trim()) updates.displayName = editDisplayName;
    if (editPassword.trim()) updates.password = editPassword;
    const result = await auth.updateUser(editUserId, updates);
    if (result.success) {
      toast.success("მომხმარებელი განახლდა");
      setEditOpen(false);
      setEditUserId(null);
      setEditDisplayName("");
      setEditPassword("");
    } else {
      toast.error(result.error);
    }
  };

  const openEditDialog = (user: (typeof auth.users)[0]) => {
    setEditUserId(user.id);
    setEditDisplayName(user.displayName);
    setEditPassword("");
    setEditOpen(true);
  };

  return (
    <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/10 pb-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            მომხმარებლების მართვა
          </CardTitle>
          <CardDescription>
            დაამატეთ, შეცვალეთ ან წაშალეთ მომხმარებლები
          </CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <UserPlus className="h-4 w-4" />
              დამატება
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                ახალი მომხმარებელი
              </DialogTitle>
              <DialogDescription>
                შეიყვანეთ ახალი მომხმარებლის მონაცემები
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">მომხმარებლის სახელი</Label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="username"
                  className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">სახელი</Label>
                <Input
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="სახელი გვარი"
                  className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">პაროლი</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="მინიმუმ 4 სიმბოლო"
                  className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddUser} className="w-full h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">დამატება</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">მომხმარებელი</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">სახელი</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">შექმნის თარიღი</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">მოქმედება</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auth.users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                      <Users className="h-3 w-3 text-primary" />
                    </div>
                    {user.username}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-muted-foreground">{user.displayName}</TableCell>
                <TableCell className="text-sm">
                  {new Date(user.createdAt).toLocaleDateString("ka-GE")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => openEditDialog(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {user.id !== auth.currentUser?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border-none">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-bold">
                              მომხმარებლის წაშლა
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {"ნამდვილად გსურთ "}
                              <strong className="text-foreground">{user.displayName}</strong>
                              {"-ის წაშლა?"}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl border-none bg-muted/50 font-bold tracking-tight">გაუქმება</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-bold tracking-tight"
                            >
                              წაშლა
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              მომხმარებლის რედაქტირება
            </DialogTitle>
            <DialogDescription>
              შეცვალეთ სახელი ან პაროლი
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">სახელი</Label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="h-11 rounded-xl bg-muted/30 border-none font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                ახალი პაროლი (ცარიელი = არ შეიცვლება)
              </Label>
              <Input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="ახალი პაროლი"
                className="h-11 rounded-xl bg-muted/30 border-none font-medium"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditUser} className="w-full h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">შენახვა</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ========== Settings Tab ==========

interface SettingsTabProps {
  settings: ReturnType<typeof useSettings>;
}

function SettingsTab({ settings }: SettingsTabProps) {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [currency, setCurrency] = useState<"GEL" | "USD" | "EUR">(settings.currency);
  const [accountingMethod, setAccountingMethod] = useState<"accrual" | "cash">(settings.accountingMethod || "accrual");
  const [phone, setPhone] = useState(settings.phone || "");
  const [email, setEmail] = useState(settings.email || "");
  const [bankAccount, setBankAccount] = useState(settings.bankAccount || "");
  const [address, setAddress] = useState(settings.address || "");
  const [rsgeUsername, setRsgeUsername] = useState(settings.rsgeUsername || "");
  const [rsgePassword, setRsgePassword] = useState(settings.rsgePassword || "");
  const [rsgeTin, setRsgeTin] = useState((settings as any).rsgeTin || "");
  const [rsgeAutoSend, setRsgeAutoSend] = useState(settings.rsgeAutoSend || false);
  const [rsgeAutoInvoice, setRsgeAutoInvoice] = useState((settings as any).rsgeAutoInvoice || false);
  const [rsgeDefaultWaybillType, setRsgeDefaultWaybillType] = useState<1 | 2 | 3>(
    (settings as any).rsgeDefaultWaybillType || 1
  );
  const [rsgeTestStatus, setRsgeTestStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [fiscalType, setFiscalType] = useState<"none" | "digital" | "physical">(settings.fiscalType || "none");
  const [fiscalAutoPrint, setFiscalAutoPrint] = useState(settings.fiscalAutoPrint || false);
  const [deletePin, setDeletePin] = useState(settings.deletePin || "1234");

  const handleSave = () => {
    settings.updateSettings({
      companyName: companyName.trim() || "DASTA CLOUD JR",
      currency,
      accountingMethod,
      phone: phone.trim(),
      email: email.trim(),
      bankAccount: bankAccount.trim(),
      address: address.trim(),
      rsgeUsername: rsgeUsername.trim(),
      rsgePassword: rsgePassword.trim(),
      rsgeTin: rsgeTin.trim(),
      rsgeAutoSend,
      rsgeAutoInvoice,
      rsgeDefaultWaybillType,
      fiscalType,
      fiscalAutoPrint,
      deletePin,
    });
    toast.success("პარამეტრები შეინახა");
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/10">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            სისტემის პარამეტრები
          </CardTitle>
          <CardDescription>
            კომპანიის სახელი, ვალუტა და საკონტაქტო ინფორმაცია (ინვოისისთვის)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">კომპანიის სახელი</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="DASTA CLOUD JR"
                className="h-11 rounded-xl bg-muted/30 border-none font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ვალუტა</Label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="flex h-11 w-full rounded-xl border-none bg-muted/30 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <option value="GEL">GEL (₾)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ბუღალტრული მეთოდი</Label>
              <select
                value={accountingMethod}
                onChange={(e) => setAccountingMethod(e.target.value as any)}
                className="flex h-11 w-full rounded-xl border-none bg-muted/30 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <option value="accrual">დარიცხვის (Accrual)</option>
                <option value="cash">საკასო (Cash)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/50" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">საკონტაქტო ინფორმაცია</h3>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5"><Phone className="h-3 w-3" /> ტელეფონის ნომერი</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+995 ..."
                  className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5"><Globe className="h-3 w-3" /> ელ-ფოსტა</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@..."
                  className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5"><Wallet className="h-3 w-3" /> საბანკო ანგარიში (IBAN)</Label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="GE00TB0000000000000000"
                className="h-11 rounded-xl bg-muted/30 border-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5"><MapPin className="h-3 w-3" /> მისამართი</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ქუჩა, ქალაქი..."
                className="h-11 rounded-xl bg-muted/30 border-none font-medium"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-emerald-200/50" />
              <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-emerald-600">RS.GE ინტეგრაცია</h3>
              <div className="h-px flex-1 bg-emerald-200/50" />
            </div>

            {/* Status badge */}
            {rsgeUsername && rsgePassword ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-4 w-4" /> კონფიგურირებულია — RS.GE მომხმარებელი შევსებულია
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4" /> შეიყვანეთ RS.GE პარამეტრები — ბაზა ძალიან კლიენტისაგან
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">მომხმარებელი (Username)</Label>
                <Input
                  value={rsgeUsername}
                  onChange={(e) => setRsgeUsername(e.target.value)}
                  placeholder="მომხმარებელი"
                  className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">პაროლი</Label>
                <Input
                  type="password"
                  value={rsgePassword}
                  onChange={(e) => setRsgePassword(e.target.value)}
                  placeholder="********"
                  className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                <Link2 className="h-3 w-3" /> საიდენტიფიკაციო ნომერი (ს/ნ)
              </Label>
              <Input
                value={rsgeTin}
                onChange={(e) => setRsgeTin(e.target.value)}
                placeholder="200000000"
                maxLength={20}
                className="h-11 rounded-xl bg-muted/30 border-none font-medium"
              />
            </div>

            {/* Test Connection */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-2 font-bold flex items-center gap-2"
                disabled={!rsgeUsername || !rsgePassword || rsgeTestStatus === "loading"}
                onClick={async () => {
                  setRsgeTestStatus("loading");
                  try {
                    const res = await fetch(`/api/rsge/test?username=${encodeURIComponent(rsgeUsername)}&password=${encodeURIComponent(rsgePassword)}`);
                    const data = await res.json();
                    setRsgeTestStatus(data.success ? "ok" : "fail");
                  } catch {
                    setRsgeTestStatus("fail");
                  }
                }}
              >
                {rsgeTestStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                {rsgeTestStatus === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                {rsgeTestStatus === "fail" && <XCircle className="h-4 w-4 text-red-500" />}
                {rsgeTestStatus === "idle" && <Link2 className="h-4 w-4" />}
                კავშირის ტესტი
              </Button>
              {rsgeTestStatus === "ok" && <span className="text-sm font-bold text-emerald-600">კავშირი წარმატებულია! ✅</span>}
              {rsgeTestStatus === "fail" && <span className="text-sm font-bold text-red-500">კავშირი ვერ ესახა. შეამოწმეთ მონაცემები! ❌</span>}
            </div>

            {/* Waybill type */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ნაგულისხმევი ზედნადების ტიპი</Label>
              <select
                value={rsgeDefaultWaybillType}
                onChange={(e) => setRsgeDefaultWaybillType(Number(e.target.value) as 1 | 2 | 3)}
                className="flex h-11 w-full rounded-xl border-none bg-muted/30 px-3 py-2 text-sm font-medium"
              >
                <option value={1}>შიდა (Internal)</option>
                <option value={2}>გარე (External)</option>
                <option value={3}>გადაადგილება (Transfer)</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/20">
                <input
                  type="checkbox"
                  id="rsge-auto"
                  checked={rsgeAutoSend}
                  onChange={(e) => setRsgeAutoSend(e.target.checked)}
                  className="h-5 w-5 rounded-md"
                />
                <Label htmlFor="rsge-auto" className="cursor-pointer font-bold text-sm">ზედნადების ავტომატური გაგზავნა გაყიდვისას</Label>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/20">
                <input
                  type="checkbox"
                  id="rsge-auto-invoice"
                  checked={rsgeAutoInvoice}
                  onChange={(e) => setRsgeAutoInvoice(e.target.checked)}
                  className="h-5 w-5 rounded-md"
                />
                <Label htmlFor="rsge-auto-invoice" className="cursor-pointer font-bold text-sm">ანგარიშ-ფაქტურას ავტომატური გაგზავნა ზედნადებისთან ერთად</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/50" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">საკასო აპარატი</h3>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">აპარატის ტიპი</Label>
                <select
                  id="fiscal-type"
                  value={fiscalType}
                  onChange={(e) => setFiscalType(e.target.value as any)}
                  className="flex h-11 w-full rounded-xl border-none bg-muted/30 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  <option value="none">გამორთული</option>
                  <option value="digital">ციფრული (Daisy)</option>
                  <option value="physical">ფიზიკური (USB/LAN)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/20">
              <input
                type="checkbox"
                id="fiscal-auto"
                checked={fiscalAutoPrint}
                onChange={(e) => setFiscalAutoPrint(e.target.checked)}
                className="h-5 w-5 rounded-md border-border/50 bg-background text-primary focus:ring-primary/20"
              />
              <Label htmlFor="fiscal-auto" className="cursor-pointer font-bold text-sm">ჩეკის ავტომატური ამობეჭდვა გაყიდვისას</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/50" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">უსაფრთხოება</h3>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-rose-600 ml-1">მონაცემთა წაშლის პინ-კოდი</Label>
                <Input
                  type="password"
                  maxLength={4}
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  placeholder="1234"
                  className="max-w-48 h-11 rounded-xl bg-white border-rose-200 text-rose-900 font-black tracking-widest text-center text-xl"
                />
                <p className="text-[10px] font-bold text-rose-500/70 uppercase px-1">გამოიყენება ყველა მონაცემის წაშლისას</p>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20 mt-2">
            <Save className="mr-2 h-4 w-4" />
            ყველა პარამეტრის შენახვა
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== Data Tab ==========

interface DataTabProps {
  store: ReturnType<typeof useWarehouseStore>;
}

function DataTab({ store }: DataTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      products: store.products,
      sales: store.sales,
      users: authStore.getAllUsersRaw(),
      settings: settingsStore.getSettings(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warehouse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("მონაცემები ექსპორტირდა");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.products) await warehouseStore.importData(data.products, data.sales || []);
        if (data.users) await authStore.importUsers(data.users);
        if (data.settings) settingsStore.importSettings(data.settings);
        toast.success("მონაცემები იმპორტირდა წარმატებით");
      } catch {
        toast.error("ფაილის წაკითხვა ვერ მოხერხდა");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const [pinInput, setPinInput] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleClearAll = async () => {
    const settings = settingsStore.getSettings();
    if (pinInput !== settings.deletePin) {
      toast.error("პინ-კოდი არასწორია");
      return;
    }
    await warehouseStore.clearAll();
    toast.success("ყველა მონაცემი წაიშალა");
    setPinInput("");
    setIsAlertOpen(false);
  };

  const dataSize = (() => {
    try {
      const products = localStorage.getItem("warehouse_products") || "";
      const sales = localStorage.getItem("warehouse_sales") || "";
      const users = localStorage.getItem("warehouse_users") || "";
      const settings = localStorage.getItem("warehouse_settings") || "";
      const totalBytes = products.length + sales.length + users.length + settings.length;
      if (totalBytes < 1024) return `${totalBytes} B`;
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    } catch {
      return "N/A";
    }
  })();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Package className="h-12 w-12" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">სულ პროდუქცია</p>
            <div className="text-3xl font-black text-foreground tracking-tight">
              {store.totalProducts}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="h-12 w-12" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">სულ გაყიდვები</p>
            <div className="text-3xl font-black text-foreground tracking-tight">
              {store.sales.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Database className="h-12 w-12" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">მონაცემთა ზომა</p>
            <div className="text-3xl font-black text-foreground tracking-tight">{dataSize}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/10">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            მონაცემთა მართვა
          </CardTitle>
          <CardDescription>
            ექსპორტი, იმპორტი და მონაცემთა წაშლა
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-8">
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={handleExport} className="h-12 rounded-xl px-6 font-bold tracking-tight gap-2 shadow-sm border-border/50 hover:bg-muted/50 transition-colors">
              <Download className="h-4 w-4 text-emerald-600" />
              ექსპორტი (JSON)
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-12 rounded-xl px-6 font-bold tracking-tight gap-2 shadow-sm border-border/50 hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-4 w-4 text-sky-600" />
              იმპორტი (JSON)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>

          <div className="pt-8 mt-4 border-t border-border/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <h3 className="text-sm font-bold text-rose-600 uppercase tracking-tight">სახიფათო ზონა</h3>
            </div>

            <p className="text-sm text-muted-foreground font-medium mb-4">
              ყველა მონაცემის წაშლა გამოიწვევს პროდუქციის და გაყიდვების ისტორიის სრულ გასუფთავებას.
            </p>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="h-12 rounded-xl px-8 font-bold uppercase tracking-widest shadow-lg shadow-destructive/10">
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin-reverse" />
                  მონაცემების გასუფთავება
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-6 w-6" />
                    ნამდვილად გსურთ წაშლა?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base font-medium">
                    ეს მოქმედება წაშლის ყველა პროდუქციას და გაყიდვას.
                    <br />
                    მომხმარებლები და პარამეტრები შენარჩუნდება.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-6 space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">დასადასტურებლად შეიყვანეთ პინ-კოდი</Label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="____"
                    className="text-center text-4xl font-black tracking-[1em] h-20 rounded-2xl bg-muted/30 border-none"
                    autoFocus
                  />
                </div>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel onClick={() => setPinInput("")} className="rounded-xl border-none bg-muted/50 font-bold h-12">გაუქმება</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-white hover:bg-destructive/90 rounded-xl h-12 font-bold px-8 uppercase tracking-widest shadow-lg shadow-destructive/20"
                  >
                    დადასტურება
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const PackageIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);
