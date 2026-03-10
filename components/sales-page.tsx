"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Plus, Minus, ShoppingCart, Trash2, Package, Download, FileText, Pencil, ArrowUpDown, ArrowUp, ArrowDown, X, Search, AlertCircle, Wallet, CreditCard, Eye, ChevronRight, Printer, CheckCircle2 } from "lucide-react";
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

      // Auto-generate Z-Report on close
      try {
        const res = await fiscalService.printZReport();
        if (res.success) {
          toast.success("Z-რეპორტი წარმატებით დაიბეჭდა");
        }
      } catch (zErr) {
        console.error("Z-Report failed:", zErr);
        toast.error("ცვლა დაიხურა, მაგრამ Z-რეპორტის ბეჭდვა ვერ მოხერხდა");
      }

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
          <div className="hidden md:flex items-center gap-2 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-lg">
            <User className="h-3 w-3 text-primary/60" />
            <span className="text-[11px] font-black">{store.currentEmployee.name}</span>
          </div>
        )}
      </div>
    );

    headerStore.setHeader(headerTitle, headerActions);

    return () => {
      headerStore.clearHeader();
    };
  }, [mounted, store.currentShift, store.currentEmployee, showHistory, store.sales.length]);

  return (
    <div id="print-area" className="flex flex-col h-full max-w-full overflow-x-hidden space-y-3 pt-0 p-4 sm:p-4 animate-in fade-in duration-700">
      <PINLoginOverlay />

      <ManagerAuthDialog
        open={managerAuthOpen}
        onOpenChange={setManagerAuthOpen}
        actionName={managerAuthName}
        onSuccess={() => {
          if (managerAuthAction) managerAuthAction();
        }}
      />

      {/* POS Layout: Products Grid + Cart Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Product Grid */}
        <div className="lg:col-span-1">
          {/* Search */}
          <div className="relative mb-4 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={productSearchRef}
              placeholder="ძებნა (Space) — (სახელი, კატეგორია, შტრიხკოდი)..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-10 h-11 border-primary/10 focus-visible:ring-primary/20"
            />
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>პროდუქტები ვერ მოიძებნა</p>
              </div>
            ) : (
              filteredProducts.map((product: Product) => {
                const inCart = cart.find(item => item.productId === product.id);
                const isOutOfStock = product.quantity <= 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    className={cn(
                      "relative text-left rounded-2xl border p-3 transition-all duration-300 group overflow-hidden",
                      inCart
                        ? "border-primary bg-primary/5 ring-2 ring-primary/10 shadow-lg"
                        : "border-border/50 bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1",
                      isOutOfStock ? "opacity-40 cursor-not-allowed grayscale" : "cursor-pointer active:scale-95"
                    )}
                  >
                    {/* Cart badge */}
                    {inCart && (
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-black rounded-full h-6 w-6 flex items-center justify-center shadow-lg border-2 border-background animate-in zoom-in">
                        {inCart.quantity}
                      </span>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      {product.imageUrl ? (
                        <div className={cn(
                          "h-10 w-10 rounded-lg overflow-hidden shadow-sm border",
                          inCart ? "border-primary" : "border-transparent"
                        )}>
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                          inCart ? "bg-primary text-primary-foreground" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                        )}>
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded truncate">
                          {product.category || "სხვა"}
                        </span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest whitespace-nowrap",
                          isOutOfStock ? "text-destructive" : "text-primary/60"
                        )}>
                          სტოკი: {product.quantity}
                        </span>
                      </div>
                      <div className="pt-2 flex items-baseline justify-between border-t border-border/50 mt-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black tracking-tighter text-foreground">
                            {product.salePrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-black text-primary/80 uppercase tracking-widest">
                            {settings.currency}
                          </span>
                        </div>
                        {inCart && (
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Cart Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* Held Receipts UI */}
          {heldReceipts.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {heldReceipts.map(receipt => (
                <div key={receipt.id} className="flex flex-col bg-amber-50 border border-amber-200 rounded-xl p-2 min-w-[140px] shadow-sm relative group animate-in zoom-in slide-in-from-left-2 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-900 truncate pr-4">{receipt.clientName}</span>
                    <button
                      onClick={() => removeHeldReceipt(receipt.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-amber-700/50 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-sm font-black text-amber-700">{receipt.total.toFixed(2)} ₾</span>
                    <button
                      onClick={() => recallReceipt(receipt.id)}
                      className="h-6 w-6 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center hover:bg-amber-300 transition-colors shadow-sm"
                    >
                      <PlayCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Card className="sticky top-4 border-primary/20 shadow-xl overflow-hidden rounded-2xl flex flex-col h-max">
            <div className="h-1.5 w-full bg-primary flex-shrink-0" />
            <CardHeader className="pb-4 bg-muted/30 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-primary-foreground" />
                  </div>
                  კალათა
                  <span className="ml-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {cartItemCount}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="bg-muted/50 p-1 rounded-xl flex items-center text-xs font-bold border border-border/50">
                    <button
                      onClick={() => setPriceMode("retail")}
                      className={cn("px-3 py-1.5 rounded-lg transition-all", priceMode === "retail" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                      საცალო
                    </button>
                    <button
                      onClick={() => setPriceMode("wholesale")}
                      className={cn("px-3 py-1.5 rounded-lg transition-all", priceMode === "wholesale" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-primary")}
                    >
                      საბითუმო
                    </button>
                  </div>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/5 h-8 text-xs font-bold px-2 ml-1"
                      onClick={clearCart}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="relative mx-auto w-20 h-20 mb-4">
                    <ShoppingCart className="h-20 w-20 opacity-5" />
                    <Search className="absolute inset-0 h-8 w-8 m-auto opacity-20" />
                  </div>
                  <p className="text-sm font-medium">კალათა ცარიელია</p>
                  <p className="text-xs mt-1 opacity-60">დაასკანერეთ ან აირჩიეთ პროდუქტი</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Cart Items List */}

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm group animate-in slide-in-from-right-2 duration-200"
                      >
                        {/* Product thumbnail */}
                        {item.imageUrl ? (
                          <div className="h-10 w-10 rounded-lg overflow-hidden border border-border/50 flex-shrink-0">
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                            <Package className="h-5 w-5 text-primary/40" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground leading-snug mb-1">
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {item.salePrice.toFixed(2)} ₾
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center bg-muted/50 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-background"
                            onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-sm font-black w-8 text-center text-primary">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-background"
                            onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Item total + delete */}
                        <div className="flex flex-col items-end gap-1 min-w-[60px]">
                          <span className="text-sm font-black text-primary">
                            {(item.quantity * item.salePrice).toFixed(2)} ₾
                          </span>
                          <button
                            className="text-muted-foreground hover:text-destructive p-1 transition-colors hover:bg-destructive/5 rounded-md"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer / Summary */}
                  <div className="p-3 bg-muted/20 border-t space-y-3">
                    {/* Client Selection */}
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">მყიდველი</Label>
                      <Input
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="მყიდველის სახელი"
                        className="h-9 text-xs border-transparent focus-visible:ring-primary/10 bg-card rounded-lg"
                      />
                    </div>

                    {/* Financial Summary */}
                    <div className="p-3 rounded-xl bg-primary/5 space-y-2 border border-primary/10">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span className="text-[10px] font-bold uppercase tracking-wider">ჯამი</span>
                        <span className="text-base font-black text-foreground">
                          {cartTotal.toFixed(2)} ₾
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center ml-1">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-primary/70">გადახდილი თანხა</Label>
                          {paidAmount && (
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                              parseFloat(paidAmount) >= cartTotal ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            )}>
                              {parseFloat(paidAmount) >= cartTotal
                                ? `ხურდა: ${(parseFloat(paidAmount) - cartTotal).toFixed(2)}`
                                : `ნისია: ${(cartTotal - parseFloat(paidAmount)).toFixed(2)}`
                              }
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          placeholder={cartTotal.toFixed(2)}
                          className="h-9 text-sm font-black border-transparent focus-visible:ring-primary/20 bg-card rounded-lg text-primary"
                        />
                      </div>
                    </div>

                    {/* Settings Toggles */}
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() => setSendToRSGE(!sendToRSGE)}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 rounded-lg border-2 cursor-pointer transition-all",
                          sendToRSGE ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm" : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <span className="text-[11px] font-black tracking-widest leading-none">RS.GE</span>
                      </div>
                      <div
                        onClick={() => setPrintFiscal(!printFiscal)}
                        className={cn(
                          "flex items-center justify-center gap-2 py-1.5 rounded-lg border-2 cursor-pointer transition-all",
                          printFiscal ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <span className="text-[9px] font-bold">ფისკალური</span>
                      </div>
                    </div>

                    {/* RS.GE extra fields (visible when toggle is ON) */}
                    {sendToRSGE && (
                      <div className="flex flex-col gap-2 p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">ზედნადების პარამეტრები</p>
                        <input
                          className="h-8 w-full rounded-lg bg-white border border-emerald-200 px-3 text-sm font-medium"
                          placeholder="მყიდველის ს/ნ (TIN) — არასავალდებული"
                          value={rsgeBuyerTin}
                          onChange={(e) => setRsgeBuyerTin(e.target.value)}
                        />
                        <select
                          value={rsgeWaybillType}
                          onChange={(e) => setRsgeWaybillType(Number(e.target.value) as 1 | 2 | 3)}
                          className="h-8 w-full rounded-lg bg-white border border-emerald-200 px-3 text-sm font-medium"
                        >
                          <option value={1}>შიდა (ინტერნალ)</option>
                          <option value={2}>გარე (ექსტერნალ)</option>
                          <option value={3}>გადაადგილება</option>
                        </select>
                      </div>
                    )}


                    {/* Final Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="gap-1 h-11 text-xs font-bold border-amber-500/30 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-500/50 transition-all rounded-xl w-1/3"
                        onClick={holdCurrentReceipt}
                      >
                        <PauseCircle className="h-4 w-4" />
                        გადადება (F9)
                      </Button>
                      <Button
                        className="flex-1 gap-2 h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all rounded-xl"
                        size="lg"
                        onClick={() => {
                          if (cart.length === 0) return;
                          setCashPaid(cartTotal.toFixed(2));
                          setCardPaid("");
                          setCheckoutOpen(true);
                        }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        გაყიდვა (Enter)
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
