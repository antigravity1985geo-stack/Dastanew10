import { supabase } from "./supabase";
import { toast } from "sonner";
import { authStore } from "./auth";
import { settingsStore } from "./settings";
import { CHART_OF_ACCOUNTS } from "./coa";
import { hashPin } from "./utils";

const EMPLOYEE_SESSION_KEY = "dasta_employee_session";
const SHIFTS_KEY = "dasta_shifts";

// Multi-tenancy helper
function getTenantId(): string | null {
  return authStore.getTenantId();
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  transactions: {
    accountCode: string;
    debit: number;
    credit: number;
  }[];
  referenceId: string; // ID of sale, purchase, or expense
  referenceType: 'sale' | 'purchase' | 'expense' | 'transfer' | 'inventory_session';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  imageUrl?: string;
  purchasePrice: number;
  salePrice: number;
  discountPrice?: number; // New: Promotional/Sale price
  wholesalePrice?: number;
  quantity: number;
  minStockLevel?: number; // Fix #4: Low Stock Alerts
  supplier?: string;
  client?: string;
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
  totalValue?: number; // Added for RS.GE Fiscal Receipt
  paymentMethod?: 'cash' | 'card' | 'split' | 'nisia'; // Added for RS.GE Fiscal Receipt
  paidInCash: number; // Split payment support
  paidInCard: number; // Split payment support
  status: "paid" | "partial" | "unpaid";
  client: string;
  currency: "GEL" | "USD" | "EUR"; // Added
  exchangeRate: number; // Added
  idempotencyKey?: string; // Added for RS.GE sync
  receiptNumber?: string; // Added for RS.GE Fiscal Receipt
  discountTotal?: number; // Added Phase 5: Track lost revenue from discounts
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  paymentMethod: 'cash' | 'bank';
  currency: "GEL" | "USD" | "EUR"; // Added
  exchangeRate: number; // Added
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
  paidInCash: number;
  paidInCard: number;
  supplier: string;
  client?: string;
  currency: "GEL" | "USD" | "EUR";
  exchangeRate: number;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  phone: string;
  pinCode?: string;
  baseSalary: number;
  salaryType: 'monthly' | 'daily' | 'hourly';
  createdAt: string;
}

export interface PayrollPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  paymentMethod: 'cash' | 'bank';
  paymentDate: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  actionType: "INSERT" | "UPDATE" | "DELETE";
  tableName: "sales" | "expenses" | "products" | "transfers" | "employees";
  recordId: string;
  oldData?: any;
  newData?: any;
  createdAt: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  expectedCash?: number;
  actualCash?: number;
  variance?: number;
  status: 'open' | 'closed';
}

export interface Return {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  refundAmount: number;
  reason: string;
  employeeId?: string;
  employeeName?: string;
  createdAt: string;
}

export interface InventorySession {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  employeeId?: string;
  employeeName?: string;
  notes?: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  productId: string;
  productName: string;
  name?: string;
  description?: string;
  yieldPercentage: number;
  items: RecipeItem[];
  createdAt: string;
}

export interface RecipeItem {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
}

export interface ProductionLog {
  id: string;
  recipeId: string;
  productId: string;
  productName: string;
  quantityProduced: number;
  wastageQuantity: number;
  batchNumber: string;
  totalCost: number;
  employeeId?: string;
  employeeName?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryCount {
  id: string;
  sessionId: string;
  productId: string;
  productName: string;
  expectedQty: number;
  countedQty: number;
  variance: number;
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
  recipes: Recipe[];
  productionLogs: ProductionLog[];
  auditLogs: AuditLog[]; // Added Phase 5
  initialized: boolean; // Added for AccessGuard

  // Actions
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Period Closing action
  setClosedUntil: (date: string | undefined) => void;

  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, "id" | "createdAt">) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Omit<Employee, "id" | "createdAt">>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  // PIN Identification
  currentEmployee: Employee | null;
  loginEmployee: (pin: string) => Promise<Employee | null>;
  logoutEmployee: () => void;

  // Debts
  updatePurchaseHistory: (id: string, updates: { paidInCash?: number; paidInCard?: number }) => Promise<void>;
  payoffDebts: (transactions: any[], amount: number, method: 'cash' | 'bank', type: 'customer' | 'supplier') => Promise<void>;
  importWaybillToWarehouse: (items: any[]) => Promise<void>;

  // Shift Management
  shifts: Shift[];
  currentShift: Shift | null;
  openShift: (openingCash: number) => Promise<void>;
  closeShift: (actualCash: number) => Promise<void>;

  // Accounting Reform (NEW)
  journalEntries: JournalEntry[];
  getAccountBalance: (code: string) => number;

  // Returns
  returns: Return[];
  addReturn: (saleId: string, items: { productId: string; productName: string; quantity: number; refundAmount: number }[], reason: string) => Promise<void>;
  getReturnsBySale: (saleId: string) => Return[];

  // Inventory
  inventorySessions: InventorySession[];
  inventoryCounts: InventoryCount[];
  startInventorySession: (name: string, notes?: string) => Promise<string>;
  submitCount: (sessionId: string, productId: string, countedQty: number) => Promise<void>;
  completeInventorySession: (sessionId: string) => Promise<void>;
  cancelInventorySession: (sessionId: string) => Promise<void>;

  // Production
  addRecipe: (recipe: Partial<Recipe>, items: Partial<RecipeItem>[]) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  executeProduction: (recipeId: string, quantity: number, wastage: number, notes?: string) => Promise<void>;
  getRecipeCost: (recipeId: string) => number;
  checkMaterialAvailability: (recipeId: string, quantity: number) => { ingredientId: string; ingredientName: string; required: number; available: number; missing: number }[];

  // Payroll
  payrollPayments: PayrollPayment[];
  processSalaryPayment: (payment: Omit<PayrollPayment, 'id' | 'createdAt'>) => Promise<void>;
}

class WarehouseStore {
  private products: Product[] = [];
  private sales: Sale[] = [];
  private purchaseHistory: PurchaseHistory[] = [];
  private expenses: Expense[] = [];
  private employees: Employee[] = [];
  private auditLogs: AuditLog[] = []; // Phase 5
  private shifts: Shift[] = [];
  private currentShift: Shift | null = null;
  private journalEntries: JournalEntry[] = [];
  private returns: Return[] = [];
  private inventorySessions: InventorySession[] = [];
  private inventoryCounts: InventoryCount[] = [];
  private recipes: Recipe[] = [];
  private productionLogs: ProductionLog[] = [];
  private payrollPayments: PayrollPayment[] = [];
  private currentEmployee: Employee | null = null;
  private listeners: Set<StoreListener> = new Set();
  private _cachedSnapshot: StoreSnapshot | null = null;
  private initialized = false;

