/* RMP MT Contacts: caching logic.
 *
 * This file is NOT registered on its own. firebase-messaging-sw.js (the one worker
 * registered for this scope) pulls it in with importScripts(), so push handling
 * and caching live in the same service worker.
 *
 *  - App shell (same-origin html/js/css/json/manifest): stale-while-revalidate.
 *  - Images (any origin, including opaque cross-origin responses) and the pinned
 *    Firebase SDK files: cache-first.
 *  - NEVER cached: non-GET, Firebase Auth / Realtime Database / FCM / installations
 *    traffic, the Worker's /api/ routes, and range requests.
 *  - Cache names are versioned; old versions are deleted on activate; each cache has
 *    an entry cap.
 */
const SW_VERSION = "v4";
const PREFIX = "rmpmt-";
const SHELL_CACHE = PREFIX + "shell-" + SW_VERSION;
const IMAGE_CACHE = PREFIX + "img-" + SW_VERSION;
const STATIC_CACHE = PREFIX + "static-" + SW_VERSION;
const CURRENT_CACHES = [SHELL_CACHE, IMAGE_CACHE, STATIC_CACHE];

const MAX_ENTRIES = { [SHELL_CACHE]: 80, [IMAGE_CACHE]: 120, [STATIC_CACHE]: 40 };

const PRECACHE = [
    "./splash.html",
    "./index.html",
    "./index1.html",
    "./manifest.json",
    "./css/style.css",
    "./js/app.js",
    "./js/app1.js",
    "./js/auth.js",
    "./js/firebase.js",
    "./js/secure-store.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

const NEVER_CACHE_HOSTS = [
    "firebaseio.com",                 // Realtime Database (REST + websocket long-poll)
    "firebasedatabase.app",
    "identitytoolkit.googleapis.com", // Auth sign-in / lookup
    "securetoken.googleapis.com",     // Auth token refresh
    "firebaseinstallations.googleapis.com",
    "fcm.googleapis.com",
    "fcmregistrations.googleapis.com",
    "firestore.googleapis.com",
    "oauth2.googleapis.com",
    "accounts.google.com",
    "apis.google.com"
];

function isNeverCached(url) {
    if (url.protocol !== "https:" && url.hostname !== "localhost") return true;
    if (NEVER_CACHE_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith("." + h))) return true;
    if (url.hostname.endsWith("firebaseapp.com") && url.pathname.startsWith("/__/")) return true; // auth handler
    if (url.pathname.startsWith("/api/")) return true;
    return false;
}

function isImageRequest(request, url) {
    return request.destination === "image" || url.pathname.startsWith("/img/") ||
        /\.(png|jpe?g|webp|gif|avif|svg|ico)$/i.test(url.pathname);
}

function isPinnedStatic(url) {
    // Version-pinned Firebase SDK and Google font files never change at a given URL.
    return (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) ||
        url.hostname === "fonts.gstatic.com";
}

async function trim(cacheName) {
    const max = MAX_ENTRIES[cacheName];
    if (!max) return;
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]); // oldest first
}

async function put(cacheName, request, response) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    await trim(cacheName);
}

// Same-origin success, or an opaque cross-origin image (status 0) which cannot be inspected.
function cacheable(response, { allowOpaque }) {
    if (!response) return false;
    if (response.type === "opaque") return allowOpaque;
    return response.ok && response.status === 200;
}

async function staleWhileRevalidate(event, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(event.request);

    const network = fetch(event.request)
        .then((res) => {
            if (cacheable(res, { allowOpaque: false })) event.waitUntil(put(cacheName, event.request, res.clone()));
            return res;
        })
        .catch(() => null);

    if (cached) {
        event.waitUntil(network); // refresh in the background
        return cached;
    }
    const res = await network;
    if (res) return res;

    // Offline with nothing cached: for page navigations fall back to the cached shell.
    if (event.request.mode === "navigate") {
        const fallback = (await cache.match("./index.html")) || (await cache.match("./splash.html"));
        if (fallback) return fallback;
    }
    return new Response("Offline", { status: 503, statusText: "Offline" });
}

async function cacheFirst(event, cacheName, { allowOpaque }) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(event.request);
    if (cached) return cached;

    try {
        const res = await fetch(event.request);
        if (cacheable(res, { allowOpaque })) event.waitUntil(put(cacheName, event.request, res.clone()));
        return res;
    } catch (err) {
        return new Response("", { status: 504, statusText: "Offline" });
    }
}

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            // One failing file must not abort the install, so add individually.
            .then((cache) => Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => null))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names
                    .filter((n) => !CURRENT_CACHES.includes(n))
                    // our own old versions, and the legacy "RMP MT Contacts-v1.1" cache
                    .filter((n) => n.startsWith(PREFIX) || n.startsWith("RMP MT Contacts"))
                    .map((n) => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("message", (event) => {
    if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;
    if (request.headers.has("range")) return;

    let url;
    try { url = new URL(request.url); } catch (e) { return; }
    if (isNeverCached(url)) return; // let the browser handle it untouched

    if (isImageRequest(request, url)) {
        event.respondWith(cacheFirst(event, IMAGE_CACHE, { allowOpaque: true }));
        return;
    }

    if (isPinnedStatic(url)) {
        event.respondWith(cacheFirst(event, STATIC_CACHE, { allowOpaque: false }));
        return;
    }

    if (url.origin === self.location.origin) {
        // Never cache the worker scripts themselves; the browser manages their updates.
        if (/\/(sw|firebase-messaging-sw)\.js$/.test(url.pathname)) return;
        event.respondWith(staleWhileRevalidate(event, SHELL_CACHE));
    }
    // Everything else (other cross-origin requests) goes straight to the network.
});
