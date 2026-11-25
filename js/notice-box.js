import { db } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const NOTICES_PATH = "webapp/notices";
const READ_KEY = "rmp_push_notice_read_v1";     // ids this device has opened
const CACHE_KEY = "rmp_push_notice_cache_v1";   // last list, for offline viewing

let pushNotices = [];
let readIds = new Set();
let unsubscribeNotices = null;
let isLoadingNotices = true;
let noticeSearchQuery = "";
let isNoticeActive = false;
let prevTitleText = "";
let prevBackHidden = true;
let prevMenuHidden = false;

/* ============================== Helpers ============================== */

function canUseStorage() {
    try {
        const k = "__rmp_nb_test__";
        window.localStorage.setItem(k, "1");
        window.localStorage.removeItem(k);
        return true;
    } catch (e) {
        return false;
    }
}

const HAS_STORAGE = canUseStorage();

function escapeHTML(str) {
    return String(str ?? "").replace(
        /[&<>"']/g,
        m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[m])
    );
}

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


function safeUrl(u) {
    const s = String(u ?? "").trim();
    return /^https?:\/\//i.test(s) ? s : "";
}

/* ============================== Data (Firebase, read-only) ============================== */

function normalizePush(key, raw) {
    if (!raw || typeof raw !== "object") return null;
    if (raw.type !== "push") return null;

    const title = String(raw.title ?? "").trim();
    const body = String(raw.message ?? raw.body ?? "").trim();
    if (!title && !body) return null;

    return {
        id: String(raw.id || key),
        title: title || "জরুরি বিজ্ঞপ্তি",
        body,
        time: String(raw.time ?? ""),
        img: safeUrl(raw.img),
        video: safeUrl(raw.Video ?? raw.video),
        link: safeUrl(raw.keys)
    };
}

function loadReadIds() {
    readIds = new Set();
    if (!HAS_STORAGE) return;
    try {
        const arr = JSON.parse(window.localStorage.getItem(READ_KEY) || "[]");
        if (Array.isArray(arr)) arr.forEach(id => readIds.add(String(id)));
    } catch (e) { /* ignore */ }
}

function saveReadIds() {
    if (!HAS_STORAGE) return;
    try {
        window.localStorage.setItem(READ_KEY, JSON.stringify([...readIds]));
    } catch (e) { /* ignore */ }
}

function loadCachedNotices() {
    if (!HAS_STORAGE) return [];
    try {
        const arr = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "[]");
        return Array.isArray(arr) ? arr.filter(n => n && n.id) : [];
    } catch (e) {
        return [];
    }
}

function saveCachedNotices(list) {
    if (!HAS_STORAGE) return;
    try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
}

function startNoticeListener() {
    stopNoticeListener();

    unsubscribeNotices = onValue(
        ref(db, NOTICES_PATH),
        (snapshot) => {
            const data = snapshot.val() || {};
            // Firebase push-ids are chronological, so sorting keys descending = newest first.
            pushNotices = Object.keys(data)
                .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
                .map(key => normalizePush(key, data[key]))
                .filter(Boolean);

            isLoadingNotices = false;
            saveCachedNotices(pushNotices);
            if (isNoticeActive) renderNoticeBoxInSheet();
        },
        (error) => {
            console.error("Notice Box read error:", error);
            isLoadingNotices = false;
            if (isNoticeActive) renderNoticeBoxInSheet();
        }
    );
}

function stopNoticeListener() {
    if (typeof unsubscribeNotices === "function") {
        try { unsubscribeNotices(); } catch (e) { /* ignore */ }
    }
    unsubscribeNotices = null;
}

/* ============================== Styles & Notch Clean Fix ============================== */

