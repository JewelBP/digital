// Push sending is done by the Worker (POST /api/push), never in the browser.
// The FCM service-account key lives only in the Worker secret FCM_SERVICE_ACCOUNT.
// This module sends { title, body, image } plus the admin's Firebase ID token; the
// Worker verifies the admin, reads device tokens, sends, and prunes dead tokens.
import { getIdToken } from "./auth.js";

const WORKER_ORIGIN = "https://rmpmt.jn420net.workers.dev";
const API_BASE = location.hostname.endsWith("workers.dev") ? "" : WORKER_ORIGIN;

// Any key left behind by the old in-browser sender is a live credential: wipe it.
try { localStorage.removeItem("fcm_service_account"); } catch (e) { }

// Sends to every saved device. Returns { sent, failed, removed, total }.
export async function sendPushToAll({ title, body, image }) {
    const token = await getIdToken();
    if (!token) throw new Error("লগইন করা নেই");

    const res = await fetch(`${API_BASE}/api/push`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "", body: body || "", image: image || "" })
    });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
        if (res.status === 401) throw new Error("সেশন শেষ, আবার লগইন করুন");
        if (res.status === 403) throw new Error("আপনি Admin নন");
        if (json && json.error && json.error.code === "push_not_configured") {
            throw new Error("Push সার্ভারে সেট করা নেই (Worker secret FCM_SERVICE_ACCOUNT)");
        }
        throw new Error((json && json.error && json.error.message) || "Push ব্যর্থ হয়েছে");
    }
    return json;
}
