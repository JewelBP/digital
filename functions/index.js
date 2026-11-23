// Sends an FCM push to every saved device when a "push" notice is created
// from the admin panel (webapp/notices/{id} with type === "push").
const { onValueCreated } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendPushNotice = onValueCreated(
  { ref: "/webapp/notices/{id}", region: "us-central1" },
  async (event) => {
    const n = event.data.val();
    if (!n || n.type !== "push") return;

    const snap = await admin.database().ref("webapp/fcmTokens").get();
    if (!snap.exists()) return;

    const entries = Object.entries(snap.val()); // [key, {token}]
    const tokens = entries.map(([, v]) => v.token).filter(Boolean);

    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const res = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        data: {
          title: n.title || "",
          body: n.message || "",
          image: n.img || "",
          url: "/"
        }
      });

      // remove dead tokens
      await Promise.all(res.responses.map(async (r, idx) => {
        const code = r.error && r.error.code;
        if (code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token") {
          const key = entries.find(([, v]) => v.token === batch[idx])?.[0];
          if (key) await admin.database().ref("webapp/fcmTokens/" + key).remove();
        }
      }));
    }
  }
);
