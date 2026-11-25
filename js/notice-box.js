
/* =========================================================
   js/notice-box.js
   RMP MT CONTACTS
   Direct Firebase Auto Sync
   Strict type="push" | Read Only
   LocalStorage Fallback Enabled
========================================================= */

const STORAGE_KEY = "rmp_app_notices_v1";
const LEGACY_KEY = "app_notices";
const FIREBASE_NOTICES_PATH = "notices";
const DEFAULT_RTDB_URL = "https://qrt-team-default-rtdb.firebaseio.com";

let noticeState = { notices: [] };
let memoryNotices = [];
let noticeSearchQuery = "";

let isNoticeActive = false;

let prevTitleText = "";
let prevBackHidden = true;
let prevMenuHidden = false;

let autoSyncStarted = false;
let autoSyncPollTimer = null;

let lastSyncedSnapshotSignature = "";

let nbDepth = 0;
let swallowPop = 0;
let viewSnapshot = null;
let searchHandler = null;
let noticeTitleNow = "";

const NOTICE_HIDE_IDS = [
    "mainDashboardView",
    "categoryDetailsView",
    "dataDetailsView",
    "heroSlider",
    "searchBox",
    "subPageHeaderSearchWrapper",
    "slidingNoticeContainer"
];

/* =========================================================
   HELPERS
========================================================= */

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


function isPushNotice(raw) {

    if (!raw || typeof raw !== "object") {
        return false;
    }

    const rawType = String(
        raw.type ??
        raw.Type ??
        raw.noticeType ??
        raw.categoryType ??
        ""
    ).trim().toLowerCase();

    return rawType === "push";
}


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


