// js/notice-box.js
// ড্রয়ারের "Notice Box" ক্লিক করলে drawer.js এই ফাইলটি লোড করে openNoticeInbox() চালায়।

const PRIMARY_KEY = "rmp_app_notices_v1";
const LEGACY_KEY = "app_notices";
const LOGO_SRC = "icons/icon-192.png";
const ADMIN_SECRET = "admin@jr";

let memoryNotices = [];
let noticeQuery = "";

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

function normalizeNotice(raw, index = 0) {
    if (!raw || typeof raw !== "object") return null;
    const title = String(raw.title ?? raw.subject ?? raw.heading ?? "জরুরি বিজ্ঞপ্তি").trim();
    const body = String(raw.body ?? raw.message ?? raw.text ?? raw.description ?? "").trim();
    if (!title && !body) return null;

    return {
        id: String(raw.id ?? `notice_${Date.now()}_${index}`),
        title: title || "জরুরি বিজ্ঞপ্তি",
        body,
        time: String(raw.time ?? raw.timestamp ?? formatNow()),
        read: Boolean(raw.read)
    };
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

function readFromKey(key) {
    if (!HAS_STORAGE) return null;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;
        return parsed.map((item, idx) => normalizeNotice(item, idx)).filter(Boolean);
    } catch (e) {
        console.warn("Notice read error:", key, e);
        return null;
    }
}

function loadNotices() {
    const fromPrimary = readFromKey(PRIMARY_KEY);
    if (fromPrimary && fromPrimary.length > 0) {
        memoryNotices = fromPrimary;
        return fromPrimary;
    }

    const fromLegacy = readFromKey(LEGACY_KEY);
    if (fromLegacy && fromLegacy.length > 0) {
        memoryNotices = fromLegacy;
        saveNotices(fromLegacy);
        return fromLegacy;
    }

    if (Array.isArray(memoryNotices) && memoryNotices.length > 0) {
        return memoryNotices;
    }

    return fromPrimary || fromLegacy || [];
}

