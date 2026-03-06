'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'malema-pwa-install-dismissed'

export function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        // Check if already in standalone mode (installed)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }

        // Check if user dismissed recently (within 3 days)
        const dismissedAt = localStorage.getItem(DISMISS_KEY)
        if (dismissedAt) {
            const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
            if (daysSince < 3) return
        }

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            // Small delay before showing for better UX
            setTimeout(() => {
                setShowBanner(true)
                setIsAnimating(true)
            }, 2000)
        }

        window.addEventListener('beforeinstallprompt', handler)

        window.addEventListener('appinstalled', () => {
            setShowBanner(false)
            setDeferredPrompt(null)
            setIsInstalled(true)
        })

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setShowBanner(false)
        }
        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setIsAnimating(false)
        setTimeout(() => {
            setShowBanner(false)
            localStorage.setItem(DISMISS_KEY, Date.now().toString())
        }, 300)
    }

    if (isInstalled || !showBanner) return null

    return (
        <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm
        transition-all duration-300 ease-out
        ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
            <div
                className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                style={{
                    background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                {/* Glow effect */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at top left, #6366f1 0%, transparent 60%)',
                    }}
                />

                <div className="relative p-4 flex items-center gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Smartphone className="w-6 h-6 text-white" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm leading-tight">
                            დააინსტალირეთ Malema ERP
                        </p>
                        <p className="text-zinc-400 text-xs mt-0.5 leading-tight">
                            სწრაფი წვდომა მოწყობილობიდან
                        </p>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
                        aria-label="დახურვა"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Install button */}
                <div className="px-4 pb-4">
                    <button
                        onClick={handleInstall}
                        className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white
              bg-gradient-to-r from-indigo-600 to-purple-600
              hover:from-indigo-500 hover:to-purple-500
              active:scale-[0.98]
              transition-all duration-150 shadow-lg shadow-indigo-500/20
              flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        ინსტალაცია
                    </button>
                </div>
            </div>
        </div>
    )
}
