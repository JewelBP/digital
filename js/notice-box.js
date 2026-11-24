// js/notice-box.js

const STORAGE_KEY = "rmp_mt_drawer_notice_box_v1";
const MAX_NOTICES = 100;

let activeSearchQuery = "";
let isNoticeViewOpen = false;
let isInitialized = false;

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

    if (isNoticeViewOpen) {
        renderNoticeCards();
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
    renderNoticeCards();
}

function getFilteredNotices() {
    const q = activeSearchQuery.trim().toLowerCase();
    const all = readNotices();
    if (!q) return all;
    return all.filter(item =>
        (item.title || "").toLowerCase().includes(q) ||
        (item.body || "").toLowerCase().includes(q) ||
        (item.url || "").toLowerCase().includes(q)
    );
}

function renderNoticeCards() {
    const listEl = document.getElementById("noticeBoxCardsList");
    if (!listEl) return;

    const notices = getFilteredNotices();
    if (!notices.length) {
        listEl.innerHTML = `
            <div style="
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                padding: 24px 16px;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
                color: #463758;
            ">
                <div style="font-size: 30px; margin-bottom: 6px;">📭</div>
                <div style="font-size: 15.5px; font-weight: 700;">
                    ${activeSearchQuery.trim() ? "কোনো ম্যাচিং নোটিফিকেশন পাওয়া যায়নি" : "কোনো নোটিফিকেশন জমা নেই"}
                </div>
                <div style="font-size: 12.5px; color: #64748b; margin-top: 4px;">
                    ${activeSearchQuery.trim() ? "অন্য শব্দ দিয়ে সার্চ করে দেখুন।" : "নতুন নোটিফিকেশন এলে এখানে জমা হবে।"}
                </div>
            </div>
        `;
        return;
    }

    listEl.innerHTML = notices.map(item => `
        <div class="data-card-item notice-design-card" data-id="${escapeHtml(item.id)}" style="
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 14px 14px;
            margin-bottom: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-sizing: border-box;
        ">
            <div style="
                width: 62px;
                height: 62px;
                min-width: 62px;
                border-radius: 50%;
                background: #dbe3ec;
                color: #64748b;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 26px;
                position: relative;
                flex-shrink: 0;
            ">
                <span>📢</span>
                ${!item.read ? `<span style="
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #ef4444;
                    border: 2px solid #ffffff;
                "></span>` : ""}
            </div>

            <div style="flex: 1 1 auto; min-width: 0;">
                <div style="
                    font-size: 16px;
                    font-weight: 700;
                    color: #463758;
                    margin-bottom: 4px;
                    line-height: 1.3;
                    word-break: break-word;
                ">${escapeHtml(item.title)}</div>

                ${item.body ? `<div style="
                    font-size: 12.5px;
                    color: #64748b;
                    line-height: 1.5;
                    margin-bottom: 3px;
                    white-space: pre-line;
                    word-break: break-word;
                ">📌 ${escapeHtml(item.body)}</div>` : ""}

                <div style="
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.45;
                ">🕒 ${escapeHtml(formatNoticeTime(item.timestamp))}</div>

                ${item.url ? `<div style="margin-top: 4px;">
                    <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" style="
                        font-size: 12px;
                        font-weight: 700;
                        color: #0d6efd;
                        text-decoration: none;
                    ">🔗 বিস্তারিত লিঙ্ক দেখুন</a>
                </div>` : ""}
            </div>

            <button type="button" class="delete-single-notice-btn" data-id="${escapeHtml(item.id)}" title="মুছুন" style="
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                color: #94a3b8;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                font-size: 13px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                align-self: center;
            ">✕</button>
        </div>
    `).join("");

    listEl.querySelectorAll(".delete-single-notice-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            const id = btn.getAttribute("data-id");
            const remaining = readNotices().filter(n => n.id !== id);
            writeNotices(remaining);
            updateNoticeBadge();
            renderNoticeCards();
        });
    });
}

function ensureNoticeBoxView() {
    let view = document.getElementById("drawerNoticeBoxView");
    if (view) return view;

    const mainSheet = document.getElementById("mainScrollSheet") || document.body;

    view = document.createElement("div");
    view.id = "drawerNoticeBoxView";
    view.style.cssText = `
        display: none;
        width: 100%;
        min-height: 100%;
        box-sizing: border-box;
    `;

    view.innerHTML = `
        <div style="
            background: var(--app-main-color, var(--primary-color, #020624));
            color: #ffffff;
            margin: -16px -14px 14px -14px;
            padding: 12px 16px 18px 16px;
            border-bottom-left-radius: 22px;
            border-bottom-right-radius: 22px;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
        ">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                    <button type="button" id="noticeBoxBackBtn" title="ফিরে যান" style="
                        width: 34px;
                        height: 34px;
                        min-width: 34px;
                        border-radius: 10px;
                        border: 1px solid rgba(255,255,255,0.18);
                        background: rgba(255,255,255,0.12);
                        color: #ffffff;
                        font-size: 15px;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    ">←</button>
                    <div style="min-width:0;">
                        <div style="font-size:18px;font-weight:700;color:#ffffff;line-height:1.25;">Notice Box</div>
                        <div id="noticeBoxSubClock" style="font-size:11.5px;color:#cbd5e1;font-family:monospace;margin-top:2px;"></div>
                    </div>
                </div>

                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                    <button type="button" id="noticeBoxClearAllBtn" style="
                        background: rgba(239, 68, 68, 0.22);
                        border: 1px solid rgba(248, 113, 113, 0.4);
                        color: #fecaca;
                        border-radius: 10px;
                        padding: 6px 10px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                    ">সব মুছুন</button>
                    <img src="icons/icon-192.png" alt="Logo" style="
                        width: 54px;
                        height: 54px;
                        border-radius: 50%;
                        object-fit: cover;
                    ">
                </div>
            </div>

            <div style="
                width: 74%;
                min-width: 240px;
                margin: 0 auto;
                height: 38px;
                padding: 0 14px;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,0.22);
                background: rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                gap: 8px;
                box-sizing: border-box;
            ">
                <span style="color:#cbd5e1;font-size:15px;line-height:1;">⌕</span>
                <input type="search" id="noticeBoxSearchInput" placeholder="Search notices..." autocomplete="off" style="
                    flex: 1;
                    min-width: 0;
                    height: 100%;
                    border: 0;
                    outline: 0;
                    background: transparent;
                    color: #ffffff;
                    font-size: 13.5px;
                ">
                <button type="button" id="noticeBoxClearSearchBtn" title="মুছুন" style="
                    display: none;
                    width: 20px;
                    height: 20px;
                    border: 0;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.18);
                    color: #ffffff;
                    font-size: 14px;
                    line-height: 1;
                    cursor: pointer;
                ">×</button>
            </div>
        </div>

        <div style="
            display: flex;
            align-items: stretch;
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            margin-bottom: 14px;
            overflow: hidden;
            border: 1px solid #f1f5f9;
        ">
            <div style="
                background: #e11d48;
                color: #ffffff;
                padding: 7px 12px;
                font-size: 13px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
                flex-shrink: 0;
            ">
                <span>📢</span>
                <span>জরুরী বিজ্ঞপ্তি:</span>
            </div>
            <div id="noticeBoxTickerText" style="
                flex: 1;
                padding: 7px 12px;
                font-size: 13px;
                font-weight: 600;
                color: #1e293b;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: flex;
                align-items: center;
            ">নতুন নোটিফিকেশন এখানে জমা হয়</div>
        </div>

        <div id="noticeBoxCardsList"></div>
    `;

    mainSheet.prepend(view);

    const clockEl = document.getElementById("noticeBoxSubClock");
    if (clockEl) {
        const updateSubClock = () => {
            const now = new Date();
            clockEl.textContent = `${now.toLocaleDateString("en-GB")} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
        };
        updateSubClock();
        setInterval(updateSubClock, 1000);
    }

    const searchInput = document.getElementById("noticeBoxSearchInput");
    const clearSearchBtn = document.getElementById("noticeBoxClearSearchBtn");

    searchInput?.addEventListener("input", () => {
        activeSearchQuery = searchInput.value || "";
        if (clearSearchBtn) {
            clearSearchBtn.style.display = activeSearchQuery.length > 0 ? "inline-flex" : "none";
        }
        renderNoticeCards();
    });

    clearSearchBtn?.addEventListener("click", () => {
        if (!searchInput) return;
        searchInput.value = "";
        activeSearchQuery = "";
        clearSearchBtn.style.display = "none";
        renderNoticeCards();
        searchInput.focus();
    });

    document.getElementById("noticeBoxBackBtn")?.addEventListener("click", closeNoticeBox);
    document.getElementById("noticeBoxClearAllBtn")?.addEventListener("click", clearAllNotices);

    return view;
}

