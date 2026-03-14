"use client";

import { useState, useMemo, useEffect } from "react";
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
import { 
  ChefHat, 
  Plus, 
  Play, 
  History, 
  Trash2, 
  Search, 
  ArrowRight, 
  Scale, 
  AlertTriangle,
  ClipboardList,
  PackageCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function ProductionPage() {
  const store = useWarehouseStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("recipes");
  
  // Recipe Creation/Edit State
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    productId: "",
    name: "",
    description: "",
    yieldPercentage: 100,
  });
  const [recipeItems, setRecipeItems] = useState<Array<{ ingredientId: string; quantity: number }>>([
    { ingredientId: "", quantity: 1 }
  ]);

  // Production Execution State
  const [executingRecipeId, setExecutingRecipeId] = useState<string | null>(null);
  const [productionForm, setProductionForm] = useState({
    quantity: 1,
    wastage: 0,
    notes: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddRecipeItem = () => {
    setRecipeItems([...recipeItems, { ingredientId: "", quantity: 1 }]);
  };

  const handleRemoveRecipeItem = (index: number) => {
    if (recipeItems.length > 1) {
      const newItems = [...recipeItems];
      newItems.splice(index, 1);
      setRecipeItems(newItems);
    }
  };

  const handleUpdateRecipeItem = (index: number, field: string, value: any) => {
    const newItems = [...recipeItems];
    (newItems[index] as any)[field] = value;
    setRecipeItems(newItems);
  };

  const handleCreateRecipe = async () => {
    if (!newRecipe.productId || !newRecipe.name) {
      toast.error("შეავსეთ სავალდებულო ველები");
      return;
    }
    
    const validItems = recipeItems.filter(item => item.ingredientId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("დაამატეთ მინიმუმ ერთი ინგრედიენტი");
      return;
    }

    try {
      await store.addRecipe(
        { 
          productId: newRecipe.productId, 
          name: newRecipe.name, 
          description: newRecipe.description,
          productName: store.products.find(p => p.id === newRecipe.productId)?.name || ""
        },
        validItems.map(item => ({
          ingredientId: item.ingredientId,
          ingredientName: store.products.find(p => p.id === item.ingredientId)?.name || "",
          quantity: item.quantity
        }))
      );
      setIsAddingRecipe(false);
      setNewRecipe({ productId: "", name: "", description: "", yieldPercentage: 100 });
      setRecipeItems([{ ingredientId: "", quantity: 1 }]);
    } catch (error: any) {
      toast.error(error.message || "შეცდომა რეცეპტის დამატებისას");
    }
  };

  const handleExecuteProduction = async () => {
    if (!executingRecipeId) return;
    
    // Final check before submission
    const missing = store.checkMaterialAvailability(executingRecipeId, productionForm.quantity);
    if (missing.length > 0) {
      toast.error("შეცდომა: ინგრედიენტები არასაკმარისია");
      return;
    }

    try {
      await store.executeProduction(
        executingRecipeId,
        productionForm.quantity,
        productionForm.wastage,
        productionForm.notes
      );
      setExecutingRecipeId(null);
      setProductionForm({ quantity: 1, wastage: 0, notes: "" });
    } catch (error: any) {
      toast.error(error.message || "შეცდომა წარმოებისას");
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50/50">
      <div className="flex-none">
        <PageHeader 
          title="წარმოება" 
          description="რეცეპტების მართვა და პროდუქციის წარმოება"
          actions={
            <Button onClick={() => setIsAddingRecipe(true)} className="gap-2 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold h-10 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              ახალი რეცეპტი
            </Button>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/50 border p-1 rounded-xl h-11 w-full max-w-md">
            <TabsTrigger value="recipes" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
              <ChefHat className="h-4 w-4 mr-2" />
              რეცეპტები
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
              <History className="h-4 w-4 mr-2" />
              ისტორია
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipes" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <RecipeList 
              onExecute={(id) => setExecutingRecipeId(id)}
              onDelete={(id) => store.deleteRecipe(id)}
            />
          </TabsContent>

          <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ProductionHistory />
          </TabsContent>
        </Tabs>
      </div>

      {/* ADD RECIPE DIALOG */}
      <Dialog open={isAddingRecipe} onOpenChange={setIsAddingRecipe}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">ახალი რეცეპტი</DialogTitle>
            <DialogDescription>
              განსაზღვრეთ მზა პროდუქტი და მისი შემადგენლობა.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground">მზა პროდუქტი</Label>
                <Select value={newRecipe.productId} onValueChange={(val) => setNewRecipe({...newRecipe, productId: val})}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="აირჩიეთ პროდუქტი" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {store.products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground">რეცეპტის სახელი</Label>
                <Input 
                  placeholder="მაგ: პურის რეცეპტი" 
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground">აღწერა (არასავალდებულო)</Label>
                <Input 
                  placeholder="მოკლე ინფორმაცია..." 
                  value={newRecipe.description}
                  onChange={(e) => setNewRecipe({...newRecipe, description: e.target.value})}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground">მოსავლიანობა (%)</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    placeholder="100" 
                    value={newRecipe.yieldPercentage}
                    onChange={(e) => setNewRecipe({...newRecipe, yieldPercentage: parseFloat(e.target.value) || 100})}
                    className="h-12 rounded-xl"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-black text-sm uppercase tracking-wider text-primary">ინგრედიენტები</Label>
                <Button variant="outline" size="sm" onClick={handleAddRecipeItem} className="h-8 rounded-lg border-primary/20 hover:bg-primary/5 text-primary text-xs font-bold">
                  <Plus className="h-3 w-3 mr-1" />
                  დამატება
                </Button>
              </div>

              <div className="space-y-3">
                {recipeItems.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end group animate-in slide-in-from-right-2">
                    <div className="flex-1 space-y-1.5">
                      <Select value={item.ingredientId} onValueChange={(val) => handleUpdateRecipeItem(index, 'ingredientId', val)}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="ინგრედიენტი" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {store.products.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32 space-y-1.5">
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="რაოდ." 
                          value={item.quantity}
                          onChange={(e) => handleUpdateRecipeItem(index, 'quantity', parseFloat(e.target.value))}
                          className="h-11 rounded-xl pr-10 text-center font-bold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">ცალი</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-11 w-11 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                      onClick={() => handleRemoveRecipeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddingRecipe(false)} className="h-12 rounded-xl font-bold flex-1">გაუქმება</Button>
            <Button onClick={handleCreateRecipe} className="h-12 rounded-xl font-black flex-[2] bg-primary text-white hover:bg-primary/90">შენახვა</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXECUTE PRODUCTION DIALOG */}
      <Dialog open={!!executingRecipeId} onOpenChange={(val) => !val && setExecutingRecipeId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">წარმოების დაწყება</DialogTitle>
            <DialogDescription>
              მიუთითეთ რამდენი ერთეულის წარმოება გსურთ.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Play className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">
                    {store.recipes.find(r => r.id === executingRecipeId)?.name || "რეცეპტი"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {store.recipes.find(r => r.id === executingRecipeId)?.productName}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">საწარმოო რაოდენობა</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={productionForm.quantity}
                    onChange={(e) => setProductionForm({...productionForm, quantity: parseFloat(e.target.value) || 0})}
                    className="h-12 rounded-xl text-center font-black text-lg border-2 border-primary/20 focus-visible:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">ცალი</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">დანაკარგი (წუნი)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={productionForm.wastage}
                    onChange={(e) => setProductionForm({...productionForm, wastage: parseFloat(e.target.value) || 0})}
                    className="h-12 rounded-xl text-center font-black text-lg border-2 border-rose-100 focus-visible:border-rose-300"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground text-rose-400">ცალი</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">შენიშვნა</Label>
              <Input 
                placeholder="დამატებითი დეტალები..." 
                value={productionForm.notes}
                onChange={(e) => setProductionForm({...productionForm, notes: e.target.value})}
                className="h-12 rounded-xl"
              />
            </div>

            {/* MRP CHECKER */}
            {executingRecipeId && (
              <div className="mt-4 border rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b text-[10px] font-black uppercase tracking-widest text-slate-500">
                  მარაგების შემოწმება
                </div>
                <div className="p-3 space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                  {(() => {
                    const missing = store.checkMaterialAvailability(executingRecipeId, productionForm.quantity);
                    const recipe = store.recipes.find(r => r.id === executingRecipeId);
                    if (!recipe) return null;

                    return recipe.items.map(item => {
                      const m = missing.find(x => x.ingredientId === item.ingredientId);
                      return (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-600">{item.ingredientName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{item.quantity * productionForm.quantity} ც</span>
                            {m ? (
                              <Badge variant="outline" className="text-rose-500 border-rose-200 bg-rose-50 font-black text-[9px] px-1.5 h-4">
                                აკლია {m.missing}
                              </Badge>
                            ) : (
                              <PackageCheck className="h-3 w-3 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExecutingRecipeId(null)} className="h-12 rounded-xl font-bold flex-1">გაუქმება</Button>
            <Button onClick={handleExecuteProduction} className="h-12 rounded-xl font-black flex-[2] bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
              <Play className="h-4 w-4 mr-2 fill-current" />
              გაშვება
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecipeList({ onExecute, onDelete }: { onExecute: (id: string) => void, onDelete: (id: string) => void }) {
  const store = useWarehouseStore();
  const recipes = store.recipes;

  if (recipes.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-transparent shadow-none py-20">
        <div className="flex flex-col items-center text-center px-4">
          <ChefHat className="h-16 w-16 text-muted-foreground opacity-10 mb-4" />
          <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">რეცეპტები არ არის</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            დაამატეთ ახალი რეცეპტი წარმოების დასაწყებად.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {recipes.map(recipe => (
        <Card key={recipe.id} className="group overflow-hidden rounded-2xl border-border/50 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5">
          <CardHeader className="p-5 pb-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Badge variant="outline" className="border-primary/20 text-primary font-black text-[9px] uppercase tracking-tighter">
                  {recipe.productName}
                </Badge>
                <CardTitle className="text-lg font-black text-slate-800 tracking-tight">
                  {recipe.name || "უსახელო რეცეპტი"}
                </CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(recipe.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {recipe.description && (
              <CardDescription className="text-xs line-clamp-2 mt-2 leading-relaxed">
                {recipe.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center justify-between">
                <span>თვითღირებულება (EST.)</span>
                <span className="text-slate-900 font-black">{store.getRecipeCost(recipe.id).toFixed(2)} ₾ / ც</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">მოსავლიანობა</span>
                <span className="text-xs font-black text-slate-700">{recipe.yieldPercentage}%</span>
              </div>
              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center justify-between mt-4">
                <span>შემადგენლობა</span>
                <span>{recipe.items.length} ინგრედიენტი</span>
              </div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                {recipe.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-600 truncate mr-2">{item.ingredientName}</span>
                    <span className="font-black text-primary bg-white px-2 py-0.5 rounded shadow-sm shrink-0 border border-slate-100">
                      {item.quantity} ც
                    </span>
                  </div>
                ))}
                {recipe.items.length > 3 && (
                  <div className="text-[10px] text-center text-muted-foreground py-1 font-bold">
                    + კიდევ {recipe.items.length - 3} ინგრედიენტი
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={() => onExecute(recipe.id)}
              className="w-full bg-slate-900 hover:bg-primary text-white font-black rounded-xl h-11 transition-all flex items-center justify-center gap-2 group/btn"
            >
              <Play className="h-4 w-4 group-hover/btn:fill-current" />
              წარმოების დაწყება
              <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProductionHistory() {
  const store = useWarehouseStore();
  const logs = store.productionLogs;

  if (logs.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-transparent shadow-none py-20">
        <div className="flex flex-col items-center text-center px-4">
          <History className="h-16 w-16 text-muted-foreground opacity-10 mb-4" />
          <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">ისტორია ცარიელია</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            აქ გამოჩნდება განხორციელებული წარმოების ჩანაწერები.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent border-b-2">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">პარტია / თარიღი</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">პროდუქცია</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">რაოდენობა</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">თვითღირებულება</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">თანამშრომელი</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id} className="hover:bg-primary/5 transition-colors group">
                <TableCell className="font-medium text-slate-600 whitespace-nowrap py-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary font-mono bg-primary/5 px-2 py-0.5 rounded w-fit mb-1 tracking-tight">
                      {log.batchNumber || "NO-BATCH"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("ka-GE", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800">{log.productName}</span>
                    {log.notes && <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{log.notes}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 font-black px-3 py-1">
                      {log.quantityProduced} ცალი
                    </Badge>
                    {log.wastageQuantity > 0 && (
                      <span className="text-[10px] font-bold text-rose-500 mt-1">
                        წუნი: -{log.wastageQuantity} ც
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-black text-slate-700">
                    {(log.totalCost || 0).toFixed(2)} ₾
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {log.employeeName?.[0] || 'A'}
                    </div>
                    <span className="text-xs font-medium text-slate-600 truncate">{log.employeeName || "ადმინისტრატორი"}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
