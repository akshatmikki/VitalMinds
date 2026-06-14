const CACHE = 'vitalmind-v1'
const OFFLINE_URLS = ['/dashboard', '/habits', '/health', '/journal', '/chat']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/'])).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)

  // API and auth requests: network only
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful page navigations
        if (res.ok && e.request.mode === 'navigate') {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('/')))
  )
})

// Push notification handler
self.addEventListener('push', e => {
  if (!e.data) return
  const { title, body, icon } = e.data.json()
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow('/dashboard'))
})
