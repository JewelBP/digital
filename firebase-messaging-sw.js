importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyCSirbiyWf7WQn9UqoZghAfph2U5jwJbPI",
    authDomain: "qrt-team.firebaseapp.com",
    databaseURL: "https://qrt-team-default-rtdb.firebaseio.com",
    projectId: "qrt-team",
    storageBucket: "qrt-team.firebasestorage.app",
    messagingSenderId: "855875068920",
    appId: "1:855875068920:web:df1a2218ee083000b8ec0d",
    measurementId: "G-BKNYLRYSGS"
});

const messaging = firebase.messaging();

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
