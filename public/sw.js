/*
 * FAANG Study service worker: offline reading for the static export.
 *
 * - Pages (navigations): network first, falling back to the saved copy after
 *   3 seconds or when offline, so fresh content wins on a good connection.
 * - Hashed build files (/_next/static): cache first; they never change.
 * - Search index and topic list: stale-while-revalidate.
 * - The app asks it to save upcoming re-reads and recently opened topics.
 *
 * Caches are versioned; bumping VERSION drops the old ones on activation.
 */
const VERSION = 'v1'
const PAGES = `faang-pages-${VERSION}`
const ASSETS = `faang-assets-${VERSION}`
const PAYLOADS = `faang-payloads-${VERSION}`
const MAX_PAGES = 200
const MAX_ASSETS = 400
const MAX_PAYLOADS = 200
const NETWORK_GRACE_MS = 3000

// '' at the site root, '/study-practice-repo' on GitHub Pages.
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '')
const CORE_PAGES = ['/', '/review', '/system-design', '/dsa', '/ddia', '/cs-fundamentals', '/behavioral', '/progress', '/flashcards', '/settings'].map((p) => BASE + p)
const DATA_FILES = ['/search-index.json', '/topics-graph.json'].map((p) => BASE + p)

/** One cache key per page, whatever form the URL arrived in. */
function pageKey(input) {
  const url = new URL(input, self.location.origin)
  const path = url.pathname.replace(/\.html$/, '').replace(/\/+$/, '')
  return url.origin + (path || '/')
}

/** Copies a redirected response: Safari refuses those as navigation answers. */
function clean(res) {
  if (!res.redirected) return res
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers })
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function offlinePage() {
  const home = BASE + '/'
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · FAANG Study</title>
<style>
:root{color-scheme:light dark;--bg:#f9f9fb;--ink:#16161c;--muted:#6f6f7b;--brand:#b85c12}
@media (prefers-color-scheme:dark){:root{--bg:#0f0f12;--ink:#ececf1;--muted:#8e8e9a;--brand:#eea25c}}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:15px/1.55 "Helvetica Neue",Helvetica,Arial,sans-serif;padding:24px}
main{max-width:420px}h1{font-size:22px;letter-spacing:-.02em;margin:0 0 8px}p{color:var(--muted);margin:0 0 16px}a{color:var(--brand);font-weight:500}
</style></head><body><main>
<h1>You're offline</h1>
<p>This page hasn't been saved on this device yet. Topics you've opened, and your re-reads for today and the next two days, are available offline.</p>
<a href="${home}">Go to the library</a>
</main></body></html>`
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

async function cacheAsset(url) {
  const cache = await caches.open(ASSETS)
  if (await cache.match(url)) return
  const res = await fetch(url)
  if (res.ok) await cache.put(url, res)
}

/** Saves a page and the build files it references, so it renders offline. */
async function savePage(url, { refresh = false } = {}) {
  const key = pageKey(url)
  const pages = await caches.open(PAGES)
  if (!refresh && (await pages.match(key))) return
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) return
  const html = await res.clone().text()
  await pages.put(key, clean(res))
  const assets = new Set()
  const pattern = new RegExp(`(?:src|href)="(${BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/_next/static/[^"]+)"`, 'g')
  for (const m of html.matchAll(pattern)) assets.add(m[1])
  await Promise.allSettled([...assets].map(cacheAsset))
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await Promise.allSettled(CORE_PAGES.map((url) => savePage(url, { refresh: true })))
      await Promise.allSettled(DATA_FILES.map(cacheAsset))
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PAGES, ASSETS, PAYLOADS])
      for (const name of await caches.keys()) {
        if (name.startsWith('faang-') && !keep.has(name)) await caches.delete(name)
      }
      await self.clients.claim()
    })()
  )
})

async function networkFirstPage(request) {
  const key = pageKey(request.url)
  const pages = await caches.open(PAGES)
  const network = fetch(request).then(async (res) => {
    if (res.ok) {
      await pages.put(key, clean(res.clone()))
      trim(PAGES, MAX_PAGES)
    }
    return clean(res)
  })
  const cached = await pages.match(key)
  if (!cached) return network.catch(() => offlinePage())
  return Promise.race([network.catch(() => cached), sleep(NETWORK_GRACE_MS).then(() => cached)])
}

/** Client-side navigation payloads. On a miss the router falls back to a full page load. */
async function networkFirstPayload(request) {
  const url = new URL(request.url)
  const key = url.origin + url.pathname
  const payloads = await caches.open(PAYLOADS)
  try {
    const res = await fetch(request)
    if (res.ok) {
      await payloads.put(key, res.clone())
      trim(PAYLOADS, MAX_PAYLOADS)
    }
    return res
  } catch {
    return (await payloads.match(key)) || Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok && res.type === 'basic') {
    await cache.put(request, res.clone())
    trim(ASSETS, MAX_ASSETS)
  }
  return res
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS)
  const hit = await cache.match(request)
  const network = fetch(request)
    .then(async (res) => {
      if (res.ok) await cache.put(request, res.clone())
      return res
    })
    .catch(() => hit || Response.error())
  return hit || network
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname !== BASE && !url.pathname.startsWith(BASE + '/')) return

  if (url.pathname.startsWith(BASE + '/_next/static/')) {
    event.respondWith(cacheFirst(request))
  } else if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
  } else if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1' || url.pathname.endsWith('.txt')) {
    event.respondWith(networkFirstPayload(request))
  } else if (DATA_FILES.includes(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request))
  } else {
    event.respondWith(cacheFirst(request))
  }
})

self.addEventListener('message', (event) => {
  const { type, urls } = event.data || {}
  if (!Array.isArray(urls)) return
  const sameOrigin = urls.filter((u) => {
    try {
      return typeof u === 'string' && new URL(u, self.location.origin).origin === self.location.origin
    } catch {
      return false
    }
  })
  if (type === 'save-pages') {
    event.waitUntil(Promise.allSettled(sameOrigin.map((u) => savePage(u))).then(() => trim(PAGES, MAX_PAGES)))
  } else if (type === 'save-assets') {
    event.waitUntil(Promise.allSettled(sameOrigin.map(cacheAsset)).then(() => trim(ASSETS, MAX_ASSETS)))
  }
})
