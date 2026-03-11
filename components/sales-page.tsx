"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Plus, Minus, ShoppingCart, Trash2, Package, Download, FileText, Pencil, ArrowUpDown, ArrowUp, ArrowDown, X, Search, AlertCircle, Wallet, CreditCard, Eye, ChevronRight, Printer, CheckCircle2, Home, LayoutGrid, Settings, Wifi, Zap, Bell, History as HistoryIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useWarehouseStore } from "@/hooks/use-store";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { Product, Sale } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel";
import { printInvoice, printPayoffReceipt } from "@/lib/invoice";
import { rsgeService } from "@/lib/rs-ge";
import { fiscalService } from "@/lib/fiscal";
import { PINLoginOverlay } from "@/components/pin-login-overlay";
import { LogOut, User, PauseCircle, PlayCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManagerAuthDialog } from "@/components/manager-auth-dialog";
import { headerStore } from "@/lib/header-store";

// Held Receipt type
interface HeldReceipt {
  id: string;
  cart: CartItem[];
  clientName: string;
  timestamp: string;
  total: number;
  priceMode: "retail" | "wholesale";
}

// Cart item type
interface CartItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  salePrice: number;
  retailPrice: number;
  wholesalePrice?: number;
  maxStock: number;
  imageUrl?: string;
}

