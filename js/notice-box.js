// js/notice-box.js

const STORAGE_KEY = "rmp_mt_drawer_notice_box_v1";
const MAX_NOTICES = 100;

function readNotices() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Failed to read notice box storage:", err);
        return [];
    }
}

function writeNotices(notices) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notices.slice(0, MAX_NOTICES)));
    } catch (err) {
        console.error("Failed to save notice box storage:", err);
    }
}

function escapeHtml(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatNoticeTime(timestamp) {
    try {
        const d = new Date(timestamp || Date.now());
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleString("bn-BD", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return "";
    }
}

function extractPayload(input) {
    if (!input) return null;

    // FCM payload shape: { notification: { title, body }, data: { title, body, url } }
    if (input.notification || input.data) {
        const notif = input.notification || {};
        const data = input.data || {};
        const title = notif.title || data.title || "নতুন নোটিফিকেশন";
        const body = notif.body || data.body || data.message || "";
        const url = data.url || data.link || notif.click_action || "";
        if (!title && !body) return null;
        return {
            title: String(title).trim(),
            body: String(body).trim(),
            url: String(url).trim(),
            timestamp: data.timestamp ? Number(data.timestamp) || Date.now() : Date.now()
        };
    }

    // Direct object or string
    if (typeof input === "string") {
        const text = input.trim();
        if (!text) return null;
        return {
            title: "নতুন নোটিফিকেশন",
            body: text,
            url: "",
            timestamp: Date.now()
        };
    }

    const title = (input.title || input.heading || "নতুন নোটিফিকেশন").toString().trim();
    const body = (input.body || input.message || input.text || "").toString().trim();
    const url = (input.url || input.link || "").toString().trim();
    if (!title && !body) return null;

    return {
        title,
        body,
        url,
        timestamp: input.timestamp ? Number(input.timestamp) || Date.now() : Date.now()
    };
}

export function getUnreadNoticeCount() {
    return readNotices().filter(item => !item.read).length;
}

export function updateNoticeBadge() {
    const unread = getUnreadNoticeCount();
    const drawerItem = document.querySelector('#appDrawer li[data-action="notice-box"]');
    if (!drawerItem) return;

    let badge = drawerItem.querySelector(".notice-box-badge");
    if (!badge) {
        badge = document.createElement("span");
        badge.className = "notice-box-badge";
        badge.style.cssText = `
            margin-left: auto;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            border-radius: 999px;
            background: #ef4444;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        `;
        drawerItem.appendChild(badge);
    }

    if (unread > 0) {
        badge.textContent = unread > 99 ? "99+" : String(unread);
        badge.style.display = "inline-flex";
    } else {
        badge.style.display = "none";
    }
}

export function addNoticeToBox(rawPayload) {
    const normalized = extractPayload(rawPayload);
    if (!normalized) return null;

    const current = readNotices();
    const top = current[0];

    // ২ সেকেন্ডের মধ্যে হুবহু একই নোটিফিকেশন ডুপ্লিকেট আসা ঠেকানো
    if (
        top &&
        top.title === normalized.title &&
        top.body === normalized.body &&
        Math.abs((top.timestamp || 0) - normalized.timestamp) < 2000
    ) {
        return top;
    }

    const entry = {
        id: `notice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: normalized.title,
        body: normalized.body,
        url: normalized.url,
        timestamp: normalized.timestamp,
        read: false
    };

    const updated = [entry, ...current];
    writeNotices(updated);
    updateNoticeBadge();

    const modalEl = document.getElementById("drawerNoticeBoxModal");
    if (modalEl && modalEl.style.display === "flex") {
        renderNoticeList();
    }

    return entry;
}

export function markAllNoticesRead() {
    const updated = readNotices().map(n => ({ ...n, read: true }));
    writeNotices(updated);
    updateNoticeBadge();
}

export function clearAllNotices() {
    writeNotices([]);
    updateNoticeBadge();
    renderNoticeList();
}

function renderNoticeList() {
    const listEl = document.getElementById("drawerNoticeList");
    if (!listEl) return;

    const notices = readNotices();
    if (!notices.length) {
        listEl.innerHTML = `
            <div style="text-align:center;padding:36px 16px;color:#64748b;">
                <div style="font-size:34px;margin-bottom:8px;">📭</div>
                <div style="font-size:15px;font-weight:600;">কোনো নোটিফিকেশন জমা নেই</div>
                <div style="font-size:13px;margin-top:4px;">নতুন নোটিফিকেশন এলে এখানে দেখা যাবে।</div>
            </div>
        `;
        return;
    }

    listEl.innerHTML = notices.map(item => `
        <div class="notice-box-item" data-id="${escapeHtml(item.id)}" style="
            background: ${item.read ? "#f8fafc" : "#eff6ff"};
            border: 1px solid ${item.read ? "#e2e8f0" : "#bfdbfe"};
            border-radius: 12px;
            padding: 12px 14px;
            margin-bottom: 10px;
            position: relative;
        ">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                <div style="font-size:15px;font-weight:700;color:#0f172a;">
                    ${!item.read ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2563eb;margin-right:6px;"></span>' : ""}
                    ${escapeHtml(item.title)}
                </div>
                <button type="button" class="delete-single-notice-btn" data-id="${escapeHtml(item.id)}" title="মুছুন" style="
                    background:none;border:none;color:#94a3b8;font-size:15px;cursor:pointer;padding:0 2px;line-height:1;
                ">✕</button>
            </div>
            ${item.body ? `<p style="margin:6px 0 8px 0;font-size:13.5px;line-height:1.5;color:#334155;white-space:pre-line;word-break:break-word;">${escapeHtml(item.body)}</p>` : ""}
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#64748b;">
                <span>${escapeHtml(formatNoticeTime(item.timestamp))}</span>
                ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600;text-decoration:none;">বিস্তারিত →</a>` : ""}
            </div>
        </div>
    `).join("");

    listEl.querySelectorAll(".delete-single-notice-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            const id = btn.getAttribute("data-id");
            const remaining = readNotices().filter(n => n.id !== id);
            writeNotices(remaining);
            updateNoticeBadge();
            renderNoticeList();
        });
    });
}

function ensureNoticeModal() {
    let modal = document.getElementById("drawerNoticeBoxModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "drawerNoticeBoxModal";
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.58);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
        padding: 16px;
        backdrop-filter: blur(2px);
    `;

    modal.innerHTML = `
        <div style="
            background: #ffffff;
            color: #0f172a;
            width: 100%;
            max-width: 440px;
            max-height: 82vh;
            border-radius: 18px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 18px 40px rgba(0,0,0,0.3);
            font-family: inherit;
        ">
            <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 16px;
                border-bottom: 1px solid #e2e8f0;
                background: #020624;
                color: #ffffff;
            ">
                <h3 style="margin: 0; font-size: 17px; font-weight: 700;">📢 Notice Box</h3>
                <div style="display:flex;align-items:center;gap:8px;">
                    <button type="button" id="clearAllNoticesBtn" style="
                        background: rgba(239, 68, 68, 0.2);
                        color: #fca5a5;
                        border: 1px solid rgba(248, 113, 113, 0.35);
                        border-radius: 8px;
                        padding: 4px 10px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                    ">সব মুছুন</button>
                    <button type="button" id="closeNoticeBoxModalBtn" style="
                        background: rgba(255,255,255,0.14);
                        color: #ffffff;
                        border: none;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        font-size: 16px;
                        cursor: pointer;
                    ">✕</button>
                </div>
            </div>

            <div id="drawerNoticeList" style="
                padding: 14px;
                overflow-y: auto;
                flex: 1;
            "></div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
        modal.style.display = "none";
    };

    document.getElementById("closeNoticeBoxModalBtn").addEventListener("click", closeModal);
    document.getElementById("clearAllNoticesBtn").addEventListener("click", clearAllNotices);
    modal.addEventListener("click", e => {
        if (e.target === modal) closeModal();
    });

    return modal;
}

export function openNoticeBox() {
    const modal = ensureNoticeModal();
    renderNoticeList();
    modal.style.display = "flex";
    markAllNoticesRead();
}

let isInitialized = false;

export function initNoticeBox() {
    updateNoticeBadge();
    if (isInitialized) return;
    isInitialized = true;

    // 1. কাস্টম ইভেন্ট দিয়ে নোটিফিকেশন ধরার লিসেনার
    window.addEventListener("app:notification", event => {
        addNoticeToBox(event.detail);
    });

    // 2. Service Worker / iframe postMessage থেকে আসা পুশ নোটিফিকেশন ধরার লিসেনার
    window.addEventListener("message", event => {
        const data = event?.data;
        if (!data) return;
        if (data.type === "FCM_NOTIFICATION" || data.type === "PUSH_NOTIFICATION" || data.notification || data.data) {
            addNoticeToBox(data.payload || data);
        }
    });

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", event => {
            const data = event?.data;
            if (!data) return;
            if (data.type === "FCM_NOTIFICATION" || data.type === "PUSH_NOTIFICATION" || data.notification || data.data) {
                addNoticeToBox(data.payload || data);
            }
        });
    }

    // 3. ড্রয়ার DOM তৈরি বা পুনরায় রেন্ডার হলে ব্যাজ আপডেট রাখা
    const observer = new MutationObserver(() => {
        updateNoticeBadge();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // গ্লোবাল হেল্পার (অন্য ফাইল থেকে সহজে কল করার জন্য)
    window.openNoticeBox = openNoticeBox;
    window.addNoticeToBox = addNoticeToBox;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNoticeBox);
} else {
    initNoticeBox();
}
