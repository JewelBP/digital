// js/notice-box.js
// ড্রয়ারের "Notice Box" ক্লিক করলে drawer.js এই ফাইলটি লোড করে openNoticeInbox() চালায়।

const STORAGE_KEY = "rmp_app_notices_v1";
const EMBLEM_URL = "https://rmpmt.github.io/digital/emblem.png";

let memoryNotices = [];

function canUseStorage() {
    try {
        const k = "__rmp_notice_test__";
        window.localStorage.setItem(k, "1");
        window.localStorage.removeItem(k);
        return true;
    } catch (e) {
        return false;
    }
}

const HAS_LOCAL_STORAGE = canUseStorage();

function loadNotices() {
    if (HAS_LOCAL_STORAGE) {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    memoryNotices = parsed;
                    return parsed;
                }
            }
        } catch (e) {
            console.warn("Notice load error:", e);
        }
    }
    return Array.isArray(memoryNotices) ? memoryNotices : [];
}

function saveNotices(list) {
    const safeList = Array.isArray(list) ? list : [];
    memoryNotices = safeList;

    if (HAS_LOCAL_STORAGE) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeList));
        } catch (e) {
            console.warn("Notice save error:", e);
        }
    }
}

function formatDateTime(date = new Date()) {
    const pad = n => String(n).padStart(2, "0");
    const dd = pad(date.getDate());
    const mm = pad(date.getMonth() + 1);
    const yyyy = date.getFullYear();

    let hours = date.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    const min = pad(date.getMinutes());
    const sec = pad(date.getSeconds());
    return `${dd}/${mm}/${yyyy} ${pad(hours)}:${min}:${sec} ${ampm}`;
}

