// Encrypted on-device storage for the offline database.
//
//  - Data is encrypted with AES-GCM (random 96-bit IV per write) and kept in IndexedDB.
//  - Key: inside the Android app the 256-bit data key is created and wrapped by the
//    Android Keystore (window.AndroidSecure). In a browser it is a NON-EXTRACTABLE
//    CryptoKey stored in IndexedDB, so the raw key bytes can never be read by script.
//  - API is synchronous (an in-memory mirror is decrypted once at startup, writes are
//    encrypted and flushed asynchronously) so existing code keeps working unchanged.
//  - Legacy plain-text localStorage entries are migrated into the encrypted store and
//    then deleted.
//  If crypto/IndexedDB are unavailable the store degrades to memory-only for that
//  session: nothing sensitive is written in plain text.

const DB_NAME = "rmpmt_secure";
const DATA_STORE = "data";
const KEY_STORE = "keys";
const KEY_ID = "data-key-v1";

// Keys that hold the offline database/content and must never sit in plain text.
export const PROTECTED_KEYS = [
    "police_phonebook_data",
    "rmp_push_notice_cache_v1",
    "rmp_driving_guide_v5",
    "police_pb_slider_cache"
];

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(DATA_STORE)) db.createObjectStore(DATA_STORE);
            if (!db.objectStoreNames.contains(KEY_STORE)) db.createObjectStore(KEY_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function idb(db, store, mode, fn) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const out = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(out && "result" in out ? out.result : undefined);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function loadKey(db) {
    // 1) Android: key material comes from the Keystore-protected native store.
    if (window.AndroidSecure && typeof window.AndroidSecure.getDataKey === "function") {
        try {
            const b64 = window.AndroidSecure.getDataKey();
            if (b64) {
                return await crypto.subtle.importKey("raw", b64ToBytes(b64), "AES-GCM", false, ["encrypt", "decrypt"]);
            }
        } catch (e) { /* fall back to the browser key below */ }
    }
    // 2) Browser: non-extractable key persisted in IndexedDB.
    const existing = await idb(db, KEY_STORE, "readonly", (s) => s.get(KEY_ID));
    if (existing) return existing;
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await idb(db, KEY_STORE, "readwrite", (s) => s.put(key, KEY_ID));
    return key;
}

async function encryptString(key, text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
    return { v: 1, iv, ct };
}

async function decryptString(key, record) {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: record.iv }, key, record.ct);
    return new TextDecoder().decode(pt);
}

async function createStore() {
    const mirror = new Map();
    let db = null;
    let key = null;
    let encrypted = false;

    try {
        if (window.crypto && crypto.subtle && window.indexedDB) {
            db = await openDb();
            key = await loadKey(db);
            encrypted = true;
        }
    } catch (e) {
        db = null; key = null; encrypted = false;
    }

    if (encrypted) {
        // Decrypt everything once. A record that fails to decrypt (key lost, tampering)
        // is discarded so the app simply re-downloads fresh data.
        try {
            const names = await idb(db, DATA_STORE, "readonly", (s) => s.getAllKeys());
            for (const name of names || []) {
                try {
                    const rec = await idb(db, DATA_STORE, "readonly", (s) => s.get(name));
                    mirror.set(name, await decryptString(key, rec));
                } catch (e) {
                    await idb(db, DATA_STORE, "readwrite", (s) => s.delete(name)).catch(() => { });
                }
            }
        } catch (e) { /* start empty */ }
    }

    // Migrate legacy plain-text copies, then remove them from localStorage.
    for (const name of PROTECTED_KEYS) {
        let legacy = null;
        try { legacy = localStorage.getItem(name); } catch (e) { }
        if (legacy == null) continue;
        if (encrypted) {
            if (!mirror.has(name)) mirror.set(name, legacy);
            try { localStorage.removeItem(name); } catch (e) { }
            persist(name, mirror.get(name));
        } else {
            // Cannot encrypt on this device: keep working from memory, still drop plain text.
            if (!mirror.has(name)) mirror.set(name, legacy);
            try { localStorage.removeItem(name); } catch (e) { }
        }
    }

    // Serialise writes per key so a slow older write can never overwrite a newer one.
    const chains = new Map();
    function persist(name, value) {
        if (!encrypted) return Promise.resolve();
        const prev = chains.get(name) || Promise.resolve();
        const next = prev.then(async () => {
            if (value == null) {
                await idb(db, DATA_STORE, "readwrite", (s) => s.delete(name));
            } else {
                const rec = await encryptString(key, value);
                await idb(db, DATA_STORE, "readwrite", (s) => s.put(rec, name));
            }
        }).catch(() => { });
        chains.set(name, next);
        return next;
    }

    return {
        encrypted,
        getItem(name) { return mirror.has(name) ? mirror.get(name) : null; },
        setItem(name, value) { value = String(value); mirror.set(name, value); return persist(name, value); },
        removeItem(name) { mirror.delete(name); return persist(name, null); },
        // Wipe all offline data (used by "clear data").
        async clear() {
            mirror.clear();
            if (encrypted) await idb(db, DATA_STORE, "readwrite", (s) => s.clear()).catch(() => { });
        }
    };
}

export const secureStore = await createStore();
