// ONE service worker for this scope: caching (sw.js) + Firebase push (below).
// sw.js is imported, never registered separately; changing it also updates this worker.
importScripts("./sw.js");

importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyCizLhGsdZXyiJvGkebputzI8-7gWx0Gks",
    authDomain: "rmpmt-digital-phonebook.firebaseapp.com",
    databaseURL: "https://rmpmt-digital-phonebook-default-rtdb.firebaseio.com",
    projectId: "rmpmt-digital-phonebook",
    storageBucket: "rmpmt-digital-phonebook.appspot.com",
    messagingSenderId: "559683777015",
    appId: "1:559683777015:web:6d4e6669c7071e7f523ef2"
});

const messaging = firebase.messaging();

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
