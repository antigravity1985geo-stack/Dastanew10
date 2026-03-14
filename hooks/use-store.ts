"use client";

import { useSyncExternalStore } from "react";
import { warehouseStore } from "@/lib/store";

const subscribe = (callback: () => void) => warehouseStore.subscribe(callback);
const getSnapshot = () => warehouseStore.getSnapshot();
const getServerSnapshot = () => warehouseStore.getSnapshot();

export function useWarehouseStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    ...snapshot,
    addProduct: warehouseStore.addProduct.bind(warehouseStore),
    updateProduct: warehouseStore.updateProduct.bind(warehouseStore),
    deleteProduct: warehouseStore.deleteProduct.bind(warehouseStore),
    addSale: warehouseStore.addSale.bind(warehouseStore),
    updateSale: warehouseStore.updateSale.bind(warehouseStore),
    deleteSale: warehouseStore.deleteSale.bind(warehouseStore),
    getProductById: warehouseStore.getProductById.bind(warehouseStore),
    getProductByBarcode: warehouseStore.getProductByBarcode.bind(warehouseStore),
    getAnalyticsData: warehouseStore.getAnalyticsData.bind(warehouseStore),
    getTopProducts: warehouseStore.getTopProducts.bind(warehouseStore),
    getCategoryDistribution: warehouseStore.getCategoryDistribution.bind(warehouseStore),
    getPurchaseHistory: warehouseStore.getPurchaseHistory.bind(warehouseStore),
    addExpense: warehouseStore.addExpense.bind(warehouseStore),
    deleteExpense: warehouseStore.deleteExpense.bind(warehouseStore),
    
    // Customers
    addCustomer: warehouseStore.addCustomer.bind(warehouseStore),
    updateCustomer: warehouseStore.updateCustomer.bind(warehouseStore),
    deleteCustomer: warehouseStore.deleteCustomer.bind(warehouseStore),
    
    // Branches
    addBranch: warehouseStore.addBranch.bind(warehouseStore),
    updateBranch: warehouseStore.updateBranch.bind(warehouseStore),
    deleteBranch: warehouseStore.deleteBranch.bind(warehouseStore),
    setCurrentBranch: warehouseStore.setCurrentBranch.bind(warehouseStore),
    
    // Transfers
    transferStock: warehouseStore.transferStock.bind(warehouseStore),
    
    // Auth/Employees
    logoutEmployee: warehouseStore.logoutEmployee.bind(warehouseStore),
  };
}
