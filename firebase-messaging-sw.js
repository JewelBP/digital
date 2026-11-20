importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBCnqpIJqMWTI_qXv96hyVs6_UV_60s3Mc",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "https://qrt-team-default-rtdb.firebaseio.com",
    projectId: "qrt-team",
    storageBucket: "qrt-team.firebasestorage.app",
    messagingSenderId: "855875068920",
    appId: "1:855875068920:android:601ffc0cbed4fa36b8ec0d"
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
