"use client";

import { useState, useEffect } from "react";
import { useCFDSync, CFDState } from "@/hooks/use-cfd-sync";
import { MonitorPlay, ShoppingCart, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CustomerDisplayPage() {
  const [state, setState] = useState<CFDState>({
    cart: [],
    total: 0,
    clientName: "",
    isNisia: false
  });
  
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  // Hook handles receiving the broadcasts from either Local or Realtime channels
  useCFDSync('receiver', (newState) => {
    if (connectionStatus !== 'connected') setConnectionStatus('connected');
    setState(newState);
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (connectionStatus === 'connecting') setConnectionStatus('disconnected');
    }, 5000);
    return () => clearTimeout(timer);
  }, [connectionStatus]);

  const { cart, total, clientName, isNisia } = state;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8 font-sans">
      
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#8b1a1a] rounded-lg flex items-center justify-center shadow-md">
             <span className="text-sm font-black text-white">DASTA</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">თქვენი შენაძენი</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {clientName && (
            <div className="hidden sm:block text-sm font-medium text-slate-600">
              მომხმარებელი: <span className="text-slate-900 font-bold">{clientName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
            <div className={cn(
                "h-2 w-2 rounded-full animate-pulse",
                connectionStatus === 'connected' ? "bg-emerald-500" : 
                connectionStatus === 'connecting' ? "bg-amber-500" : "bg-red-500"
              )} />
            <span className="text-xs font-bold text-slate-600 uppercase">
              {connectionStatus === 'connected' ? "დაკავშირებულია" : 
               connectionStatus === 'connecting' ? "კავშირი..." : "გათიშულია"}
            </span>
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-[#8b1a1a]" />
            <h2 className="text-base md:text-lg font-bold text-slate-800 uppercase tracking-wide">კალათის შიგთავსი</h2>
          </div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
            {cart.length} პროდუქტი
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 md:pr-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <MonitorPlay className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg md:text-xl font-bold opacity-50 uppercase tracking-widest text-center">კალათა ცარიელია</p>
            </div>
          ) : (
            <div className="space-y-3">
               {cart.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-100 p-3 md:p-4 rounded-xl shadow-sm gap-3 sm:gap-0">
                     <div className="flex items-center gap-4">
                       <div className="h-10 w-10 md:h-12 md:w-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} alt="" className="h-full w-full object-cover rounded-lg" />
                          ) : (
                             <Package className="h-5 w-5 md:h-6 md:w-6 text-slate-300" />
                          )}
                       </div>
                       <div>
                          <h3 className="text-sm md:text-base font-bold text-slate-800 uppercase line-clamp-1">{item.productName}</h3>
                          <div className="text-xs md:text-sm font-semibold text-slate-500 mt-1">
                            {item.quantity} ცალი <span className="mx-1 text-slate-300">•</span> {(item.finalPrice || 0).toFixed(2)} ₾
                          </div>
                       </div>
                     </div>
                     <div className="text-right sm:pl-4 sm:border-l border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5 hidden sm:block">ჯამი</p>
                        <p className="text-lg md:text-xl font-black text-slate-900">
                          {((item.finalPrice || 0) * item.quantity).toFixed(2)} ₾
                        </p>
                     </div>
                  </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Total */}
      <div className="mt-4 md:mt-6 bg-slate-900 text-white p-4 md:p-6 rounded-xl shadow-lg flex items-center justify-between shrink-0">
         <div>
            <p className="text-white/60 font-bold uppercase tracking-widest text-xs mb-1">გადასახდელი ჯამი</p>
            {isNisia && (
                <span className="text-[10px] md:text-xs font-bold text-yellow-400 uppercase bg-yellow-400/10 px-2 py-1 rounded inline-block mt-1">ნისიის წიგნი</span>
            )}
         </div>
         <div className="flex items-center gap-2 md:gap-3">
            <span className="text-3xl md:text-5xl font-black tracking-tight">{total.toFixed(2)}</span>
            <span className="text-xl md:text-2xl font-bold text-[#8b1a1a] bg-white/10 px-2 md:px-3 py-1 md:py-1.5 rounded-lg">₾</span>
         </div>
      </div>

    </div>
  );
}
