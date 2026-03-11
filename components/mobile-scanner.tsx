"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
}

export function MobileScanner({ onScan, onClose, title = "ბარკოდის სკანერი" }: MobileScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Stop scanner on success and call onScan
        scanner.clear().then(() => {
          onScan(decodedText);
        }).catch(err => console.error("Failed to clear scanner", err));
      },
      (errorMessage) => {
        // Silently ignore camera feed errors (they happen every frame if no barcode)
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Cleanup error", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div id="reader" className="w-full max-w-sm overflow-hidden rounded-2xl border-2 border-primary/50" />
        
        <p className="mt-8 text-center text-sm text-white/60">
          მოათავსეთ ბარკოდი ჩარჩოში სკანირებისთვის
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="p-8 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          გადატვირთვა
        </Button>
      </div>
    </div>
  );
}
