// ওয়েব পুশ নোটিফিকেশন (FCM) — GitHub Pages সাইটের জন্য
import { app } from "./firebase.js";
import {
    getMessaging,
    getToken,
    onMessage,
    isSupported
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";

// Firebase Console → Project settings → Cloud Messaging → Web Push certificates থেকে পাওয়া key
const VAPID_KEY = "BMrkQHSj9Ecth4EmZgRAJI9Wy0SaC6fYzMbibosBFXdaUo8BE-TRotw9UXx9Lp9ABFsLQJZPA_4QaueOuIs9GaE";

const SW_PATH = "firebase-messaging-sw.js";
const DISMISS_KEY = "push_prompt_dismissed_at";
const DISMISS_DAYS = 3;

let messaging = null;
let registration = null;

function isConfigured() {
    return VAPID_KEY && VAPID_KEY !== "PASTE_YOUR_VAPID_KEY_HERE";
}

async function registerAndGetToken() {
    registration = await navigator.serviceWorker.register(SW_PATH);
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
    });

    if (token) {
        try { localStorage.setItem("fcm_token", token); } catch (e) { /* ignore */ }
    }
    return token;
}

async function enablePush() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
    const token = await registerAndGetToken();
    return !!token;
}

function wasDismissedRecently() {
    try {
        const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
        return at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch (e) {
        return false;
    }
}

function showPromptBanner() {
    if (document.getElementById("pushPromptBanner")) return;

    const box = document.createElement("div");
    box.id = "pushPromptBanner";
    box.style.cssText =
        "position:fixed;left:12px;right:12px;bottom:calc(90px + env(safe-area-inset-bottom, 0px));" +
        "z-index:99999;background:#0a1a4a;color:#fff;border-radius:14px;padding:12px 14px;" +
        "box-shadow:0 6px 24px rgba(0,0,0,.35);font-family:inherit;font-size:14px;line-height:1.4;";

    const text = document.createElement("div");
    text.textContent = "🔔 নতুন নোটিশ সরাসরি ফোনে পেতে নোটিফিকেশন চালু করুন";

    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;justify-content:flex-end;margin-top:10px;";

    const later = document.createElement("button");
    later.type = "button";
    later.textContent = "পরে";
    later.style.cssText = "background:transparent;color:#cbd5e1;border:1px solid #475569;border-radius:8px;padding:6px 14px;font-size:13px;";

    const enable = document.createElement("button");
    enable.type = "button";
    enable.textContent = "চালু করুন";
    enable.style.cssText = "background:#22c55e;color:#fff;border:0;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:600;";

    later.addEventListener("click", () => {
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* ignore */ }
        box.remove();
    });

    enable.addEventListener("click", async () => {
        enable.disabled = true;
        enable.textContent = "অপেক্ষা করুন...";
        try {
            const ok = await enablePush();
            text.textContent = ok
                ? "✅ নোটিফিকেশন চালু হয়েছে"
                : "⚠️ অনুমতি দেওয়া হয়নি। ব্রাউজারের সাইট সেটিংস থেকে চালু করতে পারবেন।";
        } catch (err) {
            console.error("Push enable error:", err);
            text.textContent = "⚠️ চালু করা যায়নি, পরে আবার চেষ্টা করুন";
        }
        row.remove();
        setTimeout(() => box.remove(), 3500);
    });

    row.append(later, enable);
    box.append(text, row);
    document.body.appendChild(box);
}

async function initPush() {
    // অ্যাপের ভেতরের WebView-তে ওয়েব পুশ চলে না (সেখানে নেটিভ FCM আছে)
    if (location.hostname === "appassets.androidplatform.net") return;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    if (!isConfigured()) {
        console.warn("push.js: VAPID_KEY বসানো হয়নি");
        return;
    }

    try {
        if (!(await isSupported())) return;
        messaging = getMessaging(app);
    } catch (e) {
        return;
    }

    // অ্যাপ খোলা অবস্থায় মেসেজ এলে নোটিফিকেশন দেখানো
    onMessage(messaging, (payload) => {
        const n = payload.notification || {};
        const d = payload.data || {};
        const title = n.title || d.title;
        if (!title || !registration) return;
        registration.showNotification(title, {
            body: n.body || d.body || "",
            icon: "icons/icon-192.png"
        });
    });

    if (Notification.permission === "granted") {
        // আগে অনুমতি দেওয়া থাকলে চুপচাপ টোকেন নতুন করে নেওয়া
        try { await registerAndGetToken(); } catch (e) { console.error("Push token error:", e); }
    } else if (Notification.permission === "default" && !wasDismissedRecently()) {
        setTimeout(showPromptBanner, 4000);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPush);
} else {
    initPush();
}

export { enablePush };
