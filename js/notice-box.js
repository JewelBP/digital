// js/notice-box.js (Push Notification Inbox - Notebook UI Edition)

import {
    ref,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { db } from "./firebase.js";

const INBOX_STORAGE_KEY = "rmp_notice_inbox_v1";
const READ_IDS_KEY = "rmp_notice_inbox_read_v1";
const DISMISSED_IDS_KEY = "rmp_notice_inbox_dismissed_v1";
const SW_IDB_NAME = "rmp_sw_push_inbox";
const SW_IDB_STORE = "messages";

let inboxItems = [];
let readIds = new Set();
let dismissedIds = new Set();

let activeNoticeId = null;
let inboxSearchQuery = "";
let isInboxActive = false;
let isSyncStarted = false;

let prevTitleText = "";
let prevBackHidden = true;
let prevMenuHidden = false;
let viewSnapshot = null;

let nbDepth = 0;
let swallowPop = 0;
let nbTitleNow = "";
let lastRenderedAdmin = null;
let nbObserver = null;
let enforceTimer = null;
let searchHandler = null;

/* ============================== Helpers ============================== */

function escapeHTML(str) {
    return String(str ?? "").replace(
        /[&<>"']/g,
        m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])
    );
}

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAdminUser() {
    return window.currentUserRole === "admin";
}

function showInboxToast(msg) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2400);
    }
}

function safeUrl(raw) {
    let u = String(raw || "").trim();
    if (!u) return "";
    if (/^(javascript|data|vbscript):/i.test(u)) return "";
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    return u;
}

/* ============================== Local & SW Storage ============================== */

function loadLocalState() {
    try {
        const raw = localStorage.getItem(INBOX_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) inboxItems = parsed;
        }
        const rRaw = localStorage.getItem(READ_IDS_KEY);
        if (rRaw) readIds = new Set(JSON.parse(rRaw));

        const dRaw = localStorage.getItem(DISMISSED_IDS_KEY);
        if (dRaw) dismissedIds = new Set(JSON.parse(dRaw));
    } catch (e) {
        console.error("Notice inbox local load error:", e);
    }
}

function saveLocalState() {
    try {
        localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(inboxItems));
        localStorage.setItem(READ_IDS_KEY, JSON.stringify([...readIds]));
        localStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify([...dismissedIds]));
    } catch (e) {
        console.error("Notice inbox local save error:", e);
    }
    updateUnreadBadges();
}

/* Service Worker থেকে IndexedDB-তে জমা হওয়া ব্যাকগ্রাউন্ড পুশ পড়া */
function pullFromServiceWorkerDB() {
    if (!("indexedDB" in window)) return;
    try {
        const req = indexedDB.open(SW_IDB_NAME, 1);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(SW_IDB_STORE)) {
                req.result.createObjectStore(SW_IDB_STORE, { keyPath: "id" });
            }
        };
        req.onsuccess = () => {
            const dbi = req.result;
            if (!dbi.objectStoreNames.contains(SW_IDB_STORE)) return;
            const tx = dbi.transaction(SW_IDB_STORE, "readonly");
            const getAll = tx.objectStore(SW_IDB_STORE).getAll();
            getAll.onsuccess = () => {
                const rows = getAll.result || [];
                if (rows.length) {
                    mergeIncomingNotices(rows);
                }
            };
        };
    } catch (e) {
        console.warn("SW IDB read warning:", e);
    }
}

function mergeIncomingNotices(list) {
    let changed = false;
    const map = new Map(inboxItems.map(item => [item.id, item]));

    list.forEach(raw => {
        if (!raw || !raw.id) return;
        if (dismissedIds.has(raw.id) && !isAdminUser()) return;

        const existing = map.get(raw.id);
        const normalized = {
            id: String(raw.id),
            title: String(raw.title || "নতুন নোটিশ"),
            message: String(raw.message || raw.body || ""),
            img: String(raw.img || raw.image || ""),
            link: String(raw.keys || raw.url || ""),
            time: String(raw.time || ""),
            timestamp: Number(raw.timestamp) || existing?.timestamp || Date.now(),
            source: raw.source || existing?.source || "push"
        };

        if (
            !existing ||
            existing.title !== normalized.title ||
            existing.message !== normalized.message ||
            existing.img !== normalized.img ||
            existing.time !== normalized.time
        ) {
            map.set(normalized.id, normalized);
            changed = true;
        }
    });

    if (changed) {
        inboxItems = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        saveLocalState();
        if (isInboxActive) renderNoticeInboxInSheet();
    } else {
        updateUnreadBadges();
    }
}

