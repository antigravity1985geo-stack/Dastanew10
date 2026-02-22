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

export function AdminPage() {
  const auth = useAuth();
  const settings = useSettings();
  const store = useWarehouseStore();

  return (
    <div>
      <PageHeader
        title="ადმინ პანელი"
        description="მომხმარებლების მართვა, სისტემის პარამეტრები და მონაცემთა მართვა"
      />

      <div id="print-area">
        <Tabs defaultValue="users" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">მომხმარებლები</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">პარამეტრები</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">მონაცემები</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UsersTab auth={auth} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsTab settings={settings} />
          </TabsContent>

          <TabsContent value="data" className="mt-6">
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">მომხმარებლების მართვა</CardTitle>
          <CardDescription>
            დაამატეთ, შეცვალეთ ან წაშალეთ მომხმარებლები
          </CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              დამატება
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ახალი მომხმარებელი</DialogTitle>
              <DialogDescription>
                შეიყვანეთ ახალი მომხმარებლის მონაცემები
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-username">მომხმარებლის სახელი</Label>
                <Input
                  id="add-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="username"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-displayname">სახელი</Label>
                <Input
                  id="add-displayname"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="სახელი გვარი"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-password">პაროლი</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="მინიმუმ 4 სიმბოლო"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                გაუქმება
              </Button>
              <Button onClick={handleAddUser}>დამატება</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>მომხმარებელი</TableHead>
              <TableHead>სახელი</TableHead>
              <TableHead>შექმნის თარიღი</TableHead>
              <TableHead className="text-right">მოქმედება</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auth.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString("ka-GE")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(user)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">რედაქტირება</span>
                    </Button>
                    {user.id !== auth.currentUser?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">წაშლა</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              მომხმარებლის წაშლა
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {"ნამდვილად გსურთ "}
                              <strong>{user.displayName}</strong>
                              {"-ის წაშლა?"}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>მომხმარებლის რედაქტირება</DialogTitle>
            <DialogDescription>
              შეცვალეთ სახელი ან პაროლი
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-displayname">სახელი</Label>
              <Input
                id="edit-displayname"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-password">
                ახალი პაროლი (ცარიელი = არ შეიცვლება)
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="ახალი პაროლი"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              გაუქმება
            </Button>
            <Button onClick={handleEditUser}>შენახვა</Button>
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
  const [currency, setCurrency] = useState(settings.currency);
  const [phone, setPhone] = useState(settings.phone || "");
  const [email, setEmail] = useState(settings.email || "");
  const [bankAccount, setBankAccount] = useState(settings.bankAccount || "");
  const [address, setAddress] = useState(settings.address || "");

  const handleSave = () => {
    settings.updateSettings({
      companyName: companyName.trim() || "საწყობი",
      currency: currency.trim() || "₾",
      phone: phone.trim(),
      email: email.trim(),
      bankAccount: bankAccount.trim(),
      address: address.trim(),
    });
    toast.success("პარამეტრები შეინახა");
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">სისტემის პარამეტრები</CardTitle>
          <CardDescription>
            კომპანიის სახელი, ვალუტა და საკონტაქტო ინფორმაცია (ინვოისისთვის)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="company-name">კომპანიის სახელი</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="საწყობი"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">ვალუტა</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="₾"
              />
            </div>
          </div>

          <div className="h-px bg-border my-2" />
          <h3 className="text-sm font-semibold">საკონტაქტო ინფორმაცია (ინვოისისთვის)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">ტელეფონის ნომერი</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+995 ..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">ელ-ფოსტა</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bank">საბანკო ანგარიში (IBAN)</Label>
            <Input
              id="bank"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="GE00TB0000000000000000"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="address">მისამართი</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ქუჩა, ქალაქი..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>ენა</Label>
            <Input value="ქართული" disabled className="max-w-48" />
          </div>

          <Button onClick={handleSave} className="w-fit mt-2">
            <Save className="mr-2 h-4 w-4" />
            შენახვა
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
        toast.error("ဖაილის წაკითხვა ვერ მოხერხდა");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearAll = async () => {
    await warehouseStore.clearAll();
    toast.success("ყველა მონაცემი წაიშალა");
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {store.totalProducts}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              სულ პროდუქცია
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {store.sales.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              სულ გაყიდვები
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{dataSize}</div>
            <p className="text-sm text-muted-foreground mt-1">მონაცემთა ზომა</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">მონაცემთა მართვა</CardTitle>
          <CardDescription>
            ექსპორტი, იმპორტი და მონაცემთა წაშლა
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              ექსპორტი (JSON)
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
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

          <div className="border-t border-border pt-4 mt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  ყველა მონაცემის წაშლა
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ყველა მონაცემის წაშლა
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    ეს მოქმედება წაშლის ყველა პროდუქციას და გაყიდვას.
                    მომხმარებლები და პარამეტრები შეინარჩუნდება. ეს მოქმედება
                    შეუქცევადია.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    წაშლა
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
