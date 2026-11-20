importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// ব্যাকগ্রাউন্ডে পুশ নোটিফিকেশন আসলে তা দেখানোর হ্যান্ডলার
messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || "নতুন নোটিফিকেশন";
    const options = {
        body: payload.notification?.body || payload.data?.body || "",
        icon: payload.notification?.icon || payload.data?.icon || "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: payload.data || {}
    };

    self.registration.showNotification(title, options);
});

// নোটিফিকেশনে ক্লিক করলে অ্যাপ/পেজ ওপেন করা
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ("focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