function setOtherMainViewsHidden(hidden) {
    const ids = ["mainDashboardView", "categoryDetailsView", "dataDetailsView", "allSearchContainer", "slidingNoticeContainer"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (hidden) {
            el.dataset.prevHidden = el.classList.contains("hidden") ? "1" : "0";
            el.classList.add("hidden");
        } else if (el.dataset.prevHidden === "0") {
            el.classList.remove("hidden");
        }
    });

    const topWrapper = document.querySelector(".modern-top-wrapper");
    if (topWrapper) {
        topWrapper.style.display = hidden ? "none" : "";
    }
}

export function openNoticeBox() {
    const view = ensureNoticeBoxView();
    isNoticeViewOpen = true;
    activeSearchQuery = "";

    const searchInput = document.getElementById("noticeBoxSearchInput");
    const clearSearchBtn = document.getElementById("noticeBoxClearSearchBtn");
    if (searchInput) searchInput.value = "";
    if (clearSearchBtn) clearSearchBtn.style.display = "none";

    const latest = readNotices()[0];
    const tickerEl = document.getElementById("noticeBoxTickerText");
    if (tickerEl) {
        tickerEl.textContent = latest
            ? `${latest.title}${latest.body ? " — " + latest.body : ""}`
            : "নতুন নোটিফিকেশন এখানে জমা হয়";
    }

    setOtherMainViewsHidden(true);
    view.style.display = "block";

    const scrollSheet = document.getElementById("mainScrollSheet");
    if (scrollSheet) scrollSheet.scrollTop = 0;

    renderNoticeCards();
    markAllNoticesRead();
}

export function closeNoticeBox() {
    const view = document.getElementById("drawerNoticeBoxView");
    if (view) view.style.display = "none";
    isNoticeViewOpen = false;
    setOtherMainViewsHidden(false);
}

export function initNoticeBox() {
    updateNoticeBadge();
    if (isInitialized) return;
    isInitialized = true;

    window.addEventListener("app:notification", event => {
        addNoticeToBox(event.detail);
    });

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

    const observer = new MutationObserver(() => {
        updateNoticeBadge();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.openNoticeBox = openNoticeBox;
    window.closeNoticeBox = closeNoticeBox;
    window.addNoticeToBox = addNoticeToBox;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNoticeBox);
} else {
    initNoticeBox();
}