function injectNoticeStyles() {
    if (document.getElementById("noticeBoxModernStyles")) return;

    const style = document.createElement("style");
    style.id = "noticeBoxModernStyles";
    style.textContent = `
        /* ===== নেভিগেশন বার নচ ও লোগোর দুপাশের কালো অংশ রিমুভ ===== */
        .custom-bottom-nav {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            height: 48px !important;
            z-index: 100000 !important;
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            overflow: visible !important;
            isolation: isolate !important;
            -webkit-tap-highlight-color: transparent !important;
        }
        .custom-bottom-nav::before,
        .custom-bottom-nav::after {
            display: none !important;
            content: none !important;
        }
        .custom-bottom-nav .bottom-nav-svg {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 48px !important;
            display: block !important;
            z-index: 1 !important;
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            filter: none !important;
            -webkit-filter: none !important;
            overflow: visible !important;
        }
        .custom-bottom-nav .bottom-nav-svg path,
        .custom-bottom-nav .bottom-nav-svg circle,
        .custom-bottom-nav .bottom-nav-svg rect,
        .custom-bottom-nav .bottom-nav-svg g {
            filter: none !important;
            -webkit-filter: none !important;
            stroke: none !important;
            outline: none !important;
        }
        .custom-bottom-nav .bottom-nav-logo-circle {
            position: absolute !important;
            top: auto !important;
            bottom: 10px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 54px !important;
            height: 54px !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 50% !important;
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            filter: none !important;
            -webkit-filter: none !important;
            clip-path: none !important;
            -webkit-clip-path: none !important;
            mask: none !important;
            -webkit-mask: none !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 2 !important;
            isolation: isolate !important;
            backface-visibility: hidden !important;
            -webkit-backface-visibility: hidden !important;
        }
        .custom-bottom-nav .bottom-nav-logo-circle::before,
        .custom-bottom-nav .bottom-nav-logo-circle::after {
            display: none !important;
            content: none !important;
        }
        .custom-bottom-nav .bottom-nav-logo-circle img,
        .custom-bottom-nav .bottom-nav-logo-circle svg {
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: cover !important;
            border-radius: 50% !important;
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            filter: none !important;
            -webkit-filter: none !important;
            clip-path: none !important;
            -webkit-clip-path: none !important;
            mask: none !important;
            -webkit-mask: none !important;
            backface-visibility: hidden !important;
            -webkit-backface-visibility: hidden !important;
        }
        .custom-bottom-nav * {
            -webkit-tap-highlight-color: transparent !important;
        }

        /* ===== NOTICE BOX VIEW (ক্যাটাগরি ও সাব-ক্যাটাগরির মতো মার্জিন ও প্যাডিং) ===== */
        #noticeBoxSheetView {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: -6px;
            padding: 0 2px 24px;
        }
        #noticeBoxSheetView.hidden {
            display: none !important;
        }
        #noticeBoxSheetView .hidden {
            display: none !important;
        }

        .nb-result-count {
            font-size: 12px;
            color: var(--text-muted, #64748b);
            margin: 0 4px;
        }
        .nb-result-count:empty {
            display: none;
        }

        /* জরুরি বিজ্ঞপ্তি টিকার — আরও উপরের দিকে তোলা ও হাইট বৃদ্ধি */
        .nb-ticker-bar {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 14px;
            margin: 0 0 4px 0;
            min-height: 44px;
            padding: 8px 12px 8px 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 3px 10px rgba(2, 6, 36, .05);
            overflow: hidden;
        }
        body.dark-mode .nb-ticker-bar {
            background: var(--card-bg, #0f172a);
            border-color: var(--border-color, #1e293b);
        }
        .nb-ticker-badge {
            background: #dc2626;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 10px;
            border-radius: 9px;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .nb-ticker-viewport {
            flex: 1;
            min-width: 0;
            height: 28px;
            display: flex;
            align-items: center;
            overflow: hidden;
            position: relative;
        }
        .nb-ticker-track {
            display: inline-flex;
            align-items: center;
            height: 28px;
            line-height: 28px;
            white-space: nowrap;
            font-size: 13.5px;
            font-weight: 600;
            color: var(--text-main, #0f172a);
            padding-left: 100%;
            animation: nbScrollText 14s linear infinite;
        }
        body.dark-mode .nb-ticker-track {
            color: var(--text-main, #f8fafc);
        }
        .nb-ticker-bar:hover .nb-ticker-track {
            animation-play-state: paused;
        }
        @keyframes nbScrollText {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-100%); }
        }

        /* কার্ড লিস্ট — ক্যাটাগরি ও সাব-ক্যাটাগরির মতো স্পেসিং */
        .nb-card-stack {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .nb-card {
            position: relative;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 16px;
            margin: 0;
            padding: 14px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(2, 6, 36, .05);
            cursor: pointer;
        }
        .nb-card.unread {
            border-left: 4px solid var(--app-main-color, var(--primary-color, #020624));
        }
        body.dark-mode .nb-card {
            background: var(--card-bg, #0f172a);
            border-color: var(--border-color, #1e293b);
        }

        .nb-avatar {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: color-mix(in srgb, var(--app-main-color, var(--primary-color, #020624)) 12%, transparent);
            color: var(--app-main-color, var(--primary-color, #020624));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 19px;
            flex-shrink: 0;
        }
        body.dark-mode .nb-avatar {
            background: rgba(255, 255, 255, .14);
            color: #ffffff;
        }

        .nb-content {
            flex: 1;
            min-width: 0;
        }
        .nb-card-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }
        .nb-card-title {
            margin: 0;
            font-size: 15.5px;
            font-weight: 700;
            color: var(--text-main, #0f172a);
            line-height: 1.35;
        }
        body.dark-mode .nb-card-title {
            color: var(--text-main, #f8fafc);
        }
        .nb-new-tag {
            background: #dc2626;
            color: #ffffff;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 999px;
            flex-shrink: 0;
        }
        .nb-card-body {
            margin: 6px 0 8px;
            font-size: 13.5px;
            line-height: 1.55;
            color: var(--text-muted, #475569);
            white-space: pre-wrap;
            word-break: break-word;
        }
        body.dark-mode .nb-card-body {
            color: var(--text-muted, #cbd5e1);
        }
        .nb-card-foot {
            font-size: 11.5px;
            color: var(--text-muted, #64748b);
        }

        .nb-mini-btn {
            border: none;
            border-radius: 10px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }
        .nb-mini-btn.del {
            background: #ef4444;
            color: #fff;
        }

        .nb-empty {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 16px;
            margin: 0;
            padding: 28px 16px;
            text-align: center;
            color: var(--text-muted, #64748b);
        }
        body.dark-mode .nb-empty {
            background: var(--card-bg, #0f172a);
            border-color: var(--border-color, #1e293b);
            color: var(--text-muted, #94a3b8);
        }


        .nb-card-media {
            display: block;
            width: 100%;
            max-height: 220px;
            object-fit: cover;
            border-radius: 10px;
            margin: 0 0 8px;
            background: rgba(0, 0, 0, .06);
        }
        .nb-card-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 0 0 8px;
        }
        .nb-link-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            border-radius: 10px;
            font-size: 12.5px;
            font-weight: 700;
            text-decoration: none;
            color: #ffffff;
            background: var(--app-main-color, var(--primary-color, #020624));
        }
        .nb-card-time {
            display: block;
            margin-top: 2px;
        }
        .nb-card.read {
            opacity: .92;
        }

        .nb-rich mark {
            background: #fde68a;
            color: #111827;
            padding: 0 3px;
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);
}

/* ============================== Highlight ============================== */

/* ============================== Highlight & Admin Code ============================== */

function highlightHTML(html) {
    if (!noticeSearchQuery) return html;
    const re = new RegExp(`(${escapeRegExp(escapeHTML(noticeSearchQuery))})`, "gi");
    return html
        .split(/(<[^>]+>)/g)
        .map(seg => (seg.startsWith("<") ? seg : seg.replace(re, "<mark>$1</mark>")))
        .join("");
}

/* ============================== Layout / Header / History ============================== */

const NOTICE_HIDE_IDS = [
    "mainDashboardView", "categoryDetailsView", "dataDetailsView",
    "heroSlider", "searchBox", "subPageHeaderSearchWrapper", "slidingNoticeContainer"
];

let nbDepth = 0;
let swallowPop = 0;
let viewSnapshot = null;
let searchHandler = null;
let noticeTitleNow = "";

function ensureSheetContainer() {
    const sheet = document.getElementById("mainScrollSheet");
    if (!sheet) return null;

    let view = document.getElementById("noticeBoxSheetView");
    if (!view) {
        view = document.createElement("div");
        view.id = "noticeBoxSheetView";
        view.className = "hidden";
        const mainEl = sheet.querySelector("main.container") || sheet;
        mainEl.appendChild(view);
    }
    return view;
}

function pushNoticeState(level) {
    try { history.pushState({ nbLevel: level }, "", location.href); } catch (e) { /* ignore */ }
    nbDepth = level;
}

window.addEventListener("popstate", (e) => {
    if (swallowPop > 0) {
        swallowPop--;
        e.stopImmediatePropagation();
        return;
    }
    if (!isNoticeActive) return;

    e.stopImmediatePropagation();
    const lvl = e.state && typeof e.state.nbLevel === "number" ? e.state.nbLevel : 0;
    if (lvl >= 1) {
        nbDepth = lvl;
        return;
    }
    nbDepth = 0;
    closeNoticeBox(true);
}, true);

function setHeaderBackMode(titleText) {
    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");
    const navBtn = document.getElementById("navToggleBtn");

    noticeTitleNow = titleText;
    if (appTitleText) appTitleText.textContent = titleText;
    if (menuIcon && backIcon) {
        menuIcon.classList.add("hidden");
        backIcon.classList.remove("hidden");
    }

    if (navBtn && !navBtn.dataset.nbBound) {
        navBtn.dataset.nbBound = "1";
        navBtn.addEventListener("click", (e) => {
            if (!isNoticeActive) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (nbDepth > 0) {
                history.back();
            } else {
                closeNoticeBox();
            }
        }, true);
    }
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

function hideMainViewsForNotice(hide) {
    if (hide) {
        viewSnapshot = {};
        NOTICE_HIDE_IDS.forEach(id => {
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
    NOTICE_HIDE_IDS.forEach(id => {
        const el = document.getElementById(id);
        const snap = viewSnapshot[id];
        if (!el || !snap) return;
        el.classList.toggle("hidden", snap.hidden);
        el.style.display = snap.display;
    });
    viewSnapshot = null;
}

/* ============================== Header Search ============================== */

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
        if (header) {
            header.insertAdjacentElement("afterend", wrap);
        } else if (top) {
            top.appendChild(wrap);
        } else {
            const sheet = document.getElementById("mainScrollSheet");
            if (sheet?.parentElement) sheet.parentElement.insertBefore(wrap, sheet);
            else document.body.prepend(wrap);
        }

        const field = wrap.querySelector(".subpage-search-field");
        const input = wrap.querySelector("#nbToolbarSearchInput");
        const clearBtn = wrap.querySelector("#nbClearSearchBtn");

        input.addEventListener("input", () => {
            noticeSearchQuery = input.value.trim().toLowerCase();
            field.classList.toggle("has-value", input.value.length > 0);
            if (searchHandler) searchHandler();
        });
        clearBtn.addEventListener("click", () => {
            noticeSearchQuery = "";
            input.value = "";
            field.classList.remove("has-value");
            input.focus();
            if (searchHandler) searchHandler();
        });
    }

    const field = wrap.querySelector(".subpage-search-field");
    const input = wrap.querySelector("#nbToolbarSearchInput");
    input.placeholder = placeholder;
    if (input.value.trim().toLowerCase() !== noticeSearchQuery) input.value = noticeSearchQuery;
    field.classList.toggle("has-value", input.value.length > 0);
    wrap.classList.add("is-visible");
    wrap.classList.remove("hidden");
}

function unmountHeaderSearch() {
    document.getElementById("nbHeaderSearch")?.remove();
    searchHandler = null;
}

/* ============================== Notice List Render ============================== */

function renderNoticeListView(container) {
    setHeaderBackMode(noticeTitleNow || "Notice Box");
    mountHeaderSearch("নোটিশ খুঁজুন...");

    container.innerHTML = `
        <div class="nb-ticker-bar">
            <span class="nb-ticker-badge">📢 জরুরি বিজ্ঞপ্তি:</span>
            <div class="nb-ticker-viewport">
                <div id="nbTickerTrack" class="nb-ticker-track">কোনো জরুরি নোটিশ নেই</div>
            </div>
        </div>

        <div id="nbResultCount" class="nb-result-count"></div>
        <div id="nbListArea"></div>
    `;

    searchHandler = () => fillNoticeList();
    fillNoticeList();
}

function updateTicker(all, filtered, q, trackEl) {
    if (!trackEl) return;
    if (!all.length) {
        trackEl.textContent = isLoadingNotices
            ? "নোটিশ লোড হচ্ছে..."
            : "কোনো নোটিশ সংরক্ষিত নেই — নতুন নোটিশ আসলে এখানে স্ক্রল করে দেখা যাবে।";
        return;
    }

    const summary = q
        ? `সার্চ ফলাফল: ${filtered.length}টি নোটিশ পাওয়া গেছে`
        : `মোট ${all.length}টি নোটিশ • `;

    const headlines = (filtered.length ? filtered : all)
        .slice(0, 10)
        .map(n => `${n.title}: ${n.body || ""}`.trim())
        .join("   ★   ");

    trackEl.textContent = `${summary}   •   ${headlines}`;
}

function fillNoticeList() {
    const area = document.getElementById("nbListArea");
    const countEl = document.getElementById("nbResultCount");
    const tickerEl = document.getElementById("nbTickerTrack");
    if (!area) return;

    const all = pushNotices;
    const q = noticeSearchQuery;

    const filtered = q
        ? all.filter(n =>
            (n.title || "").toLowerCase().includes(q) ||
            (n.body || "").toLowerCase().includes(q) ||
            (n.time || "").toLowerCase().includes(q)
        )
        : all;

    if (countEl) {
        countEl.textContent = q ? `${filtered.length}টি নোটিশ পাওয়া গেছে` : "";
    }
    updateTicker(all, filtered, q, tickerEl);

    if (!filtered.length) {
        const loading = isLoadingNotices && !all.length;
        area.innerHTML = `
            <div class="nb-empty">
                <div style="font-size:28px;margin-bottom:6px;">📢</div>
                <div style="font-size:15px;font-weight:700;">
                    ${loading ? "নোটিশ লোড হচ্ছে..." : q ? "কোনো নোটিশ খুঁজে পাওয়া যায়নি" : "কোনো নোটিশ সংরক্ষিত নেই"}
                </div>
                <div style="font-size:12.5px;margin-top:4px;">
                    ${loading ? "" : q ? "অন্য শব্দ দিয়ে সার্চ করে দেখুন।" : "নতুন নোটিশ যুক্ত হলে এখানে দেখা যাবে।"}
                </div>
            </div>`;
        return;
    }

    area.innerHTML = `<div class="nb-card-stack nb-rich">${filtered.map(n => {
        const isRead = readIds.has(n.id);
        return `
        <article class="nb-card ${isRead ? "read" : "unread"}" data-id="${escapeHTML(n.id)}">
            <div class="nb-avatar">📢</div>
            <div class="nb-content">
                <div class="nb-card-top">
                    <h3 class="nb-card-title">${highlightHTML(escapeHTML(n.title))}</h3>
                    ${isRead ? "" : `<span class="nb-new-tag">নতুন</span>`}
                </div>
                ${n.img ? `<img class="nb-card-media" src="${escapeHTML(n.img)}" alt="" loading="lazy">` : ""}
                <p class="nb-card-body">${highlightHTML(escapeHTML(n.body))}</p>
                ${(n.video || n.link) ? `
                <div class="nb-card-actions">
                    ${n.video ? `<a class="nb-link-btn" href="${escapeHTML(n.video)}" target="_blank" rel="noopener noreferrer">▶ ভিডিও দেখুন</a>` : ""}
                    ${n.link ? `<a class="nb-link-btn" href="${escapeHTML(n.link)}" target="_blank" rel="noopener noreferrer">🔗 লিংক খুলুন</a>` : ""}
                </div>` : ""}
                <div class="nb-card-foot">
                    <span class="nb-card-time">🕒 ${highlightHTML(escapeHTML(n.time || ""))}</span>
                </div>
            </div>
        </article>`;
    }).join("")}</div>`;

    // Broken image -> just hide it
    area.querySelectorAll(".nb-card-media").forEach(img => {
        img.addEventListener("error", () => { img.style.display = "none"; });
    });

    // Links must not trigger the card's "mark as read" handler
    area.querySelectorAll(".nb-link-btn").forEach(a => {
        a.addEventListener("click", (e) => e.stopPropagation());
    });

    // Tap = mark as read (local only). No edit / delete anywhere.
    area.querySelectorAll(".nb-card.unread").forEach(card => {
        card.addEventListener("click", () => {
            readIds.add(card.getAttribute("data-id"));
            saveReadIds();
            fillNoticeList();
        });
    });
}

/* ============================== Public API ============================== */

export function renderNoticeBoxInSheet() {
    const view = ensureSheetContainer();
    if (!view) return;
    renderNoticeListView(view);
}

export function openNoticeInbox() {
    injectNoticeStyles();
    loadReadIds();

    // Show the last known list instantly (also works offline), then Firebase refreshes it.
    pushNotices = loadCachedNotices();
    isLoadingNotices = true;

    if (!isNoticeActive) {
        captureHeaderState();
        hideMainViewsForNotice(true);
        pushNoticeState(1);
    }

    isNoticeActive = true;
    noticeSearchQuery = "";
    noticeTitleNow = "Notice Box";

    const view = ensureSheetContainer();
    if (view) {
        view.classList.remove("hidden");
        renderNoticeBoxInSheet();
    }

    startNoticeListener();
}

export function closeNoticeBox(fromPop = false) {
    if (!isNoticeActive) return;

    if (fromPop !== true && nbDepth > 0) {
        swallowPop++;
        try { history.go(-nbDepth); } catch (e) { swallowPop = 0; }
    }
    nbDepth = 0;
    isNoticeActive = false;
    noticeSearchQuery = "";

    stopNoticeListener();
    unmountHeaderSearch();

    const view = document.getElementById("noticeBoxSheetView");
    if (view) {
        view.classList.add("hidden");
        view.innerHTML = "";
    }

    restoreHeaderMode();
    hideMainViewsForNotice(false);
}

window.openNoticeInbox = openNoticeInbox;
window.closeNoticeBox = () => closeNoticeBox();
