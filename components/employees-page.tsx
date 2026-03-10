"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    User,
    Phone,
    Briefcase,
    MoreVertical,
    Pencil,
    Trash2,
    Users,
    Lock,
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
    DialogTrigger,
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

const POSITIONS = [
    "ადმინისტრატორი",
    "მოლარე",
    "კონსულტანტი",
    "საწყობის თანამშრომელი",
];

export function EmployeesPage() {
    const store = useWarehouseStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: "",
        position: POSITIONS[0],
        phone: "",
        pinCode: "",
    });

    const filteredEmployees = store.employees.filter(
        (e) =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.phone.includes(searchQuery)
    );

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error("შეიყვანეთ სახელი");
            return;
        }

        try {
            await store.addEmployee(formData);
            toast.success("თანამშრომელი დაემატა");
            setIsAddDialogOpen(false);
            setFormData({ name: "", position: POSITIONS[0], phone: "", pinCode: "" });
        } catch (error) {
            console.error("Add employee failed in UI:", error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmployee) return;

        try {
            await store.updateEmployee(editingEmployee.id, formData);
            toast.success("მონაცემები განახლდა");
            setIsEditDialogOpen(false);
            setEditingEmployee(null);
        } catch (error) {
            toast.error("შეცდომა განახლებისას");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("ნამდვილად გსურთ წაშლა?")) return;

        try {
            await store.deleteEmployee(id);
            toast.success("თანამშრომელი წაიშალა");
        } catch (error) {
            toast.error("შეცდომა წაშლისას");
        }
    };

    const openEdit = (employee: any) => {
        setEditingEmployee(employee);
        setFormData({
            name: employee.name,
            position: employee.position,
            phone: employee.phone,
            pinCode: employee.pinCode || "",
        });
        setIsEditDialogOpen(true);
    };

    return (
        <div id="print-area" className="space-y-8 animate-in fade-in duration-700">
            <PageHeader
                title="თანამშრომლები"
                description="პერსონალის მართვა და პოზიციები"
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ძებნა (სახელი, პოზიცია...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 border-none bg-muted/30 rounded-xl"
                    />
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" />
                            დამატება
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto rounded-2xl">
                        <form onSubmit={handleAdd}>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    ახალი თანამშრომელი
                                </DialogTitle>
                                <DialogDescription>
                                    შეიყვანეთ თანამშრომლის მონაცემები
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">სახელი და გვარი *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="მაგ: გიორგი ბერიძე"
                                        className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">პოზიცია</Label>
                                    <Select
                                        value={formData.position}
                                        onValueChange={(val) =>
                                            setFormData({ ...formData, position: val })
                                        }
                                    >
                                        <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-medium">
                                            <SelectValue placeholder="აირჩიეთ პოზიცია" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            {POSITIONS.map((p) => (
                                                <SelectItem key={p} value={p}>
                                                    {p}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ტელეფონი</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                        placeholder="მაგ: 599 12 34 56"
                                        className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PIN კოდი</Label>
                                    <Input
                                        value={formData.pinCode}
                                        onChange={(e) =>
                                            setFormData({ ...formData, pinCode: e.target.value })
                                        }
                                        placeholder="მაგ: 1234"
                                        className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                                    შენახვა
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">თანამშრომელი</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">პოზიცია</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">ტელეფონი</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">PIN</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">მოქმედება</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((employee) => (
                                    <TableRow key={employee.id} className="hover:bg-muted/20 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-bold text-sm">{employee.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-tight bg-sky-50 text-sky-700 gap-1">
                                                <Briefcase className="h-3 w-3" />
                                                {employee.position}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{employee.phone || "—"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="font-mono text-xs font-bold">{employee.pinCode || "—"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl">
                                                    <DropdownMenuItem onClick={() => openEdit(employee)} className="gap-2">
                                                        <Pencil className="h-4 w-4" />
                                                        რედაქტირება
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive gap-2"
                                                        onClick={() => handleDelete(employee.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        წაშლა
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-20 text-muted-foreground"
                                    >
                                        <Users className="h-10 w-10 mx-auto mb-3 opacity-10" />
                                        <p className="font-medium">თანამშრომლები არ მოიძებნა</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto rounded-2xl">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Pencil className="h-5 w-5 text-primary" />
                                რედაქტირება
                            </DialogTitle>
                            <DialogDescription>
                                შეცვალეთ თანამშრომლის მონაცემები
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-5">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">სახელი და გვარი</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">პოზიცია</Label>
                                <Select
                                    value={formData.position}
                                    onValueChange={(val) =>
                                        setFormData({ ...formData, position: val })
                                    }
                                >
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-medium">
                                        <SelectValue placeholder="აირჩიეთ პოზიცია" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-xl">
                                        {POSITIONS.map((p) => (
                                            <SelectItem key={p} value={p}>
                                                {p}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ტელეფონი</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                    className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PIN კოდი</Label>
                                <Input
                                    value={formData.pinCode}
                                    onChange={(e) =>
                                        setFormData({ ...formData, pinCode: e.target.value })
                                    }
                                    className="h-11 rounded-xl bg-muted/30 border-none font-medium"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                                შენახვა
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
