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
            // Error is already handled/toasted in the store
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
        <div className="space-y-6">
            <PageHeader
                title="თანამშრომლები"
                description="პერსონალის მართვა და პოზიციები"
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ძებნა (სახელი, პოზიცია...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            დამატება
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleAdd}>
                            <DialogHeader>
                                <DialogTitle>ახალი თანამშრომელი</DialogTitle>
                                <DialogDescription>
                                    შეიყვანეთ თანამშრომლის მონაცემები
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">სახელი და გვარი</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="მაგ: გიორგი ბერიძე"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="position">პოზიცია</Label>
                                    <Select
                                        value={formData.position}
                                        onValueChange={(val) =>
                                            setFormData({ ...formData, position: val })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="აირჩიეთ პოზიცია" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {POSITIONS.map((p) => (
                                                <SelectItem key={p} value={p}>
                                                    {p}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">ტელეფონი</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                        placeholder="მაგ: 599 12 34 56"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="pinCode">PIN კოდი (იდენტიფიკაციისთვის)</Label>
                                    <Input
                                        id="pinCode"
                                        value={formData.pinCode}
                                        onChange={(e) =>
                                            setFormData({ ...formData, pinCode: e.target.value })
                                        }
                                        placeholder="მაგ: 1234"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">შენახვა</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>თანამშრომელი</TableHead>
                                <TableHead>პოზიცია</TableHead>
                                <TableHead>ტელეფონი</TableHead>
                                <TableHead>PIN</TableHead>
                                <TableHead className="text-right">მოქმედება</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-medium">{employee.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{employee.position}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{employee.phone || "—"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="font-mono text-xs">{employee.pinCode || "—"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(employee)}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        რედაქტირება
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(employee.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
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
                                        colSpan={4}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        თანამშრომლები არ მოიძებნა
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>რედაქტირება</DialogTitle>
                            <DialogDescription>
                                შეცვალეთ თანამშრომლის მონაცემები
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">სახელი და გვარი</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-position">პოზიცია</Label>
                                <Select
                                    value={formData.position}
                                    onValueChange={(val) =>
                                        setFormData({ ...formData, position: val })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="აირჩიეთ პოზიცია" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {POSITIONS.map((p) => (
                                            <SelectItem key={p} value={p}>
                                                {p}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-phone">ტელეფონი</Label>
                                <Input
                                    id="edit-phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-pinCode">PIN კოდი</Label>
                                <Input
                                    id="edit-pinCode"
                                    value={formData.pinCode}
                                    onChange={(e) =>
                                        setFormData({ ...formData, pinCode: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">შენახვა</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
