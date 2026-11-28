import { app, db } from "./firebase.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates থেকে Key বসান
const VAPID_KEY = "BHFVjxKWjfcSub9dffCn4JfsllHTt4X-slsD9wZaZC3b0JGGqjvRlyxgKUqc5U-8q4lCV_ITZwaoKy7E5GsZoUY";

// Inside the Android app the WebView has no Push API. The native side (Firebase Messaging)
// hands us its token through window.__onNativePushToken and shows the notifications itself.
function isAndroidApp() {
    return !!(window.AndroidPush && typeof window.AndroidPush.register === "function");
}

async function saveToken(token, platform) {
    if (!token) return;
    const tokenKey = btoa(token).replace(/[^\w]/g, "").slice(-40);
    await set(ref(db, `webapp/fcmTokens/${tokenKey}`), {
        token,
        updatedAt: Date.now(),
        platform
    });
}

let nativeHooked = false;
export function initNativePushNotifications() {
    if (!isAndroidApp()) return false;
    if (!nativeHooked) {
        nativeHooked = true;
        window.__onNativePushToken = function (token) {
            saveToken(token, "android").catch((e) => console.error("Saving push token failed:", e));
        };
    }
    try { window.AndroidPush.register(); } catch (e) { console.error(e); }
    return true;
}

export async function initWebPushNotifications() {
    if (initNativePushNotifications()) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (token) await saveToken(token, "web");

        onMessage(messaging, async (payload) => {
            const d = payload.data || {};
            const title = payload.notification?.title || d.title || "New notification";
            const options = {
                body: payload.notification?.body || d.body || "",
                icon: "icons/icon-192.png",
                badge: "icons/icon-192.png",
                data: d
            };
            if (d.image && /^https?:/i.test(d.image)) options.image = d.image;
            if (Notification.permission === "granted") {
                // Android Chrome does not allow `new Notification()`; use the service worker.
                try { await registration.showNotification(title, options); }
                catch (e) { console.error("showNotification failed:", e); }
            }
        });
    } catch (err) {
        console.error("FCM Setup Error:", err);
    }
}
