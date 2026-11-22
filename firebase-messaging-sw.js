/* =========================
   BACKGROUND PUSH NOTIFICATION (FCM + Web Push)
========================= */
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

// Background message handler when app is in background or closed
messaging.onBackgroundMessage(function (payload) {
    console.log("[sw.js] Background message received:", payload);

    const notificationTitle =
        payload.notification?.title ||
        payload.data?.title ||
        "RMP MT Contacts";

    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || "নতুন জরুরি বার্তা এসেছে",
        icon: "./icon/icon-192.png",
        badge: "./icon/icon-192.png",
        vibrate: [200, 100, 200],
        tag: payload.data?.tag || "rmp-mt-notification",
        renotify: true,
        data: {
            url: payload.data?.url || "https://rmpmt.github.io/digital/index.html"
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Open the app when the user taps the notification
self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "https://rmpmt.github.io/digital/index.html";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
            for (const client of clientList) {
                if (client.url.includes("/digital/") && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
