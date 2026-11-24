import { app, db } from "./firebase.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates থেকে Key বসান
const VAPID_KEY = "BMrkQHSj9Ecth4EmZgRAJI9Wy0SaC6fYzMbibosBFXdaUo8BE-TRotw9UXx9Lp9ABFsLQJZPA_4QaueOuIs9GaE";

export async function initWebPushNotifications() {
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

        if (token) {
            const tokenKey = btoa(token).replace(/[^\w]/g, "").slice(-40);
            await set(ref(db, `webapp/fcmTokens/${tokenKey}`), {
                token,
                updatedAt: Date.now(),
                platform: "web"
            });
        }

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

            try {
                const noticePayload = {
                    id: payload.messageId || payload.fcmMessageId || d.id || "",
                    title,
                    body: options.body || "",
                    read: false,
                    createdAt: Date.now()
                };
                if (typeof window.saveNoticeToUserStorage === "function") {
                    window.saveNoticeToUserStorage(noticePayload);
                } else {
                    window.dispatchEvent(new CustomEvent("app:notice", { detail: noticePayload }));
                }
            } catch (e) {
                console.warn("Notice storage sync skipped:", e);
            }

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