function generateNoticeId() {

    return `push_${Date.now()}_${Math.random()
        .toString(36).substring(2, 7)}`;
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


function normalizePushNotice(raw, index = 0) {

    if (!raw || typeof raw !== "object") {
        return null;
    }

    if (!isPushNotice(raw)) {
        return null;
    }

    const title = String(
        raw.title ??
        raw.subject ??
        raw.heading ??
        "জরুরি বিজ্ঞপ্তি"
    ).trim();

    const body = String(
        raw.body ??
        raw.message ??
        raw.text ??
        raw.description ??
        ""
    ).trim();

    if (!title && !body) {
        return null;
    }

    return {
        id: String(
            raw.id ??
            `push_${index}_${title.slice(0, 10)}`
        ),

        title: title || "জরুরি বিজ্ঞপ্তি",

        body,

        type: "push",

        time: String(
            raw.time ??
            raw.timestamp ??
            formatNow()
        ),

        read: Boolean(raw.read),

        createdAt:
            Number(raw.createdAt) ||
            (1700000000000 + index * 1000)
    };
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function readFromKey(key) {

    if (!HAS_STORAGE) {
        return null;
    }

    try {

        const raw = window.localStorage.getItem(key);

        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return null;
        }

        return parsed
            .map((item, idx) =>
                normalizePushNotice(item, idx)
            )
            .filter(Boolean);

    } catch (e) {

        console.warn("Notice read error:", key, e);

        return null;
    }
}


function loadLocalNotices() {

    const fromPrimary = readFromKey(STORAGE_KEY);

    if (fromPrimary && fromPrimary.length > 0) {

        memoryNotices = fromPrimary;

        noticeState = {
            notices: fromPrimary
        };

        return fromPrimary;
    }

    const fromLegacy = readFromKey(LEGACY_KEY);

    if (fromLegacy && fromLegacy.length > 0) {

        memoryNotices = fromLegacy;

        noticeState = {
            notices: fromLegacy
        };

        return fromLegacy;
    }

    if (
        Array.isArray(memoryNotices) &&
        memoryNotices.length > 0
    ) {

        const filteredMem = memoryNotices.filter(isPushNotice);

        noticeState = {
            notices: filteredMem
        };

        return filteredMem;
    }

    noticeState = {
        notices: []
    };

    return [];
}


function saveLocalNotices() {

    const safe = (
        Array.isArray(noticeState.notices)
            ? noticeState.notices
            : []
    )
        .map((item, idx) =>
            normalizePushNotice(item, idx)
        )
        .filter(Boolean);

    noticeState.notices = safe;

    memoryNotices = safe;

    if (HAS_STORAGE) {

        try {

            const serialized = JSON.stringify(safe);

            window.localStorage.setItem(
                STORAGE_KEY,
                serialized
            );

            window.localStorage.setItem(
                LEGACY_KEY,
                serialized
            );

        } catch (e) {

            console.error("Notice local save error:", e);
        }
    }
}


/* =========================================================
   STYLES
========================================================= */

function injectNoticeStyles() {

    if (document.getElementById("noticeBoxModernStyles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "noticeBoxModernStyles";

    style.textContent = `

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
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            filter: none !important;
            overflow: visible !important;
        }

        .custom-bottom-nav .bottom-nav-svg path,
        .custom-bottom-nav .bottom-nav-svg circle,
        .custom-bottom-nav .bottom-nav-svg rect,
        .custom-bottom-nav .bottom-nav-svg g {
            filter: none !important;
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
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            filter: none !important;
            clip-path: none !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 2 !important;
            isolation: isolate !important;
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
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            filter: none !important;
        }

        .custom-bottom-nav * {
            -webkit-tap-highlight-color: transparent !important;
        }

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


/* =========================================================
   HIGHLIGHT
========================================================= */

function highlightHTML(html) {

    if (!noticeSearchQuery) {
        return html;
    }

    const re = new RegExp(
        `(${escapeRegExp(escapeHTML(noticeSearchQuery))})`,
        "gi"
    );

    return html
        .split(/(<[^>]+>)/g)
        .map(seg =>
            seg.startsWith("<")
                ? seg
                : seg.replace(re, "<mark>$1</mark>")
        )
        .join("");
}


/* =========================================================
   LAYOUT / HEADER / HISTORY
========================================================= */

function ensureSheetContainer() {

    const sheet = document.getElementById("mainScrollSheet");

    if (!sheet) {
        return null;
    }

    let view = document.getElementById("noticeBoxSheetView");

    if (!view) {

        view = document.createElement("div");

        view.id = "noticeBoxSheetView";

        view.className = "hidden";

        const mainEl =
            sheet.querySelector("main.container") || sheet;

        mainEl.appendChild(view);
    }

    return view;
}


function pushNoticeState(level) {

    try {
        history.pushState(
            { nbLevel: level },
            "",
            location.href
        );
    } catch (e) {}

    nbDepth = level;
}


window.addEventListener("popstate", (e) => {

    if (swallowPop > 0) {

        swallowPop--;

        e.stopImmediatePropagation();

        return;
    }

    if (!isNoticeActive) {
        return;
    }

    e.stopImmediatePropagation();

    const lvl =
        e.state && typeof e.state.nbLevel === "number"
            ? e.state.nbLevel
            : 0;

    if (lvl >= 1) {

        nbDepth = lvl;

        return;
    }

    nbDepth = 0;

    closeNoticeBox(true);

}, true);


function setHeaderBackMode(titleText) {

    const appTitleText =
        document.querySelector(".app-title-text");

    const menuIcon =
        document.getElementById("menuIcon");

    const backIcon =
        document.getElementById("backIcon");

    const navBtn =
        document.getElementById("navToggleBtn");

    noticeTitleNow = titleText;

    if (appTitleText) {
        appTitleText.textContent = titleText;
    }

    if (menuIcon && backIcon) {

        menuIcon.classList.add("hidden");

        backIcon.classList.remove("hidden");
    }

    if (navBtn && !navBtn.dataset.nbBound) {

        navBtn.dataset.nbBound = "1";

        navBtn.addEventListener("click", (e) => {

            if (!isNoticeActive) {
                return;
            }

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

    const appTitleText =
        document.querySelector(".app-title-text");

    const menuIcon =
        document.getElementById("menuIcon");

    const backIcon =
        document.getElementById("backIcon");

    prevTitleText =
        appTitleText ? appTitleText.textContent : "";

    prevMenuHidden =
        menuIcon ? menuIcon.classList.contains("hidden") : false;

    prevBackHidden =
        backIcon ? backIcon.classList.contains("hidden") : true;
}


function restoreHeaderMode() {

    const appTitleText =
        document.querySelector(".app-title-text");

    const menuIcon =
        document.getElementById("menuIcon");

    const backIcon =
        document.getElementById("backIcon");

    if (appTitleText) {
        appTitleText.textContent =
            prevTitleText || "RMP MT Contacts";
    }

    if (menuIcon) {
        menuIcon.classList.toggle("hidden", prevMenuHidden);
    }

    if (backIcon) {
        backIcon.classList.toggle("hidden", prevBackHidden);
    }
}


function hideMainViewsForNotice(hide) {

    if (hide) {

        viewSnapshot = {};

        NOTICE_HIDE_IDS.forEach(id => {

            const el = document.getElementById(id);

            if (!el) {
                return;
            }

            viewSnapshot[id] = {
                hidden: el.classList.contains("hidden"),
                display: el.style.display
            };

            el.classList.add("hidden");
        });

        const slider =
            document.getElementById("heroSlider");

        if (slider) {
            slider.style.display = "none";
        }

        return;
    }

    if (!viewSnapshot) {
        return;
    }

    NOTICE_HIDE_IDS.forEach(id => {

        const el = document.getElementById(id);

        const snap = viewSnapshot[id];

        if (!el || !snap) {
            return;
        }

        el.classList.toggle("hidden", snap.hidden);

        el.style.display = snap.display;
    });

    viewSnapshot = null;
}


/* =========================================================
   HEADER SEARCH
========================================================= */

function mountHeaderSearch(placeholder) {

    let wrap = document.getElementById("nbHeaderSearch");

    if (!wrap) {

        wrap = document.createElement("div");

        wrap.id = "nbHeaderSearch";

        wrap.className =
            "header-search-inline is-visible";

        wrap.innerHTML = `
            <div class="subpage-search-field">
                <span class="subpage-search-icon" aria-hidden="true">⌕</span>
                <input id="nbToolbarSearchInput"
                       type="search"
                       autocomplete="off">

                <button id="nbClearSearchBtn"
                        type="button"
                        class="subpage-search-clear"
                        aria-label="Clear search"
                        title="Clear search">×</button>
            </div>
        `;

        const top =
            document.querySelector(".modern-top-wrapper");

        const header =
            top?.querySelector(".modern-header");

        if (header) {

            header.insertAdjacentElement("afterend", wrap);

        } else if (top) {

            top.appendChild(wrap);

        } else {

            const sheet =
                document.getElementById("mainScrollSheet");

            if (sheet?.parentElement) {
                sheet.parentElement.insertBefore(wrap, sheet);
            } else {
                document.body.prepend(wrap);
            }
        }

        const field =
            wrap.querySelector(".subpage-search-field");

        const input =
            wrap.querySelector("#nbToolbarSearchInput");

        const clearBtn =
            wrap.querySelector("#nbClearSearchBtn");

        input.addEventListener("input", () => {

            noticeSearchQuery =
                input.value.trim().toLowerCase();

            field.classList.toggle(
                "has-value",
                input.value.length > 0
            );

            if (searchHandler) {
                searchHandler();
            }
        });

        clearBtn.addEventListener("click", () => {

            noticeSearchQuery = "";

            input.value = "";

            field.classList.remove("has-value");

            input.focus();

            if (searchHandler) {
                searchHandler();
            }
        });
    }

    const field =
        wrap.querySelector(".subpage-search-field");

    const input =
        wrap.querySelector("#nbToolbarSearchInput");

    input.placeholder = placeholder;

    if (
        input.value.trim().toLowerCase() !==
        noticeSearchQuery
    ) {
        input.value = noticeSearchQuery;
    }

    field.classList.toggle(
        "has-value",
        input.value.length > 0
    );

    wrap.classList.add("is-visible");

    wrap.classList.remove("hidden");
}


function unmountHeaderSearch() {

    document.getElementById("nbHeaderSearch")?.remove();

    searchHandler = null;
}


/* =========================================================
   NOTICE LIST RENDER
========================================================= */

function renderNoticeListView(container) {

    setHeaderBackMode(noticeTitleNow || "Notice Box");

    mountHeaderSearch("নোটিশ খুঁজুন...");

    container.innerHTML = `
        <div class="nb-ticker-bar">
            <span class="nb-ticker-badge">
                📢 জরুরি বিজ্ঞপ্তি:
            </span>

            <div class="nb-ticker-viewport">
                <div id="nbTickerTrack"
                     class="nb-ticker-track">
                    লোড হচ্ছে...
                </div>
            </div>
        </div>

        <div id="nbResultCount"
             class="nb-result-count"></div>

        <div id="nbListArea"></div>
    `;

    searchHandler = () => fillNoticeList();

    fillNoticeList();
}


function getCategorySlidingNoticeText() {

    const el =
        document.getElementById("slidingNoticeContainer") ||
        document.querySelector(".sliding-notice-container");

    if (!el) {
        return "";
    }

    return String(el.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
}


function updateTicker(all, filtered, q, trackEl) {

    if (!trackEl) {
        return;
    }

    const catSlideText =
        getCategorySlidingNoticeText();

    if (catSlideText) {

        trackEl.textContent = catSlideText;

        return;
    }

    if (!all.length) {

        trackEl.textContent =
            "কোনো পুশ নোটিশ নেই — Firebase এ type: push নোটিশ থাকলে এখানে দেখা যাবে।";

        return;
    }

    const summary = q
        ? `সার্চ ফলাফল: ${filtered.length}টি নোটিশ পাওয়া গেছে`
        : `মোট ${all.length}টি নোটিশ • `;

    const headlines = (
        filtered.length ? filtered : all
    )
        .map(n => `${n.title}: ${n.body || ""}`.trim())
        .join("   ★   ");

    trackEl.textContent =
        `${summary}   •   ${headlines}`;
}


function fillNoticeList() {

    const area =
        document.getElementById("nbListArea");

    const countEl =
        document.getElementById("nbResultCount");

    const tickerEl =
        document.getElementById("nbTickerTrack");

    if (!area) {
        return;
    }

    // গুরুত্বপূর্ণ:
    // Firebase খালি থাকলেও LocalStorage থেকে নোটিশ লোড হবে।
    const all = loadLocalNotices().filter(isPushNotice);

    const q = noticeSearchQuery;

    const filtered = q
        ? all.filter(n =>
            (n.title || "").toLowerCase().includes(q) ||
            (n.body || "").toLowerCase().includes(q) ||
            (n.time || "").toLowerCase().includes(q)
        )
        : all;

    if (countEl) {

        countEl.textContent = q
            ? `${filtered.length}টি নোটিশ পাওয়া গেছে`
            : "";
    }

    updateTicker(all, filtered, q, tickerEl);

    if (!filtered.length) {

        area.innerHTML = `
            <div class="nb-empty">
                <div style="font-size:28px;margin-bottom:6px;">
                    📢
                </div>

                <div style="font-size:15px;font-weight:700;">
                    ${q
                        ? "কোনো নোটিশ খুঁজে পাওয়া যায়নি"
                        : "কোনো পুশ নোটিশ নেই"}
                </div>

                <div style="font-size:12.5px;margin-top:4px;">
                    ${q
                        ? "অন্য শব্দ দিয়ে সার্চ করে দেখুন।"
                        : 'Firebase এ type: "push" নোটিশ থাকলে এখানে দেখা যাবে।'}
                </div>
            </div>
        `;

        return;
    }

    area.innerHTML = `
        <div class="nb-card-stack nb-rich">

            ${filtered.map(n => `

                <article class="nb-card ${n.read ? "" : "unread"}"
                         data-id="${escapeHTML(n.id)}">

                    <div class="nb-avatar">
                        📢
                    </div>

                    <div class="nb-content">

                        <div class="nb-card-top">

                            <h3 class="nb-card-title">
                                ${highlightHTML(escapeHTML(n.title))}
                            </h3>

                            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">

                                ${n.read
                                    ? ""
                                    : `<span class="nb-new-tag">নতুন</span>`
                                }

                            </div>

                        </div>

                        <p class="nb-card-body">
                            ${highlightHTML(escapeHTML(n.body))}
                        </p>

                        <div class="nb-card-foot">
                            <span>
                                🕒 ${highlightHTML(escapeHTML(n.time || ""))}
                            </span>
                        </div>

                    </div>

                </article>

            `).join("")}

        </div>
    `;

    area.querySelectorAll(".nb-card").forEach(card => {

        card.addEventListener("click", () => {

            const id = card.getAttribute("data-id");

            noticeState.notices =
                loadLocalNotices().map(item =>
                    item.id === id
                        ? { ...item, read: true }
                        : item
                );

            saveLocalNotices();

            renderNoticeBoxInSheet();
        });
    });
}


/* =========================================================
   STRICT PUSH NOTICE STORAGE
========================================================= */

function upsertNoticeToUserStorage(rawNotice) {

    if (!rawNotice || typeof rawNotice !== "object") {
        return null;
    }

    if (!isPushNotice(rawNotice)) {
        return null;
    }

    const cleanTitle = String(
        rawNotice.title ??
        rawNotice.subject ??
        rawNotice.heading ??
        ""
    ).trim();

    const cleanBody = String(
        rawNotice.body ??
        rawNotice.message ??
        rawNotice.text ??
        rawNotice.description ??
        ""
    ).trim();

    if (!cleanTitle && !cleanBody) {
        return null;
    }

    loadLocalNotices();

    const targetId =
        rawNotice.id ? String(rawNotice.id) : null;

    const existingIndex = targetId

        ? noticeState.notices.findIndex(
            item => String(item.id) === targetId
        )

        : noticeState.notices.findIndex(item =>
            item.title === (cleanTitle || "জরুরি বিজ্ঞপ্তি") &&
            item.body === cleanBody
        );

    if (existingIndex !== -1) {

        const existing =
            noticeState.notices[existingIndex];

        const updated = normalizePushNotice({

            ...existing,

            title: cleanTitle || existing.title,

            body: cleanBody || existing.body,

            type: "push",

            time: rawNotice.time || existing.time,

            read: existing.read,

            createdAt: existing.createdAt

        }, existingIndex);

        if (updated) {

            noticeState.notices[existingIndex] = updated;

            saveLocalNotices();

            if (isNoticeActive) {
                renderNoticeBoxInSheet();
            }

            return updated;
        }

        return existing;
    }

    const entry = {

        id: targetId || generateNoticeId(),

        title: cleanTitle || "জরুরি বিজ্ঞপ্তি",

        body: cleanBody,

        type: "push",

        time: String(
            rawNotice.time ??
            rawNotice.timestamp ??
            formatNow()
        ),

        read: false,

        createdAt:
            Number(rawNotice.createdAt) || Date.now()
    };

    noticeState.notices.unshift(entry);

    saveLocalNotices();

    if (isNoticeActive) {
        renderNoticeBoxInSheet();
    }

    return entry;
}


/* =========================================================
   FIREBASE DATA EXTRACTION
========================================================= */

function extractStrictPushList(input) {

    if (!input) {
        return [];
    }

    if (Array.isArray(input)) {

        return input.map((item, idx) => {

            if (
                !item ||
                typeof item !== "object" ||
                !isPushNotice(item)
            ) {
                return null;
            }

            return {

                id: String(
                    item.id ??
                    item._key ??
                    `push_arr_${idx}`
                ),

                title: String(
                    item.title ??
                    item.subject ??
                    item.heading ??
                    ""
                ).trim(),

                body: String(
                    item.message ??
                    item.body ??
                    item.text ??
                    item.description ??
                    ""
                ).trim(),

                type: "push",

                time: String(
                    item.time ??
                    item.timestamp ??
                    formatNow()
                ),

                createdAt:
                    Number(item.createdAt) ||
                    (1700000000000 + idx * 1000)

            };

        }).filter(item =>
            item && (item.title || item.body)
        );
    }

    if (typeof input === "object") {

        return Object.entries(input).map(([key, val], idx) => {

            if (
                !val ||
                typeof val !== "object" ||
                !isPushNotice(val)
            ) {
                return null;
            }

            return {

                id: String(val.id || key),

                title: String(
                    val.title ??
                    val.subject ??
                    val.heading ??
                    ""
                ).trim(),

                body: String(
                    val.message ??
                    val.body ??
                    val.text ??
                    val.description ??
                    ""
                ).trim(),

                type: "push",

                time: String(
                    val.time ??
                    val.timestamp ??
                    formatNow()
                ),

                createdAt:
                    Number(val.createdAt) ||
                    (1700000000000 + idx * 1000)

            };

        }).filter(item =>
            item && (item.title || item.body)
        );
    }

    return [];
}


/* =========================================================
   FIREBASE SYNC
========================================================= */

function syncFirebaseNoticesList(noticesInput) {

    const pushItems =
        extractStrictPushList(noticesInput);

    // FIX:
    // Firebase-এ Push নোটিশ না থাকলে পুরোনো নোটিশ
    // কখনোই মুছে ফেলা হবে না।

    if (!pushItems.length) {

        loadLocalNotices();

        if (isNoticeActive) {
            fillNoticeList();
        }

        return;
    }

    const prevList =
        loadLocalNotices().filter(isPushNotice);

    const prevReadMap = new Map(
        prevList.map(n => [
            String(n.id),
            Boolean(n.read)
        ])
    );

    const prevCreatedMap = new Map(
        prevList.map(n => [
            String(n.id),
            Number(n.createdAt) || 0
        ])
    );

    const nextList = pushItems.map((n, idx) => ({

        id: String(n.id),

        title: n.title || "জরুরি বিজ্ঞপ্তি",

        body: n.body || "",

        type: "push",

        time: n.time || formatNow(),

        read: prevReadMap.has(String(n.id))
            ? prevReadMap.get(String(n.id))
            : false,

        createdAt:
            Number(n.createdAt) ||
            prevCreatedMap.get(String(n.id)) ||
            (1700000000000 + idx * 1000)

    }));

    nextList.sort((a, b) =>
        (Number(b.createdAt) || 0) -
        (Number(a.createdAt) || 0)
    );

    const changed =
        JSON.stringify(prevList) !==
        JSON.stringify(nextList);

    lastSyncedSnapshotSignature =
        JSON.stringify(
            pushItems.map(i => [
                i.id,
                i.title,
                i.body,
                i.time
            ])
        );

    noticeState.notices = nextList;

    memoryNotices = nextList;

    saveLocalNotices();

    if (isNoticeActive) {

        if (changed) {
            renderNoticeBoxInSheet();
        } else {
            fillNoticeList();
        }
    }
}


/* =========================================================
   FIREBASE DATABASE RESOLVER
========================================================= */

function resolveRealtimeDbInstance() {

    if (
        window.db &&
        typeof window.db.ref === "function"
    ) {
        return window.db;
    }

    if (
        window.firebaseDb &&
        typeof window.firebaseDb.ref === "function"
    ) {
        return window.firebaseDb;
    }

    if (
        window.database &&
        typeof window.database.ref === "function"
    ) {
        return window.database;
    }

    if (
        window.rtdb &&
        typeof window.rtdb.ref === "function"
    ) {
        return window.rtdb;
    }

    if (
        window.firebase &&
        typeof window.firebase.database === "function"
    ) {

        try {
            return window.firebase.database();
        } catch (e) {
            return null;
        }
    }

    return null;
}


function resolveDatabaseUrl() {

    return (
        window.FIREBASE_DATABASE_URL ||
        window.firebaseConfig?.databaseURL ||
        window.firebase?.app?.()?.options?.databaseURL ||
        DEFAULT_RTDB_URL
    );
}


/* =========================================================
   FIREBASE REST FETCH
========================================================= */

async function fetchPushNoticesViaRest() {

    const dbUrl = resolveDatabaseUrl();

    if (!dbUrl) {
        return;
    }

    try {

        const base =
            String(dbUrl).replace(/\/+$/, "");

        const res = await fetch(
            `${base}/${FIREBASE_NOTICES_PATH}.json`,
            {
                cache: "no-store"
            }
        );

        if (!res.ok) {
            return;
        }

        const data = await res.json();

        // খালি Firebase ডাটা হলে LocalStorage অক্ষত থাকবে।
        syncFirebaseNoticesList(data || {});

    } catch (e) {

        // Network error হলে LocalStorage ব্যবহার হবে।
        console.warn(
            "Firebase REST sync unavailable:",
            e
        );
    }
}


/* =========================================================
   AUTO SYNC START
========================================================= */

function startFirebaseAutoSync() {

    // প্রথমে LocalStorage লোড
    // যাতে Firebase আসার আগেই পুরোনো নোটিশ পাওয়া যায়।

    loadLocalNotices();

    // তাৎক্ষণিক Firebase REST Sync
    fetchPushNoticesViaRest();

    if (autoSyncStarted) {
        return;
    }

    autoSyncStarted = true;

    const db = resolveRealtimeDbInstance();

    // Firebase Compat Listener
    if (db) {

        try {

            const ref =
                db.ref(FIREBASE_NOTICES_PATH);

            ref.on("value", (snapshot) => {

                const val =
                    snapshot &&
                    typeof snapshot.val === "function"
                        ? snapshot.val()
                        : null;

                syncFirebaseNoticesList(val || {});

            });

        } catch (e) {

            console.warn(
                "Firebase SDK listener fallback to REST:",
                e
            );
        }
    }

    // Firebase Modular Listener
    if (
        window._firebaseModularDb &&
        window._firebaseModularRef &&
        window._firebaseModularOnValue
    ) {

        try {

            const r =
                window._firebaseModularRef(
                    window._firebaseModularDb,
                    FIREBASE_NOTICES_PATH
                );

            window._firebaseModularOnValue(r, (snapshot) => {

                const val =
                    snapshot &&
                    typeof snapshot.val === "function"
                        ? snapshot.val()
                        : null;

                syncFirebaseNoticesList(val || {});

            });

        } catch (e) {

            console.warn(
                "Firebase Modular listener fallback to REST:",
                e
            );
        }
    }

    // প্রতি ৫ সেকেন্ডে REST Auto Sync
    if (!autoSyncPollTimer) {

        autoSyncPollTimer = setInterval(
            fetchPushNoticesViaRest,
            5000
        );
    }
}


/* =========================================================
   PUBLIC API
========================================================= */

export function renderNoticeBoxInSheet() {

    const view = ensureSheetContainer();

    if (!view) {
        return;
    }

    renderNoticeListView(view);
}


export function openNoticeInbox() {

    injectNoticeStyles();

    // প্রথমে পুরোনো LocalStorage নোটিশ লোড
    loadLocalNotices();

    // তারপর Firebase Auto Sync
    startFirebaseAutoSync();

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
}


export function closeNoticeBox(fromPop = false) {

    if (!isNoticeActive) {
        return;
    }

    if (fromPop !== true && nbDepth > 0) {

        swallowPop++;

        try {

            history.go(-nbDepth);

        } catch (e) {

            swallowPop = 0;
        }
    }

    nbDepth = 0;

    isNoticeActive = false;

    noticeSearchQuery = "";

    unmountHeaderSearch();

    const view =
        document.getElementById("noticeBoxSheetView");

    if (view) {

        view.classList.add("hidden");

        view.innerHTML = "";
    }

    restoreHeaderMode();

    hideMainViewsForNotice(false);
}


/* =========================================================
   PUSH EVENT LISTENER
========================================================= */

window.addEventListener("app:notice", (e) => {

    const d = e?.detail || {};

    if (!isPushNotice(d)) {
        return;
    }

    if (d.title || d.body || d.message) {

        upsertNoticeToUserStorage({

            id: d.id,

            title: d.title,

            body: d.body ?? d.message,

            type: "push",

            time: d.time,

            createdAt: d.createdAt

        });
    }
});


/* =========================================================
   FIREBASE EXTERNAL SYNC EVENT
========================================================= */

window.addEventListener(
    "rmp:firebase-notices-sync",
    (e) => {

        if (e?.detail?.notices !== undefined) {

            syncFirebaseNoticesList(
                e.detail.notices
            );

        } else {

            fetchPushNoticesViaRest();
        }
    }
);


/* =========================================================
   SERVICE WORKER / MESSAGE LISTENER
========================================================= */

window.addEventListener("message", (event) => {

    const data = event?.data;

    if (!data || typeof data !== "object") {
        return;
    }

    const payload =
        data.payload ||
        data.data ||
        data;

    const nested =
        payload.data &&
        typeof payload.data === "object"
            ? payload.data
            : {};

    const merged = {
        ...nested,
        ...payload
    };

    if (!isPushNotice(merged)) {
        return;
    }

    const title =
        merged.notification?.title ||
        merged.title ||
        merged.subject ||
        "";

    const body =
        merged.notification?.body ||
        merged.body ||
        merged.message ||
        merged.text ||
        "";

    if (title || body) {

        upsertNoticeToUserStorage({

            id: merged.id || merged.messageId,

            title,

            body,

            type: "push",

            time:
                merged.time ||
                formatNow()

        });
    }
});


/* =========================================================
   STORAGE EVENT
========================================================= */

window.addEventListener("storage", (e) => {

    if (
        e.key === STORAGE_KEY ||
        e.key === LEGACY_KEY
    ) {

        loadLocalNotices();

        if (isNoticeActive) {
            renderNoticeBoxInSheet();
        }
    }
});


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadLocalNotices();

    startFirebaseAutoSync();

});


window.addEventListener("load", () => {

    startFirebaseAutoSync();

});


/* =========================================================
   GLOBAL API
========================================================= */

window.openNoticeInbox = openNoticeInbox;

window.closeNoticeBox = () => closeNoticeBox();

window.saveNoticeToUserStorage =
    upsertNoticeToUserStorage;

window.syncFirebaseNoticesToUserStorage =
    syncFirebaseNoticesList;

window.startNoticeBoxAutoSync =
    startFirebaseAutoSync;