  private checkPeriodLocked(date: string) {
    const closedUntil = settingsStore.getSnapshot().closedUntil;
    if (closedUntil && new Date(date) <= new Date(closedUntil)) {
      const errorMsg = `პერიოდი ჩაკეტილია ${new Date(closedUntil).toLocaleDateString('ka-GE')}-მდე. ცვლილება შეუძლებელია.`;
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private async addJournalEntry(entry: Omit<JournalEntry, "id" | "createdAt">) {
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    // Optimistic local update
    this.journalEntries.unshift(newEntry);
    this.notify();

    // Supabase insert (assuming journal_entries table exists or will be created)
    const dbEntry = {
      id: newEntry.id,
      date: newEntry.date,
      description: newEntry.description,
      transactions: JSON.stringify(newEntry.transactions),
      reference_id: newEntry.referenceId,
      reference_type: newEntry.referenceType,
      created_at: newEntry.createdAt,
      tenant_id: getTenantId()
    };

    const { error } = await supabase.from('journal_entries').insert(dbEntry);
    if (error) {
      console.warn("Journal logging failed (Table might be missing):", error.message);
      // We don't block the UI if table doesn't exist yet, but we log the intent
    }
  }

  private async logAction(log: Omit<AuditLog, "id" | "createdAt" | "userId">) {
    const { currentUser } = authStore.getSnapshot();
    const sanitizeJson = (obj: any) => obj ? JSON.parse(JSON.stringify(obj)) : null;

    const newLog = {
      user_id: currentUser?.id || null,
      action_type: log.actionType,
      table_name: log.tableName,
      record_id: log.recordId,
      old_data: sanitizeJson(log.oldData),
      new_data: sanitizeJson(log.newData),
      tenant_id: getTenantId()
    };

    // Optimistic local update
    this.auditLogs.unshift({
      ...log,
      id: crypto.randomUUID(),
      userId: currentUser?.id,
      createdAt: new Date().toISOString()
    });
    this.notify();

    // Supabase insert
    const { error } = await supabase.from('audit_logs').insert(newLog);
    if (error) {
      console.error("Audit logging failed. Payload:", newLog);
      console.error("Supabase Error Details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
  }

  private lastTenantId: string | null = null;

  constructor() {
    this.lastTenantId = authStore.getTenantId() || null;
    this.initialize();

    // Listen to Auth changes to reload data when switching tenants
    authStore.subscribe(() => {
      const currentTenantId = authStore.getTenantId();
      if (currentTenantId && currentTenantId !== this.lastTenantId) {
        this.lastTenantId = currentTenantId;
        this.resetAndReload();
      } else if (!currentTenantId && this.lastTenantId) {
        this.lastTenantId = null;
        this.clearLocalData();
      }
    });
  }

  private clearLocalData() {
    this.products = [];
    this.sales = [];
    this.purchaseHistory = [];
    this.expenses = [];
    this.employees = [];
    this.auditLogs = [];
    this.shifts = [];
    this.currentShift = null;
    this.journalEntries = [];
    this.returns = [];
    this.payrollPayments = [];
    this.currentEmployee = null;
    this.notify();
  }

  private async resetAndReload() {
    this.clearLocalData();
    await this.initialize();
  }

  private async initialize() {
    if (typeof window === "undefined") return;

    // Check if we actually have a tenant, otherwise don't fetch
    if (!authStore.getTenantId()) {
      this.initialized = true;
      this.notify();
      return;
    }

    try {
      const tenantId = getTenantId();
      console.log("DEBUG: store.initialize with tenantId:", tenantId);
      
      if (!tenantId || tenantId === "null" || tenantId === "undefined") {
        console.warn("DEBUG: Initializing store with empty/invalid tenantId, skipping fetch.");
        this.initialized = true;
        this.notify();
        return;
      }

      // Parallel fetch products, sales, and purchase history — filtered by tenant_id
      const [
        { data: productsData },
        { data: salesData },
        { data: purchaseData },
        { data: expensesData },
        { data: employeesData },
        { data: auditLogsData },
        { data: journalData },
        { data: returnsData },
        { data: invSessionsData },
        { data: invCountsData },
        { data: recipesData },
        { data: productionLogsData },
        { data: payrollPaymentsData }
      ] = await Promise.all([
        supabase.from('products').select('*').eq('tenant_id', tenantId),
        supabase.from('sales').select('*').eq('tenant_id', tenantId),
        supabase.from('purchase_history').select('*').eq('tenant_id', tenantId),
        supabase.from('expenses').select('*').eq('tenant_id', tenantId),
        supabase.from('employees').select('*').eq('tenant_id', tenantId),
        supabase.from('audit_logs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(100),
        supabase.from('journal_entries').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('returns').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('inventory_sessions').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('inventory_counts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('recipes').select('*, recipe_items(*)').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('production_logs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('payroll_payments').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      ]);

      if (payrollPaymentsData) {
        this.payrollPayments = payrollPaymentsData.map((p: any) => this.mapPayrollPayment(p));
      }

      if (journalData) {
        this.journalEntries = journalData.map(j => ({
          id: j.id,
          date: j.date,
          description: j.description,
          transactions: typeof j.transactions === 'string' ? JSON.parse(j.transactions) : j.transactions,
          referenceId: j.reference_id,
          referenceType: j.reference_type,
          createdAt: j.created_at
        }));
      }

      if (expensesData) {
        this.expenses = expensesData.map(e => this.mapExpense(e));
      }

      if (productsData) {
        this.products = productsData.map(p => this.mapProduct(p));
      }

      if (employeesData) {
        this.employees = employeesData.map(e => this.mapEmployee(e));
      }

      if (salesData) {
        this.sales = salesData.map(s => this.mapSale(s));
      }

      if (purchaseData) {
        this.purchaseHistory = purchaseData.map(ph => this.mapPurchase(ph));
      }

      if (returnsData) {
        this.returns = returnsData.map((r: any) => this.mapReturn(r));
      }

      if (invSessionsData) {
        this.inventorySessions = invSessionsData.map((s: any) => this.mapInventorySession(s));
      }

      if (invCountsData) {
        this.inventoryCounts = invCountsData.map((c: any) => this.mapInventoryCount(c));
      }

      if (recipesData) {
        this.recipes = recipesData.map((r: any) => this.mapRecipe(r));
      }

      if (productionLogsData) {
        this.productionLogs = productionLogsData.map((l: any) => this.mapProductionLog(l));
      }

      if (auditLogsData) {
        this.auditLogs = auditLogsData.map(log => ({
          id: log.id,
          userId: log.user_id,
          actionType: log.action_type,
          tableName: log.table_name,
          recordId: log.record_id,
          oldData: log.old_data,
          newData: log.new_data,
          createdAt: log.created_at
        }));
      }

      // Restore employee session from localStorage
      try {
        const savedEmpId = localStorage.getItem(EMPLOYEE_SESSION_KEY);
        if (savedEmpId) {
          const empId = JSON.parse(savedEmpId);
          const emp = this.employees.find(e => e.id === empId);
          if (emp) this.currentEmployee = emp;
        }
      } catch (e) { console.warn("Failed to restore employee session", e); }

      // Restore shifts from localStorage + Supabase
      try {
        const savedShifts = localStorage.getItem(SHIFTS_KEY);
        if (savedShifts) {
          const localShifts: Shift[] = JSON.parse(savedShifts);
          // Only restore open shift if it exists, historical shifts will come from Supabase next
          const openShift = localShifts.find(s => s.status === 'open');
          if (openShift) {
            this.shifts = [openShift];
            this.currentShift = openShift;
          }
        }
      } catch (e) { console.warn("Failed to restore local shifts", e); }

      try {
        const { data: dbShifts, error: shiftError } = await supabase.from('shifts').select('*').eq('tenant_id', tenantId).order('opened_at', { ascending: false }).limit(50);
        if (!shiftError && dbShifts && dbShifts.length > 0) {
          const mappedShifts = dbShifts.map(s => this.mapShift(s));

          // DB is the ultimate source of truth, ensure local open shift is accurate
          const dbOpenShift = mappedShifts.find(s => s.status === 'open');
          this.shifts = mappedShifts;

          if (dbOpenShift) {
            this.currentShift = dbOpenShift;
          } else {
            // If DB doesn't have an open shift, but local did, we probably missed an offline close.
            // Or, more safely, just trust the DB
            this.currentShift = null;
          }
          this.persistShifts();
        }
      } catch (e) { console.warn("Failed to fetch shifts from Supabase", e); }

      this.initialized = true;
      this.notify();

      // Subscribe to changes — filter by tenant_id to prevent cross-tenant leakage
      supabase
        .channel(`schema-db-changes-${tenantId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimeProduct(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimeSale(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_history', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimePurchase(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimeExpense(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimeEmployee(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'returns', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimeReturn(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_sessions', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimeInventorySession(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_counts', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimeInventoryCount(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimeRecipe(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'production_logs', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimeProductionLog(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payroll_payments', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          this.handleRealtimePayroll(payload);
        })
        .subscribe();

    } catch (error: any) {
      console.error("Supabase init error (400?):", error);
      if (error && typeof error === 'object' && error.message) {
        console.error("Error Message:", error.message);
        console.error("Error Context:", { tenantId: getTenantId() });
      }
    }
  }

  // --- Mappers ---
  private mapProduct(p: any): Product {
    return {
      id: p.id,
      name: p.name || "",
      category: p.category_name || "",
      barcode: p.barcode || "",
      imageUrl: p.image_url || "",
      purchasePrice: Number(p.purchase_price) || 0,
      salePrice: Number(p.sale_price) || 0,
      discountPrice: p.discount_price != null ? Number(p.discount_price) : undefined,
      wholesalePrice: Number(p.wholesale_price) || 0,
      quantity: p.quantity || 0,
      minStockLevel: p.min_stock_level != null ? Number(p.min_stock_level) : undefined,
      client: p.client || "",
      createdAt: p.created_at || new Date().toISOString()
    };
  }

  private mapSale(s: any): Sale {
    return {
      id: s.id,
      productId: s.product_id,
      productName: s.product_name || "",
      category: s.category_name || "",
      quantity: s.quantity || 0,
      salePrice: Number(s.sale_price) || 0,
      totalAmount: Number(s.total_amount) || 0,
      paidInCash: Number(s.paid_in_cash) || 0,
      paidInCard: Number(s.paid_in_card) || 0,
      status: s.status || "paid",
      client: s.client || "",
      currency: (s.currency || "GEL") as "GEL" | "USD" | "EUR",
      exchangeRate: Number(s.exchange_rate) || 1,
      createdAt: s.created_at || new Date().toISOString()
    };
  }

  private mapPurchase(ph: any): PurchaseHistory {
    return {
      id: ph.id,
      productId: ph.product_id,
      productName: ph.product_name || "",
      category: ph.category_name || "",
      purchasePrice: Number(ph.purchase_price) || 0,
      salePrice: Number(ph.sale_price) || 0,
      quantity: ph.quantity || 0,
      paidInCash: Number(ph.paid_in_cash) || 0,
      paidInCard: Number(ph.paid_in_card) || 0,
      supplier: ph.supplier || "",
      client: ph.client || "",
      currency: (ph.currency || "GEL") as "GEL" | "USD" | "EUR",
      exchangeRate: Number(ph.exchange_rate) || 1,
      createdAt: ph.created_at || new Date().toISOString()
    };
  }

  private mapExpense(e: any): Expense {
    return {
      id: e.id,
      amount: Number(e.amount) || 0,
      category: e.category || "",
      description: e.description || "",
      paymentMethod: (e.payment_method || "cash") as 'cash' | 'bank',
      currency: (e.currency || "GEL") as "GEL" | "USD" | "EUR",
      exchangeRate: Number(e.exchange_rate) || 1,
      date: e.date || new Date().toISOString(),
      createdAt: e.created_at || new Date().toISOString()
    };
  }

  private mapEmployee(e: any): Employee {
    return {
      id: e.id,
      name: e.name,
      position: e.position,
      phone: e.phone || "",
      pinCode: e.pin_code ? String(e.pin_code) : "",
      baseSalary: Number(e.base_salary) || 0,
      salaryType: (e.salary_type || 'monthly') as 'monthly' | 'daily' | 'hourly',
      createdAt: e.created_at
    };
  }

  private mapPayrollPayment(p: any): PayrollPayment {
    return {
      id: p.id,
      employeeId: p.employee_id,
      employeeName: p.employee_name,
      amount: Number(p.amount) || 0,
      paymentMethod: (p.payment_method || 'cash') as 'cash' | 'bank',
      paymentDate: p.payment_date,
      periodStart: p.period_start,
      periodEnd: p.period_end,
      notes: p.notes || "",
      createdAt: p.created_at
    };
  }

  private mapShift(s: any): Shift {
    return {
      id: s.id,
      employeeId: s.employee_id || s.employeeId,
      employeeName: s.employee_name || s.employeeName || "",
      openedAt: s.opened_at || s.openedAt,
      closedAt: s.closed_at || s.closedAt,
      openingCash: Number(s.opening_cash ?? s.openingCash) || 0,
      expectedCash: s.expected_cash != null ? Number(s.expected_cash) : (s.expectedCash != null ? Number(s.expectedCash) : undefined),
      actualCash: s.actual_cash != null ? Number(s.actual_cash) : (s.actualCash != null ? Number(s.actualCash) : undefined),
      variance: s.variance != null ? Number(s.variance) : undefined,
      status: s.status as 'open' | 'closed'
    };
  }

  private mapReturn(r: any): Return {
    return {
      id: r.id,
      saleId: r.sale_id,
      productId: r.product_id,
      productName: r.product_name || '',
      quantity: Number(r.quantity) || 0,
      refundAmount: Number(r.refund_amount) || 0,
      reason: r.reason || '',
      employeeId: r.employee_id,
      employeeName: r.employee_name || '',
      createdAt: r.created_at || new Date().toISOString()
    };
  }

  private mapInventorySession(s: any): InventorySession {
    return {
      id: s.id,
      name: s.name,
      status: s.status,
      startedAt: s.started_at,
      completedAt: s.completed_at,
      employeeId: s.employee_id,
      employeeName: s.employee_name,
      notes: s.notes,
      createdAt: s.created_at
    };
  }

  private mapInventoryCount(c: any): InventoryCount {
    return {
      id: c.id,
      sessionId: c.session_id,
      productId: c.product_id,
      productName: c.product_name,
      expectedQty: c.expected_qty,
      countedQty: c.counted_qty,
      variance: c.variance,
      createdAt: c.created_at
    };
  }

  private mapRecipe(r: any): Recipe {
    return {
      id: r.id,
      productId: r.product_id,
      productName: r.product_name || (this.products.find(p => p.id === r.product_id)?.name || ""),
      description: r.description,
      yieldPercentage: Number(r.yield_percentage ?? 100),
      items: (r.recipe_items || []).map((ri: any) => ({
        id: ri.id,
        recipeId: ri.recipe_id,
        ingredientId: ri.ingredient_id,
        ingredientName: this.products.find(p => p.id === ri.ingredient_id)?.name || "",
        quantity: Number(ri.quantity) || 0
      })),
      createdAt: r.created_at
    };
  }

  private mapProductionLog(l: any): ProductionLog {
    return {
      id: l.id,
      recipeId: l.recipe_id,
      productId: l.product_id,
      productName: l.product_name || (this.products.find(p => p.id === l.product_id)?.name || ""),
      quantityProduced: Number(l.quantity_produced) || 0,
      wastageQuantity: Number(l.wastage_quantity) || 0,
      batchNumber: l.batch_number || "",
      totalCost: Number(l.total_cost) || 0,
      employeeId: l.employee_id,
      employeeName: l.employee_name,
      notes: l.notes,
      createdAt: l.created_at
    };
  }



  private handleRealtimeProduct(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === 'INSERT') {
      if (!this.products.find(p => p.id === newRow.id)) {
        this.products.push(this.mapProduct(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.products.findIndex(p => p.id === newRow.id);
      if (idx !== -1) this.products[idx] = this.mapProduct(newRow);
    } else if (eventType === 'DELETE') {
      this.products = this.products.filter(p => p.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeSale(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === 'INSERT') {
      if (!this.sales.find(s => s.id === newRow.id)) {
        this.sales.push(this.mapSale(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.sales.findIndex(s => s.id === newRow.id);
      if (idx !== -1) this.sales[idx] = this.mapSale(newRow);
    } else if (eventType === 'DELETE') {
      this.sales = this.sales.filter(s => s.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimePurchase(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === 'INSERT') {
      if (!this.purchaseHistory.find(ph => ph.id === newRow.id)) {
        this.purchaseHistory.push(this.mapPurchase(newRow));
      }
    } else if (eventType === 'DELETE') {
      this.purchaseHistory = this.purchaseHistory.filter(ph => ph.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeExpense(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === 'INSERT') {
      if (!this.expenses.find(e => e.id === newRow.id)) {
        this.expenses.push(this.mapExpense(newRow));
        this.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.expenses.findIndex(e => e.id === newRow.id);
      if (idx !== -1) this.expenses[idx] = this.mapExpense(newRow);
    } else if (eventType === 'DELETE') {
      this.expenses = this.expenses.filter(e => e.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeRecipe(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === 'INSERT') {
      if (!this.recipes.find(r => r.id === newRow.id)) {
        this.recipes.unshift(this.mapRecipe(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.recipes.findIndex(r => r.id === newRow.id);
      if (idx !== -1) this.recipes[idx] = this.mapRecipe(newRow);
    } else if (eventType === 'DELETE') {
      this.recipes = this.recipes.filter(r => r.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeProductionLog(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === 'INSERT') {
      if (!this.productionLogs.find(l => l.id === newRow.id)) {
        this.productionLogs.unshift(this.mapProductionLog(newRow));
      }
    } else if (eventType === 'DELETE') {
      this.productionLogs = this.productionLogs.filter(l => l.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeEmployee(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === 'INSERT') {
      if (!this.employees.find(e => e.id === newRow.id)) {
        this.employees.push(this.mapEmployee(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.employees.findIndex(e => e.id === newRow.id);
      if (idx !== -1) this.employees[idx] = this.mapEmployee(newRow);
    } else if (eventType === 'DELETE') {
      this.employees = this.employees.filter(e => e.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeReturn(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === 'INSERT') {
      if (!this.returns.find(r => r.id === newRow.id)) {
        this.returns.unshift(this.mapReturn(newRow));
      }
    } else if (eventType === 'DELETE') {
      this.returns = this.returns.filter(r => r.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeInventorySession(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === 'INSERT') {
      if (!this.inventorySessions.find(s => s.id === newRow.id)) {
        this.inventorySessions.unshift(this.mapInventorySession(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.inventorySessions.findIndex(s => s.id === newRow.id);
      if (idx !== -1) this.inventorySessions[idx] = this.mapInventorySession(newRow);
    } else if (eventType === 'DELETE') {
      this.inventorySessions = this.inventorySessions.filter(s => s.id !== oldRow.id);
    }
    this.notify();
  }

  private handleRealtimeInventoryCount(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === 'INSERT') {
      if (!this.inventoryCounts.find(c => c.id === newRow.id)) {
        this.inventoryCounts.unshift(this.mapInventoryCount(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.inventoryCounts.findIndex(c => c.id === newRow.id);
      if (idx !== -1) this.inventoryCounts[idx] = this.mapInventoryCount(newRow);
    } else if (eventType === 'DELETE') {
      this.inventoryCounts = this.inventoryCounts.filter(c => c.id !== oldRow.id);
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

  // --- RETURNS MANAGEMENT ---
  getReturnsBySale(saleId: string): Return[] {
    return this.returns.filter(r => r.saleId === saleId);
  }

  async addReturn(saleId: string, items: { productId: string; productName: string; quantity: number; refundAmount: number }[], reason: string) {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("Missing tenant_id");

    this.checkPeriodLocked(new Date().toISOString());

    const newReturns: Return[] = [];
    const dbReturns: any[] = [];
    const dbProductUpdates: any[] = [];
    let totalRefund = 0;

    for (const item of items) {
      if (item.quantity <= 0) continue;
      
      const newReturn: Return = {
        id: crypto.randomUUID(),
        saleId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        refundAmount: item.refundAmount,
        reason,
        employeeId: this.currentEmployee?.id,
        employeeName: this.currentEmployee?.name,
        createdAt: new Date().toISOString()
      };
      newReturns.push(newReturn);
      totalRefund += item.refundAmount;

      dbReturns.push({
        id: newReturn.id,
        sale_id: newReturn.saleId,
        product_id: newReturn.productId,
        product_name: newReturn.productName,
        quantity: newReturn.quantity,
        refund_amount: newReturn.refundAmount,
        reason: newReturn.reason,
        employee_id: newReturn.employeeId,
        employee_name: newReturn.employeeName,
        tenant_id: tenantId,
        created_at: newReturn.createdAt
      });

      // Optimistic product update
      const product = this.products.find(p => p.id === item.productId);
      if (product) {
        product.quantity += item.quantity;
      }
    }

    if (newReturns.length === 0) return;

    // Optimistic Returns update
    this.returns = [...newReturns, ...this.returns];
    this.notify();

    try {
      // Supabase insert returns. The handle_return_stock trigger will update the product quantity in the DB.
      const { error: returnsError } = await supabase.from('returns').insert(dbReturns);
      if (returnsError) throw returnsError;

      // Log action
      this.logAction({
        actionType: 'INSERT',
        tableName: 'returns', // Cast to any internally if TS complains, though we added it conceptually. Since AuditLog.tableName requires specific strings, let's just use 'sales' as a proxy, or add 'returns' to the type. Actually, let's cast as any to be safe if 'returns' isn't in AuditLog type yet.
        recordId: saleId,
        newData: dbReturns,
      } as any);

      // Accounting Entry for Return
      // Debit: Sales Returns (5200) or similar, Credit: Cash (1110) or Bank (1210)
      this.addJournalEntry({
        date: new Date().toISOString(),
        description: `პროდუქტის დაბრუნება (გაყიდვა: ${saleId.slice(0, 8)}) - მიზეზი: ${reason}`,
        referenceId: saleId,
        referenceType: 'sale', // using 'sale' for return reference
        transactions: [
          { accountCode: '5200', debit: totalRefund, credit: 0 }, // Sales Returns
          { accountCode: '1110', debit: 0, credit: totalRefund }  // Cash (assuming cash refund for now)
        ]
      });

      toast.success("პროდუქტი წარმატებით დაბრუნდა");

    } catch (error: any) {
      console.error("Error adding return:", error);
      // Revert optimistic updates
      this.returns = this.returns.filter(r => !newReturns.find(nr => nr.id === r.id));
      for (const item of items) {
        const product = this.products.find(p => p.id === item.productId);
        if (product) product.quantity -= item.quantity;
      }
      this.notify();
      toast.error("შეცდომა პროდუქტის დაბრუნებისას");
      throw error;
    }
  }

  // --- SHIFT MANAGEMENT ---
  async openShift(openingCash: number) {
    if (this.shifts.some(s => s.status === 'open')) {
      throw new Error("ცვლა უკვე გახსნილია");
    }
    if (!this.currentEmployee) {
      throw new Error("ცვლის გასახსნელად საჭიროა ავტორიზაცია");
    }

    const tenantId = getTenantId();
    const newShift: Shift = {
      id: crypto.randomUUID(),
      employeeId: this.currentEmployee.id,
      employeeName: this.currentEmployee.name,
      openedAt: new Date().toISOString(),
      openingCash,
      status: 'open'
    };

    this.shifts.push(newShift);
    this.persistShifts();
    this.notify();

    // Persist to Supabase
    try {
      const { error } = await supabase.from('shifts').insert({
        id: newShift.id,
        employee_id: newShift.employeeId,
        employee_name: newShift.employeeName,
        opened_at: newShift.openedAt,
        opening_cash: newShift.openingCash,
        status: 'open',
        tenant_id: tenantId
      });
      if (error) console.error("Failed to persist shift to Supabase:", error.message);
    } catch (e) {
      console.error("openShift Supabase error:", e);
    }

    toast.success("ცვლა გახსნილია");
  }

  async closeShift(actualCash: number) {
    const shift = this.shifts.find(s => s.status === 'open');
    if (!shift) {
      throw new Error("გახსნილი ცვლა ვერ მოიძებნა");
    }

    const shiftSales = this.sales.filter(s => s.createdAt > shift.openedAt);
    const shiftSalesCash = shiftSales.reduce((sum, s) => sum + s.paidInCash, 0);

    const shiftExpenses = this.expenses.filter(e => e.date > shift.openedAt && e.paymentMethod === 'cash');
    const shiftExpensesTotal = shiftExpenses.reduce((sum, e) => sum + e.amount, 0);

    const expectedCash = shift.openingCash + shiftSalesCash - shiftExpensesTotal;
    const variance = actualCash - expectedCash;

    shift.closedAt = new Date().toISOString();
    shift.status = 'closed';
    shift.expectedCash = expectedCash;
    shift.actualCash = actualCash;
    shift.variance = variance;

    this.persistShifts();
    this.notify();

    // Update Supabase
    try {
      const { error } = await supabase.from('shifts').update({
        closed_at: shift.closedAt,
        status: 'closed',
        expected_cash: expectedCash,
        actual_cash: actualCash,
        variance: variance
      }).eq('id', shift.id);
      if (error) console.error("Failed to update shift in Supabase:", error.message);
    } catch (e) {
      console.error("closeShift Supabase error:", e);
    }

    if (Math.abs(variance) > 0.1) {
      toast.warning(`ცვლა დაიხურა სხვაობით: ${variance.toFixed(2)} ₾`);
    } else {
      toast.success("ცვლა დაიხურა ხარვეზების გარეშე");
    }
  }

  private persistShifts() {
    try {
      localStorage.setItem(SHIFTS_KEY, JSON.stringify(this.shifts));
    } catch (e) { console.warn("Failed to persist shifts", e); }
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

  async addProduct(product: Omit<Product, "id" | "createdAt"> & {
    paidInCash?: number;
    paidInCard?: number;
    supplier?: string;
    imageUrl?: string;
    currency?: "GEL" | "USD" | "EUR";
    exchangeRate?: number;
  }) {
    const tenantId = authStore.getTenantId();
    if (!tenantId) {
      toast.error("თქვენი პროფილი არაა დაკავშირებული ტენანტთან. გთხოვთ დაუკავშირდეთ ადმინისტრატორს.");
      throw new Error("Missing tenant_id");
    }

    this.checkPeriodLocked(new Date().toISOString());

    const existing = this.products.find((p) =>
      (p.barcode && product.barcode && p.barcode === product.barcode) ||
      (p.name.toLowerCase() === product.name.toLowerCase())
    );

    const currency = product.currency || "GEL";
    const exchangeRate = product.exchangeRate || 1;
    const gelPurchasePrice = product.purchasePrice * exchangeRate;

    if (existing) {
      const oldProductQuantity = existing.quantity;
      const totalQuantity = existing.quantity + product.quantity;
      const updates: any = {
        quantity: totalQuantity,
        purchase_price: gelPurchasePrice,
        sale_price: product.salePrice,
        discount_price: product.discountPrice,
        wholesale_price: product.wholesalePrice || existing.wholesalePrice || product.salePrice,
        category_name: product.category || existing.category,
        client: product.supplier || product.client || existing.client,
      };

      if (product.barcode) {
        updates.barcode = product.barcode;
        existing.barcode = product.barcode;
      }

      if (product.imageUrl) {
        updates.image_url = product.imageUrl;
        existing.imageUrl = product.imageUrl;
      }

      // Optimistic update
      Object.assign(existing, {
        quantity: updates.quantity,
        purchasePrice: updates.purchase_price,
        salePrice: updates.sale_price,
        discountPrice: updates.discount_price,
        wholesalePrice: updates.wholesale_price,
        category: updates.category_name,
        client: updates.client,
      });
      this.notify();

      // Supabase update
      const { error: updateError } = await supabase.from('products').update(updates).eq('id', existing.id);
      if (updateError) {
        console.error("Error updating product:", updateError);
        toast.error("შეცდომა პროდუქტის განახლებისას");
      }

      // Log action
      this.logAction({
        actionType: 'UPDATE',
        tableName: 'products',
        recordId: existing.id,
        newData: updates,
        oldData: { quantity: oldProductQuantity, purchasePrice: existing.purchasePrice, salePrice: existing.salePrice }
      });

      const tenantId = authStore.getTenantId();
      // Log purchase history for stock increase
      const purchaseHistoryEntry = {
        product_id: existing.id,
        product_name: existing.name,
        category_name: existing.category || "სხვადასხვა",
        purchase_price: product.purchasePrice,
        sale_price: product.salePrice,
        quantity: product.quantity,
        paid_in_cash: product.paidInCash || 0,
        paid_in_card: product.paidInCard || 0,
        supplier: product.supplier || product.client || "",
        currency: currency,
        exchange_rate: exchangeRate,
        created_at: new Date().toISOString(),
        tenant_id: tenantId
      };

      try {
        const { error: historyError } = await supabase.from('purchase_history').insert(purchaseHistoryEntry);
        if (historyError) {
          console.error("Error logging purchase history:", historyError.message);
        }
      } catch (err) {
        console.error("Critical error in purchase history log:", err);
      }

      // Accounting: Purchase Entry
      this.addJournalEntry({
        date: purchaseHistoryEntry.created_at,
        description: `საქონლის შესყიდვა: ${existing.name}`,
        referenceId: existing.id,
        referenceType: 'purchase',
        transactions: [
          { accountCode: '1610', debit: gelPurchasePrice * product.quantity, credit: 0 }, // Inventory (Asset) increases
          { accountCode: product.paidInCash ? '1110' : '1210', debit: 0, credit: (product.paidInCash || product.paidInCard || 0) * exchangeRate } // Cash/Bank decreases
        ]
      });
    } else {
      const gelWholesalePrice = (product.wholesalePrice || product.salePrice) * exchangeRate;
      const newProduct: any = {
        id: crypto.randomUUID(),
        name: product.name,
        category_name: product.category,
        purchase_price: gelPurchasePrice,
        sale_price: product.salePrice,
        discount_price: product.discountPrice,
        wholesale_price: gelWholesalePrice,
        quantity: product.quantity,
        client: product.supplier || product.client,
        image_url: product.imageUrl || null,
        created_at: new Date().toISOString(),
        tenant_id: tenantId
      };

      if (!newProduct.category_name) {
        newProduct.category_name = "სხვადასხვა";
      }

      if (product.barcode) {
        newProduct.barcode = product.barcode;
      }

      // Optimistic update
      this.products.push({
        id: newProduct.id,
        name: product.name,
        category: product.category,
        barcode: product.barcode,
        imageUrl: product.imageUrl,
        purchasePrice: gelPurchasePrice,
        salePrice: product.salePrice,
        discountPrice: product.discountPrice,
        wholesalePrice: gelWholesalePrice,
        quantity: product.quantity,
        client: product.supplier || product.client,
        createdAt: newProduct.created_at
      });
      this.notify();

      try {
        // Supabase insert - avoid .select() to prevent schema cache errors
        const { error } = await supabase
          .from('products')
          .insert(newProduct);

        if (error) throw error;

        // Use the local data we just sent as the "dbProduct"
        const dbProduct = newProduct;

          const purchaseHistoryEntry = {
            product_id: dbProduct.id,
            product_name: dbProduct.name,
            category_name: dbProduct.category_name || "სხვადასხვა",
            purchase_price: product.purchasePrice,
            sale_price: dbProduct.sale_price,
            quantity: dbProduct.quantity,
            paid_in_cash: product.paidInCash || 0,
            paid_in_card: product.paidInCard || 0,
            supplier: product.supplier || product.client || "",
            currency: currency,
            exchange_rate: exchangeRate,
            created_at: new Date().toISOString(),
            tenant_id: tenantId
          };

          const { error: historyError } = await supabase.from('purchase_history').insert(purchaseHistoryEntry);
          if (historyError) console.error("Error logging purchase history:", historyError.message);
      } catch (error: any) {
        console.error("Error adding product:", error);
        this.products = this.products.filter(p => p.id !== newProduct.id);
        this.notify();
        const msg = error.message || "შეცდომა პროდუქტის დამატებისას";
        toast.error(msg);
        throw new Error(msg);
      }
    }
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, "id" | "createdAt">>) {
    const product = this.products.find((p) => p.id === id);
    if (!product) throw new Error("პროდუქცია ვერ მოიძებნა");

    // Only block if the CURRENT date is locked, metadata updates shouldn't be blocked by past closures
    this.checkPeriodLocked(new Date().toISOString());

    const oldProduct = { ...product };
    // Optimistic update
    Object.assign(product, updates);
    this.notify();

    // Map to snake_case for DB
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category_name = updates.category;
    if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
    if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice;
    if (updates.discountPrice !== undefined) dbUpdates.discount_price = updates.discountPrice;
    if (updates.wholesalePrice !== undefined) dbUpdates.wholesale_price = updates.wholesalePrice;
    if (updates.minStockLevel !== undefined) dbUpdates.min_stock_level = updates.minStockLevel;
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
      toast.error("შეცდომა განახლებისას: " + (error.message || "უცნობი შეცდომა"));
      throw error;
    }
  }

  async deleteProduct(id: string) {
    const oldProducts = [...this.products];
    const oldSales = [...this.sales];
    const oldPurchaseHistory = [...this.purchaseHistory];

    this.checkPeriodLocked(new Date().toISOString());

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
        console.error("Related sales deletion failed:", salesError.message);
        throw new Error(`გაყიდვების წაშლა ვერ მოხერხდა: ${salesError.message}. სავარაუდოდ არ გაქვთ წაშლის უფლება (RLS).`);
      }

      // Then delete related purchase history
      const { error: historyError } = await supabase
        .from('purchase_history')
        .delete()
        .eq('product_id', id);

      if (historyError) {
        console.warn("Purchase history deletion failed or no history found:", historyError.message);
      }

      // Finally delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      // Rollback
      this.products = oldProducts;
      this.sales = oldSales;
      this.purchaseHistory = oldPurchaseHistory;
      this.notify();
      const msg = err?.message || "შეცდომა წაშლისას";
      toast.error(msg);
      throw new Error(msg);
    }
  }

  // Sales
  getSnapshot(): StoreSnapshot {
    if (this._cachedSnapshot) return this._cachedSnapshot;

    this._cachedSnapshot = {
      products: [...this.products],
      sales: [...this.sales],
      expenses: [...this.expenses],
      totalProducts: this.getTotalProducts(),
      getTotalSalesItemCount: () => this.getTotalSalesItemCount(),
      totalStock: this.getTotalStock(),
      totalPurchaseValue: this.getTotalPurchaseValue(),
      totalSaleValue: this.getTotalSaleValue(),
      totalRevenue: this.getTotalRevenue(),
      totalProfit: this.getTotalProfit(),
      totalExpenses: this.getTotalExpenses(),
      categories: this.getCategories(),
      salesByMonth: this.getSalesByMonth(),
      topProducts: this.getTopProducts(),
      categoryDistribution: this.getCategoryDistribution(),
      lowStockProducts: this.getLowStockProducts(),
      purchaseHistory: [...this.purchaseHistory],
      recipes: [...this.recipes],
      productionLogs: [...this.productionLogs],
      auditLogs: [...this.auditLogs],
      initialized: this.initialized,

      // Actions
      addExpense: (e) => this.addExpense(e),
      deleteExpense: (id) => this.deleteExpense(id),
      setClosedUntil: (d) => this.setClosedUntil(d),

      // Employees
      employees: [...this.employees],
      addEmployee: (e) => this.addEmployee(e),
      updateEmployee: (id, e) => this.updateEmployee(id, e),
      deleteEmployee: (id) => this.deleteEmployee(id),

      // Identification
      currentEmployee: this.currentEmployee,
      loginEmployee: (pin) => this.loginEmployee(pin),
      logoutEmployee: () => this.logoutEmployee(),

      // Debts
      updatePurchaseHistory: (id, u) => this.updatePurchaseHistory(id, u),
      payoffDebts: (t, a, m, type) => this.payoffDebts(t, a, m, type),
      importWaybillToWarehouse: (items) => this.importWaybillToWarehouse(items),

      // Shifts
      shifts: [...this.shifts],
      currentShift: this.currentShift,
      openShift: (cash) => this.openShift(cash),
      closeShift: (cash) => this.closeShift(cash),

      // Accounting
      journalEntries: [...this.journalEntries],
      getAccountBalance: (code) => this.getAccountBalance(code),

      // Returns
      returns: [...this.returns],
      addReturn: (saleId, items, reason) => this.addReturn(saleId, items, reason),
      getReturnsBySale: (saleId) => this.getReturnsBySale(saleId),

      // Inventory
      inventorySessions: [...this.inventorySessions],
      inventoryCounts: [...this.inventoryCounts],
      startInventorySession: (name, notes) => this.startInventorySession(name, notes),
      submitCount: (sid, pid, qty) => this.submitCount(sid, pid, qty),
      completeInventorySession: (sid) => this.completeInventorySession(sid),
      cancelInventorySession: (sid) => this.cancelInventorySession(sid),

      // Production
      addRecipe: (r, i) => this.addRecipe(r, i),
      deleteRecipe: (id) => this.deleteRecipe(id),
      executeProduction: (rid, q, w, n) => this.executeProduction(rid, q, w, n),
      getRecipeCost: (id) => this.getRecipeCost(id),
      checkMaterialAvailability: (id, q) => this.checkMaterialAvailability(id, q),

      // Payroll
      payrollPayments: [...this.payrollPayments],
      processSalaryPayment: (p) => this.processSalaryPayment(p),
    };

    return this._cachedSnapshot;
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

  async updateSale(id: string, updates: Partial<Sale>) {
    const sale = this.sales.find((s) => s.id === id);
    if (!sale) return;

    this.checkPeriodLocked(sale.createdAt);

    const oldSale = { ...sale };
    const product = this.products.find((p) => p.id === sale.productId);
    const oldProductQuantity = product ? product.quantity : 0;

    if (updates.quantity !== undefined && product) {
      const diff = updates.quantity - sale.quantity;
      if (product.quantity < diff) {
        throw new Error("არასაკმარისი რაოდენობა საწყობში");
      }
      product.quantity -= diff;
      sale.quantity = updates.quantity;
    }

    if (updates.salePrice !== undefined) sale.salePrice = updates.salePrice;
    if (updates.client !== undefined) sale.client = updates.client;
    if (updates.paidInCash !== undefined) sale.paidInCash = updates.paidInCash;
    if (updates.paidInCard !== undefined) sale.paidInCard = updates.paidInCard;
    if (updates.status !== undefined) sale.status = updates.status;

    sale.totalAmount = sale.salePrice * sale.quantity;

    this.notify();

    // Log action
    this.logAction({
      actionType: 'UPDATE',
      tableName: 'sales',
      recordId: id,
      oldData: oldSale,
      newData: { ...sale, ...updates }
    });

    // Supabase update - DB Trigger will handle product stock
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          quantity: sale.quantity,
          sale_price: sale.salePrice,
          total_amount: sale.totalAmount,
          client: sale.client,
          paid_in_cash: sale.paidInCash,
          paid_in_card: sale.paidInCard,
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

    this.checkPeriodLocked(sale.createdAt);

    const product = this.products.find((p) => p.id === sale.productId);
    const oldSales = [...this.sales];
    const oldProductQuantity = product ? product.quantity : 0;

    // Optimistic return quantity back to product
    if (product) product.quantity += sale.quantity;
    this.sales = this.sales.filter((s) => s.id !== id);
    this.notify();

    // Log action before delete
    this.logAction({
      actionType: 'DELETE',
      tableName: 'sales',
      recordId: id,
      oldData: sale
    });

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
    this.checkPeriodLocked(new Date().toISOString());
    const product = this.products.find((p) => p.id === sale.productId);
    if (!product) throw new Error("პროდუქცია ვერ მოიძებნა");
    if (product.quantity < sale.quantity)
      throw new Error(`არასაკმარისი რაოდენობა. საწყობში არის: ${product.quantity}`);

    const oldProductQuantity = product.quantity;
    const { currentUser } = authStore.getSnapshot();

    const insertSaleData = {
      id: crypto.randomUUID(),
      product_id: sale.productId,
      product_name: sale.productName,
      category_name: sale.category,
      quantity: sale.quantity,
      sale_price: sale.salePrice,
      total_amount: sale.salePrice * sale.quantity,
      paid_amount: (sale.paidInCash || 0) + (sale.paidInCard || 0),
      paid_in_cash: sale.paidInCash || 0,
      paid_in_card: sale.paidInCard || 0,
      status: sale.status,
      purchase_price_at_sale: product.purchasePrice,
      created_at: new Date().toISOString(),
      created_by: currentUser?.id,
      client: sale.client || '',
      tenant_id: getTenantId(),
      discount_total: (product.salePrice - sale.salePrice) * sale.quantity
    };

    // Optimistic update
    product.quantity -= sale.quantity;
    const optimisticSale: Sale = {
      ...sale,
      id: insertSaleData.id,
      currency: sale.currency || "GEL",
      exchangeRate: sale.exchangeRate || 1,
      totalAmount: insertSaleData.total_amount,
      discountTotal: insertSaleData.discount_total,
      createdAt: insertSaleData.created_at
    };
    this.sales.push(optimisticSale);
    this.notify();

    // Supabase insert - DB Trigger will handle product stock
    try {
      const { error } = await supabase.from('sales').insert(insertSaleData);
      if (error) throw error;

      // Use local data instead of waiting for SELECT (prevents schema cache issues)
      const dbSale: any = {
        ...insertSaleData,
        total_amount: insertSaleData.total_amount
      };

      if (dbSale) {
        this.logAction({ actionType: 'INSERT', tableName: 'sales', recordId: dbSale.id, newData: dbSale });

        // Accounting: Sale Entry
        const saleAmount = dbSale.total_amount;
        const cogsAmount = this.calculateFIFOCOG(dbSale.product_id, dbSale.quantity, dbSale.created_at);

        this.addJournalEntry({
          date: dbSale.created_at,
          description: `რეალიზაცია: ${dbSale.product_name}`,
          referenceId: dbSale.id,
          referenceType: 'sale',
          transactions: [
            // 1. Revenue & Payment — split between cash and card
            ...(dbSale.paid_in_cash > 0 ? [{ accountCode: '1110', debit: dbSale.paid_in_cash, credit: 0 }] : []),
            ...(dbSale.paid_in_card > 0 ? [{ accountCode: '1210', debit: dbSale.paid_in_card, credit: 0 }] : []),
            ...((saleAmount - dbSale.paid_in_cash - dbSale.paid_in_card) > 0.01 ? [{ accountCode: '1410', debit: saleAmount - dbSale.paid_in_cash - dbSale.paid_in_card, credit: 0 }] : []),
            { accountCode: '6110', debit: 0, credit: saleAmount }, // Revenue increases

            // 2. COGS & Inventory
            { accountCode: '7110', debit: cogsAmount, credit: 0 }, // COGS increases
            { accountCode: '1610', debit: 0, credit: cogsAmount } // Inventory decreases
          ]
        });
      }
    } catch (error: any) {
      console.error("Error adding sale:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      product.quantity = oldProductQuantity;
      this.sales = this.sales.filter(s => s.id !== insertSaleData.id);
      this.notify();
      throw error;
    }
  }

  // Expenses
  async addExpense(expense: Omit<Expense, "id" | "createdAt">) {
    this.checkPeriodLocked(expense.date);
    const optimisticId = crypto.randomUUID();
    const optimisticCreatedAt = new Date().toISOString();

    this.expenses.push({
      ...expense,
      id: optimisticId,
      createdAt: optimisticCreatedAt
    });
    this.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.notify();

    const insertData = {
      id: optimisticId,
      amount: Number(expense.amount),
      category: expense.category || "",
      description: expense.description || "",
      payment_method: expense.paymentMethod || 'cash',
      currency: expense.currency || 'GEL',
      exchange_rate: expense.exchangeRate || 1,
      date: expense.date || new Date().toISOString().split('T')[0],
      tenant_id: getTenantId()
    };

    // Supabase insert
    try {
      const { error } = await supabase
        .from('expenses')
        .insert(insertData);

      if (error) throw error;

      // Use local data instead of waiting for SELECT
      const dbExpense: any = {
        ...insertData,
        id: optimisticId, // We used a local UUID, but if DB generates one we might need to be careful.
        // Actually, we should probably generate UUID for expenses too if we want this pattern.
        created_at: optimisticCreatedAt
      };

      // Update optimistic record with real ID from DB if necessary
      if (dbExpense) {
        this.logAction({ actionType: 'INSERT', tableName: 'expenses', recordId: dbExpense.id, newData: dbExpense });

        const idx = this.expenses.findIndex(e => e.id === optimisticId);
        if (idx !== -1) {
          this.expenses[idx] = {
            id: dbExpense.id,
            amount: Number(dbExpense.amount),
            category: dbExpense.category || "",
            description: dbExpense.description || "",
            paymentMethod: dbExpense.payment_method || "cash",
            currency: (dbExpense.currency || "GEL") as "GEL" | "USD" | "EUR",
            exchangeRate: Number(dbExpense.exchange_rate) || 1,
            date: dbExpense.date || new Date().toISOString(),
            createdAt: dbExpense.created_at || new Date().toISOString()
          };
          this.notify();
        }

        // Accounting: Expense Entry
        let accountCode = '8110'; // Default Operating
        if (dbExpense.category === 'ხელფასი') accountCode = '8120';
        else if (dbExpense.category === 'ქირა') accountCode = '8130';
        else if (dbExpense.category === 'კომუნალური') accountCode = '8140';

        this.addJournalEntry({
          date: dbExpense.date,
          description: dbExpense.description,
          referenceId: dbExpense.id,
          referenceType: 'expense',
          transactions: [
            { accountCode: accountCode, debit: Number(dbExpense.amount) * Number(dbExpense.exchange_rate), credit: 0 },
            { accountCode: dbExpense.payment_method === 'cash' ? '1110' : '1210', debit: 0, credit: Number(dbExpense.amount) * Number(dbExpense.exchange_rate) }
          ]
        });
      }
    } catch (error: any) {
      console.error("Error adding expense:", error.message || JSON.stringify(error), error.details, error.hint);
      this.expenses = this.expenses.filter(e => e.id !== optimisticId);
      this.notify();
      toast.error("შეცდომა ხარჯის დამატებისას: " + (error.message || "უცნობი შეცდომა"));
    }
  }

  async deleteExpense(id: string) {
    const expense = this.expenses.find(e => e.id === id);
    if (!expense) return;

    this.checkPeriodLocked(expense.date);

    const oldExpenses = [...this.expenses];
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.notify();

    // Log action
    this.logAction({
      actionType: 'DELETE',
      tableName: 'expenses',
      recordId: id,
      oldData: expense
    });

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
    // 1. Hash PIN first, then check uniqueness (hash vs hash)
    let hashedPin = employee.pinCode;
    if (employee.pinCode) {
      hashedPin = await hashPin(employee.pinCode);
      if (this.employees.some(e => e.pinCode === hashedPin)) {
        toast.error("ეს PIN კოდი უკვე გამოყენებულია სხვა თანამშრომლის მიერ");
        throw new Error("PIN კოდი უკვე არსებობს");
      }
    }

    // 2. Prevent exact name + phone duplicates
    const nameLower = employee.name.trim().toLowerCase();
    const phoneTrim = (employee.phone || "").trim();
    if (this.employees.some(e =>
      e.name.trim().toLowerCase() === nameLower &&
      (e.phone || "").trim() === phoneTrim
    )) {
      toast.error("ამ სახელით და ტელეფონით თანამშრომელი უკვე არსებობს");
      throw new Error("დუბლიკატი თანამშრომელი");
    }

    const optimisticId = crypto.randomUUID();
    const optimisticCreatedAt = new Date().toISOString();

    // Keep the optimistic update unhashed so the user doesn't see a giant hash locally right away, 
    // or we hash it so local validation matches. Safer to hash it:
    this.employees.push({
      ...employee,
      pinCode: hashedPin,
      baseSalary: Number(employee.baseSalary) || 0,
      salaryType: employee.salaryType || 'monthly',
      id: optimisticId,
      createdAt: optimisticCreatedAt
    });
    this.notify();

    const tenantId = getTenantId();
    if (!tenantId) {
      const msg = "კომპანიის ID ვერ მოიძებნა (Tenant ID is empty). გთხოვთ დაარეფრეშოთ გვერდი.";
      toast.error(msg);
      throw new Error(msg);
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          name: employee.name,
          position: employee.position,
          phone: employee.phone || "",
          pin_code: hashedPin || "",
          base_salary: Number(employee.baseSalary) || 0,
          salary_type: employee.salaryType || 'monthly',
          tenant_id: tenantId
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error adding employee:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      if (data) {
        const idx = this.employees.findIndex(e => e.id === optimisticId);
        if (idx !== -1) {
          this.employees[idx] = {
            id: data.id,
            name: data.name,
            position: data.position,
            phone: data.phone || "",
            pinCode: data.pin_code || "",
            baseSalary: Number(data.base_salary) || 0,
            salaryType: data.salary_type || 'monthly',
            createdAt: data.created_at
          };
          this.notify();
        }
      }
    } catch (error: any) {
      console.error("Total error adding employee:", error);
      this.employees = this.employees.filter(e => e.id !== optimisticId);
      this.notify();
      const errorMessage = error.message || error.details || "უცნობი შეცდომა";
      toast.error("შეცდომა თანამშრომლის დამატებისას: " + errorMessage);
      throw error;
    }
  }

  async updateEmployee(id: string, employee: Partial<Omit<Employee, "id" | "createdAt">>) {
    const oldEmployee = this.employees.find(e => e.id === id);
    if (!oldEmployee) return;

    // PIN uniqueness check: hash new PIN then compare hash-to-hash
    let finalPin = oldEmployee.pinCode;
    if (employee.pinCode && employee.pinCode !== oldEmployee.pinCode) {
      finalPin = await hashPin(employee.pinCode);
      if (this.employees.some(e => e.id !== id && e.pinCode === finalPin)) {
        toast.error("ეს PIN კოდი უკვე გამოყენებულია სხვა თანამშრომლის მიერ");
        throw new Error("PIN კოდი უკვე არსებობს");
      }
    }

    const originalData = { ...oldEmployee };

    // Optimistic update
    Object.assign(oldEmployee, { ...employee, pinCode: finalPin });
    this.notify();

    try {
      // undefined-checker dbUpdates object
      const dbUpdates: any = {};
      if (employee.name !== undefined) dbUpdates.name = employee.name;
      if (employee.position !== undefined) dbUpdates.position = employee.position;
      if (employee.phone !== undefined) dbUpdates.phone = employee.phone;
      if (employee.pinCode !== undefined) dbUpdates.pin_code = finalPin;

      const { error } = await supabase
        .from('employees')
        .update(dbUpdates)
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

  async loginEmployee(pin: string): Promise<Employee | null> {
    const hashedAttempt = await hashPin(pin);
    const employee = this.employees.find(e => e.pinCode === hashedAttempt);

    if (employee) {
      this.currentEmployee = employee;
      try { localStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(employee.id)); } catch (e) { }
      this.notify();
      return employee;
    }
    return null;
  }

  logoutEmployee() {
    this.currentEmployee = null;
    try { localStorage.removeItem(EMPLOYEE_SESSION_KEY); } catch (e) { }
    this.notify();
  }

  async setClosedUntil(date: string | undefined) {
    await settingsStore.updateSettings({ closedUntil: date });
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
    const settings = settingsStore.getSettings();
    return this.sales.reduce((acc, s) => {
      if (settings.accountingMethod === 'cash') {
        return acc + (s.paidInCash + s.paidInCard);
      }
      return acc + s.totalAmount;
    }, 0);
  }

  private calculateFIFOCOG(productId: string, quantity: number, saleDate: string): number {
    // 1. Get all purchases for this product BEFORE or ON this sale date, sorted by date asc
    const purchases = [...this.purchaseHistory]
      .filter(p => p.productId === productId && p.createdAt <= saleDate)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    // 2. Get all previous sales of this product BEFORE this sale date
    const previousSalesTotal = this.sales
      .filter(s => s.productId === productId && s.createdAt < saleDate)
      .reduce((sum, s) => sum + s.quantity, 0);

    // 3. Skip "consumed" purchases
    let consumedQty = 0;
    let totalCog = 0;
    let remainingToCalculate = quantity;

    for (const purchase of purchases) {
      const pQty = purchase.quantity;
      const pPrice = purchase.purchasePrice;

      // If this purchase batch was partially or fully consumed by previous sales
      if (consumedQty + pQty <= previousSalesTotal) {
        consumedQty += pQty;
        continue;
      }

      // Calculate how much of THIS purchase batch belongs to previous sales vs current sale
      // usedOffset is how many units in this batch are ALREADY used by previous sales
      const usedOffset = Math.max(0, previousSalesTotal - consumedQty);
      const availableInThisBatch = pQty - usedOffset;
      const usedFromThisBatchNow = Math.min(remainingToCalculate, availableInThisBatch);

      if (usedFromThisBatchNow > 0) {
        totalCog += usedFromThisBatchNow * pPrice;
        remainingToCalculate -= usedFromThisBatchNow;
      }

      consumedQty += pQty;
      if (remainingToCalculate <= 0) break;
    }

    // Fallback if not enough purchase history exists (use latest purchase price)
    if (remainingToCalculate > 0) {
      const product = this.products.find(p => p.id === productId);
      totalCog += remainingToCalculate * (product?.purchasePrice || 0);
    }

    return totalCog;
  }

  getTotalProfit(): number {
    const settings = settingsStore.getSettings();
    return this.sales.reduce((acc, s) => {
      const revenue = settings.accountingMethod === 'cash'
        ? (s.paidInCash + s.paidInCard)
        : s.totalAmount;

      // For profit, we still usually want COGS of the units sold
      // But in pure Cash Basis, some people only count expenses when paid.
      // We will stick to FIFO COGS for operational profit regardless of accrual/cash toggle for revenue.
      const cog = this.calculateFIFOCOG(s.productId, s.quantity, s.createdAt);

      // If revenue is cash-basis, it might be less than totalAmount.
      // We should probably pro-rate the COGS if we want true cash-basis profit (advanced!)
      // For now: PROFIT = REVENUE (toggleable) - COGS (FIFO)
      return acc + (revenue - cog);
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
    const settings = settingsStore.getSettings();
    this.sales.forEach((s) => {
      const date = new Date(s.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = map.get(key) || { revenue: 0, profit: 0 };

      const revenue = settings.accountingMethod === 'cash'
        ? (s.paidInCash + s.paidInCard)
        : s.totalAmount;

      const cog = this.calculateFIFOCOG(s.productId, s.quantity, s.createdAt);

      existing.revenue += revenue;
      existing.profit += (revenue - cog);
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }

  getTopProducts(limit = 5): { name: string; sold: number; revenue: number; profit: number }[] {
    const map = new Map<string, { sold: number; revenue: number; profit: number }>();
    const settings = settingsStore.getSettings();
    
    this.sales.forEach((s) => {
      const existing = map.get(s.productName) || { sold: 0, revenue: 0, profit: 0 };
      const revenue = settings.accountingMethod === 'cash' ? (s.paidInCash + s.paidInCard) : s.totalAmount;
      const cog = this.calculateFIFOCOG(s.productId, s.quantity, s.createdAt);
      
      existing.sold += s.quantity;
      existing.revenue += revenue;
      existing.profit += (revenue - cog);
      map.set(s.productName, existing);
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, limit);
  }

  getAnalyticsData(range: number = 30): { date: string; revenue: number; profit: number; expenses: number; discounts: number }[] {
    const data: { [key: string]: { revenue: number; profit: number; expenses: number; discounts: number } } = {};
    const settings = settingsStore.getSettings();
    const now = new Date();
    
    // Initialize last X days
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      data[key] = { revenue: 0, profit: 0, expenses: 0, discounts: 0 };
    }

    // Aggregating sales
    this.sales.forEach(s => {
      const key = s.createdAt.split('T')[0];
      if (data[key]) {
        const revenue = settings.accountingMethod === 'cash' ? (s.paidInCash + s.paidInCard) : s.totalAmount;
        const cog = this.calculateFIFOCOG(s.productId, s.quantity, s.createdAt);
        data[key].revenue += revenue;
        data[key].profit += (revenue - cog);
        data[key].discounts += (s.discountTotal || 0);
      }
    });

    // Aggregating expenses
    this.expenses.forEach(e => {
      const key = e.date;
      if (data[key]) {
        data[key].expenses += (e.amount || 0);
      }
    });

    return Object.entries(data).map(([date, values]) => ({
      date,
      ...values
    })).sort((a, b) => a.date.localeCompare(b.date));
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
    return this.products.filter(p => p.quantity < (p.minStockLevel ?? threshold));
  }

  getPurchaseHistory(): PurchaseHistory[] {
    return [...this.purchaseHistory];
  }

  // Data management
  async clearAll() {
    const tenantId = getTenantId();
    if (!tenantId) {
      toast.error("კომპანიის ID ვერ მოიძებნა");
      return;
    }

    this.products = [];
    this.sales = [];
    this.purchaseHistory = [];
    this.expenses = [];
    this.employees = [];
    this.auditLogs = [];
    this.journalEntries = [];
    this.shifts = [];
    // Clear localStorage shift/session data
    try { localStorage.removeItem(SHIFTS_KEY); } catch (e) { }
    try { localStorage.removeItem(EMPLOYEE_SESSION_KEY); } catch (e) { }
    this.currentEmployee = null;
    this.notify();

    try {
      const results = await Promise.all([
        supabase.from('products').delete().eq('tenant_id', tenantId),
        supabase.from('sales').delete().eq('tenant_id', tenantId),
        supabase.from('purchase_history').delete().eq('tenant_id', tenantId),
        supabase.from('expenses').delete().eq('tenant_id', tenantId),
        supabase.from('employees').delete().eq('tenant_id', tenantId)
      ]);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error("Errors clearing some tables:", errors);
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
      paid_in_cash: s.paidInCash || 0,
      paid_in_card: s.paidInCard || 0,
      status: s.status || 'paid',
      client: s.client,
      created_at: s.createdAt
    }));

    const dbExpenses = expenses.map(e => ({
      id: e.id,
      amount: e.amount,
      category: e.category,
      description: e.description,
      payment_method: e.paymentMethod || 'cash',
      currency: e.currency || 'GEL',
      exchange_rate: e.exchangeRate || 1,
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

  async updatePurchaseHistory(id: string, updates: { paidInCash?: number; paidInCard?: number }) {
    const ph = this.purchaseHistory.find((p) => p.id === id);
    if (!ph) throw new Error("შესყიდვა ვერ მოიძებნა");

    this.checkPeriodLocked(ph.createdAt);

    const oldPh = { ...ph };
    if (updates.paidInCash !== undefined) ph.paidInCash = updates.paidInCash;
    if (updates.paidInCard !== undefined) ph.paidInCard = updates.paidInCard;

    this.notify();

    try {
      const { error } = await supabase
        .from('purchase_history')
        .update({
          paid_in_cash: ph.paidInCash,
          paid_in_card: ph.paidInCard
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating purchase history:", error);
      Object.assign(ph, oldPh);
      this.notify();
      toast.error("შეცდომა განახლებისას");
    }
  }

  async importWaybillToWarehouse(items: Array<{
    name: string;
    quantity: number;
    price: number;
    barcode?: string;
    category: string;
    supplier: string;
  }>) {
    this.checkPeriodLocked(new Date().toISOString());

    for (const item of items) {
      await this.addProduct({
        name: item.name,
        category: item.category,
        purchasePrice: item.price,
        salePrice: item.price * 1.25, // Default 25% margin
        quantity: item.quantity,
        barcode: item.barcode,
        supplier: item.supplier,
      });
    }
  }

  async payoffDebts(transactions: any[], amount: number, method: 'cash' | 'bank', type: 'customer' | 'supplier') {
    // Phase 5: Check if any transaction is in locked period?
    // Usually payoff happens TODAY, so we check today's date
    this.checkPeriodLocked(new Date().toISOString());
    let remainingAmount = amount;
    // Sort by date (oldest first - FIFO)
    const sorted = [...transactions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const t of sorted) {
      if (remainingAmount <= 0) break;

      const total = t.quantity * (t.salePrice || t.purchasePrice);
      const currentlyPaid = t.paidInCash + t.paidInCard;
      const currentDebt = total - currentlyPaid;

      if (currentDebt <= 0) continue;

      const payNow = Math.min(remainingAmount, currentDebt);
      const newPaidInCash = method === 'cash' ? t.paidInCash + payNow : t.paidInCash;
      const newPaidInCard = method === 'bank' ? t.paidInCard + payNow : t.paidInCard;

      try {
        if (type === 'customer') {
          // Status update: if fully paid now
          const newStatus = (currentlyPaid + payNow >= total) ? 'paid' : 'partial';
          await this.updateSale(t.id, {
            paidInCash: newPaidInCash,
            paidInCard: newPaidInCard,
            status: newStatus
          });
        } else {
          await this.updatePurchaseHistory(t.id, {
            paidInCash: newPaidInCash,
            paidInCard: newPaidInCard
          });
        }
        remainingAmount -= payNow;
      } catch (err) {
        console.error("Error in payoff chain:", err);
        throw err;
      }
    }
  }

  // --- INVENTORY MANAGEMENT ---
  async startInventorySession(name: string, notes?: string): Promise<string> {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("Missing tenant_id");

    this.checkPeriodLocked(new Date().toISOString());

    const sessionId = crypto.randomUUID();
    const newSession: InventorySession = {
      id: sessionId,
      name,
      status: 'active',
      startedAt: new Date().toISOString(),
      employeeId: this.currentEmployee?.id,
      employeeName: this.currentEmployee?.name,
      notes,
      createdAt: new Date().toISOString()
    };

    // Create counts for all current products
    const newCounts: InventoryCount[] = this.products.map(p => ({
      id: crypto.randomUUID(),
      sessionId,
      productId: p.id,
      productName: p.name,
      expectedQty: p.quantity,
      countedQty: 0,
      variance: -p.quantity, // initially, counted is 0, so variance is -expected
      createdAt: new Date().toISOString()
    }));

    // Optimistic Update
    this.inventorySessions.unshift(newSession);
    this.inventoryCounts.push(...newCounts);
    this.notify();

    try {
      const { error: sessionError } = await supabase.from('inventory_sessions').insert({
        id: newSession.id,
        name: newSession.name,
        status: newSession.status,
        started_at: newSession.startedAt,
        employee_id: newSession.employeeId,
        employee_name: newSession.employeeName,
        notes: newSession.notes,
        tenant_id: tenantId,
        created_at: newSession.createdAt
      });
      if (sessionError) throw sessionError;

      // Batch insert counts
      const dbCounts = newCounts.map(c => ({
        id: c.id,
        session_id: c.sessionId,
        product_id: c.productId,
        product_name: c.productName,
        expected_qty: c.expectedQty,
        counted_qty: c.countedQty,
        variance: c.variance,
        tenant_id: tenantId,
        created_at: c.createdAt
      }));

      // split into batches of 1000 to avoid postgrest limits
      const chunkSize = 1000;
      for (let i = 0; i < dbCounts.length; i += chunkSize) {
        const chunk = dbCounts.slice(i, i + chunkSize);
        const { error: countError } = await supabase.from('inventory_counts').insert(chunk);
        if (countError) throw countError;
      }

    } catch (error) {
      console.error("Start Inventory Session Error:", error);
      this.inventorySessions = this.inventorySessions.filter(s => s.id !== sessionId);
      this.inventoryCounts = this.inventoryCounts.filter(c => c.sessionId !== sessionId);
      this.notify();
      throw error;
    }

    return sessionId;
  }

  async submitCount(sessionId: string, productId: string, countedQty: number) {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("Missing tenant_id");

    const session = this.inventorySessions.find(s => s.id === sessionId);
    if (!session || session.status !== 'active') throw new Error("აქტიური სესია ვერ მოიძებნა");

    const count = this.inventoryCounts.find(c => c.sessionId === sessionId && c.productId === productId);
    if (!count) throw new Error("პროდუქტი სესიაში ვერ მოიძებნა");

    const oldQty = count.countedQty;
    const oldVariance = count.variance;

    // Optimistic Update
    count.countedQty = countedQty;
    count.variance = countedQty - count.expectedQty;
    this.notify();

    try {
      const { error } = await supabase.from('inventory_counts').update({
        counted_qty: count.countedQty,
        variance: count.variance
      }).eq('id', count.id);

      if (error) throw error;
    } catch (error) {
      console.error("Submit count error:", error);
      count.countedQty = oldQty;
      count.variance = oldVariance;
      this.notify();
      throw error;
    }
  }

  async completeInventorySession(sessionId: string) {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("Missing tenant_id");

    const session = this.inventorySessions.find(s => s.id === sessionId);
    if (!session || session.status !== 'active') throw new Error("აქტიური სესია ვერ მოიძებნა");

    this.checkPeriodLocked(new Date().toISOString());

    const counts = this.inventoryCounts.filter(c => c.sessionId === sessionId);
    
    // Calculate discrepancies
    const updates: { id: string; quantity: number }[] = [];
    let surplusValue = 0;
    let deficitValue = 0;

    for (const count of counts) {
      if (count.variance !== 0) {
        const product = this.products.find(p => p.id === count.productId);
        if (product) {
          updates.push({ id: product.id, quantity: count.countedQty });
          const valueDiff = Math.abs(count.variance) * product.purchasePrice;
          if (count.variance > 0) surplusValue += valueDiff;
          else deficitValue += valueDiff;
        }
      }
    }

    // Optimistic Update
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    
    const oldProducts = JSON.parse(JSON.stringify(this.products));
    updates.forEach(u => {
      const p = this.products.find(prod => prod.id === u.id);
      if (p) p.quantity = u.quantity;
    });

    this.notify();

    try {
      // 1. Update session
      const { error: sessionError } = await supabase.from('inventory_sessions').update({
        status: session.status,
        completed_at: session.completedAt
      }).eq('id', sessionId);
      if (sessionError) throw sessionError;

      // 2. Adjust product quantities (using individual updates)
      const chunkedUpdates = [];
      for(let i = 0; i < updates.length; i += 50) {
        chunkedUpdates.push(updates.slice(i, i + 50));
      }

      for (const chunk of chunkedUpdates) {
        await Promise.all(chunk.map(u => 
          supabase.from('products').update({ quantity: u.quantity }).eq('id', u.id)
        ));
      }

      // 3. Accounting Details - Post Inventory Adjustment
      if (surplusValue > 0 || deficitValue > 0) {
        const transactions = [];
        if (deficitValue > 0) {
          transactions.push({ accountCode: '7100', debit: deficitValue, credit: 0 }); // Shrinkage Expense
          transactions.push({ accountCode: '1610', debit: 0, credit: deficitValue }); // Inventory Asset
        }
        if (surplusValue > 0) {
          transactions.push({ accountCode: '1610', debit: surplusValue, credit: 0 }); // Inventory Asset
          transactions.push({ accountCode: '6100', debit: 0, credit: surplusValue }); // Other Income
        }

        await this.addJournalEntry({
          date: new Date().toISOString(),
          description: `ინვენტარიზაციის შედეგი: ${session.name}`,
          referenceId: sessionId,
          referenceType: 'inventory_session',
          transactions
        });
      }

    } catch (error) {
      console.error("Complete session error:", error);
      session.status = 'active';
      session.completedAt = undefined;
      this.products = oldProducts;
      this.notify();
      throw error;
    }
  }

  async cancelInventorySession(sessionId: string) {
    const session = this.inventorySessions.find(s => s.id === sessionId);
    if (!session || session.status !== 'active') throw new Error("აქტიური სესია ვერ მოიძებნა");

    session.status = 'cancelled';
    this.notify();

    try {
      const { error } = await supabase.from('inventory_sessions').update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      }).eq('id', sessionId);
      if (error) throw error;
    } catch (error) {
      console.error("Cancel session error:", error);
      session.status = 'active';
      this.notify();
      throw error;
    }
  }

  // --- PRODUCTION MANAGEMENT ---
  getRecipeCost(recipeId: string): number {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) return 0;
    
    return recipe.items.reduce((total, item) => {
      const product = this.products.find(p => p.id === item.ingredientId);
      return total + (product?.purchasePrice || 0) * item.quantity;
    }, 0);
  }

  checkMaterialAvailability(recipeId: string, quantity: number): { ingredientId: string; ingredientName: string; required: number; available: number; missing: number }[] {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) return [];

    return recipe.items.map(item => {
      const product = this.products.find(p => p.id === item.ingredientId);
      const available = product?.quantity || 0;
      const required = item.quantity * quantity;
      return {
        ingredientId: item.ingredientId,
        ingredientName: product?.name || item.ingredientName,
        required,
        available,
        missing: Math.max(0, required - available)
      };
    }).filter(report => report.missing > 0);
  }

  async addRecipe(recipe: Partial<Recipe>, items: Partial<RecipeItem>[]) {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("Missing tenant_id");

    const recipeId = crypto.randomUUID();
    const newRecipe: Recipe = {
      id: recipeId,
      productId: recipe.productId!,
      productName: recipe.productName!,
      name: recipe.name,
      description: recipe.description,
      yieldPercentage: Number(recipe.yieldPercentage ?? 100),
      items: items.map((item, idx) => ({
        id: crypto.randomUUID(),
        recipeId,
        ingredientId: item.ingredientId!,
        ingredientName: item.ingredientName!,
        quantity: item.quantity!
      })),
      createdAt: new Date().toISOString()
    };

    this.recipes.unshift(newRecipe);
    this.notify();

    try {
      const { error: recipeError } = await supabase.from('recipes').insert({
        id: recipeId,
        product_id: recipe.productId,
        name: recipe.name,
        description: recipe.description,
        yield_percentage: newRecipe.yieldPercentage,
        tenant_id: tenantId
      });
      if (recipeError) throw recipeError;

      const dbItems = newRecipe.items.map(item => ({
        id: item.id,
        recipe_id: item.recipeId,
        ingredient_id: item.ingredientId,
        quantity: item.quantity,
        tenant_id: tenantId
      }));

      const { error: itemsError } = await supabase.from('recipe_items').insert(dbItems);
      if (itemsError) throw itemsError;

      toast.success("რეცეპტი წარმატებით დაემატა");
    } catch (error) {
      console.error("Add recipe error:", error);
      this.recipes = this.recipes.filter(r => r.id !== recipeId);
      this.notify();
      toast.error("შეცდომა რეცეპტის დამატებისას");
      throw error;
    }
  }

  async deleteRecipe(id: string) {
    const oldRecipes = [...this.recipes];
    this.recipes = this.recipes.filter(r => r.id !== id);
    this.notify();

    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
      toast.success("რეცეპტი წაიშალა");
    } catch (error) {
      console.error("Delete recipe error:", error);
      this.recipes = oldRecipes;
      this.notify();
      toast.error("შეცდომა რეცეპტის წაშლისას");
    }
  }

  async executeProduction(recipeId: string, quantity: number, wastage: number, notes?: string) {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("Missing tenant_id");

    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) throw new Error("რეცეპტი ვერ მოიძებნა");

    this.checkPeriodLocked(new Date().toISOString());

    // Validation: Check stock for all ingredients
    const missingMaterials = this.checkMaterialAvailability(recipeId, quantity);
    if (missingMaterials.length > 0) {
      const report = missingMaterials.map(m => `${m.ingredientName}: აკლია ${m.missing}`).join(", ");
      throw new Error(`არასაკმარისი მარაგი: ${report}`);
    }

    const logId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const batchNumber = `PROD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${logId.slice(0, 4).toUpperCase()}`;

    const oldProducts = JSON.parse(JSON.stringify(this.products));
    const finishedProduct = this.products.find(p => p.id === recipe.productId);
    
    // Calculate values for accounting
    let totalCostValue = 0;

    // Optimistic Update
    recipe.items.forEach(item => {
      const ingredient = this.products.find(p => p.id === item.ingredientId);
      if (ingredient) {
        const consumed = item.quantity * quantity;
        totalCostValue += consumed * ingredient.purchasePrice;
        ingredient.quantity -= consumed;
      }
    });

    if (finishedProduct) {
      const yieldMultiplier = (recipe.yieldPercentage || 100) / 100;
      const actualYield = (quantity * yieldMultiplier) - wastage;
      finishedProduct.quantity += actualYield;
    }

    const newLog: ProductionLog = {
      id: logId,
      recipeId,
      productId: recipe.productId,
      productName: recipe.productName,
      quantityProduced: quantity,
      wastageQuantity: wastage,
      batchNumber,
      totalCost: totalCostValue,
      employeeId: this.currentEmployee?.id,
      employeeName: this.currentEmployee?.name,
      notes,
      createdAt
    };

    this.productionLogs.unshift(newLog);
    this.notify();

    try {
      // 1. Supabase: Deduct ingredients
      for (const item of recipe.items) {
        const ingredient = oldProducts.find((p: any) => p.id === item.ingredientId);
        const { error: stockError } = await supabase.from('products').update({
          quantity: ingredient.quantity - (item.quantity * quantity)
        }).eq('id', item.ingredientId);
        if (stockError) throw stockError;
      }

      // 2. Supabase: Add finished products
      if (finishedProduct) {
        const { error: prodError } = await supabase.from('products').update({
          quantity: finishedProduct.quantity
        }).eq('id', finishedProduct.id);
        if (prodError) throw prodError;
      }

      // 3. Supabase: Insert Log
      const { error: logError } = await supabase.from('production_logs').insert({
        id: logId,
        recipe_id: recipeId,
        product_id: recipe.productId,
        quantity_produced: quantity,
        wastage_quantity: wastage,
        batch_number: batchNumber,
        total_cost: totalCostValue,
        employee_id: this.currentEmployee?.id,
        employee_name: this.currentEmployee?.name,
        notes,
        tenant_id: tenantId,
        created_at: createdAt
      });
      if (logError) throw logError;

      // 4. Accounting Entry
      await this.addJournalEntry({
        date: createdAt,
        description: `წარმოება: ${recipe.productName} (Batch: ${batchNumber})`,
        referenceId: logId,
        referenceType: 'transfer' as any,
        transactions: [
          { accountCode: '1610', debit: totalCostValue, credit: 0 },
          { accountCode: '1610', debit: 0, credit: totalCostValue }
        ]
      });

      toast.success(`წარმოება დასრულდა (პარტია: ${batchNumber})`);
    } catch (error) {
      console.error("Execute production error:", error);
      this.products = oldProducts;
      this.productionLogs = this.productionLogs.filter(l => l.id !== logId);
      this.notify();
      toast.error("შეცდომა წარმოებისას");
      throw error;
    }
  }

  // Accounting
  getAccountBalance(code: string): number {
    let balance = 0;
    this.journalEntries.forEach(entry => {
      entry.transactions.forEach(tx => {
        if (tx.accountCode === code) {
          // Normal balance: 
          // Assets (1000s) & Expenses (7000-8000s) = Debit - Credit
          // Liabilities (2000s), Equity (3000s), Revenue (6000s) = Credit - Debit
          if (code.startsWith('1') || code.startsWith('7') || code.startsWith('8')) {
            balance += (tx.debit - tx.credit);
          } else {
            balance += (tx.credit - tx.debit);
          }
        }
      });
    });
    return balance;
  }

  // Recipes & Production Logs
  getRecipes(): Recipe[] {
    return [...this.recipes];
  }

  getProductionLogs(): ProductionLog[] {
    return [...this.productionLogs];
  }

  exportData(): { products: Product[]; sales: Sale[]; expenses: Expense[] } {
    return {
      products: [...this.products],
      sales: [...this.sales],
      expenses: [...this.expenses],
    };
  }

  // Payroll
  async processSalaryPayment(payment: Omit<PayrollPayment, 'id' | 'createdAt'>) {
    const paymentId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const tenantId = getTenantId();

    if (!tenantId) throw new Error("Tenant ID not found");

    const newPayment: PayrollPayment = {
      ...payment,
      id: paymentId,
      createdAt
    };

    // Optimistic Update
    this.payrollPayments.unshift(newPayment);
    this.notify();

    try {
      // 1. Supabase: Insert Payment
      const { error: payError } = await supabase.from('payroll_payments').insert({
        id: paymentId,
        employee_id: payment.employeeId,
        employee_name: payment.employeeName,
        amount: payment.amount,
        payment_method: payment.paymentMethod,
        payment_date: payment.paymentDate,
        period_start: payment.periodStart,
        period_end: payment.periodEnd,
        notes: payment.notes,
        tenant_id: tenantId,
        created_at: createdAt
      });
      if (payError) throw payError;

      // 2. Accounting Entry
      await this.addJournalEntry({
        date: payment.paymentDate,
        description: `ხელფასი: ${payment.employeeName} (${payment.periodStart} - ${payment.periodEnd})`,
        referenceId: paymentId,
        referenceType: 'expense',
        transactions: [
          { accountCode: '7110', debit: payment.amount, credit: 0 },
          { accountCode: payment.paymentMethod === 'cash' ? '1210' : '1220', debit: 0, credit: payment.amount }
        ]
      });

      toast.success(`ხელფასი გაიცა: ${payment.employeeName}`);
    } catch (error) {
      console.error("Process salary payment error:", error);
      this.payrollPayments = this.payrollPayments.filter(p => p.id !== paymentId);
      this.notify();
      toast.error("შეცდომა ხელფასის გაცემისას");
      throw error;
    }
  }

  private handleRealtimePayroll(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === 'INSERT') {
      if (!this.payrollPayments.find(p => p.id === newRow.id)) {
        this.payrollPayments.unshift(this.mapPayrollPayment(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.payrollPayments.findIndex(p => p.id === newRow.id);
      if (idx !== -1) this.payrollPayments[idx] = this.mapPayrollPayment(newRow);
    } else if (eventType === 'DELETE') {
      this.payrollPayments = this.payrollPayments.filter(p => p.id !== oldRow.id);
    }
    this.notify();
  }
}

// Singleton - lazy init to avoid SSR issues
// initialize() guards against SSR internally with `if (typeof window === "undefined") return;`
let _instance: WarehouseStore | null = null;
function getWarehouseStore(): WarehouseStore {
  if (!_instance) {
    _instance = new WarehouseStore();
  }
  return _instance;
}

export const warehouseStore = getWarehouseStore();
