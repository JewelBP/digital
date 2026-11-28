import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithCredential,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { app, db } from "./firebase.js";

const auth = getAuth(app);

// Firebase error code -> message shown in the login toast.
const LOGIN_ERRORS = {
    "auth/invalid-email": "ইমেইল ঠিকানা সঠিক নয়",
    "auth/missing-email": "ইমেইল দিন",
    "auth/missing-password": "পাসওয়ার্ড দিন",
    "auth/user-not-found": "এই ইমেইলে কোনো অ্যাকাউন্ট নেই",
    "auth/wrong-password": "পাসওয়ার্ড ভুল",
    "auth/invalid-credential": "ইমেইল বা পাসওয়ার্ড ভুল",
    "auth/invalid-login-credentials": "ইমেইল বা পাসওয়ার্ড ভুল",
    "auth/user-disabled": "এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে",
    "auth/too-many-requests": "অনেকবার ভুল চেষ্টা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন",
    "auth/network-request-failed": "নেটওয়ার্ক সমস্যা, ইন্টারনেট সংযোগ চেক করুন",
    "auth/operation-not-allowed": "Email/Password লগইন চালু করা নেই (Firebase Console → Authentication → Sign-in method)",
    "auth/unauthorized-domain": "এই ডোমেইন Firebase-এ অনুমোদিত নয় (Authentication → Settings → Authorized domains)",
    "auth/invalid-api-key": "Firebase API Key সঠিক নয়",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Firebase API Key সঠিক নয়",
    "auth/requests-from-referer-are-blocked": "API Key এই ওয়েবসাইট থেকে ব্লক করা আছে (Google Cloud → Credentials → HTTP referrers)",
    "auth/app-not-authorized": "এই অ্যাপের জন্য API Key অনুমোদিত নয়",
    "auth/popup-closed-by-user": "Google লগইন বাতিল করা হয়েছে",
    "auth/cancelled-popup-request": "Google লগইন বাতিল করা হয়েছে",
    "auth/popup-blocked": "ব্রাউজার পপআপ ব্লক করেছে, পপআপ অনুমতি দিন",
    "auth/account-exists-with-different-credential": "এই ইমেইল অন্য পদ্ধতিতে নিবন্ধিত",
    "auth/network-request-failed": "নেটওয়ার্ক সমস্যা, ইন্টারনেট সংযোগ চেক করুন",
    "auth/internal-error": "Firebase অভ্যন্তরীণ ত্রুটি, আবার চেষ্টা করুন"
};

export function describeLoginError(error) {
    const code = (error && error.code) || "";
    if (LOGIN_ERRORS[code]) return LOGIN_ERRORS[code];
    // Some blocked-referrer failures only surface in the message text.
    const msg = (error && error.message) || "";
    if (/referer.*blocked|referrer.*blocked/i.test(msg)) return LOGIN_ERRORS["auth/requests-from-referer-are-blocked"];
    return code ? `অজানা ত্রুটি (${code})` : "অজানা ত্রুটি";
}

// Admin Login Function
export async function loginAdmin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, code: error && error.code, error: describeLoginError(error) };
    }
}

// Google sign-in. In a normal browser: Firebase popup. Inside the Android app the
// WebView cannot open popups, so the native side (Credential Manager) returns a Google
// ID token through window.AndroidGoogle and we sign in with that credential.
let pendingNative = null;
window.__onNativeGoogle = function (idToken, errorCode) {
    if (!pendingNative) return;
    const p = pendingNative; pendingNative = null;
    if (idToken) p.resolve(idToken);
    else p.reject({ code: errorCode || "auth/internal-error" });
};

function nativeGoogleIdToken() {
    return new Promise((resolve, reject) => {
        pendingNative = { resolve, reject };
        setTimeout(() => {
            if (pendingNative) { pendingNative = null; reject({ code: "auth/network-request-failed" }); }
        }, 120000);
        try { window.AndroidGoogle.signIn(); }
        catch (e) { pendingNative = null; reject({ code: "auth/internal-error" }); }
    });
}

export async function loginWithGoogle() {
    try {
        let userCredential;
        if (window.AndroidGoogle && typeof window.AndroidGoogle.signIn === "function") {
            const idToken = await nativeGoogleIdToken();
            userCredential = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
        } else {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });
            userCredential = await signInWithPopup(auth, provider);
        }
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, code: error && error.code, error: describeLoginError(error) };
    }
}

// Admin Logout Function
export async function logoutAdmin() {
    try {
        await signOut(auth);
        try { window.AndroidGoogle && window.AndroidGoogle.signOut && window.AndroidGoogle.signOut(); } catch (e) { }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Fresh Firebase ID token for the Worker's admin-only routes (null when signed out).
export async function getIdToken() {
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
}

// UI-only admin check. The real enforcement is the database rules + the Worker.
// A user is an admin if they carry the `admin` custom claim or webapp/admins/<uid> === true.
async function resolveRole(user) {
    try {
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims && tokenResult.claims.admin === true) return "admin";
    } catch (e) { /* fall through to the database check */ }

    try {
        const snap = await get(ref(db, `webapp/admins/${user.uid}`));
        if (snap.exists() && snap.val() === true) return "admin";
    } catch (e) { /* rules deny non-admins; that simply means "not admin" */ }

    return "user";
}

// Auth State Watcher: callback(user, role) where role is "admin" | "user" | null
export function watchAuth(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            callback(null, null);
            return;
        }
        callback(user, await resolveRole(user));
    });
}