function saveNotices(list) {
    const safe = (Array.isArray(list) ? list : [])
        .map((item, idx) => normalizeNotice(item, idx))
        .filter(Boolean);

    memoryNotices = safe;

    if (HAS_STORAGE) {
        try {
            const serialized = JSON.stringify(safe);
            window.localStorage.setItem(PRIMARY_KEY, serialized);
            window.localStorage.setItem(LEGACY_KEY, serialized);
        } catch (e) {
            console.warn("Notice save error:", e);
        }
    }
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

// সার্চ ফিল্ডে Admin@jr লিখলে হেডারের #adminLoginBtn শো করবে
let prevAdminBtnHidden = null;

function revealAdminLoginIfMatched(rawValue) {
    const btn = document.getElementById("adminLoginBtn");
    if (!btn) return false;

    const clean = String(rawValue ?? "").trim().toLowerCase();
    if (clean === ADMIN_SECRET) {
        if (prevAdminBtnHidden === null) {
            prevAdminBtnHidden = btn.classList.contains("hidden");
        }
        btn.classList.remove("hidden");
        return true;
    }
    return false;
}

function restoreAdminLoginButton() {
    const btn = document.getElementById("adminLoginBtn");
    if (btn && prevAdminBtnHidden !== null) {
        btn.classList.toggle("hidden", prevAdminBtnHidden);
        prevAdminBtnHidden = null;
    }
}

// অন্য কোড থেকে নোটিশ যোগ করার জন্য: addNotice("শিরোনাম", "বার্তা")
export function addNotice(title, body) {
    const cleanTitle = String(title ?? "").trim();
    const cleanBody = String(body ?? "").trim();
    if (!cleanTitle && !cleanBody) return null;

    const list = loadNotices();
    const entry = {
        id: `notice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: cleanTitle || "জরুরি বিজ্ঞপ্তি",
        body: cleanBody,
        time: formatNow(new Date()),
        read: false
    };

    list.unshift(entry);
    saveNotices(list);

    const panel = document.getElementById("noticeInboxPanel");
    if (panel && typeof panel._rerenderList === "function") {
        panel._rerenderList();
    }
    return entry;
}

window.addEventListener("app:notice", (e) => {
    const d = e?.detail || {};
    if (d.title || d.body) addNotice(d.title, d.body);
});

window.addEventListener("storage", (e) => {
    if (e.key === PRIMARY_KEY || e.key === LEGACY_KEY) {
        loadNotices();
        const panel = document.getElementById("noticeInboxPanel");
        if (panel && typeof panel._rerenderList === "function") {
            panel._rerenderList();
        }
    }
});

function injectStyles() {
    if (document.getElementById("rmpNoticeInboxMatchedCSS")) return;

    const style = document.createElement("style");
    style.id = "rmpNoticeInboxMatchedCSS";
    style.textContent = `
        #noticeInboxPanel {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 48px;
            z-index: 9990;
            background: var(--bg-color, #f8fafc);
            color: var(--text-main, #0f172a);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: inherit;
        }

        /* ডার্ক নেভি হেডার (index.html-এর মত) */
        .nb-top-wrap {
            background: var(--app-main-color, var(--primary-color, #020624));
            color: #ffffff;
            padding-bottom: 24px;
            flex-shrink: 0;
        }

        .nb-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px 8px;
            gap: 10px;
        }

        .nb-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }

        .nb-back-btn {
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.18);
            color: #ffffff;
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            flex-shrink: 0;
        }

        .nb-title-area {
            min-width: 0;
        }

        .nb-title {
            margin: 0;
            font-size: 19px;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.25;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .nb-clock {
            font-size: 11.5px;
            color: #cbd5e1;
            margin-top: 2px;
            letter-spacing: 0.4px;
            font-family: monospace;
        }

        .nb-logo {
            width: 65px;
            height: 65px;
            border-radius: 50%;
            object-fit: cover;
            margin-left: 4px;
            flex-shrink: 0;
        }

        /* index.html-এর .header-search-inline ও .subpage-search-field এর সাথে হুবহু সামঞ্জস্যপূর্ণ */
        .nb-search-inline {
            display: block;
            padding: 2px 16px 6px;
            width: 70%;
            box-sizing: border-box;
            margin: 0 auto;
        }

        @media (max-width: 600px) {
            .nb-search-inline {
                width: 86%;
            }
        }

        .nb-search-field {
            width: 100%;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            box-sizing: border-box;
            padding: 0 13px;
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 40px;
            background: rgba(255, 255, 255, 0.11);
            margin: 0 auto;
        }

        .nb-search-icon {
            flex: 0 0 auto;
            color: #cbd5e1;
            font-size: 23px;
            line-height: 1;
        }

        .nb-search-input {
            flex: 1 1 auto;
            min-width: 0;
            height: 100% !important;
            padding: 0 !important;
            border: 0 !important;
            outline: 0 !important;
            background: transparent !important;
            color: #ffffff !important;
            font-size: 14px;
            box-shadow: none !important;
            text-align: left;
        }

        .nb-search-input::placeholder {
            color: #cbd5e1 !important;
            opacity: 1;
        }

        .nb-search-clear {
            display: none;
            flex: 0 0 25px;
            width: 25px;
            height: 25px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.16);
            color: #fff;
            font-size: 20px;
            line-height: 22px;
            cursor: pointer;
        }

        .nb-search-field.has-value .nb-search-clear {
            display: block;
        }

        /* সাদা রাউন্ডেড শিট */
        .nb-sheet {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            background: var(--bg-color, #f8fafc);
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
            margin-top: -16px;
            padding: 16px 14px 28px;
            position: relative;
            z-index: 20;
            box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.12);
        }

        .nb-strip {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 14px;
            padding: 6px 12px 6px 6px;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
        }

        .nb-strip-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }

        .nb-badge {
            background: #dc2626;
            color: #ffffff;
            font-size: 12.5px;
            font-weight: 700;
            padding: 6px 11px;
            border-radius: 10px;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .nb-count-text {
            font-size: 12.5px;
            color: var(--text-muted, #64748b);
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .nb-clear-btn {
            border: none;
            background: #ef4444;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 11px;
            border-radius: 9px;
            cursor: pointer;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .nb-card {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 18px;
            padding: 14px;
            margin-bottom: 12px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
            display: flex;
            align-items: flex-start;
            gap: 12px;
            cursor: pointer;
        }

        .nb-card.unread {
            border-left: 4px solid var(--app-main-color, #020624);
        }

        .nb-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #e2e8f0;
            color: var(--app-main-color, #020624);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
            margin-top: 2px;
        }

        body.dark-mode .nb-avatar {
            background: rgba(255, 255, 255, 0.14);
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
            font-size: 16px;
            font-weight: 700;
            color: var(--text-main, #0f172a);
            line-height: 1.3;
        }

        .nb-new-tag {
            background: #dc2626;
            color: #ffffff;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 7px;
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

        .nb-card-foot {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: 11.5px;
            color: var(--text-muted, #64748b);
        }

        .nb-del-btn {
            border: none;
            background: rgba(239, 68, 68, 0.12);
            color: #dc2626;
            font-size: 11.5px;
            font-weight: 700;
            padding: 3px 9px;
            border-radius: 8px;
            cursor: pointer;
        }

        .nb-empty {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 18px;
            padding: 34px 18px;
            text-align: center;
            color: var(--text-muted, #64748b);
        }
    `;
    document.head.appendChild(style);
}

export function openNoticeInbox() {
    injectStyles();
    noticeQuery = "";

    let panel = document.getElementById("noticeInboxPanel");
    if (panel) panel.remove();

    panel = document.createElement("div");
    panel.id = "noticeInboxPanel";

    let closedByButton = false;

    panel.innerHTML = `
        <div class="nb-top-wrap">
            <header class="nb-header">
                <div class="nb-header-left">
                    <button type="button" id="noticeCloseBtn" class="nb-back-btn" aria-label="Back">←</button>
                    <div class="nb-title-area">
                        <h2 class="nb-title">Notice Box</h2>
                        <div class="nb-clock">${formatNow(new Date())}</div>
                    </div>
                </div>
                <img class="nb-logo" src="${escapeHTML(LOGO_SRC)}" alt="Logo" onerror="this.style.display='none'">
            </header>

            <div class="nb-search-inline">
                <div id="nbSearchField" class="nb-search-field">
                    <span class="nb-search-icon" aria-hidden="true">⌕</span>
                    <input id="nbSearchInput" type="search" class="nb-search-input" placeholder="Search notices..." autocomplete="off">
                    <button id="nbSearchClear" type="button" class="nb-search-clear" aria-label="Clear search" title="Clear search">×</button>
                </div>
            </div>
        </div>

        <div class="nb-sheet">
            <div class="nb-strip">
                <div class="nb-strip-left">
                    <span class="nb-badge">📢 বিজ্ঞপ্তি</span>
                    <span id="nbCountLabel" class="nb-count-text">লোড হচ্ছে...</span>
                </div>
                <button type="button" id="noticeClearBtn" class="nb-clear-btn">সব মুছুন</button>
            </div>
            <div id="nbCardsList"></div>
        </div>
    `;

    const cardsListEl = panel.querySelector("#nbCardsList");
    const countLabelEl = panel.querySelector("#nbCountLabel");
    const searchInput = panel.querySelector("#nbSearchInput");
    const searchField = panel.querySelector("#nbSearchField");
    const searchClear = panel.querySelector("#nbSearchClear");

    function renderList() {
        const all = loadNotices();
        const q = noticeQuery.trim().toLowerCase();
        const filtered = q
            ? all.filter(n =>
                (n.title || "").toLowerCase().includes(q) ||
                (n.body || "").toLowerCase().includes(q) ||
                (n.time || "").toLowerCase().includes(q)
            )
            : all;

        const unreadCount = all.filter(n => !n.read).length;
        countLabelEl.textContent = q
            ? `${filtered.length}টি মিলেছে (মোট ${all.length}টি)`
            : `মোট ${all.length}টি${unreadCount ? ` • ${unreadCount}টি নতুন` : ""}`;

        if (!filtered.length) {
            cardsListEl.innerHTML = `
                <div class="nb-empty">
                    <div style="font-size:28px;margin-bottom:6px;">📢</div>
                    <div style="font-size:15px;font-weight:700;color:var(--text-main,#0f172a);">
                        ${q ? "কোনো নোটিশ খুঁজে পাওয়া যায়নি" : "কোনো নোটিশ সংরক্ষিত নেই"}
                    </div>
                    <div style="font-size:12.5px;margin-top:4px;">
                        ${q ? "অন্য শব্দ দিয়ে সার্চ করে দেখুন।" : "নতুন নোটিশ যুক্ত হলে এখানে দেখা যাবে।"}
                    </div>
                </div>`;
            return;
        }

        cardsListEl.innerHTML = filtered.map(n => `
            <article class="nb-card ${n.read ? "" : "unread"}" data-id="${escapeHTML(n.id)}">
                <div class="nb-avatar">📢</div>
                <div class="nb-content">
                    <div class="nb-card-top">
                        <h3 class="nb-card-title">${escapeHTML(n.title)}</h3>
                        ${n.read ? "" : `<span class="nb-new-tag">নতুন</span>`}
                    </div>
                    <p class="nb-card-body">${escapeHTML(n.body)}</p>
                    <div class="nb-card-foot">
                        <span>🕒 ${escapeHTML(n.time || "")}</span>
                        <button type="button" class="nb-del-btn" data-del="${escapeHTML(n.id)}">মুছুন</button>
                    </div>
                </div>
            </article>
        `).join("");

        cardsListEl.querySelectorAll(".nb-card").forEach(card => {
            card.addEventListener("click", () => {
                const id = card.getAttribute("data-id");
                const next = loadNotices().map(item =>
                    item.id === id ? { ...item, read: true } : item
                );
                saveNotices(next);
                renderList();
            });
        });

        cardsListEl.querySelectorAll(".nb-del-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const delId = btn.getAttribute("data-del");
                const next = loadNotices().filter(item => item.id !== delId);
                saveNotices(next);
                renderList();
            });
        });
    }

    panel._rerenderList = renderList;

    searchInput.addEventListener("input", () => {
        noticeQuery = searchInput.value;
        searchField.classList.toggle("has-value", searchInput.value.length > 0);
        revealAdminLoginIfMatched(searchInput.value);
        renderList();
    });

    searchClear.addEventListener("click", () => {
        noticeQuery = "";
        searchInput.value = "";
        searchField.classList.remove("has-value");
        searchInput.focus();
        renderList();
    });

    panel.querySelector("#noticeCloseBtn").onclick = () => closePanel(true);

    panel.querySelector("#noticeClearBtn").onclick = () => {
        if (!loadNotices().length) return;
        saveNotices([]);
        renderList();
    };

    const navLogo = document.querySelector(".bottom-nav-logo-circle");
    const onNavLogoClick = () => {
        if (document.getElementById("noticeInboxPanel")) {
            closePanel(true);
        }
    };
    navLogo?.addEventListener("click", onNavLogoClick);

    function closePanel(fromButton = false) {
        if (!document.getElementById("noticeInboxPanel")) return;
        window.removeEventListener("popstate", onPop);
        navLogo?.removeEventListener("click", onNavLogoClick);
        restoreAdminLoginButton();
        panel.remove();

        if (fromButton && window.history.state && window.history.state.page === "notice-box") {
            closedByButton = true;
            window.history.back();
        }
    }

    const onPop = () => {
        if (closedByButton) {
            closedByButton = false;
            return;
        }
        closePanel(false);
    };

    document.body.appendChild(panel);
    renderList();

    try {
        window.history.pushState({ page: "notice-box" }, "");
        window.addEventListener("popstate", onPop);
    } catch (e) {}
}

window.openNoticeInbox = openNoticeInbox;
window.addNotice = addNotice;