export function pushToNoticeInbox(noticeObj) {
    loadLocalState();
    const id = noticeObj.id || `push_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    mergeIncomingNotices([{
        ...noticeObj,
        id,
        time: noticeObj.time || new Date().toLocaleString("bn-BD"),
        timestamp: noticeObj.timestamp || Date.now()
    }]);
}

export function getUnreadNoticeCount() {
    return inboxItems.filter(item => !readIds.has(item.id)).length;
}

function updateUnreadBadges() {
    const count = getUnreadNoticeCount();
    const badge = document.getElementById("notifBadge");
    if (badge) {
        badge.classList.toggle("hidden", count === 0);
    }
    document.querySelectorAll("[data-notice-unread-badge]").forEach(el => {
        el.textContent = count > 99 ? "99+" : String(count);
        el.classList.toggle("hidden", count === 0);
    });
}

/* ============================== Realtime Sync ============================== */

export function initNoticeInboxSync() {
    if (isSyncStarted) return;
    isSyncStarted = true;

    loadLocalState();
    pullFromServiceWorkerDB();
    updateUnreadBadges();

    // অ্যাপ ফোকাসে এলে SW থেকে নতুন পুশ চেক করা
    window.addEventListener("focus", pullFromServiceWorkerDB);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") pullFromServiceWorkerDB();
    });

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data && event.data.type === "NEW_PUSH_RECEIVED" && event.data.payload) {
                pushToNoticeInbox(event.data.payload);
            }
        });
    }

    // Firebase webapp/notices থেকে সব push টাইপ নোটিশ ইনবক্সে সিঙ্ক করা
    const noticesRef = ref(db, "webapp/notices");
    onValue(noticesRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const keys = Object.keys(data);
        const pushList = keys
            .map((key, idx) => ({ id: key, ...data[key], _order: idx }))
            .filter(n => n.type === "push")
            .map(n => ({
                id: n.id,
                title: n.title || "পুশ নোটিশ",
                message: n.message || "",
                img: n.img || "",
                link: n.keys || "",
                time: n.time || "",
                timestamp: n.timestamp || (1700000000000 + n._order * 1000),
                source: "firebase"
            }));

        mergeIncomingNotices(pushList);
    }, (err) => {
        console.warn("Notice inbox realtime sync warning:", err);
    });
}

/* ============================== Styles (Driving Guide Style) ============================== */

function injectNoticeInboxStyles() {
    if (document.getElementById("noticeInboxModernStyles")) return;

    const style = document.createElement("style");
    style.id = "noticeInboxModernStyles";
    style.textContent = `
        #noticeInboxSheetView { display:flex; flex-direction:column; gap:14px; padding-bottom:28px; }
        #noticeInboxSheetView.hidden { display:none !important; }
        #noticeInboxSheetView .hidden { display:none !important; }

        .nb-action-row { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; }
        .nb-result-count { font-size:12.5px; color:#64748b; margin:0 4px; flex:1; font-weight:600; }
        body.dark-mode .nb-result-count { color:#94a3b8; }

        .nb-top-actions { display:flex; align-items:center; gap:6px; }

        /* ===== ইনবক্স কার্ড তালিকা (Driving Guide Chapter Card এর মতো) ===== */
        .nb-list-stack { display:flex; flex-direction:column; gap:12px; }
        .nb-card {
            position:relative; display:flex; align-items:center; gap:13px;
            background:#ffffff; border:1px solid #e2e8f0; border-radius:18px;
            padding:14px 14px 14px 12px; cursor:pointer; overflow:hidden;
            box-shadow:0 6px 18px rgba(2,6,36,.06);
            transition:transform .15s ease, box-shadow .15s ease;
        }
        .nb-card::before {
            content:""; position:absolute; left:0; top:0; bottom:0; width:6px;
            background:linear-gradient(to bottom, var(--a1, #0ea5e9), var(--a2, #2563eb));
        }
        .nb-card.is-unread {
            border-color: rgba(14,165,233,0.45);
            background: #f0f9ff;
        }
        body.dark-mode .nb-card { background:#0f172a; border-color:#1e293b; }
        body.dark-mode .nb-card.is-unread { background:#132238; border-color:#38bdf8; }
        .nb-card:active { transform:scale(.985); }

        .nb-icon-badge {
            width:46px; height:46px; flex-shrink:0; border-radius:14px; margin-left:6px;
            display:flex; align-items:center; justify-content:center;
            font-size:20px; font-weight:800; color:#fff;
            background:linear-gradient(135deg, var(--a1, #0ea5e9), var(--a2, #2563eb));
            border:2px solid rgba(255,255,255,0.55);
            box-shadow:0 6px 14px color-mix(in srgb, var(--a1, #0ea5e9) 45%, transparent);
            overflow:hidden;
        }
        .nb-icon-badge img {
            width:100%; height:100%; object-fit:cover; display:block;
        }

        .nb-chip-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:5px; }
        .nb-time-chip {
            display:inline-block; font-size:11px; font-weight:700;
            color:var(--a2, #2563eb);
            background:color-mix(in srgb, var(--a1, #0ea5e9) 15%, transparent);
            padding:2px 9px; border-radius:999px;
        }
        body.dark-mode .nb-time-chip { color:#fff; background:rgba(255,255,255,0.16); }

        .nb-unread-pill {
            display:inline-flex; align-items:center; gap:4px;
            font-size:10.5px; font-weight:800; color:#ffffff;
            background:#ef4444; padding:2px 8px; border-radius:999px;
        }

        .nb-card-title {
            margin:0; font-size:16px; font-weight:700; color:#0f172a; line-height:1.35;
            display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;
        }
        body.dark-mode .nb-card-title { color:#f8fafc; }

        .nb-card-preview {
            margin:4px 0 0; font-size:13px; color:#64748b; line-height:1.45;
            display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
        }
        body.dark-mode .nb-card-preview { color:#94a3b8; }

        /* ===== বিস্তারিত নোটবুক পেজ (Driving Guide Page এর মতো) ===== */
        .nb-notebook-page {
            position:relative; background:#fffefb; border:1px solid #e7e5e4;
            border-radius:20px; padding:20px 18px 20px 22px; overflow:hidden;
            box-shadow:0 10px 28px rgba(2,6,36,.07);
            display:flex; flex-direction:column; gap:14px;
        }
        .nb-notebook-page::before {
            content:""; position:absolute; left:11px; top:0; bottom:0; width:2px;
            background:rgba(239,68,68,.35);
        }
        body.dark-mode .nb-notebook-page { background:#0f172a; border-color:#1e293b; }
        body.dark-mode .nb-notebook-page::before { background:rgba(56,189,248,.35); }

        .nb-page-top {
            display:flex; align-items:flex-start; justify-content:space-between; gap:10px;
            padding-bottom:12px; border-bottom:1px dashed #cbd5e1;
        }
        body.dark-mode .nb-page-top { border-bottom-color:#334155; }
        .nb-page-title { margin:0; font-size:18px; font-weight:800; color:#020624; line-height:1.4; }
        body.dark-mode .nb-page-title { color:#f8fafc; }
        .nb-page-meta { margin-top:5px; font-size:12px; color:#64748b; font-weight:600; }
        body.dark-mode .nb-page-meta { color:#94a3b8; }

        .nb-body-text {
            font-size:15.5px; line-height:1.85; color:#1e293b;
            white-space:pre-wrap; word-break:break-word; margin:0;
        }
        body.dark-mode .nb-body-text { color:#e2e8f0; }

        .nb-media-figure {
            margin:4px 0; padding:10px; border-radius:16px; background:#f8fafc;
            border:1px solid #e2e8f0; box-shadow:0 3px 10px rgba(0,0,0,.04);
        }
        body.dark-mode .nb-media-figure { background:#1e293b; border-color:#334155; }
        .nb-media-figure img {
            width:100%; max-height:340px; object-fit:contain; border-radius:12px;
            display:block; cursor:zoom-in; background:#020624;
        }

        .nb-mini-btn {
            border:none; border-radius:10px; padding:7px 11px; font-size:12px; font-weight:700;
            cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px;
            white-space:nowrap;
        }
        .nb-mini-btn.tag { background:var(--app-main-color, var(--primary-color, #020624)); color:#fff; }
        .nb-mini-btn.del { background:#ef4444; color:#fff; }
        .nb-mini-btn.ghost { background:#e2e8f0; color:#0f172a; }
        body.dark-mode .nb-mini-btn.ghost { background:#334155; color:#f8fafc; }

        #noticeInboxSheetView mark {
            background:#fde68a; color:#111827; padding:0 3px; border-radius:4px;
        }

        /* কাস্টম থিম সাপোর্ট */
        body.has-custom-theme #noticeInboxSheetView .nb-card,
        body.has-custom-theme #noticeInboxSheetView .nb-notebook-page {
            background: var(--app-main-color, #020624) !important;
            border: none !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.18) !important;
        }
        body.has-custom-theme #noticeInboxSheetView .nb-card-title,
        body.has-custom-theme #noticeInboxSheetView .nb-page-title,
        body.has-custom-theme #noticeInboxSheetView .nb-body-text {
            color: #ffffff !important;
        }
        body.has-custom-theme #noticeInboxSheetView .nb-card-preview,
        body.has-custom-theme #noticeInboxSheetView .nb-page-meta,
        body.has-custom-theme #noticeInboxSheetView .nb-result-count {
            color: rgba(255,255,255,0.78) !important;
        }
        body.has-custom-theme #noticeInboxSheetView .nb-time-chip {
            background: rgba(255,255,255,0.16) !important;
            color: #ffffff !important;
        }
        body.has-custom-theme #noticeInboxSheetView .nb-mini-btn.ghost {
            background: rgba(255,255,255,0.18) !important;
            color: #ffffff !important;
        }

        .nb-lightbox {
            position:fixed; inset:0; z-index:99999; background:rgba(2,6,23,.92);
            display:flex; align-items:center; justify-content:center; padding:16px; cursor:zoom-out;
        }
        .nb-lightbox img { max-width:100%; max-height:100%; border-radius:12px; }
    `;
    document.head.appendChild(style);
}

/* ============================== Layout & History ============================== */

function ensureInboxContainer() {
    const sheet = document.getElementById("mainScrollSheet");
    if (!sheet) return null;

    let view = document.getElementById("noticeInboxSheetView");
    if (!view) {
        view = document.createElement("div");
        view.id = "noticeInboxSheetView";
        view.className = "hidden";
        const mainEl = sheet.querySelector("main.container") || sheet;
        mainEl.appendChild(view);
    }
    return view;
}

function pushInboxState(level) {
    try { history.pushState({ nbLevel: level }, "", location.href); } catch (e) { /* ignore */ }
    nbDepth = level;
}

function syncInboxHistoryDepth() {
    if (!isInboxActive) return;
    if (activeNoticeId && nbDepth < 2) {
        pushInboxState(2);
    } else if (!activeNoticeId && nbDepth > 1) {
        swallowPop++;
        history.back();
        nbDepth = 1;
    }
}

window.addEventListener("popstate", (e) => {
    if (swallowPop > 0) {
        swallowPop--;
        e.stopImmediatePropagation();
        return;
    }
    if (!isInboxActive) return;

    e.stopImmediatePropagation();
    const lvl = e.state && typeof e.state.nbLevel === "number" ? e.state.nbLevel : 0;

    if (lvl >= 2) { nbDepth = lvl; return; }

    if (lvl === 1) {
        nbDepth = 1;
        if (activeNoticeId) {
            activeNoticeId = null;
            renderNoticeInboxInSheet();
        }
        return;
    }

    nbDepth = 0;
    closeNoticeInbox(true);
}, true);

function setHeaderBackMode(titleText) {
    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");
    const navBtn = document.getElementById("navToggleBtn");

    nbTitleNow = titleText;
    if (appTitleText) appTitleText.textContent = titleText;
    if (menuIcon && backIcon) {
        menuIcon.classList.add("hidden");
        backIcon.classList.remove("hidden");
    }

    if (navBtn && !navBtn.dataset.nbBound) {
        navBtn.dataset.nbBound = "1";
        navBtn.addEventListener("click", (e) => {
            if (!isInboxActive) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (nbDepth > 0) {
                history.back();
            } else if (activeNoticeId) {
                activeNoticeId = null;
                renderNoticeInboxInSheet();
            } else {
                closeNoticeInbox();
            }
        }, true);
    }
}

const INBOX_HIDE_IDS = [
    "mainDashboardView", "categoryDetailsView", "dataDetailsView",
    "drivingGuideSheetView", "heroSlider", "searchBox",
    "subPageHeaderSearchWrapper", "slidingNoticeContainer"
];

function hideMainViewsForInbox(hide) {
    if (hide) {
        viewSnapshot = {};
        INBOX_HIDE_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            viewSnapshot[id] = { hidden: el.classList.contains("hidden"), display: el.style.display };
            el.classList.add("hidden");
        });
        const slider = document.getElementById("heroSlider");
        if (slider) slider.style.display = "none";
        return;
    }

    if (!viewSnapshot) return;
    INBOX_HIDE_IDS.forEach(id => {
        const el = document.getElementById(id);
        const snap = viewSnapshot[id];
        if (!el || !snap) return;
        el.classList.toggle("hidden", snap.hidden);
        el.style.display = snap.display;
    });
    viewSnapshot = null;
}

function captureHeaderState() {
    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");
    prevTitleText = appTitleText ? appTitleText.textContent : "";
    prevMenuHidden = menuIcon ? menuIcon.classList.contains("hidden") : false;
    prevBackHidden = backIcon ? backIcon.classList.contains("hidden") : true;
}

function restoreHeaderMode() {
    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");

    if (appTitleText) appTitleText.textContent = prevTitleText || "RMP MT Contacts";
    if (menuIcon) menuIcon.classList.toggle("hidden", prevMenuHidden);
    if (backIcon) backIcon.classList.toggle("hidden", prevBackHidden);
}

/* ============================== Observer & Header Search ============================== */

function enforceInboxUI() {
    if (!isInboxActive) return;

    INBOX_HIDE_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains("hidden")) el.classList.add("hidden");
    });
    const slider = document.getElementById("heroSlider");
    if (slider && slider.style.display !== "none") slider.style.display = "none";

    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");
    if (appTitleText && nbTitleNow && appTitleText.textContent !== nbTitleNow) {
        appTitleText.textContent = nbTitleNow;
    }
    if (menuIcon && !menuIcon.classList.contains("hidden")) menuIcon.classList.add("hidden");
    if (backIcon && backIcon.classList.contains("hidden")) backIcon.classList.remove("hidden");

    const view = document.getElementById("noticeInboxSheetView");
    if (view && view.classList.contains("hidden")) view.classList.remove("hidden");

    if (!view || !document.getElementById("nbHeaderSearch") || lastRenderedAdmin !== isAdminUser()) {
        renderNoticeInboxInSheet();
    }
}

function scheduleEnforce() {
    if (!isInboxActive || enforceTimer) return;
    enforceTimer = setTimeout(() => {
        enforceTimer = null;
        enforceInboxUI();
    }, 30);
}

function startInboxObserver() {
    stopInboxObserver();
    nbObserver = new MutationObserver(scheduleEnforce);
    const attrs = { attributes: true, attributeFilter: ["class", "style"] };
    [...INBOX_HIDE_IDS, "menuIcon", "backIcon"].forEach(id => {
        const el = document.getElementById(id);
        if (el) nbObserver.observe(el, attrs);
    });
    const title = document.querySelector(".app-title-text");
    if (title) nbObserver.observe(title, { childList: true, characterData: true, subtree: true });
}

function stopInboxObserver() {
    if (nbObserver) { nbObserver.disconnect(); nbObserver = null; }
    if (enforceTimer) { clearTimeout(enforceTimer); enforceTimer = null; }
}

function mountHeaderSearch(placeholder) {
    let wrap = document.getElementById("nbHeaderSearch");

    if (!wrap) {
        wrap = document.createElement("div");
        wrap.id = "nbHeaderSearch";
        wrap.className = "header-search-inline is-visible";
        wrap.innerHTML = `
            <div class="subpage-search-field">
                <span class="subpage-search-icon" aria-hidden="true">⌕</span>
                <input id="nbToolbarSearchInput" type="search" autocomplete="off">
                <button id="nbClearSearchBtn" type="button" class="subpage-search-clear" aria-label="Clear search" title="Clear search">×</button>
            </div>`;

        const top = document.querySelector(".modern-top-wrapper");
        const header = top?.querySelector(".modern-header");
        if (header) header.insertAdjacentElement("afterend", wrap);
        else if (top) top.appendChild(wrap);

        const field = wrap.querySelector(".subpage-search-field");
        const input = wrap.querySelector("#nbToolbarSearchInput");
        const clearBtn = wrap.querySelector("#nbClearSearchBtn");

        input.addEventListener("input", () => {
            inboxSearchQuery = input.value.trim().toLowerCase();
            field.classList.toggle("has-value", input.value.length > 0);
            if (searchHandler) searchHandler();
        });
        clearBtn.addEventListener("click", () => {
            inboxSearchQuery = "";
            input.value = "";
            field.classList.remove("has-value");
            input.focus();
            if (searchHandler) searchHandler();
        });
    }

    const field = wrap.querySelector(".subpage-search-field");
    const input = wrap.querySelector("#nbToolbarSearchInput");
    input.placeholder = placeholder;
    if (input.value.trim().toLowerCase() !== inboxSearchQuery) input.value = inboxSearchQuery;
    field.classList.toggle("has-value", input.value.length > 0);
    wrap.classList.add("is-visible");
    wrap.classList.remove("hidden");
}

function unmountHeaderSearch() {
    document.getElementById("nbHeaderSearch")?.remove();
    searchHandler = null;
}

function highlightText(raw) {
    const safe = escapeHTML(raw);
    if (!inboxSearchQuery) return safe;
    const re = new RegExp(`(${escapeRegExp(escapeHTML(inboxSearchQuery))})`, "gi");
    return safe.replace(re, "<mark>$1</mark>");
}

/* ============================== Views ============================== */

const INBOX_PALETTE = [
    ["#0ea5e9", "#2563eb"], ["#10b981", "#047857"], ["#f59e0b", "#ea580c"], ["#8b5cf6", "#6d28d9"],
    ["#ec4899", "#be185d"], ["#14b8a6", "#0e7490"], ["#6366f1", "#4338ca"]
];

function accentStyle(idx) {
    const [a1, a2] = INBOX_PALETTE[idx % INBOX_PALETTE.length];
    return `--a1:${a1};--a2:${a2};`;
}

function renderInboxListView(container, admin) {
    const unread = getUnreadNoticeCount();
    setHeaderBackMode(unread > 0 ? `নোটিশ ইনবক্স (${unread})` : "নোটিশ ইনবক্স");
    mountHeaderSearch("নোটিশ শিরোনাম বা বার্তা খুঁজুন...");

    container.innerHTML = `
        <div class="nb-action-row">
            <div id="nbResultCount" class="nb-result-count">মোট ${inboxItems.length}টি নোটিশ</div>
            <div class="nb-top-actions">
                ${unread > 0 ? `<button id="nbMarkAllReadBtn" type="button" class="nb-mini-btn ghost">✓ সব পড়া হয়েছে</button>` : ""}
                ${inboxItems.length > 0 ? `<button id="nbClearAllBtn" type="button" class="nb-mini-btn del">🗑️ ক্লিয়ার</button>` : ""}
            </div>
        </div>
        <div id="nbListArea"></div>
    `;

    searchHandler = () => fillInboxList(admin);
    fillInboxList(admin);

    document.getElementById("nbMarkAllReadBtn")?.addEventListener("click", () => {
        inboxItems.forEach(i => readIds.add(i.id));
        saveLocalState();
        showInboxToast("সব নোটিশ পড়া হয়েছে হিসেবে চিহ্নিত করা হয়েছে");
        renderNoticeInboxInSheet();
    });

    document.getElementById("nbClearAllBtn")?.addEventListener("click", () => {
        if (!confirm("আপনার ইনবক্সের সব নোটিশ মুছে ফেলবেন?")) return;
        inboxItems.forEach(i => dismissedIds.add(i.id));
        inboxItems = [];
        saveLocalState();
        showInboxToast("ইনবক্স খালি করা হয়েছে");
        renderNoticeInboxInSheet();
    });
}

function fillInboxList(admin) {
    const area = document.getElementById("nbListArea");
    const countEl = document.getElementById("nbResultCount");
    if (!area) return;

    const q = inboxSearchQuery;
    const filtered = inboxItems.filter(item => !q ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.message || "").toLowerCase().includes(q));

    if (countEl) {
        countEl.textContent = q
            ? `${filtered.length}টি নোটিশ পাওয়া গেছে`
            : `মোট ${inboxItems.length}টি নোটিশ`;
    }

    if (!filtered.length) {
        area.innerHTML = `
            <div class="nb-notebook-page" style="text-align:center; padding:32px 18px;">
                <div style="font-size:38px;">📭</div>
                <p class="nb-body-text" style="opacity:.75; text-align:center;">
                    ${q ? "খুঁজে পাওয়া যায়নি।" : "ইনবক্সে এখনো কোনো পুশ নোটিশ জমা হয়নি।"}
                </p>
            </div>`;
        return;
    }

    area.innerHTML = `<div class="nb-list-stack">${filtered.map((item, idx) => {
        const isUnread = !readIds.has(item.id);
        const badgeContent = item.img
            ? `<img src="${escapeHTML(safeUrl(item.img))}" alt="" onerror="this.parentElement.textContent='🔔'">`
            : `🔔`;

        return `
            <div class="nb-card ${isUnread ? "is-unread" : ""}" data-notice-id="${escapeHTML(item.id)}" style="${accentStyle(idx)}">
                <div class="nb-icon-badge">${badgeContent}</div>
                <div style="min-width:0; flex:1;">
                    <div class="nb-chip-row">
                        ${isUnread ? `<span class="nb-unread-pill">● নতুন</span>` : ""}
                        ${item.time ? `<span class="nb-time-chip">🕒 ${escapeHTML(item.time)}</span>` : ""}
                    </div>
                    <h3 class="nb-card-title">${highlightText(item.title || "নোটিশ")}</h3>
                    <p class="nb-card-preview">${highlightText(item.message || "")}</p>
                </div>
                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    <button type="button" class="nb-mini-btn del nb-del-item" data-id="${escapeHTML(item.id)}" title="মুছুন">🗑️</button>
                    <span style="font-size:22px; opacity:.5;">›</span>
                </div>
            </div>`;
    }).join("")}</div>`;

    area.querySelectorAll(".nb-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.getAttribute("data-notice-id");
            activeNoticeId = id;
            readIds.add(id);
            saveLocalState();
            renderNoticeInboxInSheet();
        });
    });

    area.querySelectorAll(".nb-del-item").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute("data-id");
            dismissedIds.add(id);
            inboxItems = inboxItems.filter(n => n.id !== id);
            saveLocalState();
            if (admin && confirm("অ্যাডমিন হিসেবে ফায়ারবেজ সার্ভার থেকেও স্থায়ীভাবে মুছবেন?")) {
                await remove(ref(db, `webapp/notices/${id}`)).catch(() => {});
            }
            showInboxToast("নোটিশ মুছে ফেলা হয়েছে");
            renderNoticeInboxInSheet();
        });
    });
}

function renderNoticeDetailView(container, notice, admin) {
    setHeaderBackMode("নোটিশ বিস্তারিত");
    unmountHeaderSearch();

    const imgUrl = notice.img ? safeUrl(notice.img) : "";
    const linkUrl = notice.link ? safeUrl(notice.link) : "";

    container.innerHTML = `
        <article class="nb-notebook-page">
            <div class="nb-page-top">
                <div style="min-width:0; flex:1;">
                    <h3 class="nb-page-title">${escapeHTML(notice.title || "নোটিশ")}</h3>
                    ${notice.time ? `<div class="nb-page-meta">🕒 ${escapeHTML(notice.time)}</div>` : ""}
                </div>
                <button type="button" id="nbDetailDeleteBtn" class="nb-mini-btn del">🗑️ মুছুন</button>
            </div>

            ${imgUrl ? `
                <figure class="nb-media-figure">
                    <img id="nbDetailImg" src="${escapeHTML(imgUrl)}" alt="Notice Image">
                </figure>` : ""}

            <p class="nb-body-text">${escapeHTML(notice.message || "")}</p>

            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px;">
                <button type="button" id="nbCopyBtn" class="nb-mini-btn ghost">📋 কপি করুন</button>
                ${linkUrl ? `<a href="${escapeHTML(linkUrl)}" target="_blank" rel="noopener noreferrer" class="nb-mini-btn tag" style="text-decoration:none;">🔗 লিংক খুলুন ↗</a>` : ""}
            </div>
        </article>
    `;

    const imgEl = document.getElementById("nbDetailImg");
    imgEl?.addEventListener("click", () => {
        const box = document.createElement("div");
        box.className = "nb-lightbox";
        box.innerHTML = `<img src="${escapeHTML(imgEl.src)}" alt="">`;
        box.addEventListener("click", () => box.remove());
        document.body.appendChild(box);
    });

    document.getElementById("nbCopyBtn")?.addEventListener("click", () => {
        const txt = `${notice.title || ""}\n\n${notice.message || ""}`.trim();
        navigator.clipboard?.writeText(txt);
        showInboxToast("নোটিশ কপি করা হয়েছে!");
    });

    document.getElementById("nbDetailDeleteBtn")?.addEventListener("click", async () => {
        dismissedIds.add(notice.id);
        inboxItems = inboxItems.filter(n => n.id !== notice.id);
        saveLocalState();
        if (admin && confirm("ফায়ারবেজ সার্ভার থেকেও স্থায়ীভাবে মুছবেন?")) {
            await remove(ref(db, `webapp/notices/${notice.id}`)).catch(() => {});
        }
        activeNoticeId = null;
        showInboxToast("নোটিশ মুছে ফেলা হয়েছে");
        renderNoticeInboxInSheet();
    });
}

/* ============================== Public API ============================== */

export function renderNoticeInboxInSheet() {
    const view = ensureInboxContainer();
    if (!view) return;

    const admin = isAdminUser();
    lastRenderedAdmin = admin;

    if (activeNoticeId) {
        const found = inboxItems.find(n => n.id === activeNoticeId);
        if (found) {
            syncInboxHistoryDepth();
            renderNoticeDetailView(view, found, admin);
            return;
        }
        activeNoticeId = null;
    }

    syncInboxHistoryDepth();
    renderInboxListView(view, admin);
}

export function openNoticeInbox() {
    injectNoticeInboxStyles();
    initNoticeInboxSync();
    pullFromServiceWorkerDB();

    if (!isInboxActive) {
        captureHeaderState();
        hideMainViewsForInbox(true);
        pushInboxState(1);
    }

    isInboxActive = true;
    inboxSearchQuery = "";
    activeNoticeId = null;

    const view = ensureInboxContainer();
    if (view) {
        view.classList.remove("hidden");
        renderNoticeInboxInSheet();
    }
    startInboxObserver();
}

export function closeNoticeInbox(fromPop = false) {
    if (!isInboxActive) return;

    if (fromPop !== true && nbDepth > 0) {
        swallowPop++;
        try { history.go(-nbDepth); } catch (e) { swallowPop = 0; }
    }
    nbDepth = 0;

    stopInboxObserver();
    isInboxActive = false;
    activeNoticeId = null;
    inboxSearchQuery = "";

    unmountHeaderSearch();

    const view = document.getElementById("noticeInboxSheetView");
    if (view) {
        view.classList.add("hidden");
        view.innerHTML = "";
    }

    restoreHeaderMode();
    hideMainViewsForInbox(false);
}

window.openNoticeInbox = openNoticeInbox;
window.closeNoticeInbox = () => closeNoticeInbox();
