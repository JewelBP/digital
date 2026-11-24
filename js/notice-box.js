// js/notice-box.js
// ড্রয়ারের "Notice Box" ক্লিক করলে drawer.js এই ফাইলটি লোড করে openNoticeInbox() চালায়।

const STORAGE_KEY = "rmp_app_notices_v1";
const EMBLEM_URL = "https://rmpmt.github.io/digital/emblem.png"; // প্রয়োজনে আপনার লোগোর পাথ দিন

let memoryNotices = [];

function canUseStorage() {
    try {
        const testKey = "__rmp_notice_test__";
        window.localStorage.setItem(testKey, "1");
        window.localStorage.removeItem(testKey);
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

function formatBanglaDateTime(date = new Date()) {
    try {
        return date.toLocaleString("bn-BD", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    } catch (e) {
        return date.toLocaleString();
    }
}

// অন্য কোড থেকে নোটিশ যোগ করার জন্য: addNotice("শিরোনাম", "বার্তা")
export function addNotice(title, body) {
    const cleanTitle = String(title ?? "").trim();
    const cleanBody = String(body ?? "").trim();
    if (!cleanTitle && !cleanBody) return null;

    const list = loadNotices();
    const newNotice = {
        id: `notice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: cleanTitle || "জরুরি বিজ্ঞপ্তি",
        body: cleanBody,
        time: formatBanglaDateTime(new Date()),
        read: false
    };

    list.unshift(newNotice);
    saveNotices(list);

    const panel = document.getElementById("noticeInboxPanel");
    if (panel && typeof panel._rerender === "function") {
        panel._rerender();
    }

    return newNotice;
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
    if (document.getElementById("rmpNoticeBoxStyles")) return;

    const style = document.createElement("style");
    style.id = "rmpNoticeBoxStyles";
    style.textContent = `
        #noticeInboxPanel {
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: #f1f4f8;
            color: #0f172a;
            display: flex;
            flex-direction: column;
            font-family: inherit;
        }

        .nb-header {
            background: var(--app-main-color, #020624);
            color: #ffffff;
            padding: 14px 16px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 4px 14px rgba(2, 6, 36, 0.22);
        }

        .nb-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
        }

        .nb-back-btn {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            font-size: 18px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            flex-shrink: 0;
        }

        .nb-title-wrap {
            min-width: 0;
        }

        .nb-title {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            line-height: 1.25;
            color: #ffffff;
        }

        .nb-subtitle {
            margin: 3px 0 0;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.72);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .nb-emblem {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            object-fit: cover;
            background: #ffffff;
            border: 2px solid #eab308;
            flex-shrink: 0;
        }

        .nb-body-sheet {
            flex: 1;
            overflow-y: auto;
            background: #f3f5f8;
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
            margin-top: -8px;
            padding: 18px 14px 24px;
        }

        .nb-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            background: #ffffff;
            border-radius: 14px;
            padding: 10px 12px;
            margin-bottom: 14px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
        }

        .nb-banner-tag {
            background: #dc2626;
            color: #ffffff;
            font-size: 12.5px;
            font-weight: 700;
            padding: 5px 10px;
            border-radius: 9px;
            white-space: nowrap;
        }

        .nb-banner-text {
            font-size: 13px;
            color: #475569;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .nb-card {
            background: #ffffff;
            border-radius: 18px;
            padding: 15px 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
            border: 1px solid rgba(226, 232, 240, 0.9);
            display: flex;
            gap: 12px;
            align-items: flex-start;
            transition: transform 0.14s ease, box-shadow 0.14s ease;
        }

        .nb-card:active {
            transform: scale(0.99);
        }

        .nb-card.unread {
            border-left: 4px solid var(--app-main-color, #020624);
        }

        .nb-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #e2e8f0;
            color: var(--app-main-color, #020624);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 19px;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .nb-card-content {
            flex: 1;
            min-width: 0;
        }

        .nb-card-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
        }

        .nb-card-title {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.35;
        }

        .nb-badge-new {
            background: #dbeafe;
            color: #1d4ed8;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 999px;
            flex-shrink: 0;
        }

        .nb-card-body {
            margin: 6px 0 8px;
            font-size: 14px;
            line-height: 1.55;
            color: #334155;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .nb-card-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: 12px;
            color: #64748b;
        }

        .nb-del-single {
            border: none;
            background: transparent;
            color: #94a3b8;
            font-size: 14px;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 8px;
        }

        .nb-del-single:hover {
            background: #fee2e2;
            color: #dc2626;
        }

        .nb-empty {
            background: #ffffff;
            border-radius: 18px;
            padding: 42px 20px;
            text-align: center;
            color: #64748b;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
        }

        .nb-footer {
            padding: 12px 16px;
            background: var(--app-main-color, #020624);
            display: flex;
            gap: 10px;
        }

        .nb-clear-btn {
            width: 100%;
            padding: 11px 14px;
            border: none;
            border-radius: 12px;
            background: #dc2626;
            color: #ffffff;
            font-size: 14.5px;
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

        const itemsHTML = list.length
            ? list.map(n => `
                <article class="nb-card ${n.read ? "" : "unread"}" data-id="${escapeHTML(n.id)}">
                    <div class="nb-avatar">📢</div>
                    <div class="nb-card-content">
                        <div class="nb-card-top">
                            <h3 class="nb-card-title">${escapeHTML(n.title)}</h3>
                            ${n.read ? "" : `<span class="nb-badge-new">নতুন</span>`}
                        </div>
                        <p class="nb-card-body">${escapeHTML(n.body)}</p>
                        <div class="nb-card-meta">
                            <span>🕒 ${escapeHTML(n.time || "")}</span>
                            <button type="button" class="nb-del-single" data-del-id="${escapeHTML(n.id)}" title="মুছুন">✕</button>
                        </div>
                    </div>
                </article>`).join("")
            : `<div class="nb-empty">
                <div style="font-size:32px;margin-bottom:8px;">📭</div>
                <div style="font-size:15.5px;font-weight:700;color:#1e293b;">কোনো নোটিশ সংরক্ষিত নেই</div>
                <div style="font-size:13px;margin-top:4px;">নতুন কোনো নোটিশ আসলে এখানে দেখা যাবে।</div>
            </div>`;

        panel.innerHTML = `
            <header class="nb-header">
                <div class="nb-header-left">
                    <button type="button" id="noticeCloseBtn" class="nb-back-btn" aria-label="Back">←</button>
                    <div class="nb-title-wrap">
                        <h2 class="nb-title">নোটিশ বক্স</h2>
                        <div class="nb-subtitle">${formatBanglaDateTime(new Date())}</div>
                    </div>
                </div>
                <img class="nb-emblem" src="${escapeHTML(EMBLEM_URL)}" alt="Emblem" onerror="this.style.display='none'">
            </header>

            <div class="nb-body-sheet">
                <div class="nb-banner">
                    <span class="nb-banner-tag">📢 বিজ্ঞপ্তি</span>
                    <span class="nb-banner-text">মোট নোটিশ: ${list.length}টি${unreadCount ? ` • অপঠিত: ${unreadCount}টি` : ""}</span>
                </div>
                <div id="nbListContainer">${itemsHTML}</div>
            </div>

            <footer class="nb-footer">
                <button type="button" id="noticeClearBtn" class="nb-clear-btn">সব নোটিশ মুছুন</button>
            </footer>
        `;

        panel.querySelector("#noticeCloseBtn").onclick = () => closePanel(true);

        panel.querySelector("#noticeClearBtn").onclick = () => {
            if (!loadNotices().length) return;
            saveNotices([]);
            render();
        };

        panel.querySelectorAll(".nb-card").forEach(card => {
            card.addEventListener("click", () => {
                const id = card.getAttribute("data-id");
                const updated = loadNotices().map(item =>
                    item.id === id ? { ...item, read: true } : item
                );
                saveNotices(updated);
                render();
            });
        });

        panel.querySelectorAll(".nb-del-single").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const delId = btn.getAttribute("data-del-id");
                const updated = loadNotices().filter(item => item.id !== delId);
                saveNotices(updated);
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
    } catch (e) {
        // history সীমাবদ্ধ থাকলে উপেক্ষা করা হবে
    }
}

window.openNoticeInbox = openNoticeInbox;
window.addNotice = addNotice;
