// js/notice-box.js  (Clean Notice Box Edition — Matched with driving-guide.js style)

const STORAGE_KEY = "rmp_app_notices_v1";
const LEGACY_KEY = "app_notices";

let noticeState = { notices: [] };
let memoryNotices = [];
let lastRemoteNotices = [];
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

/* শুধুমাত্র type=push নোটিফিকেশন এখানে সংরক্ষিত হবে */
function isPushNotice(raw) {
    return !!raw && String(raw.type ?? "").trim().toLowerCase() === "push";
}

function generateNoticeId() {
    return `notice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function formatNow(date = new Date()) {
    const pad = n => String(n).padStart(2, "0");
    const dd = pad(date.getDate());
    const mm = pad(date.getMonth() + 1);
    const yyyy = date.getFullYear();

    let h = date.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;

    return `${dd}/${mm}/${yyyy} ${pad(h)}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${ampm}`;
}

function normalizeNotice(raw, index = 0) {
    if (!raw || typeof raw !== "object") return null;

    const title = String(
        raw.title ?? raw.subject ?? raw.heading ?? "জরুরি বিজ্ঞপ্তি"
    ).trim();

    const body = String(
        raw.body ?? raw.message ?? raw.text ?? raw.description ?? ""
    ).trim();

    if (!title && !body) return null;

    return {
        id: String(raw.id ?? `notice_${Date.now()}_${index}`),
        title: title || "জরুরি বিজ্ঞপ্তি",
        body,
        time: String(raw.time ?? raw.timestamp ?? formatNow()),
        type: "push",
        read: Boolean(raw.read),
        createdAt: Number(raw.createdAt) || Date.now()
    };
}

/* ============================== Storage ============================== */

function readFromKey(key) {
    if (!HAS_STORAGE) return null;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;
        return parsed
            .map((item, idx) => normalizeNotice(item, idx))
            .filter(Boolean)
            .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
    } catch (e) {
        console.warn("Notice read error:", key, e);
        return null;
    }
}

function loadLocalNotices() {
    const fromPrimary = readFromKey(STORAGE_KEY);
    if (fromPrimary && fromPrimary.length > 0) {
        memoryNotices = fromPrimary;
        noticeState = { notices: fromPrimary };
        return fromPrimary;
    }

    const fromLegacy = readFromKey(LEGACY_KEY);
    if (fromLegacy && fromLegacy.length > 0) {
        memoryNotices = fromLegacy;
        noticeState = { notices: fromLegacy };
        saveLocalNotices();
        return fromLegacy;
    }

    if (Array.isArray(memoryNotices) && memoryNotices.length > 0) {
        noticeState = { notices: memoryNotices };
        return memoryNotices;
    }

    noticeState = { notices: [] };
    return [];
}

function saveLocalNotices() {
    const safe = (Array.isArray(noticeState.notices) ? noticeState.notices : [])
        .map((item, idx) => normalizeNotice(item, idx))
        .filter(Boolean);

    noticeState.notices = safe;
    memoryNotices = safe;

    if (HAS_STORAGE) {
        try {
            const serialized = JSON.stringify(safe);
            window.localStorage.setItem(STORAGE_KEY, serialized);
            window.localStorage.setItem(LEGACY_KEY, serialized);
        } catch (e) {
            console.error("Notice local save error:", e);
        }
    }
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

        /* স্লাইড টেক্সট — ক্যাটাগরি/সাব-ক্যাটাগরির #slidingNoticeContainer এর মতো (ট্রান্সপারেন্ট, নিচে বর্ডার, গোলাকার) */
        .nb-ticker-bar {
            background: transparent;
            border: 0;
            border-bottom: 1px solid var(--border-color, #e2e8f0);
            border-radius: 8px;
            margin: 0 0 4px 0;
            padding: 2px 0;
            display: flex;
            align-items: center;
            overflow: hidden;
        }
        .nb-ticker-bar.hidden {
            display: none !important;
            margin: 0 !important;
            border: 0 !important;
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

        .nb-rich mark {
            background: #fde68a;
            color: #111827;
            padding: 0 3px;
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);
}

/* ============================== Highlight & Admin Code ============================== */

function highlightHTML(html) {
    if (!noticeSearchQuery) return html;
    const re = new RegExp(`(${escapeRegExp(escapeHTML(noticeSearchQuery))})`, "gi");
    return html
        .split(/(<[^>]+>)/g)
        .map(seg => (seg.startsWith("<") ? seg : seg.replace(re, "<mark>$1</mark>")))
        .join("");
}

function checkAdminCode() {
    if (noticeSearchQuery !== "admin@jr") return;
    const btn = document.getElementById("adminLoginBtn");
    if (btn) {
        btn.classList.remove("hidden");
        btn.style.display = "inline-flex";
    }
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
            checkAdminCode();
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

    const html = `
        <div id="nbTickerBar" class="nb-ticker-bar hidden">
            <div class="nb-ticker-viewport">
                <div id="nbTickerTrack" class="nb-ticker-track"></div>
            </div>
        </div>

        <div id="nbResultCount" class="nb-result-count"></div>
        <div id="nbListArea"></div>
    `;

    container.innerHTML = html;

    searchHandler = () => fillNoticeList();
    fillNoticeList();
}

function updateTicker(all, filtered, q, trackEl) {
    if (!trackEl) return;
    const bar = document.getElementById("nbTickerBar");
    const list = q ? filtered : all;

    if (!list.length) {
        if (bar) bar.classList.add("hidden");
        trackEl.textContent = "";
        return;
    }

    const text = list
        .map(n => `${n.title}${n.body ? ": " + n.body : ""}`.trim())
        .join("   ★   ");

    if (trackEl.textContent !== text) trackEl.textContent = text;
    if (bar) bar.classList.remove("hidden");
}

function fillNoticeList() {
    const area = document.getElementById("nbListArea");
    const countEl = document.getElementById("nbResultCount");
    const tickerEl = document.getElementById("nbTickerTrack");
    if (!area) return;

    const all = loadLocalNotices();
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
        area.innerHTML = `
            <div class="nb-empty">
                <div style="font-size:28px;margin-bottom:6px;">📢</div>
                <div style="font-size:15px;font-weight:700;">
                    ${q ? "কোনো নোটিশ খুঁজে পাওয়া যায়নি" : "কোনো নোটিশ সংরক্ষিত নেই"}
                </div>
                <div style="font-size:12.5px;margin-top:4px;">
                    ${q ? "অন্য শব্দ দিয়ে সার্চ করে দেখুন।" : "নতুন নোটিশ যুক্ত হলে এখানে দেখা যাবে।"}
                </div>
            </div>`;
        return;
    }

    area.innerHTML = `<div class="nb-card-stack nb-rich">${filtered.map(n => `
        <article class="nb-card ${n.read ? "" : "unread"}" data-id="${escapeHTML(n.id)}">
            <div class="nb-avatar">📢</div>
            <div class="nb-content">
                <div class="nb-card-top">
                    <h3 class="nb-card-title">${highlightHTML(escapeHTML(n.title))}</h3>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                        ${n.read ? "" : `<span class="nb-new-tag">নতুন</span>`}
                    </div>
                </div>
                <p class="nb-card-body">${highlightHTML(escapeHTML(n.body))}</p>
                <div class="nb-card-foot">
                    <span>🕒 ${highlightHTML(escapeHTML(n.time || ""))}</span>
                </div>
            </div>
        </article>`).join("")}</div>`;

    area.querySelectorAll(".nb-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.getAttribute("data-id");
            noticeState.notices = loadLocalNotices().map(item =>
                item.id === id ? { ...item, read: true } : item
            );
            saveLocalNotices();
            renderNoticeBoxInSheet();
        });
    });
}

/* ============================== User Storage Sync Helpers ============================== */

function upsertNoticeToUserStorage(rawNotice) {
    if (!rawNotice || typeof rawNotice !== "object") return null;
    if (!isPushNotice(rawNotice)) return null;

    const cleanTitle = String(rawNotice.title ?? rawNotice.subject ?? rawNotice.heading ?? "").trim();
    const cleanBody = String(rawNotice.body ?? rawNotice.message ?? rawNotice.text ?? rawNotice.description ?? "").trim();
    if (!cleanTitle && !cleanBody) return null;

    loadLocalNotices();

    const targetId = rawNotice.id ? String(rawNotice.id) : null;
    const existingIndex = targetId
        ? noticeState.notices.findIndex(item => String(item.id) === targetId)
        : noticeState.notices.findIndex(item =>
            item.title === (cleanTitle || "জরুরি বিজ্ঞপ্তি") &&
            item.body === cleanBody
        );

    if (existingIndex !== -1) {
        const existing = noticeState.notices[existingIndex];
        const updated = normalizeNotice({
            ...existing,
            title: cleanTitle || existing.title,
            body: cleanBody || existing.body,
            time: rawNotice.time || existing.time,
            read: existing.read
        }, existingIndex);
        if (updated) {
            noticeState.notices[existingIndex] = updated;
            saveLocalNotices();
            if (isNoticeActive) renderNoticeBoxInSheet();
            return updated;
        }
        return existing;
    }

    const entry = {
        id: targetId || generateNoticeId(),
        title: cleanTitle || "জরুরি বিজ্ঞপ্তি",
        body: cleanBody,
        time: String(rawNotice.time ?? rawNotice.timestamp ?? formatNow(new Date())),
        type: "push",
        read: false,
        createdAt: Number(rawNotice.createdAt) || Date.now()
    };

    noticeState.notices.unshift(entry);
    saveLocalNotices();
    if (isNoticeActive) renderNoticeBoxInSheet();
    return entry;
}

function syncFirebaseNoticesList(noticesList) {
    if (!Array.isArray(noticesList)) return;
    lastRemoteNotices = noticesList;
    const userVisibleNotices = noticesList.filter(isPushNotice);
    if (!userVisibleNotices.length) return;

    loadLocalNotices();
    let changed = false;

    userVisibleNotices.forEach((n, idx) => {
        const cleanTitle = String(n.title ?? "").trim();
        const cleanBody = String(n.message ?? n.body ?? "").trim();
        if (!cleanTitle && !cleanBody) return;

        const nid = String(n.id ?? "");
        const foundIdx = nid
            ? noticeState.notices.findIndex(item => String(item.id) === nid)
            : noticeState.notices.findIndex(item => item.title === (cleanTitle || "জরুরি বিজ্ঞপ্তি") && item.body === cleanBody);

        if (foundIdx === -1) {
            noticeState.notices.push({
                id: nid || generateNoticeId(),
                title: cleanTitle || "জরুরি বিজ্ঞপ্তি",
                body: cleanBody,
                time: String(n.time ?? formatNow(new Date())),
                type: "push",
                read: false,
                createdAt: Number(n.createdAt) || (Date.now() - idx * 1000)
            });
            changed = true;
        } else {
            const prev = noticeState.notices[foundIdx];
            if (prev.title !== (cleanTitle || prev.title) || prev.body !== cleanBody || (n.time && prev.time !== n.time)) {
                noticeState.notices[foundIdx] = {
                    ...prev,
                    title: cleanTitle || prev.title,
                    body: cleanBody,
                    time: n.time || prev.time
                };
                changed = true;
            }
        }
    });

    if (changed) {
        noticeState.notices.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        saveLocalNotices();
        if (isNoticeActive) renderNoticeBoxInSheet();
    }
}

/* নতুন নোটিশ না এলেও পুরাতন নোটিশ দেখানোর জন্য: খোলার সময় সর্বশেষ লিস্ট আবার প্রয়োগ + সোর্সের কাছে রিকোয়েস্ট */
function pullRemoteNotices() {
    if (lastRemoteNotices.length) syncFirebaseNoticesList(lastRemoteNotices);
    try {
        window.dispatchEvent(new CustomEvent("rmp:notice-box-request-sync"));
    } catch (e) { /* ignore */ }
}

/* ============================== Auto Sync ============================== */

const AUTO_SYNC_MS = 30000;
const DEFAULT_DB_URL = "https://qrt-team-default-rtdb.firebaseio.com";
const PUSH_ALPHABET = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

/* Firebase push-id (যেমন -P7FEhcBxzvQs97nr-dZ) এর প্রথম ৮ অক্ষর থেকে তৈরির সময় বের করা */
function pushIdToTime(key) {
    const k = String(key || "");
    if (k.length !== 20) return 0;
    let t = 0;
    for (let i = 0; i < 8; i++) {
        const idx = PUSH_ALPHABET.indexOf(k.charAt(i));
        if (idx < 0) return 0;
        t = t * 64 + idx;
    }
    return t;
}

/* Realtime Database এর /notices থেকে সরাসরি আনা (REST) — ফিল্টার ক্লায়েন্ট সাইডে type=push */
async function fetchNoticesFromDatabase() {
    const base = String(window.RMP_FIREBASE_DB_URL || DEFAULT_DB_URL).replace(/\/+$/, "");
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;

    try {
        const res = await fetch(`${base}/notices.json`, {
            cache: "no-store",
            signal: ctrl ? ctrl.signal : undefined
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || typeof data !== "object") return [];

        const entries = Array.isArray(data)
            ? data.map((v, i) => [String(i), v])
            : Object.entries(data);

        return entries
            .filter(([, v]) => v && typeof v === "object")
            .map(([key, v]) => ({
                ...v,
                id: String(v.id || key),
                createdAt: Number(v.createdAt) || pushIdToTime(key) || 0
            }));
    } finally {
        if (timer) clearTimeout(timer);
    }
}
let autoSyncTimer = null;
let syncBusy = false;

async function runAutoSync() {
    if (syncBusy) return;
    syncBusy = true;
    try {
        // ১) Firebase Realtime Database (/notices) থেকে সরাসরি সর্বশেষ নোটিশ আনা
        try {
            const list = await fetchNoticesFromDatabase();
            syncFirebaseNoticesList(list);
        } catch (e) {
            console.warn("Notice DB fetch failed:", e);
        }
        // ২) অ্যাপের নিজস্ব ফেচার থাকলে (Promise<Array>) সেটিও ব্যবহার
        if (typeof window.fetchFirebaseNotices === "function") {
            const list = await window.fetchFirebaseNotices();
            if (Array.isArray(list)) syncFirebaseNoticesList(list);
        }
    } catch (e) {
        console.warn("Notice auto sync error:", e);
    } finally {
        syncBusy = false;
    }
    // ৩) সর্বশেষ পাওয়া লিস্ট আবার প্রয়োগ + সোর্সকে রিকোয়েস্ট
    pullRemoteNotices();
    // ৪) লোকাল স্টোরেজের পুরাতন নোটিশ স্ক্রিনে রিফ্রেশ
    if (isNoticeActive) renderNoticeBoxInSheet();
}

function startAutoSync() {
    if (autoSyncTimer) return;
    runAutoSync();
    autoSyncTimer = setInterval(() => {
        if (document.visibilityState === "visible") runAutoSync();
    }, AUTO_SYNC_MS);
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") runAutoSync();
});
window.addEventListener("focus", runAutoSync);
window.addEventListener("online", runAutoSync);

/* ============================== Public API ============================== */

export function renderNoticeBoxInSheet() {
    const view = ensureSheetContainer();
    if (!view) return;
    renderNoticeListView(view);
}

export function openNoticeInbox() {
    injectNoticeStyles();
    loadLocalNotices();

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

    runAutoSync();
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

    unmountHeaderSearch();

    const view = document.getElementById("noticeBoxSheetView");
    if (view) {
        view.classList.add("hidden");
        view.innerHTML = "";
    }

    restoreHeaderMode();
    hideMainViewsForNotice(false);
}

export function addNotice(title, body) {
    const cleanTitle = String(title ?? "").trim();
    const cleanBody = String(body ?? "").trim();
    if (!cleanTitle && !cleanBody) return null;

    loadLocalNotices();
    const entry = {
        id: generateNoticeId(),
        title: cleanTitle || "জরুরি বিজ্ঞপ্তি",
        body: cleanBody,
        time: formatNow(new Date()),
        type: "push",
        read: false,
        createdAt: Date.now()
    };

    noticeState.notices.unshift(entry);
    saveLocalNotices();
    if (isNoticeActive) renderNoticeBoxInSheet();
    return entry;
}

window.addEventListener("app:notice", (e) => {
    const d = e?.detail || {};
    if (d.title || d.body || d.message) {
        upsertNoticeToUserStorage({
            id: d.id,
            type: d.type,
            title: d.title,
            body: d.body ?? d.message,
            time: d.time,
            createdAt: d.createdAt
        });
    }
});

window.addEventListener("rmp:firebase-notices-sync", (e) => {
    if (Array.isArray(e?.detail?.notices)) {
        syncFirebaseNoticesList(e.detail.notices);
    }
});

window.addEventListener("message", (event) => {
    const data = event?.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "FCM_NOTICE" || data.type === "PUSH_NOTIFICATION" || data.from === "firebase-messaging-sw") {
        const payload = data.payload || data.data || data;
        const title = payload.notification?.title || payload.title;
        const body = payload.notification?.body || payload.body || payload.message;
        const msgType = payload.data?.type ?? payload.type;
        if (msgType && String(msgType).trim().toLowerCase() !== "push") return;
        if (title || body) {
            upsertNoticeToUserStorage({
                type: "push",
                id: payload.id || payload.messageId,
                title,
                body,
                time: formatNow(new Date())
            });
        }
    }
});

window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === LEGACY_KEY) {
        loadLocalNotices();
        if (isNoticeActive) renderNoticeBoxInSheet();
    }
});

function bootNoticeBox() {
    loadLocalNotices();
    setTimeout(startAutoSync, 1200);
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootNoticeBox);
} else {
    bootNoticeBox();
}

window.openNoticeInbox = openNoticeInbox;
window.closeNoticeBox = () => closeNoticeBox();
window.addNotice = addNotice;
window.syncNoticeBoxNow = runAutoSync;
window.saveNoticeToUserStorage = upsertNoticeToUserStorage;
window.syncFirebaseNoticesToUserStorage = syncFirebaseNoticesList;
