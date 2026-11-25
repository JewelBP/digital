// Sends FCM push (HTTP v1) straight from the admin's phone/browser, same idea as
// the FoodOrder app: service account -> signed JWT -> OAuth token -> messages:send.
// Offline phones get the message when they come back online (FCM stores it).
import { db } from "./firebase.js";
import { ref, get, remove } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const SA_KEY = "fcm_service_account"; // stored ONLY in this admin's browser
let cached = { token: null, exp: 0 };

export function hasServiceAccount() {
    return !!localStorage.getItem(SA_KEY);
} 

export function saveServiceAccount(jsonText) {
    const sa = JSON.parse(jsonText);
    if (!sa.private_key || !sa.client_email || !sa.project_id) {
        throw new Error("সঠিক Service Account JSON নয়");
    }
    localStorage.setItem(SA_KEY, JSON.stringify(sa));
    cached = { token: null, exp: 0 };
}

export function clearServiceAccount() {
    localStorage.removeItem(SA_KEY);
    cached = { token: null, exp: 0 };
}

function getSA() {
    const raw = localStorage.getItem(SA_KEY);
    if (!raw) throw new Error("Service Account সেট করা নেই");
    return JSON.parse(raw);
}

const b64url = (buf) => {
    const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new TextEncoder().encode(buf);
    let s = "";
    bytes.forEach(b => s += String.fromCharCode(b));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cached.token && cached.exp - 60 > now) return cached.token;

    const sa = getSA();
    const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s/g, "");
    const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
        "pkcs8", der.buffer,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
    );

    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = b64url(JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600
    }));
    const unsigned = header + "." + payload;
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
    const jwt = unsigned + "." + b64url(sig);

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + jwt
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) throw new Error("Token error: " + (data.error_description || data.error || res.status));
    cached = { token: data.access_token, exp: now + (data.expires_in || 3600) };
    return cached.token;
}

async function sendOne(accessToken, projectId, token, n) {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
        body: JSON.stringify({
            message: {
                token,
                data: {
                    title: String(n.title || ""),
                    body: String(n.body || ""),
                    image: String(n.image || ""),
                    url: "./"
                },
                webpush: { headers: { Urgency: "high", TTL: "604800" } } // keep 7 days if phone offline
            }
        })
    });
    if (res.ok) return "ok";
    const err = await res.json().catch(() => ({}));
    const status = err.error && err.error.status;
    if (status === "NOT_FOUND" || status === "UNREGISTERED" || status === "INVALID_ARGUMENT") return "dead";
    return "fail";
}

// Sends to every saved device. Returns { sent, failed, removed }.
export async function sendPushToAll({ title, body, image }) {
    const sa = getSA();
    const accessToken = await getAccessToken();

    const snap = await get(ref(db, "webapp/fcmTokens"));
    if (!snap.exists()) return { sent: 0, failed: 0, removed: 0 };

    const entries = Object.entries(snap.val()).filter(([, v]) => v && v.token);
    let sent = 0, failed = 0, removed = 0;

    for (let i = 0; i < entries.length; i += 10) {
        await Promise.all(entries.slice(i, i + 10).map(async ([key, v]) => {
            try {
                const r = await sendOne(accessToken, sa.project_id, v.token, { title, body, image });
                if (r === "ok") sent++;
                else if (r === "dead") { removed++; await remove(ref(db, "webapp/fcmTokens/" + key)).catch(() => { }); }
                else failed++;
            } catch (e) { failed++; }
        }));
    }
    return { sent, failed, removed };
}