// অন্য কোড থেকে নোটিশ যোগ করার জন্য: addNotice("শিরোনাম", "বার্তা")
export function addNotice(title, body) {
    const cleanTitle = String(title ?? "").trim();
    const cleanBody = String(body ?? "").trim();
    if (!cleanTitle && !cleanBody) return null;

    const list = loadNotices();
    const item = {
        id: `notice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: cleanTitle || "জরুরি বিজ্ঞপ্তি",
        body: cleanBody,
        time: formatDateTime(new Date()),
        read: false
    };

    list.unshift(item);
    saveNotices(list);

    const panel = document.getElementById("noticeInboxPanel");
    if (panel && typeof panel._rerender === "function") {
        panel._rerender();
    }
    return item;
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

function injectNoticeStyles() {
    if (document.getElementById("rmpNoticeBoxMatchedStyles")) return;

    const style = document.createElement("style");
    style.id = "rmpNoticeBoxMatchedStyles";
    style.textContent = `
        #noticeInboxPanel {
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: #e9edf2;
            color: #0f172a;
            display: flex;
            flex-direction: column;
            font-family: inherit;
        }

        /* ডার্ক নেভি হেডার (ছবির মতো) */
        .nb-top-header {
            background: var(--app-main-color, #020624);
            color: #ffffff;
            padding: 14px 16px 26px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .nb-header-main {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
        }

        .nb-back-circle {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            background: rgba(255, 255, 255, 0.06);
            color: #ffffff;
            font-size: 17px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            flex-shrink: 0;
        }

        .nb-header-titles {
            min-width: 0;
        }

        .nb-header-title {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            line-height: 1.2;
            color: #ffffff;
        }

        .nb-header-clock {
            margin-top: 4px;
            font-size: 12px;
            letter-spacing: 0.4px;
            color: rgba(255, 255, 255, 0.72);
        }

        .nb-header-emblem {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
            background: #ffffff;
            border: 2px solid #eab308;
            flex-shrink: 0;
        }

        /* সাদা রাউন্ডেড কনটেন্ট শিট */
        .nb-sheet {
            flex: 1;
            overflow-y: auto;
            background: #f1f3f6;
            border-top-left-radius: 26px;
            border-top-right-radius: 26px;
            margin-top: -14px;
            padding: 16px 14px 24px;
        }

        /* "জরুরি বিজ্ঞপ্তি:" স্ট্রিপ */
        .nb-notice-strip {
            background: #ffffff;
            border-radius: 14px;
            padding: 6px 12px 6px 6px;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 3px 10px rgba(15, 23, 42, 0.06);
        }

        .nb-strip-badge {
            background: #dc2626;
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            padding: 7px 12px;
            border-radius: 10px;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .nb-strip-sub {
            font-size: 13px;
            color: #475569;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* ছবির ডেপুটি কমান্ড্যান্ট কার্ডের মতো নোটিশ কার্ড */
        .nb-item-card {
            background: #ffffff;
            border-radius: 20px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
            display: flex;
            align-items: flex-start;
            gap: 14px;
            position: relative;
        }

        .nb-item-card.unread {
            outline: 1.5px solid rgba(2, 6, 36, 0.16);
        }

        .nb-item-avatar {
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

        .nb-item-body-wrap {
            flex: 1;
            min-width: 0;
        }

        .nb-item-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .nb-item-title {
            margin: 0;
            font-size: 17px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.3;
        }

        .nb-unread-dot {
            background: #dc2626;
            color: #ffffff;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 999px;
            flex-shrink: 0;
        }

        .nb-item-text {
            margin: 7px 0 8px;
            font-size: 13.5px;
            line-height: 1.55;
            color: #334155;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .nb-item-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: 12px;
            color: #64748b;
        }

        .nb-item-del {
            border: none;
            background: #f1f5f9;
            color: #64748b;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 9px;
            border-radius: 8px;
            cursor: pointer;
        }

        .nb-empty-card {
            background: #ffffff;
            border-radius: 20px;
            padding: 36px 18px;
            text-align: center;
            color: #64748b;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
        }

        .nb-bottom-bar {
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            padding: 10px 16px;
        }

        .nb-clear-all {
            width: 100%;
            padding: 10px 14px;
            border: none;
            border-radius: 12px;
            background: #dc2626;
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
}

export function openNoticeInbox() {
    injectNoticeStyles();

    let panel = document.getElementById("noticeInboxPanel");
    if (panel) panel.remove();

    panel = document.createElement("div");
    panel.id = "noticeInboxPanel";

    let closedByButton = false;

    function render() {
        const list = loadNotices();
        const unreadCount = list.filter(n => !n.read).length;

        const cardsHTML = list.length
            ? list.map(n => `
                <article class="nb-item-card ${n.read ? "" : "unread"}" data-id="${escapeHTML(n.id)}">
                    <div class="nb-item-avatar">📢</div>
                    <div class="nb-item-body-wrap">
                        <div class="nb-item-head">
                            <h3 class="nb-item-title">${escapeHTML(n.title)}</h3>
                            ${n.read ? "" : `<span class="nb-unread-dot">নতুন</span>`}
                        </div>
                        <p class="nb-item-text">${escapeHTML(n.body)}</p>
                        <div class="nb-item-footer">
                            <span>🕒 ${escapeHTML(n.time || "")}</span>
                            <button type="button" class="nb-item-del" data-del="${escapeHTML(n.id)}">মুছুন</button>
                        </div>
                    </div>
                </article>`).join("")
            : `<div class="nb-empty-card">
                <div style="font-size:28px;margin-bottom:6px;">📢</div>
                <div style="font-size:15px;font-weight:700;color:#1e293b;">কোনো নোটিশ নেই</div>
                <div style="font-size:12.5px;margin-top:4px;">নতুন নোটিশ যুক্ত হলে এখানে কার্ড আকারে দেখাবে।</div>
            </div>`;

        panel.innerHTML = `
            <header class="nb-top-header">
                <div class="nb-header-main">
                    <button type="button" id="noticeCloseBtn" class="nb-back-circle" aria-label="Back">←</button>
                    <div class="nb-header-titles">
                        <h2 class="nb-header-title">নোটিশ বক্স</h2>
                        <div class="nb-header-clock">${formatDateTime(new Date())}</div>
                    </div>
                </div>
                <img class="nb-header-emblem" src="${escapeHTML(EMBLEM_URL)}" alt="Emblem" onerror="this.style.display='none'">
            </header>

            <div class="nb-sheet">
                <div class="nb-notice-strip">
                    <span class="nb-strip-badge">📢 জরুরি বিজ্ঞপ্তি:</span>
                    <span class="nb-strip-sub">মোট ${list.length}টি নোটিশ${unreadCount ? ` • ${unreadCount}টি নতুন` : ""}</span>
                </div>
                <div>${cardsHTML}</div>
            </div>

            <div class="nb-bottom-bar">
                <button type="button" id="noticeClearBtn" class="nb-clear-all">সব নোটিশ মুছুন</button>
            </div>
        `;

        panel.querySelector("#noticeCloseBtn").onclick = () => closePanel(true);

        panel.querySelector("#noticeClearBtn").onclick = () => {
            if (!loadNotices().length) return;
            saveNotices([]);
            render();
        };

        panel.querySelectorAll(".nb-item-card").forEach(card => {
            card.addEventListener("click", () => {
                const id = card.getAttribute("data-id");
                saveNotices(loadNotices().map(n => (n.id === id ? { ...n, read: true } : n)));
                render();
            });
        });

        panel.querySelectorAll(".nb-item-del").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const delId = btn.getAttribute("data-del");
                saveNotices(loadNotices().filter(n => n.id !== delId));
                render();
            });
        });
    }

    panel._rerender = render;

    function closePanel(fromButton = false) {
        if (!document.getElementById("noticeInboxPanel")) return;
        window.removeEventListener("popstate", onPop);
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
    render();

    try {
        window.history.pushState({ page: "notice-box" }, "");
        window.addEventListener("popstate", onPop);
    } catch (e) {}
}

window.openNoticeInbox = openNoticeInbox;
window.addNotice = addNotice;
