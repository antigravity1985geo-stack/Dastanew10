const CACHE_NAME = 'malema-erp-v1'
const STATIC_ASSETS = [
    '/',
    '/icon-192.png',
    '/icon-512.png',
]

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    )
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    )
    self.clients.claim()
})

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return

    // Skip Supabase and analytics requests - always go to network
    const url = new URL(event.request.url)
    if (
        url.hostname.includes('supabase') ||
        url.hostname.includes('vercel') ||
        url.pathname.startsWith('/api/')
    ) {
        return
    }

    event.respondWith(
        fetch(event.request).catch(() =>
            caches.match(event.request).then((cached) => cached || new Response('Offline', { status: 503 }))
        )
    )
})
