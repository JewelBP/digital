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

    event?.waitUntil?.(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            clientList.forEach((client) => {
                client.postMessage({
                    type: "FCM_NOTICE",
                    from: "firebase-messaging-sw",
                    payload: {
                        id: payload.messageId || payload.fcmMessageId || "",
                        title,
                        body: options.body || ""
                    }
                });
            });
        })
    );


messaging.onBackgroundMessage((payload) => {
    const d = payload.data || {};
    const title = payload.notification?.title || d.title || "New notification";
    const options = {
        body: payload.notification?.body || d.body || "",
        icon: self.registration.scope + "icons/icon-192.png",
        badge: self.registration.scope + "icons/icon-192.png",
        data: d
    };
    if (d.image && /^https?:/i.test(d.image)) options.image = d.image;
    return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = self.registration.scope;

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
