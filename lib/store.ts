import { supabase } from "./supabase";
import { toast } from "sonner";

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  client: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  salePrice: number;
  totalAmount: number;
  paidAmount: number; // Added for debt tracking
  status: "paid" | "partial" | "unpaid"; // Added for debt tracking
  client: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface PurchaseHistory {
  id: string;
  productId: string;
  productName: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  client: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  phone: string;
  pinCode?: string; // New field
  createdAt: string;
}

export type StoreListener = () => void;

export interface StoreSnapshot {
  products: Product[];
  sales: Sale[];
  expenses: Expense[]; // Added
  totalProducts: number;
  getTotalSalesItemCount: () => number;
  totalStock: number;
  totalPurchaseValue: number;
  totalSaleValue: number;
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number; // Added
  categories: string[];
  salesByMonth: { month: string; revenue: number; profit: number }[];
  topProducts: { name: string; sold: number; revenue: number }[];
  categoryDistribution: { category: string; count: number; value: number }[];
  lowStockProducts: Product[];
  purchaseHistory: PurchaseHistory[];

  // Actions
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, "id" | "createdAt">) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Omit<Employee, "id" | "createdAt">>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  // PIN Identification
  currentEmployee: Employee | null;
  loginEmployee: (pin: string) => Promise<boolean>;
  logoutEmployee: () => void;
}

class WarehouseStore {
  private products: Product[] = [];
  private sales: Sale[] = [];
  private purchaseHistory: PurchaseHistory[] = [];
  private expenses: Expense[] = [];
  private employees: Employee[] = [];
  private currentEmployee: Employee | null = null;
  private listeners: Set<StoreListener> = new Set();
  private _cachedSnapshot: StoreSnapshot | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (typeof window === "undefined") return;

