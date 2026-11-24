// js/notice-box.js
// ড্রয়ারের "Notice Box" ক্লিক করলে drawer.js এই ফাইলটি লোড করে openNoticeInbox() চালায়।

const STORAGE_KEY = "app_notices";

function loadNotices() {
    try {
        const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

function saveNotices(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// অন্য কোড থেকে নোটিশ যোগ করার জন্য: addNotice("শিরোনাম", "বার্তা")
export function addNotice(title, body) {
    const list = loadNotices();
    list.unshift({
        id: Date.now(),
        title: String(title || ""),
        body: String(body || ""),
        time: new Date().toLocaleString("bn-BD"),
        read: false
    });
    saveNotices(list);
}

function escapeHTML(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
}

export function openNoticeInbox() {
    let panel = document.getElementById("noticeInboxPanel");
    if (panel) panel.remove();

    panel = document.createElement("div");
    panel.id = "noticeInboxPanel";
    panel.style.cssText = `
        position: fixed; inset: 0; z-index: 999999;
        background: #f8fafc; color: #1e293b;
        display: flex; flex-direction: column; font-family: inherit;
    `;

    function render() {
        const list = loadNotices();
        const items = list.length
            ? list.map(n => `
                <div data-id="${n.id}" class="notice-item" style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);border-left:4px solid ${n.read ? "#cbd5e1" : "#0d6efd"};">
                    <div style="font-weight:700;font-size:16px;margin-bottom:4px;">${escapeHTML(n.title)}</div>
                    <div style="font-size:15px;line-height:1.5;color:#334155;">${escapeHTML(n.body)}</div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:8px;">${escapeHTML(n.time || "")}</div>
                </div>`).join("")
            : `<div style="text-align:center;color:#94a3b8;margin-top:80px;font-size:16px;">কোনো নোটিশ নেই</div>`;

        panel.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#0d6efd;color:#fff;">
                <div style="font-size:18px;font-weight:700;">📢 Notice Box</div>
                <button type="button" id="noticeCloseBtn" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;">✕</button>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;">${items}</div>
            <div style="padding:12px 16px;border-top:1px solid #e2e8f0;background:#fff;">
                <button type="button" id="noticeClearBtn" style="width:100%;padding:10px;border:none;border-radius:10px;background:#ef4444;color:#fff;font-size:15px;font-weight:600;cursor:pointer;">সব নোটিশ মুছুন</button>
            </div>
        `;

        panel.querySelector("#noticeCloseBtn").onclick = closePanel;
        panel.querySelector("#noticeClearBtn").onclick = () => {
            saveNotices([]);
            render();
        };
    }

    function closePanel() {
        // খোলার সময় সব নোটিশ পড়া হয়েছে বলে চিহ্নিত
        saveNotices(loadNotices().map(n => ({ ...n, read: true })));
        panel.remove();
        window.removeEventListener("popstate", onPop);
    }

    const onPop = () => closePanel();

    document.body.appendChild(panel);
    render();

    // ব্যাক বাটনে প্যানেল বন্ধ হবে
    history.pushState({ page: "notice-box" }, "");
    window.addEventListener("popstate", onPop);
}

window.openNoticeInbox = openNoticeInbox;
window.addNotice = addNotice;
