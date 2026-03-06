import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AuthGuard } from '@/components/auth-guard'
import { AppShell } from '@/components/app-shell'
import { PWAInstallBanner } from '@/components/pwa-install-banner'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'საწყობის მართვის სისტემა',
  description: 'საწყობის მართვა, შესყიდვა, გაყიდვა, ბუღალტერია',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Malema ERP',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ka">
      <body className="font-sans antialiased">
        <AuthGuard>
          <AppShell>{children}</AppShell>
        </AuthGuard>
        <PWAInstallBanner />
        <ServiceWorkerRegister />
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