export function SalesPage() {
  const store = useWarehouseStore();
  const settings = useSettings();
  const auth = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cart & Held Receipts state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldReceipts, setHeldReceipts] = useState<HeldReceipt[]>([]);
  const [priceMode, setPriceMode] = useState<"retail" | "wholesale">("retail");
  const [clientName, setClientName] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // RS.GE & Fiscal Toggles (Local overrides)
  const [sendToRSGE, setSendToRSGE] = useState(false);
  const [printFiscal, setPrintFiscal] = useState(false);
  const [rsgeBuyerTin, setRsgeBuyerTin] = useState("");
  const [rsgeWaybillType, setRsgeWaybillType] = useState<1 | 2 | 3>(1);

  // Checkout Modal State
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payMode, setPayMode] = useState<"cash" | "card" | "split">("cash");
  const [receivedAmount, setReceivedAmount] = useState(""); // For keypad
  const [cashPaid, setCashPaid] = useState("");
  const [cardPaid, setCardPaid] = useState("");

  // Receipt Modal State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastReceiptData, setLastReceiptData] = useState<{
    sales: Sale[];
    items: CartItem[];
    total: number;
    cash: number;
    card: number;
    client: string;
    paymentMethod: string;
  } | null>(null);

  // Sync toggles with global settings when they change or component mounts
  useEffect(() => {
    if (mounted) {
      setSendToRSGE(!!settings.rsgeAutoSend);
      setPrintFiscal(!!settings.fiscalAutoPrint);

      const saved = localStorage.getItem('dasta_held_receipts');
      if (saved) {
        try { setHeldReceipts(JSON.parse(saved)); } catch (e) { }
      }
    }
  }, [mounted, settings.rsgeAutoSend, settings.fiscalAutoPrint]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('dasta_held_receipts', JSON.stringify(heldReceipts));
    }
  }, [heldReceipts, mounted]);

  // Sale history state
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editForm, setEditForm] = useState({
    quantity: "",
    salePrice: "",
    client: "",
    paidInCash: "",
    paidInCard: "",
  });

  // Manager Auth State
  const [managerAuthOpen, setManagerAuthOpen] = useState(false);
  const [managerAuthAction, setManagerAuthAction] = useState<(() => void) | null>(null);
  const [managerAuthName, setManagerAuthName] = useState("");

  const requireManager = (actionName: string, action: () => void) => {
    const pos = (store.currentEmployee?.position || "").toLowerCase();
    if (pos.includes("manag") || pos.includes("მენეჯერ") || pos.includes("ადმინ")) {
      action();
    } else {
      setManagerAuthName(actionName);
      setManagerAuthAction(() => action);
      setManagerAuthOpen(true);
    }
  };

  // Sorting and Pagination
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Show/hide sales history
  const [showHistory, setShowHistory] = useState(false);

  // Debts Modal State
  const [debtsOpen, setDebtsOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    name: string,
    total: number,
    transactions: any[],
    type: 'customer' | 'supplier'
  } | null>(null);

  // Debts Grouping Logic (Mirrored from Accounting Page)
  const groupedCustomerDebts = useMemo(() => {
    const groups: Record<string, { client: string, totalDebt: number, transactions: Sale[] }> = {};
    store.sales.forEach(s => {
      const total = s.quantity * s.salePrice;
      const paid = s.paidInCash + s.paidInCard;
      const debt = total - paid;
      if (debt > 0) {
        const client = s.client || "ანონიმური";
        if (!groups[client]) {
          groups[client] = { client, totalDebt: 0, transactions: [] };
        }
        groups[client].totalDebt += debt;
        groups[client].transactions.push(s);
      }
    });
    return Object.values(groups).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [store.sales]);

  const groupedSupplierDebts = useMemo(() => {
    const groups: Record<string, { supplier: string, totalDebt: number, transactions: any[] }> = {};
    store.purchaseHistory.forEach(ph => {
      const total = ph.quantity * ph.purchasePrice;
      const paid = ph.paidInCash + ph.paidInCard;
      const debt = total - paid;
      if (debt > 0) {
        const supplier = ph.supplier || ph.client || "უცნობი";
        if (!groups[supplier]) {
          groups[supplier] = { supplier, totalDebt: 0, transactions: [] };
        }
        groups[supplier].totalDebt += debt;
        groups[supplier].transactions.push(ph);
      }
    });
    return Object.values(groups).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [store.purchaseHistory]);


  // ====== CART FUNCTIONS ======

  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product.id);
      if (existing) {
        // Already in cart — increase quantity
        if (existing.quantity >= product.quantity) {
          toast.error(`${product.name} — მაქსიმუმ ${product.quantity} ცალი საწყობში`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, maxStock: product.quantity }
            : item
        );
      }
      // New item
      if (product.quantity <= 0) {
        toast.error(`${product.name} — ამოწურულია!`);
        return prevCart;
      }
      return [...prevCart, {
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity: 1,
        retailPrice: product.salePrice,
        wholesalePrice: product.wholesalePrice,
        salePrice: priceMode === "wholesale" && product.wholesalePrice !== undefined
          ? product.wholesalePrice
          : product.salePrice,
        maxStock: product.quantity,
        imageUrl: product.imageUrl,
      }];
    });
  }, [priceMode]);

  const updateCartQuantity = useCallback((productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(item => item.productId !== productId));
      return;
    }
    setCart(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, quantity: Math.min(newQty, item.maxStock) }
        : item
    ));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  }, []);

  // Update cart prices when mode changes
  useEffect(() => {
    setCart(prev => prev.map(item => ({
      ...item,
      salePrice: priceMode === "wholesale" && item.wholesalePrice !== undefined
        ? item.wholesalePrice
        : item.retailPrice
    })));
  }, [priceMode]);

  const clearCart = useCallback(() => {
    setCart([]);
    setClientName("");
    setPaidAmount("");
    setCashPaid("");
    setCardPaid("");
    setPayMode("cash");
    setReceivedAmount("");
  }, []);

  // Cart totals
  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity * item.salePrice, 0),
    [cart]
  );

  const cartItemCount = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Held receipts functions
  const holdCurrentReceipt = useCallback(() => {
    if (cart.length === 0) return;
    const newReceipt: HeldReceipt = {
      id: crypto.randomUUID(),
      cart: [...cart],
      clientName: clientName || `შეკვეთა ${heldReceipts.length + 1}`,
      timestamp: new Date().toISOString(),
      total: cartTotal,
      priceMode: priceMode
    };
    setHeldReceipts(prev => [...prev, newReceipt]);
    clearCart();
    toast.success("ჩეკი დაპაუზებულია");
  }, [cart, clientName, cartTotal, priceMode, heldReceipts.length, clearCart]);

  const recallReceipt = useCallback((id: string) => {
    const receipt = heldReceipts.find(r => r.id === id);
    if (!receipt) return;

    // If current cart is not empty, hold it first
    if (cart.length > 0) {
      const newReceipt: HeldReceipt = {
        id: crypto.randomUUID(),
        cart: [...cart],
        clientName: clientName || `შეკვეთა ${heldReceipts.length + 1}`,
        timestamp: new Date().toISOString(),
        total: cartTotal,
        priceMode: priceMode
      };
      setHeldReceipts(prev => [...prev.filter(r => r.id !== id), newReceipt]);
    } else {
      setHeldReceipts(prev => prev.filter(r => r.id !== id));
    }

    setCart(receipt.cart);
    setClientName(receipt.clientName.startsWith("შეკვეთა ") ? "" : receipt.clientName);
    setPriceMode(receipt.priceMode);
    toast.success("ჩეკი დაბრუნებულია ეკრანზე");
  }, [heldReceipts, cart, clientName, cartTotal, priceMode]);

  const removeHeldReceipt = useCallback((id: string) => {
    setHeldReceipts(prev => prev.filter(r => r.id !== id));
    toast.success("დაპაუზებული ჩეკი წაიშალა");
  }, []);

  // Sell all items in cart
  const handleSellAll = async (paymentData?: { cash: number; card: number; client: string }) => {
    if (cart.length === 0) {
      toast.error("კალათა ცარიელია");
      return;
    }

    if (!store.currentShift) {
      toast.error("გაყიდვისთვის აუცილებელია ცვლის გახსნა!", {
        description: "გთხოვთ გახსნათ ცვლა ზედა პანელიდან.",
        duration: 5000,
      });
      return;
    }

    const total = cartTotal;
    const finalCash = paymentData ? paymentData.cash : (paidAmount !== "" ? parseFloat(paidAmount) : total);
    const finalCard = paymentData ? paymentData.card : 0;
    const finalPaid = finalCash + finalCard;
    const finalClient = (paymentData ? paymentData.client : clientName).trim();

    // Client name is mandatory if there's debt
    if (finalPaid < total && !finalClient) {
      toast.error("ნიისისთვის საჭიროა კლიენტის სახელის მითითება");
      return;
    }

    try {
      const addedSales: Sale[] = [];
      for (const item of cart) {
        const itemTotal = item.quantity * item.salePrice;
        const ratio = total > 0 ? itemTotal / total : 0;

        const idempotencyKey = crypto.randomUUID();
        const saleData = {
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          quantity: item.quantity,
          salePrice: item.salePrice,
          totalValue: itemTotal, // For RS.GE Fiscal
          paymentMethod: (finalPaid >= total ? payMode : finalPaid > 0 ? "split" : "nisia") as any,
          client: finalClient,
          paidInCash: finalCash * ratio,
          paidInCard: finalCard * ratio,
          status: (finalPaid >= total ? "paid" : finalPaid > 0 ? "partial" : "unpaid") as any,
          currency: settings.currency || "GEL",
          exchangeRate: 1,
          idempotencyKey,
        };

        await store.addSale(saleData);

        addedSales.push({
          ...saleData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          totalAmount: itemTotal,
          currency: saleData.currency as any,
          exchangeRate: saleData.exchangeRate
        });

        // Fix #4: Low Stock Alert Check
        const product = store.products.find((p: any) => p.id === item.productId);
        if (product && product.minStockLevel !== undefined) {
          const remaining = product.quantity - item.quantity;
          if (remaining <= product.minStockLevel) {
            toast.warning(`მარაგი იწურება: ${product.name} (${remaining} დარჩა)`, {
              description: "გთხოვთ შეავსოთ მარაგი დროულად.",
              duration: 5000,
            });
          }
        }
      }

      // Build a full item list from all cart items
      const waybillItems = cart.map(item => ({
        productName: item.productName || "",
        quantity: item.quantity,
        unit: "ც",
        price: priceMode === "wholesale"
          ? (item.wholesalePrice || item.salePrice)
          : item.salePrice,
        barcode: "",
      }));

      // —— RS.GE Waybill ——
      if (sendToRSGE) {
        rsgeService.sendWaybill(addedSales[0], {
          buyerTin: rsgeBuyerTin,
          buyerName: clientName,
          waybillType: rsgeWaybillType,
          sendInvoice: !!(settings as any).rsgeAutoInvoice,
          idempotencyKey: addedSales[0].idempotencyKey,
        }, waybillItems).catch(err => console.error("RS.GE Waybill Sync Error:", err));
      }

      // —— RS.GE Fiscal Receipt (Fix #2: Legal Requirement) ——
      // This is ALWAYS required for POS sales in Georgia.
      // We send it asynchronously so the cashier doesn't wait.
      rsgeService.sendFiscalReceipt(addedSales[0], waybillItems)
        .catch(err => console.error("RS.GE Fiscal Sync Error:", err));

      if (printFiscal) {
        await fiscalService.printReceipt(addedSales);
      }

      setLastReceiptData({
        sales: addedSales,
        items: [...cart],
        total,
        cash: finalCash,
        card: finalCard,
        client: finalClient,
        paymentMethod: (finalPaid >= total ? payMode : finalPaid > 0 ? "split" : "nisia"),
      });
      setReceiptOpen(true);

      toast.success(`გაყიდვა წარმატებით დაფიქსირდა — ${cart.length} პროდუქტი`);
      clearCart();
      setCheckoutOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "შეცდომა გაყიდვისას");
    }
  };

  // ====== BARCODE SCANNER & HOTKEYS ======
  const productSearchRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef("");
  const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanStartTimeRef = useRef(0);

  useEffect(() => {
    if (!mounted) return;

    const processBarcode = (code: string) => {
      const scannedCode = code.trim();
      if (scannedCode.length < 4) return;

      const product = store.getProductByBarcode(scannedCode);
      if (product) {
        toast.success(`მოიძებნა: ${product.name}`);
        addToCart(product);
      } else {
        toast.error(`შტრიხკოდით "${scannedCode}" პროდუქცია ვერ მოიძებნა`);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && barcodeBufferRef.current.length >= 4) {
        e.preventDefault();
        e.stopPropagation();
        const code = barcodeBufferRef.current;
        barcodeBufferRef.current = "";
        scanStartTimeRef.current = 0;
        if (barcodeTimerRef.current) {
          clearTimeout(barcodeTimerRef.current);
          barcodeTimerRef.current = null;
        }
        processBarcode(code);
        return;
      }

      const isInputActive = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

      // Advanced POS Hotkeys
      if (e.key === 'F9') {
        e.preventDefault();
        holdCurrentReceipt();
        return;
      }

      if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0 && !checkoutOpen) {
          setCashPaid(cartTotal.toFixed(2));
          setCardPaid("");
          setCheckoutOpen(true);
        }
        return;
      }

      if (!isInputActive) {
        if (e.code === 'Space') {
          e.preventDefault();
          productSearchRef.current?.focus();
          return;
        }
        // If Enter is pressed and it wasn't a barcode (buffer < 4), trigger checkout
        if (e.key === 'Enter') {
          e.preventDefault();
          if (cart.length > 0 && !checkoutOpen) {
            setCashPaid(cartTotal.toFixed(2));
            setCardPaid("");
            setCheckoutOpen(true);
          }
          return;
        }
      }

      if (e.key.length !== 1) return;

      if (barcodeBufferRef.current.length === 0) {
        scanStartTimeRef.current = Date.now();
      }
      barcodeBufferRef.current += e.key;

      if (barcodeBufferRef.current.length >= 3) {
        const elapsed = Date.now() - scanStartTimeRef.current;
        const avgPerChar = elapsed / barcodeBufferRef.current.length;
        if (avgPerChar < 80) {
          e.preventDefault();
          e.stopPropagation();
        }
      }

      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
      barcodeTimerRef.current = setTimeout(() => {
        const buffer = barcodeBufferRef.current;
        const elapsed = Date.now() - scanStartTimeRef.current;

        if (buffer.length >= 6 && elapsed < buffer.length * 100) {
          processBarcode(buffer);
        }
        barcodeBufferRef.current = "";
        scanStartTimeRef.current = 0;
        barcodeTimerRef.current = null;
      }, 100);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
    };
  }, [mounted, store, addToCart, cart.length, checkoutOpen, cartTotal, holdCurrentReceipt]);

  // ====== FILTERED PRODUCTS FOR GRID ======
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return store.products;
    const q = productSearch.toLowerCase();
    return store.products.filter((p: Product) =>
      p.name.toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.barcode || "").includes(q)
    );
  }, [store.products, productSearch]);

  // ====== SALES HISTORY ======
  const filteredSales = useMemo(() => {
    return store.sales.filter(
      (s: Sale) =>
        (s.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.client || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [store.sales, searchTerm]);

  const sortedSales = useMemo(() => {
    const sorted = [...filteredSales].sort((a: any, b: any) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal || 0) - (bVal || 0)
        : (bVal || 0) - (aVal || 0);
    });
    return sorted;
  }, [filteredSales, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSales.slice(start, start + itemsPerPage);
  }, [sortedSales, currentPage]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const handleExportExcel = () => {
    if (store.sales.length === 0) {
      toast.error("ექსპორტისთვის მონაცემები არ არის");
      return;
    }
    exportToExcel(
      store.sales.map((s: Sale) => ({
        productName: s.productName,
        category: s.category || "",
        quantity: s.quantity,
        salePrice: s.salePrice,
        totalAmount: s.totalAmount,
        client: s.client || "",
        createdAt: new Date(s.createdAt).toLocaleDateString("ka-GE"),
      })),
      [
        { header: "პროდუქცია", key: "productName" },
        { header: "კატეგორია", key: "category" },
        { header: "რაოდენობა", key: "quantity" },
        { header: "ფასი", key: "salePrice" },
        { header: "ჯამი", key: "totalAmount" },
        { header: "მყიდველი", key: "client" },
        { header: "თარიღი", key: "createdAt" },
      ],
      "გაყიდვები"
    );
    toast.success("ექსპორტი წარმატებით დასრულდა");
  };

  const handlePrintInvoice = (saleId: string) => {
    const sale = store.sales.find((s: Sale) => s.id === saleId);
    if (!sale) return;
    const product = store.products.find((p: Product) => p.id === sale.productId);
    printInvoice(sale, product?.purchasePrice);
  };

  const handleEditOpen = (saleId: string) => {
    const sale = store.sales.find((s: Sale) => s.id === saleId);
    if (!sale) return;
    setEditingId(saleId);
    setEditForm({
      quantity: String(sale.quantity),
      salePrice: String(sale.salePrice),
      client: sale.client,
      paidInCash: String(sale.paidInCash),
      paidInCard: String(sale.paidInCard),
    });
    setEditOpen(true);
  };

  const handleEditSubmitAction = async () => {
    if (!editingId || !editForm.quantity || !editForm.salePrice) return;
    try {
      const qty = parseInt(editForm.quantity);
      const price = parseFloat(editForm.salePrice);
      const total = qty * price;
      const cash = editForm.paidInCash !== "" ? parseFloat(editForm.paidInCash) : 0;
      const card = editForm.paidInCard !== "" ? parseFloat(editForm.paidInCard) : 0;
      const paid = cash + card;

      await store.updateSale(editingId, {
        quantity: qty,
        salePrice: price,
        client: editForm.client.trim(),
        paidInCash: cash,
        paidInCard: card,
        status: paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid",
      });
      toast.success("გაყიდვა წარმატებით განახლდა");
      setEditOpen(false);
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "შეცდომა");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm.quantity || !editForm.salePrice) {
      toast.error("შეავსეთ სავალდებულო ველები");
      return;
    }
    requireManager("გაყიდვის რედაქტირების", handleEditSubmitAction);
  };

  const handleDeleteSaleAction = async (id: string) => {
    await store.deleteSale(id);
    toast.success("გაყიდვა წაიშალა და სტოკი აღდგა");
  };

  const handleDeleteSale = (id: string) => {
    requireManager("გაყიდვის წაშლის (დაბრუნების)", () => handleDeleteSaleAction(id));
  };

  const handleZReport = () => {
    requireManager("ცვლის დახურვის და Z-რეპორტის", async () => {
      const today = new Date().toLocaleDateString("ka-GE");
      if (!confirm(`ნამდვილად გსურთ ${today}-ის ცვლის დახურვა და Z-რეპორტის ბეჭდვა?`)) return;

      const res = await fiscalService.printZReport();
      if (res.success) {
        toast.success("ცვლა დაიხურა და Z-რეპორტი დაიბეჭდა");
      }
    });
  };

  // Shift Modal State
  const [shiftOpenModal, setShiftOpenModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState("");
  const [closingCashInput, setClosingCashInput] = useState("");

  const handleOpenShift = async () => {
    try {
      await store.openShift(parseFloat(openingCashInput || "0"));
      setShiftOpenModal(false);
      setOpeningCashInput("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCloseShift = async () => {
    try {
      await store.closeShift(parseFloat(closingCashInput || "0"));
      setShiftOpenModal(false);
      setClosingCashInput("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // ====== GLOBAL HEADER SYNC ======
  useEffect(() => {
    if (!mounted) return;

    const headerTitle = (
      <div className="flex items-center gap-2">
        <span className="font-black text-foreground">გაყიდვა</span>
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest hidden sm:inline">
          პროდუქციის რეალიზაცია
        </span>
      </div>
    );

    const headerActions = (
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Shift Logic in Header */}
        <Button
          variant={store.currentShift ? "outline" : "default"}
          size="sm"
          className={cn(
            "h-8 px-3 rounded-lg font-bold text-[11px] transition-all",
            store.currentShift
              ? "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-50"
              : "bg-primary text-primary-foreground"
          )}
          onClick={() => setShiftOpenModal(true)}
        >
          <div className={cn(
            "h-1.5 w-1.5 rounded-full mr-1.5",
            store.currentShift ? "bg-emerald-500 animate-pulse" : "bg-white/50"
          )} />
          {store.currentShift ? "ცვლა ღიაა" : "ცვლის გახსნა"}
        </Button>

        {/* Z-Report */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 rounded-lg border-primary/20 hover:bg-primary/5 text-primary font-bold transition-all hidden sm:flex"
          onClick={handleZReport}
        >
          <Printer className="h-3.5 w-3.5 mr-1.5" />
          Z
        </Button>

        {/* History & Excel */}
        <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/50 items-center">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 rounded-md text-[10px] font-bold transition-all",
              showHistory ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
            )}
            onClick={() => setShowHistory(!showHistory)}
          >
            <FileText className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">ისტორია</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground"
            onClick={handleExportExcel}
          >
            <Download className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
        </div>

        {/* Operator Info */}
        {store.currentEmployee && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => store.logoutEmployee()}
            className="flex items-center gap-2 bg-primary/5 hover:bg-orange-50 border border-primary/10 hover:border-orange-200 px-2 py-0.5 h-8 rounded-lg transition-colors group"
            title="მოლარის შეცვლა"
          >
            <User className="h-3 w-3 text-primary/60 group-hover:text-orange-500" />
            <span className="text-[11px] font-black group-hover:text-orange-600">{store.currentEmployee.name}</span>
            <LogOut className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 text-orange-500 transition-opacity" />
          </Button>
        )}
      </div>
    );

    headerStore.setHeader(headerTitle, headerActions);

    return () => {
      headerStore.clearHeader();
    };
  }, [mounted, store.currentShift, store.currentEmployee, showHistory, store.sales.length]);

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] overflow-hidden font-sans text-slate-800">
      <PINLoginOverlay />

      <ManagerAuthDialog
        open={managerAuthOpen}
        onOpenChange={setManagerAuthOpen}
        actionName={managerAuthName}
        onSuccess={() => {
          if (managerAuthAction) managerAuthAction();
        }}
      />

      {/* LEFT SIDEBAR */}
      <div className="w-16 bg-[#2c3e50] flex flex-col items-center py-6 gap-8 text-white/60 flex-shrink-0 border-r border-slate-700/50">
        <div className="p-2 rounded-xl bg-primary/10 mb-4">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <button className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white">
          <LayoutGrid className="h-6 w-6" />
        </button>
        <button className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <ShoppingCart className="h-6 w-6" />
        </button>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={cn("p-2 rounded-xl hover:bg-white/10 transition-colors", showHistory && "bg-white/10 text-white")}
        >
          <HistoryIcon className="h-6 w-6" />
        </button>
        <button 
          onClick={() => setDebtsOpen(true)}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <Wallet className="h-6 w-6" />
        </button>
        <div className="mt-auto flex flex-col gap-6 items-center">
          <button className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <Settings className="h-6 w-6" />
          </button>
          {store.currentEmployee && (
            <button 
              onClick={() => store.logoutEmployee()}
              className="p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors"
            >
              <LogOut className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <div className="h-14 bg-[#8b1a1a] flex items-center justify-between px-6 text-white shadow-lg z-10 flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tighter leading-none">DASTA POS</span>
              <span className="text-[9px] font-bold opacity-60 tracking-widest uppercase">Terminal v2.0</span>
            </div>
            <div className="h-8 w-[1px] bg-white/10 mx-2 hidden lg:block" />
            <div className="hidden lg:flex bg-white/10 p-1 rounded-xl items-center border border-white/10">
              <button
                onClick={() => setPriceMode("retail")}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-black transition-all",
                  priceMode === "retail" ? "bg-white text-[#8b1a1a]" : "text-white/60 hover:text-white"
                )}
              >
                საცალო
              </button>
              <button
                onClick={() => setPriceMode("wholesale")}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-black transition-all",
                  priceMode === "wholesale" ? "bg-white text-[#8b1a1a]" : "text-white/60 hover:text-white"
                )}
              >
                საბითუმო
              </button>
            </div>
            <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold opacity-50 uppercase leading-none mb-1">Cashier</span>
                <span className="text-xs font-bold">{store.currentEmployee?.name || "No User"}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 px-3 rounded-full text-[10px] font-bold border border-white/20 transition-all",
                  store.currentShift ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/10 text-white"
                )}
                onClick={() => setShiftOpenModal(true)}
              >
                <div className={cn("h-1.5 w-1.5 rounded-full mr-2", store.currentShift ? "bg-emerald-400" : "bg-white/40")} />
                {store.currentShift ? "SHIFT OPEN" : "OPEN SHIFT"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 opacity-60">
              <Wifi className="h-4 w-4" />
              <Zap className="h-4 w-4" />
              <Bell className="h-4 w-4" />
            </div>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <div className="flex flex-col items-end">
              <span className="text-sm font-black tracking-tight">{new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[9px] font-bold opacity-50 uppercase">{new Date().toLocaleDateString('ka-GE')}</span>
            </div>
          </div>
        </div>

        {/* WORK AREA */}
        <div className="flex-1 flex p-3 gap-3 overflow-hidden bg-[#eff1f3]">
          {/* LEFT: Product Grid / Categories */}
          <div className="w-[30%] lg:w-[35%] flex flex-col gap-3 h-full">
            <div className="bg-white rounded-2xl shadow-sm p-3 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  ref={productSearchRef}
                  placeholder="პროდუქტის ძებნა..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10 h-10 bg-slate-50 border-none rounded-xl focus-visible:ring-primary/20"
                />
              </div>
            </div>
            
            <div className="flex-1 bg-white rounded-2xl shadow-sm p-3 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredProducts.map((product) => {
                  const inCart = cart.find(item => item.productId === product.id);
                  const isOutOfStock = product.quantity <= 0;
                  return (
                    <button
                      key={product.id}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      disabled={isOutOfStock}
                      className={cn(
                        "aspect-square p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 group relative",
                        inCart ? "bg-primary/5 border-primary shadow-sm" : "bg-slate-50 border-slate-100 hover:border-primary/40",
                        isOutOfStock && "opacity-40 grayscale grayscale-[0.8]"
                      )}
                    >
                      {inCart && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                          {inCart.quantity}
                        </div>
                      )}
                      <div className="h-10 w-10 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} className="h-full w-full object-cover rounded-lg" alt="" />
                        ) : (
                          <Package className="h-6 w-6 text-slate-300 group-hover:text-primary transition-colors" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 line-clamp-1 text-center w-full uppercase">{product.name}</span>
                      <span className="text-xs font-black text-primary">{product.salePrice.toLocaleString()} ₾</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER: Receipt / Order View */}
          <div className="flex-1 bg-white rounded-2xl shadow-md border-2 border-slate-200 flex flex-col overflow-hidden">
            {/* Held Receipts Bar */}
            {heldReceipts.length > 0 && (
              <div className="bg-amber-50/50 border-b border-amber-100 p-2 flex gap-2 overflow-x-auto custom-scrollbar">
                {heldReceipts.map(receipt => (
                  <button
                    key={receipt.id}
                    onClick={() => recallReceipt(receipt.id)}
                    className="flex items-center gap-2 bg-white border border-amber-200 px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 group shrink-0"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[9px] font-black text-amber-600 uppercase leading-none">Held Receipt</span>
                      <span className="text-xs font-bold text-slate-700">{receipt.clientName || "Unknown"}</span>
                    </div>
                    <div className="h-6 w-[1px] bg-amber-100 mx-1" />
                    <span className="text-xs font-black text-slate-900">{receipt.total.toLocaleString()} ₾</span>
                    <div 
                      onClick={(e) => { e.stopPropagation(); removeHeldReceipt(receipt.id); }}
                      className="ml-1 p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="h-3 w-3" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="bg-slate-50/80 p-3 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#8b1a1a] flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                <span className="font-black text-sm uppercase tracking-tight">აქტიური შეკვეთა</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className="h-8 px-3 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors"
                  onClick={clearCart}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  გასუფთავება
                </button>
              </div>
            </div>

            <div className="bg-slate-100/50 px-4 py-2 grid grid-cols-6 text-[9px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">
              <div className="col-span-3">დასახელება</div>
              <div className="text-center">რაოდ.</div>
              <div className="text-right">ფასი</div>
              <div className="text-right pr-2">ჯამი</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                   <ShoppingCart className="h-16 w-16 mb-2 opacity-10" />
                   <p className="text-sm font-bold">Your cart is empty</p>
                   <p className="text-[10px] font-medium">Scan items or select from the list</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} className="grid grid-cols-6 items-center py-2.5 border-b border-slate-100 group animate-in slide-in-from-left-2 transition-all">
                    <div className="col-span-3">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.productName}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{item.category || "General"}</p>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                       <button 
                         onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                         className="h-5 w-5 rounded bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary flex items-center justify-center"
                       >
                         <Minus className="h-3 w-3" />
                       </button>
                       <span className="text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                       <button 
                         onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                         className="h-5 w-5 rounded bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary flex items-center justify-center"
                       >
                         <Plus className="h-3 w-3" />
                       </button>
                    </div>
                    <div className="text-right text-xs font-bold text-slate-500">{item.salePrice.toLocaleString()}</div>
                    <div className="text-right text-xs font-black text-slate-900 pr-2">{(item.quantity * item.salePrice).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-[#fdfdfd] border-t-2 border-slate-100 p-5 mt-auto flex-shrink-0">
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">სულ რაოდენობა</span>
                  <span className="text-lg font-black text-slate-800">{cartItemCount}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ჯამური თანხა</span>
                  <span className="text-4xl font-black text-slate-1000 tracking-tighter leading-none">{cartTotal.toLocaleString()} ₾</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Keypad & Quick Actions */}
          <div className="w-[300px] flex flex-col gap-2 flex-shrink-0">
            {/* Input Overlay */}
            <div className="bg-white rounded-2xl shadow-md p-3 flex flex-col gap-1.5">
              <div className="flex justify-between items-center mb-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">მყიდველი</span>
                 {clientName && <button onClick={() => setClientName("")} className="text-[9px] text-red-500 font-bold uppercase">წაშლა</button>}
              </div>
              <Input 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="საცალო მყიდველი"
                className="h-10 bg-slate-50 border-none font-bold text-sm tracking-tight rounded-xl"
              />
              <div className="flex justify-between items-center mt-2 mb-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">მიღებული თანხა</span>
                 {receivedAmount && <button onClick={() => setReceivedAmount("")} className="text-[9px] text-red-500 font-bold uppercase">წაშლა</button>}
              </div>
              <div className="h-12 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-center px-4 justify-between">
                <span className="text-2xl font-black text-emerald-700">{receivedAmount || "0"}</span>
                <span className="text-sm font-black text-emerald-300">₾</span>
              </div>
              {receivedAmount && parseFloat(receivedAmount) > cartTotal && (
                <div className="flex justify-between items-center px-1 animate-in zoom-in duration-300 mt-0.5">
                  <span className="text-[9px] font-black text-emerald-600 uppercase">ხურდა</span>
                  <span className="text-lg font-black text-emerald-600">{(parseFloat(receivedAmount) - cartTotal).toLocaleString()} ₾</span>
                </div>
              )}
            </div>

            {/* Numeric Keypad */}
            <div className="bg-white rounded-2xl shadow-md p-1.5 grid grid-cols-3 gap-1.5 h-[210px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    if (val === "." && receivedAmount.includes(".")) return;
                    setReceivedAmount(prev => prev + String(val));
                  }}
                  className="h-full rounded-xl bg-[#fdfaf5] hover:bg-[#f7f0e4] border border-[#f3e5ca] text-xl font-bold transition-colors active:scale-95 flex items-center justify-center text-slate-700"
                >
                  {val}
                </button>
              ))}
              <button
                onClick={() => setReceivedAmount("")}
                className="h-full rounded-xl bg-orange-100 hover:bg-orange-200 border border-orange-200 text-xl font-black text-orange-600 transition-colors active:scale-95 flex items-center justify-center"
              >
                C
              </button>
            </div>

            {/* Quick Settings */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSendToRSGE(!sendToRSGE)}
                className={cn(
                  "h-10 rounded-xl border-2 flex items-center justify-center gap-2 transition-all text-[10px] font-black tracking-widest",
                  sendToRSGE ? "bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                )}
              >
                RS.GE
                {sendToRSGE && <CheckCircle2 className="h-3 w-3" />}
              </button>
              <button
                onClick={() => setPrintFiscal(!printFiscal)}
                className={cn(
                  "h-10 rounded-xl border-2 flex items-center justify-center gap-2 transition-all text-[10px] font-black tracking-widest",
                  printFiscal ? "bg-[#8b1a1a] border-[#6b1414] text-white shadow-lg shadow-red-100" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                )}
              >
                ფისკალური
                {printFiscal && <CheckCircle2 className="h-3 w-3" />}
              </button>
            </div>

            {/* Final Actions */}
            <div className="flex flex-col gap-1.5 mt-auto">
              <div className="grid grid-cols-2 gap-2">
                 <Button 
                    variant="outline" 
                    className="h-12 bg-blue-50 border-blue-200 text-blue-600 font-black rounded-xl hover:bg-blue-100 text-xs tracking-widest"
                    onClick={() => {
                       setPayMode("card");
                       handleSellAll({ cash: 0, card: cartTotal, client: clientName });
                    }}
                 >
                    ბარათი
                 </Button>
                 <Button 
                    variant="outline" 
                    className="h-12 bg-amber-50 border-amber-200 text-amber-600 font-black rounded-xl hover:bg-amber-100 text-xs tracking-widest"
                    onClick={holdCurrentReceipt}
                 >
                    გადადება (F9)
                 </Button>
              </div>
              <Button 
                onClick={() => {
                  if (cart.length === 0) return;
                  setPayMode("cash");
                  const cashVal = receivedAmount ? parseFloat(receivedAmount) : cartTotal;
                  handleSellAll({ cash: cashVal, card: 0, client: clientName });
                }}
                className="h-16 bg-[#2ecc71] hover:bg-[#27ae60] text-white font-black text-xl rounded-2xl shadow-lg shadow-emerald-200/50 flex flex-col items-center justify-center gap-0.5 group transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                   <span>ნაღდი</span>
                   <CheckCircle2 className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-[10px] font-bold opacity-60 tracking-widest">(ENTER)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* REMAINDER OF DIALOGS (kept from original) */}

      {/* Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[760px] w-full max-h-[95vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl bg-white overflow-x-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>გადახდის ფანჯარა</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row min-h-0 md:h-[540px]">
            {/* Left Sidebar: Payment Methods */}
            <div className="w-full md:w-[280px] bg-slate-50 p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">გადახდა</h2>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-400 md:hidden" onClick={() => setCheckoutOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-1 mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">სულ გადასახდელი</span>
                <span className="text-4xl font-black text-primary tracking-tighter">{cartTotal.toFixed(2)} ₾</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1">მეთოდი</span>
                <button
                  onClick={() => { setPayMode("cash"); setReceivedAmount(""); setCashPaid(""); setCardPaid(""); }}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-200",
                    payMode === "cash"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-100"
                      : "bg-white border-transparent hover:border-slate-200 text-slate-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl", payMode === "cash" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500")}>
                      <Wallet className="h-4 w-4" />
                    </div>
                    <span className="font-black text-[13px]">ნაღდი ფულით</span>
                  </div>
                  {payMode === "cash" && <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-white" /></div>}
                </button>

                <button
                  onClick={() => { setPayMode("card"); setReceivedAmount(""); setCashPaid(""); setCardPaid(""); }}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-200",
                    payMode === "card"
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-md shadow-blue-100"
                      : "bg-white border-transparent hover:border-slate-200 text-slate-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl", payMode === "card" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500")}>
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="font-black text-[13px]">ბარათით TBC/BOG</span>
                  </div>
                  {payMode === "card" && <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-white" /></div>}
                </button>

                <button
                  onClick={() => { setPayMode("split"); setReceivedAmount(""); }}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-200",
                    payMode === "split"
                      ? "bg-slate-800 border-slate-800 text-white shadow-md shadow-slate-200"
                      : "bg-white border-transparent hover:border-slate-200 text-slate-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl", payMode === "split" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500")}>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                    <span className="font-black text-[13px]">გაყოფილი გადახდა</span>
                  </div>
                  {payMode === "split" && <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-slate-800" /></div>}
                </button>
              </div>
            </div>

            {/* Right Panel: Content */}
            <div className="flex-1 p-5 md:p-8 flex flex-col bg-white">
              <div className="flex justify-end md:mb-2 hidden md:flex">
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-300 hover:text-slate-600" onClick={() => setCheckoutOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {payMode === "split" ? (
                <div className="space-y-6 h-full flex flex-col justify-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">💵 ნაღდი ფული</Label>
                      <Input
                        type="number"
                        value={cashPaid}
                        onChange={(e) => setCashPaid(e.target.value)}
                        className="h-16 rounded-2xl bg-emerald-50/50 border-2 border-emerald-100 px-6 font-black text-2xl text-emerald-700 focus:border-emerald-500 focus:ring-0 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">💳 ბარათი</Label>
                      <Input
                        type="number"
                        value={cardPaid}
                        onChange={(e) => setCardPaid(e.target.value)}
                        className="h-16 rounded-2xl bg-blue-50/50 border-2 border-blue-100 px-6 font-black text-2xl text-blue-700 focus:border-blue-500 focus:ring-0 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">👤 მყიდველი (ნისიის შემთხვევაში)</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 px-6 font-bold text-lg focus:border-primary focus:ring-0 transition-all"
                      placeholder="სახელი / ნომერი"
                    />
                  </div>
                  {(() => {
                    const paid = (parseFloat(cashPaid || "0") + parseFloat(cardPaid || "0"));
                    const debt = cartTotal - paid;
                    if (debt > 0.01) {
                      return (
                        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-100 flex justify-between items-center animate-in zoom-in-95">
                          <span className="font-black text-amber-700 uppercase tracking-widest text-[10px]">დარჩენილი ნისია</span>
                          <span className="text-2xl font-black text-amber-700">{debt.toFixed(2)} ₾</span>
                        </div>
                      )
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 rounded-xl border-2 border-slate-100 font-black text-xs text-primary hover:bg-primary/5 hover:border-primary/20"
                      onClick={() => setReceivedAmount("50")}
                    >50 ₾</Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-10 rounded-xl border-2 border-slate-100 font-black text-xs text-primary hover:bg-primary/5 hover:border-primary/20"
                      onClick={() => setReceivedAmount("100")}
                    >100 ₾</Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-10 rounded-xl border-2 border-slate-100 font-black text-xs text-primary hover:bg-primary/5 hover:border-primary/20"
                      onClick={() => setReceivedAmount(cartTotal.toFixed(2))}
                    >ზუსტი</Button>
                  </div>

                  <div className="space-y-1.5 mb-4 text-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">მოგაწოდათ</Label>
                    <div className="h-16 w-full rounded-2xl bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center gap-2">
                      <span className="text-4xl font-black text-emerald-700">{receivedAmount || "0"}</span>
                      <span className="text-2xl font-black text-emerald-500">₾</span>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-2 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0].map(val => (
                      <button
                        key={val}
                        onClick={() => {
                          if (val === "." && receivedAmount.includes(".")) return;
                          setReceivedAmount(prev => prev + val);
                        }}
                        className="h-full min-h-[50px] rounded-2xl bg-slate-50 hover:bg-slate-100 font-black text-2xl text-slate-800 transition-colors border border-slate-100"
                      >
                        {val}
                      </button>
                    ))}
                    <button
                      onClick={() => setReceivedAmount("")}
                      className="h-full min-h-[50px] rounded-2xl bg-rose-50 hover:bg-rose-100 font-black text-2xl text-rose-600 transition-colors border border-rose-100"
                    >
                      C
                    </button>
                  </div>

                  {payMode === "cash" && receivedAmount && parseFloat(receivedAmount) > cartTotal + 0.01 && (
                    <div className="mb-4 p-4 rounded-2xl bg-primary/10 border-2 border-primary/20 flex justify-between items-center animate-in slide-in-from-bottom-2">
                      <span className="font-black text-primary uppercase tracking-widest text-[10px]">დასაბრუნებელი ხურდა</span>
                      <span className="text-3xl font-black text-primary">{(parseFloat(receivedAmount) - cartTotal).toFixed(2)} ₾</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {payMode === "card" && (
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center mb-2">
                        <p className="text-blue-700 font-black uppercase tracking-widest text-[10px]">გადახდა ხდება ბარათით</p>
                        <p className="text-2xl font-black text-blue-800 mt-1">{cartTotal.toFixed(2)} ₾</p>
                      </div>
                    )}
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-12 rounded-2xl bg-slate-50 border border-slate-100 px-5 font-bold text-base focus:border-primary focus:ring-0 transition-all"
                      placeholder="მყიდველის სახელი (არასავალდებულო)"
                    />
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                <Button
                  className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                  onClick={() => {
                    let finalCash = 0;
                    let finalCard = 0;

                    if (payMode === "cash") {
                      finalCash = cartTotal;
                    } else if (payMode === "card") {
                      finalCard = cartTotal;
                    } else if (payMode === "split") {
                      finalCash = parseFloat(cashPaid || "0");
                      finalCard = parseFloat(cardPaid || "0");
                    }

                    handleSellAll({
                      cash: finalCash,
                      card: finalCard,
                      client: clientName
                    });
                  }}
                >
                  დასრულება
                  <Plus className="h-5 w-5 rotate-45" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SALES HISTORY — toggle */}
      {
        showHistory && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                გაყიდვების ისტორია ({store.sales.length})
              </h2>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ძებნა (მყიდველი, პროდუქტი)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-muted-foreground/20 rounded-xl"
                />
              </div>
            </div>

            <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b-2">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest w-12 text-center">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("productName")}>
                        <div className="flex items-center">პროდუქცია{getSortIcon("productName")}</div>
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors hidden md:table-cell" onClick={() => handleSort("category")}>
                        <div className="flex items-center">კატეგორია{getSortIcon("category")}</div>
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors text-right" onClick={() => handleSort("quantity")}>
                        <div className="flex items-center justify-end">რაოდ.{getSortIcon("quantity")}</div>
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors text-right" onClick={() => handleSort("salePrice")}>
                        <div className="flex items-center justify-end">ფასი{getSortIcon("salePrice")}</div>
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors text-right" onClick={() => handleSort("totalAmount")}>
                        <div className="flex items-center justify-end">ჯამი{getSortIcon("totalAmount")}</div>
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">სტატუსი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">მყიდველი</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("createdAt")}>
                        <div className="flex items-center">თარიღი{getSortIcon("createdAt")}</div>
                      </TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-16">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-10 w-10 opacity-10" />
                            <p className="text-sm font-medium">გაყიდვები არ მოიძებნა</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSales.map((sale: Sale, index: number) => (
                        <TableRow key={sale.id} className="hover:bg-muted/20 transition-colors group">
                          <TableCell className="text-muted-foreground text-[10px] font-bold text-center">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground">{sale.productName}</span>
                              <span className="text-[10px] text-muted-foreground md:hidden">{sale.category}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium text-muted-foreground hidden md:table-cell">{sale.category || "—"}</TableCell>
                          <TableCell className="text-right font-bold text-sm">{sale.quantity} <span className="text-[10px] text-muted-foreground">ცალი</span></TableCell>
                          <TableCell className="text-right font-bold text-sm whitespace-nowrap">{sale.salePrice.toFixed(2)} ₾</TableCell>
                          <TableCell className="text-right font-black text-sm text-primary whitespace-nowrap">{(sale.quantity * sale.salePrice).toFixed(2)} ₾</TableCell>
                          <TableCell>
                            {sale.status === "paid" ? (
                              <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-tight">
                                გადახდილი
                              </span>
                            ) : sale.status === "partial" ? (
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700 uppercase tracking-tight">
                                  ნაწილობრივი
                                </span>
                                <span className="text-[9px] font-bold text-muted-foreground ml-1">({(sale.paidInCash + sale.paidInCard).toFixed(2)} ₾)</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center rounded-lg bg-destructive/10 px-2 py-1 text-[10px] font-black text-destructive uppercase tracking-tight">
                                ნისია
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-foreground truncate max-w-[120px]">{sale.client || <span className="text-muted-foreground font-normal">ანონიმური</span>}</TableCell>
                          <TableCell className="text-muted-foreground text-[10px] font-bold">
                            {new Date(sale.createdAt).toLocaleDateString("ka-GE", { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                                onClick={() => handleEditOpen(sale.id)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                                onClick={() => handleDeleteSale(sale.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                                onClick={() => handlePrintInvoice(sale.id)}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={cn("rounded-xl transition-all", currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-muted")}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page)}
                              className={cn("rounded-xl cursor-pointer transition-all", currentPage === page ? "font-black shadow-md shadow-primary/20" : "hover:bg-muted")}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <PaginationItem key={page}><span className="px-2 text-muted-foreground">...</span></PaginationItem>;
                      }
                      return null;
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={cn("rounded-xl transition-all", currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-muted")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )
      }

      {/* Edit Sale Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 border-none shadow-2xl">
          <div className="h-1.5 w-full bg-primary" />
          <form onSubmit={handleEditSubmit}>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                გაყიდვის რედაქტირება
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editQty" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">რაოდენობა *</Label>
                  <Input id="editQty" type="number" min="1" value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    className="h-11 rounded-xl bg-muted/30 border-none px-4 font-bold" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editPrice" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ფასი (GEL) *</Label>
                  <Input id="editPrice" type="number" step="0.01" min="0" value={editForm.salePrice}
                    onChange={(e) => setEditForm({ ...editForm, salePrice: e.target.value })}
                    className="h-11 rounded-xl bg-muted/30 border-none px-4 font-bold" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editClient" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">მყიდველი</Label>
                <Input id="editClient" value={editForm.client}
                  onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                  placeholder="არასავალდებულო" className="h-11 rounded-xl bg-muted/30 border-none px-4 font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editCash" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ნაღდი (GEL)</Label>
                  <Input id="editCash" type="number" step="0.01" min="0" value={editForm.paidInCash}
                    onChange={(e) => setEditForm({ ...editForm, paidInCash: e.target.value })}
                    className="h-11 rounded-xl bg-primary/5 border-none px-4 font-black text-primary" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editCard" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ბარათი (GEL)</Label>
                  <Input id="editCard" type="number" step="0.01" min="0" value={editForm.paidInCard}
                    onChange={(e) => setEditForm({ ...editForm, paidInCard: e.target.value })}
                    className="h-11 rounded-xl bg-primary/5 border-none px-4 font-black text-primary" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-muted/30 flex gap-3 justify-end border-t">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl font-bold h-11 px-6">გაუქმება</Button>
              <Button type="submit" className="rounded-xl font-bold h-11 px-8 shadow-lg shadow-primary/20">შენახვა</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Debts List Modal */}
      <Dialog open={debtsOpen} onOpenChange={setDebtsOpen}>
        <DialogContent className="max-w-4xl p-0 max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">ვალები & ნისიები</DialogTitle>
                <p className="text-amber-100 text-xs font-bold mt-1 uppercase tracking-widest opacity-80">მყიდველებისა და მომწოდებლების ვალების მართვა</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30">
            {/* Customer Debts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">მყიდველები (ნისია)</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black">
                  {groupedCustomerDebts.length} პირი
                </span>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {groupedCustomerDebts.map(debt => (
                  <div key={debt.client} className="group p-4 rounded-2xl bg-white border border-border/50 hover:border-amber-400/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          {debt.client[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-sm tracking-tight">{debt.client}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{debt.transactions.length} ტრანზაქცია</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-black text-amber-600">{debt.totalDebt.toFixed(2)} ₾</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">ნაშთი</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl hover:bg-amber-50 text-amber-600"
                          onClick={() => setSelectedEntity({
                            name: debt.client,
                            total: debt.totalDebt,
                            transactions: debt.transactions,
                            type: 'customer'
                          })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplier Debts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">მომწოდებლები (ვალი)</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">
                  {groupedSupplierDebts.length} პირი
                </span>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {groupedSupplierDebts.map(debt => (
                  <div key={debt.supplier} className="group p-4 rounded-2xl bg-white border border-border/50 hover:border-blue-400/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {debt.supplier[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-sm tracking-tight">{debt.supplier}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{debt.transactions.length} ტრანზაქცია</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-black text-blue-600">{debt.totalDebt.toFixed(2)} ₾</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">ნაშთი</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl hover:bg-blue-50 text-blue-600"
                          onClick={() => setSelectedEntity({
                            name: debt.supplier,
                            total: debt.totalDebt,
                            transactions: debt.transactions,
                            type: 'supplier'
                          })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debt Detail & Payoff Modal */}
      <Dialog open={!!selectedEntity} onOpenChange={(open) => !open && setSelectedEntity(null)}>
        <DialogContent className="max-w-md p-0 max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-3xl">
          {selectedEntity && (
            <>
              <DialogHeader className={cn(
                "p-8 text-white rounded-t-3xl transition-colors duration-500 relative overflow-hidden",
                selectedEntity.type === 'customer' ? "bg-amber-600" : "bg-blue-600"
              )}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest">
                        {selectedEntity.type === 'customer' ? 'ნისია' : 'ვალი'}
                      </span>
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tighter uppercase">{selectedEntity.name}</DialogTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black tracking-tighter">{selectedEntity.total.toFixed(2)} ₾</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">ჯამური დავალიანება</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 bg-white space-y-6">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedEntity?.transactions.map((t, idx) => {
                    const total = t.quantity * (t.salePrice || t.purchasePrice || 0);
                    const paid = (t.paidInCash || 0) + (t.paidInCard || 0);
                    const debt = total - paid;
                    return (
                      <div key={t.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-xs truncate w-40">{t.productName}</p>
                          <p className="text-[10px] font-medium text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("ka-GE")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-xs">{debt.toFixed(2)} ₾</p>
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">დარჩენილი</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border-2 border-dashed border-border flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">თანხა</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-11 rounded-xl bg-white border-none font-black text-lg text-primary"
                        id="payoff-amount-sales"
                      />
                    </div>
                    <div className="w-[120px] space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">მეთოდი</Label>
                      <select
                        id="payoff-method-sales"
                        className="w-full h-11 rounded-xl bg-white border-none font-bold px-2 text-xs appearance-none cursor-pointer"
                      >
                        <option value="cash">💵 ნაღდი</option>
                        <option value="bank">💳 ბანკი</option>
                      </select>
                    </div>
                  </div>

                  <Button className={cn(
                    "w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg",
                    selectedEntity?.type === 'customer' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                  )} onClick={async () => {
                    if (!selectedEntity) return;
                    const amountInput = document.getElementById('payoff-amount-sales') as HTMLInputElement;
                    const methodSelect = document.getElementById('payoff-method-sales') as HTMLSelectElement;
                    const amount = parseFloat(amountInput.value);
                    const method = methodSelect.value as 'cash' | 'bank';

                    if (!amount || amount <= 0) {
                      toast.error("შეიყვანეთ ვალიდური თანხა");
                      return;
                    }
                    if (amount > selectedEntity.total) {
                      toast.error("თანხა აღემატება არსებულ ვალს");
                      return;
                    }

                    try {
                      await store.payoffDebts(selectedEntity.transactions, amount, method, selectedEntity.type);
                      const remaining = selectedEntity.total - amount;
                      toast.success("ვალი წარმატებით დაიფარა");

                      // Show confirmation with print option
                      if (confirm("გსურთ გადახდის ქვითრის ამობეჭდვა?")) {
                        printPayoffReceipt(selectedEntity.name, amount, remaining, method, selectedEntity.type);
                      }

                      setSelectedEntity(null);
                    } catch (err) {
                      toast.error("შეცდომა ვალის დაფარვისას");
                    }
                  }}>
                    დაფარვა & ბეჭდვა
                  </Button>
                </div>

                <Button variant="outline" className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => setSelectedEntity(null)}>
                  დახურვა
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={shiftOpenModal} onOpenChange={setShiftOpenModal}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className={cn(
            "p-6 text-white",
            store.currentShift ? "bg-rose-600" : "bg-emerald-600"
          )}>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              {store.currentShift ? (
                <>
                  <LogOut className="h-5 w-5" />
                  ცვლის დახურვა
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5" />
                  ცვლის გახსნა
                </>
              )}
            </DialogTitle>
            <p className="text-xs opacity-80 mt-1 font-medium">
              {store.currentShift
                ? `${store.currentShift.employeeName}, გთხოვთ გადათვალოთ ნაღდი ფული სალაროში.`
                : "შეიყვანეთ საწყისი ნაღდი ფული სალაროს გასახსნელად."}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {!store.currentShift ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">საწყისი ნაღდი ფული (₾)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    className="h-12 rounded-xl bg-muted/30 border-none font-black text-lg focus:ring-2 ring-emerald-500/20"
                  />
                </div>
                <Button
                  onClick={() => requireManager("ცვლის გახსნა", handleOpenShift)}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-widest shadow-lg shadow-emerald-200"
                >
                  გახსნა
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/5 border border-border/50 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>გახსნის თარიღი:</span>
                    <span>{new Date(store.currentShift.openedAt).toLocaleString("ka-GE")}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>საწყისი ნაღდი:</span>
                    <span>{store.currentShift.openingCash.toFixed(2)} ₾</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ფაქტიური ნაღდი ფული სალაროში (₾)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(e.target.value)}
                    className="h-12 rounded-xl bg-muted/30 border-none font-black text-lg focus:ring-2 ring-rose-500/20"
                  />
                </div>

                <Button
                  onClick={() => requireManager("ცვლის დახურვა", handleCloseShift)}
                  className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold uppercase tracking-widest shadow-lg shadow-rose-200"
                >
                  დახურვა & Z-რეპორტი
                </Button>
              </div>
            )}

            <Button variant="ghost" className="w-full rounded-xl text-muted-foreground font-bold" onClick={() => setShiftOpenModal(false)}>
              გაუქმება
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
          <div className="bg-emerald-600 p-8 text-white text-center relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-20px] left-[-20px] w-40 h-40 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-[-20px] right-[-20px] w-40 h-40 rounded-full bg-white blur-3xl" />
            </div>

            <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/30 animate-in zoom-in duration-500">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">გაყიდვა წარმატებულია!</DialogTitle>
            <p className="text-emerald-100 text-sm font-medium mt-1 opacity-90">ჩეკი გენერირებულია წარმატებით</p>
          </div>

          <div className="p-6 space-y-6">
            {lastReceiptData && (
              <>
                <div className="bg-muted/30 rounded-2xl p-5 border border-border/50 space-y-3">
                  <div className="flex justify-between items-center pb-3 border-bottom border-dashed border-border/50">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">კლიენტი:</span>
                    <span className="font-bold text-sm">{lastReceiptData.client || "საცალო მყიდველი"}</span>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {lastReceiptData.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm items-center py-1">
                        <div className="flex flex-col">
                          <span className="font-bold line-clamp-1">{item.productName}</span>
                          <span className="text-[10px] text-muted-foreground">{item.quantity} ც × {item.salePrice.toLocaleString()} ₾</span>
                        </div>
                        <span className="font-black">{(item.quantity * item.salePrice).toLocaleString()} ₾</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-dashed border-border/80 flex justify-between items-end">
                    <span className="text-xs font-bold text-muted-foreground">ჯამური თანხა:</span>
                    <span className="text-2xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">
                      {lastReceiptData.total.toLocaleString()} ₾
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                      <Wallet className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">ნაღდი ფული</span>
                    </div>
                    <div className="text-lg font-black">{lastReceiptData.cash.toLocaleString()} ₾</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                      <CreditCard className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">ბარათი</span>
                    </div>
                    <div className="text-lg font-black">{lastReceiptData.card.toLocaleString()} ₾</div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl border-2 font-bold gap-2 hover:bg-muted/50"
                    onClick={() => lastReceiptData.sales.forEach(s => fiscalService.printReceipt(s))}
                  >
                    <Printer className="h-4 w-4" />
                    ბეჭდვა
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20"
                    onClick={() => setReceiptOpen(false)}
                  >
                    დასრულება
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