    try {
      // Parallel fetch products, sales, and purchase history
      const [{ data: productsData }, { data: salesData }, { data: purchaseData }, { data: expensesData }, { data: employeesData }] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('purchase_history').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('employees').select('*')
      ]);

      if (expensesData) {
        this.expenses = expensesData.map((e: any) => ({
          id: e.id,
          amount: Number(e.amount) || 0,
          category: e.category || "",
          description: e.description || "",
          date: e.date || new Date().toISOString(),
          createdAt: e.created_at || new Date().toISOString()
        }));
      }

      if (productsData) {
        this.products = productsData.map((p: any) => ({
          id: p.id,
          name: p.name || "",
          category: p.category_name || "",
          barcode: p.barcode || "",
          purchasePrice: Number(p.purchase_price) || 0,
          salePrice: Number(p.sale_price) || 0,
          quantity: p.quantity || 0,
          client: p.client || "",
          createdAt: p.created_at || new Date().toISOString()
        }));
      }

      if (employeesData) {
        this.employees = employeesData.map((e: any) => ({
          id: e.id,
          name: e.name,
          position: e.position,
          phone: e.phone || "",
          pinCode: e.pin_code || "",
          createdAt: e.created_at
        }));
      }

      if (salesData) {
        this.sales = salesData.map((s: any) => ({
          id: s.id,
          productId: s.product_id,
          productName: s.product_name || "",
          category: s.category_name || "",
          quantity: s.quantity || 0,
          salePrice: Number(s.sale_price) || 0,
          totalAmount: Number(s.total_amount) || 0,
          paidAmount: Number(s.paid_amount) || Number(s.total_amount) || 0,
          status: s.status || "paid",
          client: s.client || "",
          createdAt: s.created_at || new Date().toISOString()
        }));
      }

      if (purchaseData) {
        this.purchaseHistory = purchaseData.map((ph: any) => ({
          id: ph.id,
          productId: ph.product_id,
          productName: ph.product_name || "",
          category: ph.category_name || "",
          purchasePrice: Number(ph.purchase_price) || 0,
          salePrice: Number(ph.sale_price) || 0,
          quantity: ph.quantity || 0,
          client: ph.client || "",
          createdAt: ph.created_at || new Date().toISOString()
        }));
      }

      this.initialized = true;
      this.notify();

      // Subscribe to changes
      supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          this.handleRealtimeProduct(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
          this.handleRealtimeSale(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_history' }, (payload) => {
          this.handleRealtimePurchase(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
          this.handleRealtimeExpense(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, (payload) => {
          this.handleRealtimeEmployee(payload);
        })
        .subscribe();

    } catch (error) {
      console.error("Supabase init error:", error);
    }
  }

  private handleRealtimeProduct(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    const mapProduct = (p: any) => ({
      id: p.id,
      name: p.name || "",
      category: p.category_name || "",
      barcode: p.barcode || "",
      purchasePrice: Number(p.purchase_price) || 0,
      salePrice: Number(p.sale_price) || 0,
      quantity: p.quantity || 0,
      client: p.client || "",
      createdAt: p.created_at || new Date().toISOString()
    });

    if (eventType === 'INSERT') {
      if (!this.products.find(p => p.id === newRow.id)) {
        this.products.push(mapProduct(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.products.findIndex(p => p.id === newRow.id);
      if (idx !== -1) this.products[idx] = mapProduct(newRow);
    } else if (eventType === 'DELETE') {
      this.products = this.products.filter(p => p.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeSale(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    const mapSale = (s: any) => ({
      id: s.id,
      productId: s.product_id,
      productName: s.product_name || "",
      category: s.category_name || "",
      quantity: s.quantity || 0,
      salePrice: Number(s.sale_price) || 0,
      totalAmount: Number(s.total_amount) || 0,
      paidAmount: Number(s.paid_amount) || Number(s.total_amount) || 0,
      status: s.status || "paid",
      client: s.client || "",
      createdAt: s.created_at || new Date().toISOString()
    });

    if (eventType === 'INSERT') {
      if (!this.sales.find(s => s.id === newRow.id)) {
        this.sales.push(mapSale(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.sales.findIndex(s => s.id === newRow.id);
      if (idx !== -1) this.sales[idx] = mapSale(newRow);
    } else if (eventType === 'DELETE') {
      this.sales = this.sales.filter(s => s.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimePurchase(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    const mapPurchase = (ph: any) => ({
      id: ph.id,
      productId: ph.product_id,
      productName: ph.product_name || "",
      category: ph.category_name || "",
      purchasePrice: Number(ph.purchase_price) || 0,
      salePrice: Number(ph.sale_price) || 0,
      quantity: ph.quantity || 0,
      client: ph.client || "",
      createdAt: ph.created_at || new Date().toISOString()
    });

    if (eventType === 'INSERT') {
      if (!this.purchaseHistory.find(ph => ph.id === newRow.id)) {
        this.purchaseHistory.push(mapPurchase(newRow));
      }
    } else if (eventType === 'DELETE') {
      this.purchaseHistory = this.purchaseHistory.filter(ph => ph.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeExpense(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    const mapExpense = (e: any) => ({
      id: e.id,
      amount: Number(e.amount) || 0,
      category: e.category || "",
      description: e.description || "",
      date: e.date || new Date().toISOString(),
      createdAt: e.created_at || new Date().toISOString()
    });

    if (eventType === 'INSERT') {
      if (!this.expenses.find(e => e.id === newRow.id)) {
        this.expenses.push(mapExpense(newRow));
        this.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.expenses.findIndex(e => e.id === newRow.id);
      if (idx !== -1) this.expenses[idx] = mapExpense(newRow);
    } else if (eventType === 'DELETE') {
      this.expenses = this.expenses.filter(e => e.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeEmployee(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    const mapEmployee = (e: any) => ({
      id: e.id,
      name: e.name,
      position: e.position,
      phone: e.phone || "",
      pinCode: e.pin_code || "",
      createdAt: e.created_at
    });

    if (eventType === 'INSERT') {
      if (!this.employees.find(e => e.id === newRow.id)) {
        this.employees.push(mapEmployee(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.employees.findIndex(e => e.id === newRow.id);
      if (idx !== -1) this.employees[idx] = mapEmployee(newRow);
    } else if (eventType === 'DELETE') {
      this.employees = this.employees.filter(e => e.id !== oldRow.id);
    }
    this.notify();
  }

  private invalidateSnapshot() {
    this._cachedSnapshot = null;
  }

  private notify() {
    this.invalidateSnapshot();
    this.listeners.forEach((l) => l());
  }

  getSnapshot(): StoreSnapshot {
    if (this._cachedSnapshot) return this._cachedSnapshot;

    this._cachedSnapshot = {
      products: this.getProducts(),
      sales: this.getSales(),
      totalProducts: this.getTotalProducts(),
      getTotalSalesItemCount: () => this.getTotalSalesItemCount(),
      totalStock: this.getTotalStock(),
      totalPurchaseValue: this.getTotalPurchaseValue(),
      totalSaleValue: this.getTotalSaleValue(),
      totalRevenue: this.getTotalRevenue(),
      totalProfit: this.getTotalProfit(),
      totalExpenses: this.getTotalExpenses(), // Added
      categories: this.getCategories(),
      salesByMonth: this.getSalesByMonth(),
      topProducts: this.getTopProducts(),
      categoryDistribution: this.getCategoryDistribution(),
      lowStockProducts: this.getLowStockProducts(),
      purchaseHistory: this.getPurchaseHistory(),
      expenses: this.getExpenses(),
      employees: this.getEmployees(),

      addExpense: this.addExpense.bind(this),
      deleteExpense: this.deleteExpense.bind(this),
      addEmployee: this.addEmployee.bind(this),
      updateEmployee: this.updateEmployee.bind(this),
      deleteEmployee: this.deleteEmployee.bind(this),

      currentEmployee: this.currentEmployee,
      loginEmployee: this.loginEmployee.bind(this),
      logoutEmployee: this.logoutEmployee.bind(this)
    };

    return this._cachedSnapshot;
  }

  subscribe(listener: StoreListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Products
  getProducts(): Product[] {
    return [...this.products];
  }

  getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  getProductByBarcode(barcode: string): Product | undefined {
    const trimmed = barcode.trim();
    return this.products.find((p) => p.barcode && p.barcode.trim() === trimmed);
  }

  async addProduct(product: Omit<Product, "id" | "createdAt">) {
    // Check if product with same name exists - update quantity
    const existing = this.products.find(
      (p) => p.name.toLowerCase() === product.name.toLowerCase()
    );

    if (existing) {
      const newQuantity = existing.quantity + product.quantity;
      const updates: any = {
        quantity: newQuantity,
        purchase_price: product.purchasePrice,
        sale_price: product.salePrice,
        category_name: product.category || existing.category,
        client: product.client || existing.client,
      };

      if (product.barcode) {
        updates.barcode = product.barcode;
        existing.barcode = product.barcode;
      }

      // Optimistic update
      existing.quantity = newQuantity;
      existing.purchasePrice = product.purchasePrice;
      existing.salePrice = product.salePrice;
      existing.category = product.category || existing.category;
      existing.client = product.client || existing.client;
      this.notify();

      // Supabase update
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', existing.id);

      if (error) {
        console.error("Error updating product:", error);
        toast.error("შეცდომა პროდუქტის განახლებისას");
      }
    } else {
      const newProduct: any = {
        id: crypto.randomUUID(),
        name: product.name,
        category_name: product.category,
        purchase_price: product.purchasePrice,
        sale_price: product.salePrice,
        quantity: product.quantity,
        client: product.client,
        created_at: new Date().toISOString(),
      };

      // Only include barcode if it has a value
      if (product.barcode) {
        newProduct.barcode = product.barcode;
      }

      // Optimistic update - map to internal interface
      this.products.push({
        ...product,
        id: newProduct.id,
        createdAt: newProduct.created_at
      });
      this.notify();

      // Supabase insert
      const { error } = await supabase
        .from('products')
        .insert(newProduct);

      if (error) {
        console.error("Error adding product:", JSON.stringify(error, null, 2));
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Error hint:", error.hint);
        this.products = this.products.filter(p => p.id !== newProduct.id);
        this.notify();
        toast.error(error.message || "შეცდომა პროდუქტის დამატებისას");
      }
    }
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, "id" | "createdAt">>) {
    const product = this.products.find((p) => p.id === id);
    if (!product) throw new Error("პროდუქცია ვერ მოიძებნა");

    const oldProduct = { ...product };
    // Optimistic update
    Object.assign(product, updates);
    this.notify();

    // Map to snake_case for DB
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category_name = updates.category;
    if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
    if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
    if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.client !== undefined) dbUpdates.client = updates.client;

    // Supabase update
    const { error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error("Error updating product:", error);
      Object.assign(product, oldProduct);
      this.notify();
      toast.error("შეცდომა განახლებისას");
    }
  }

  async deleteProduct(id: string) {
    const oldProducts = [...this.products];
    const oldSales = [...this.sales];
    const oldPurchaseHistory = [...this.purchaseHistory];

    // Optimistic delete - remove product, related sales, and purchase history
    this.products = this.products.filter((p) => p.id !== id);
    this.sales = this.sales.filter((s) => s.productId !== id);
    this.purchaseHistory = this.purchaseHistory.filter((ph) => ph.productId !== id);
    this.notify();

    try {
      // First delete related sales
      const { error: salesError } = await supabase
        .from('sales')
        .delete()
        .eq('product_id', id);

      if (salesError) {
        console.error("Error deleting related sales:", salesError.message);
      }

      // Then delete related purchase history
      const { error: historyError } = await supabase
        .from('purchase_history')
        .delete()
        .eq('product_id', id);

      if (historyError) {
        console.error("Error deleting purchase history:", historyError.message);
      }

      // Finally delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting product:", error.message);
        // Rollback
        this.products = oldProducts;
        this.sales = oldSales;
        this.purchaseHistory = oldPurchaseHistory;
        this.notify();
        toast.error(error.message || "შეცდომა წაშლისას");
      }
    } catch (err) {
      console.error("Delete error:", err);
      this.products = oldProducts;
      this.sales = oldSales;
      this.purchaseHistory = oldPurchaseHistory;
      this.notify();
      toast.error("შეცდომა წაშლისას");
    }
  }

  // Sales
  getSales(): Sale[] {
    return [...this.sales];
  }

  getExpenses(): Expense[] {
    return [...this.expenses];
  }

  getEmployees(): Employee[] {
    return [...this.employees];
  }

  async updateSale(id: string, updates: { quantity?: number; salePrice?: number; client?: string; paidAmount?: number; status?: "paid" | "partial" | "unpaid" }) {
    const sale = this.sales.find((s) => s.id === id);
    if (!sale) throw new Error("გაყიდვა ვერ მოიძებნა");

    const product = this.products.find((p) => p.id === sale.productId);
    const oldSale = { ...sale };
    const oldProductQuantity = product ? product.quantity : 0;

    // Optimistic UI update for quantity change
    if (updates.quantity !== undefined && updates.quantity !== sale.quantity) {
      const diff = updates.quantity - sale.quantity;
      if (product) {
        if (product.quantity < diff) {
          throw new Error(`არასაკმარისი რაოდენობა. საწყობში არის: ${product.quantity}`);
        }
        product.quantity -= diff;
      }
      sale.quantity = updates.quantity;
    }

    if (updates.salePrice !== undefined) sale.salePrice = updates.salePrice;
    if (updates.client !== undefined) sale.client = updates.client;
    if (updates.paidAmount !== undefined) sale.paidAmount = updates.paidAmount;
    if (updates.status !== undefined) sale.status = updates.status;

    sale.totalAmount = sale.salePrice * sale.quantity;

    this.notify();

    // Supabase update - DB Trigger will handle product stock
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          quantity: sale.quantity,
          sale_price: sale.salePrice,
          total_amount: sale.totalAmount,
          client: sale.client,
          paid_amount: sale.paidAmount,
          status: sale.status
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating sale:", error);
      Object.assign(sale, oldSale);
      if (product) product.quantity = oldProductQuantity;
      this.notify();
      toast.error("შეცდომა განახლებისას");
    }
  }

  async deleteSale(id: string) {
    const sale = this.sales.find((s) => s.id === id);
    if (!sale) return;

    const product = this.products.find((p) => p.id === sale.productId);
    const oldSales = [...this.sales];
    const oldProductQuantity = product ? product.quantity : 0;

    // Optimistic return quantity back to product
    if (product) product.quantity += sale.quantity;
    this.sales = this.sales.filter((s) => s.id !== id);
    this.notify();

    // Supabase delete - DB Trigger will handle product stock return
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting sale:", error);
      this.sales = oldSales;
      if (product) product.quantity = oldProductQuantity;
      this.notify();
      toast.error("შეცდომა წაშლისას");
    }
  }

  async addSale(sale: Omit<Sale, "id" | "createdAt" | "totalAmount">) {
    const product = this.products.find((p) => p.id === sale.productId);
    if (!product) throw new Error("პროდუქცია ვერ მოიძებნა");
    if (product.quantity < sale.quantity)
      throw new Error(`არასაკმარისი რაოდენობა. საწყობში არის: ${product.quantity}`);

    const oldProductQuantity = product.quantity;
    const newSale = {
      id: crypto.randomUUID(),
      product_id: sale.productId,
      product_name: sale.productName,
      category_name: sale.category,
      quantity: sale.quantity,
      sale_price: sale.salePrice,
      total_amount: sale.salePrice * sale.quantity,
      paid_amount: sale.paidAmount,
      status: sale.status,
      created_at: new Date().toISOString(),
      client: sale.client
    };

    // Optimistic update
    product.quantity -= sale.quantity;
    this.sales.push({
      ...sale,
      id: newSale.id,
      totalAmount: newSale.total_amount,
      createdAt: newSale.created_at
    });
    this.notify();

    // Supabase insert - DB Trigger will handle product stock
    try {
      const { error } = await supabase.from('sales').insert(newSale);
      if (error) throw error;
    } catch (error) {
      console.error("Error adding sale:", error);
      product.quantity = oldProductQuantity;
      this.sales = this.sales.filter(s => s.id !== newSale.id);
      this.notify();
      toast.error("შეცდომა გაყიდვისას");
    }
  }

  // Expenses
  async addExpense(expense: Omit<Expense, "id" | "createdAt">) {
    const optimisticId = crypto.randomUUID();
    const optimisticCreatedAt = new Date().toISOString();

    this.expenses.push({
      ...expense,
      id: optimisticId,
      createdAt: optimisticCreatedAt
    });
    this.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.notify();

    // Supabase insert
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          amount: Number(expense.amount),
          category: expense.category || "",
          description: expense.description || "",
          date: expense.date || new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      // Update optimistic record with real ID from DB if necessary
      if (data) {
        const idx = this.expenses.findIndex(e => e.id === optimisticId);
        if (idx !== -1) {
          this.expenses[idx] = {
            id: data.id,
            amount: Number(data.amount),
            category: data.category || "",
            description: data.description || "",
            date: data.date,
            createdAt: data.created_at
          };
          this.notify();
        }
      }
    } catch (error: any) {
      console.error("Error adding expense:", error.message || JSON.stringify(error), error.details, error.hint);
      this.expenses = this.expenses.filter(e => e.id !== optimisticId);
      this.notify();
      toast.error("შეცდომა ხარჯის დამატებისას: " + (error.message || "უცნობი შეცდომა"));
    }
  }

  async deleteExpense(id: string) {
    const oldExpenses = [...this.expenses];
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.notify();

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting expense:", error);
      this.expenses = oldExpenses;
      this.notify();
      toast.error("შეცდომა ხარჯის წაშლისას");
    }
  }

  // Employees
  async addEmployee(employee: Omit<Employee, "id" | "createdAt">) {
    const optimisticId = crypto.randomUUID();
    const optimisticCreatedAt = new Date().toISOString();

    this.employees.push({
      ...employee,
      id: optimisticId,
      createdAt: optimisticCreatedAt
    });
    this.notify();

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          name: employee.name,
          position: employee.position,
          phone: employee.phone || "",
          pin_code: employee.pinCode || ""
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const idx = this.employees.findIndex(e => e.id === optimisticId);
        if (idx !== -1) {
          this.employees[idx] = {
            id: data.id,
            name: data.name,
            position: data.position,
            phone: data.phone || "",
            pinCode: data.pin_code || "",
            createdAt: data.created_at
          };
          this.notify();
        }
      }
    } catch (error: any) {
      console.error("Error adding employee:", error);
      this.employees = this.employees.filter(e => e.id !== optimisticId);
      this.notify();
      const errorMessage = error.message || error.details || "უცნობი შეცდომა";
      toast.error("შეცდომა თანამშრომლის დამატებისას: " + errorMessage);
      throw error; // Rethrow so the UI knows it failed
    }
  }

  async updateEmployee(id: string, employee: Partial<Omit<Employee, "id" | "createdAt">>) {
    const oldEmployee = this.employees.find(e => e.id === id);
    if (!oldEmployee) return;

    const originalData = { ...oldEmployee };

    // Optimistic update
    Object.assign(oldEmployee, employee);
    this.notify();

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          name: employee.name,
          position: employee.position,
          phone: employee.phone,
          pin_code: employee.pinCode
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating employee:", error);
      Object.assign(oldEmployee, originalData);
      this.notify();
      toast.error("შეცდომა თანამშრომლის განახლებისას");
    }
  }

  async deleteEmployee(id: string) {
    const oldEmployees = [...this.employees];
    this.employees = this.employees.filter(e => e.id !== id);
    this.notify();

    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting employee:", error);
      this.employees = oldEmployees;
      this.notify();
      toast.error("შეცდომა თანამშრომლის წაშლისას");
    }
  }

  async loginEmployee(pin: string): Promise<boolean> {
    const employee = this.employees.find(e => e.pinCode === pin);
    if (employee) {
      this.currentEmployee = employee;
      this.notify();
      return true;
    }
    return false;
  }

  logoutEmployee() {
    this.currentEmployee = null;
    this.notify();
  }

  // Analytics
  getTotalProducts(): number {
    return this.products.length;
  }

  getTotalSalesItemCount(): number {
    return this.sales.reduce((acc, s) => acc + s.quantity, 0);
  }

  getTotalStock(): number {
    return this.products.reduce((acc, p) => acc + p.quantity, 0);
  }

  getTotalPurchaseValue(): number {
    return this.products.reduce(
      (acc, p) => acc + p.purchasePrice * p.quantity,
      0
    );
  }

  getTotalSaleValue(): number {
    return this.products.reduce((acc, p) => acc + p.salePrice * p.quantity, 0);
  }

  getTotalRevenue(): number {
    return this.sales.reduce((acc, s) => acc + s.totalAmount, 0);
  }

  getTotalProfit(): number {
    return this.sales.reduce((acc, s) => {
      const product = this.products.find((p) => p.id === s.productId);
      const purchasePrice = product?.purchasePrice ?? 0;
      return acc + (s.salePrice - purchasePrice) * s.quantity;
    }, 0);
  }

  getTotalExpenses(): number {
    return this.expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }

  getCategories(): string[] {
    const cats = new Set(
      this.products.map((p) => p.category).filter(Boolean)
    );
    return Array.from(cats);
  }

  getSalesByMonth(): { month: string; revenue: number; profit: number }[] {
    const map = new Map<string, { revenue: number; profit: number }>();
    this.sales.forEach((s) => {
      const date = new Date(s.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = map.get(key) || { revenue: 0, profit: 0 };
      const product = this.products.find((p) => p.id === s.productId);
      const purchasePrice = product?.purchasePrice ?? 0;
      existing.revenue += s.totalAmount;
      existing.profit += (s.salePrice - purchasePrice) * s.quantity;
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }

  getTopProducts(limit = 5): { name: string; sold: number; revenue: number }[] {
    const map = new Map<string, { sold: number; revenue: number }>();
    this.sales.forEach((s) => {
      const existing = map.get(s.productName) || { sold: 0, revenue: 0 };
      existing.sold += s.quantity;
      existing.revenue += s.totalAmount;
      map.set(s.productName, existing);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  getCategoryDistribution(): { category: string; count: number; value: number }[] {
    const map = new Map<string, { count: number; value: number }>();
    this.products.forEach((p) => {
      const cat = p.category || "სხვა";
      const existing = map.get(cat) || { count: 0, value: 0 };
      existing.count += p.quantity;
      existing.value += p.salePrice * p.quantity;
      map.set(cat, existing);
    });
    return Array.from(map.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));
  }

  getLowStockProducts(threshold = 5): Product[] {
    return this.products.filter(p => p.quantity < threshold);
  }

  getPurchaseHistory(): PurchaseHistory[] {
    return [...this.purchaseHistory];
  }

  // Data management
  async clearAll() {
    this.products = [];
    this.sales = [];
    this.purchaseHistory = [];
    this.expenses = []; // Added
    this.employees = []; // Added
    this.notify();

    try {
      const results = await Promise.all([
        supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('purchase_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error("Errors clearing some tables:", errors);
        // If purchase_history failed but products succeeded, it might be RLS
        // But since products succeeded and it has CASCADE, it might have deleted anyway
        toast.error("ზოგიერთი მონაცემი ვერ წაიშალა");
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("შეცდომა მონაცემების წაშლისას");
    }
  }

  async importData(products: Product[], sales: Sale[], expenses: Expense[] = []) {
    this.products = products;
    this.sales = sales;
    this.expenses = expenses; // Added
    this.notify();

    const dbProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      category_name: p.category,
      purchase_price: p.purchasePrice,
      sale_price: p.salePrice,
      quantity: p.quantity,
      client: p.client,
      created_at: p.createdAt
    }));

    const dbSales = sales.map(s => ({
      id: s.id,
      product_id: s.productId,
      product_name: s.productName,
      category_name: s.category,
      quantity: s.quantity,
      sale_price: s.salePrice,
      total_amount: s.totalAmount,
      client: s.client,
      created_at: s.createdAt
    }));

    const dbExpenses = expenses.map(e => ({
      id: e.id,
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: e.date,
      created_at: e.createdAt
    }));

    try {
      await Promise.all([
        supabase.from('products').upsert(dbProducts),
        supabase.from('sales').upsert(dbSales),
        supabase.from('expenses').upsert(dbExpenses) // Added
      ]);
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("შეცდომა იმპორტისას");
    }
  }

  exportData(): { products: Product[]; sales: Sale[]; expenses: Expense[] } {
    return {
      products: [...this.products],
      sales: [...this.sales],
      expenses: [...this.expenses],
    };
  }
}

// Singleton - lazy init to avoid SSR issues
let _instance: WarehouseStore | null = null;
function getWarehouseStore(): WarehouseStore {
  if (!_instance) {
    _instance = new WarehouseStore();
  }
  return _instance;
}

export const warehouseStore = typeof window !== "undefined"
  ? getWarehouseStore()
  : new WarehouseStore();
