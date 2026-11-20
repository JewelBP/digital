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

        onMessage(messaging, (payload) => {
            const title = payload.notification?.title || payload.data?.title || "নতুন নোটিফিকেশন";
            const body = payload.notification?.body || payload.data?.body || "";
            const icon = payload.notification?.icon || payload.data?.icon || "icons/icon-192.png";
            if (Notification.permission === "granted") {
                new Notification(title, { body, icon });
            }
        });
    } catch (err) {
        console.error("FCM Setup Error:", err);
    }
}
