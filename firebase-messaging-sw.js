/* Firebase Cloud Messaging — ব্যাকগ্রাউন্ড নোটিফিকেশন (service worker)
   এই ফাইল index.html এর পাশেই (সাইটের মূল ফোল্ডারে) থাকতে হবে। */

// নোটিফিকেশনে ট্যাপ করলে সাইট/অ্যাপ খোলা (Firebase এর হ্যান্ডলারের আগে বসাতে হয়)
self.addEventListener("notificationclick", (event) => {
    event.stopImmediatePropagation();
    event.notification.close();

    const data = event.notification.data || {};
    const fcm = data.FCM_MSG || {};
    const link = (fcm.fcmOptions && fcm.fcmOptions.link) || data.link || self.registration.scope;
    const target = new URL(link, self.registration.scope).href;

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
            for (const client of list) {
                if (client.url.startsWith(self.registration.scope) && "focus" in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(target);
        })
    );
});

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

// Console থেকে পাঠানো "notification" মেসেজ ব্রাউজার নিজেই দেখায়।
// শুধু data মেসেজ এলে এখানে দেখানো হয়।
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return; // ডুপ্লিকেট এড়াতে
    const data = payload.data || {};
    if (!data.title && !data.body) return;

    self.registration.showNotification(data.title || "নোটিফিকেশন", {
        body: data.body || "",
        icon: "icons/icon-192.png",
        data: { link: data.link || "" }
    });
});
