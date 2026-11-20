// js/driving-guide.js  (Advanced Notebook Edition)

import {
    ref,
    set,
    get,
    onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { db } from "./firebase.js";

const STORAGE_KEY = "rmp_driving_guide_v5";
const DB_PATH = "webapp/driving_guide";
const DEFAULT_GUIDE_IMG = "https://cdn-icons-png.flaticon.com/512/3097/3097144.png";

let guideState = { chapters: [] };

let activeChapterId = null;
let editingChapterId = null;
let editingDocId = null;
let guideSearchQuery = "";
let isGuideActive = false;
let isListening = false;
let prevTitleText = "";
let prevBackHidden = true;
let prevMenuHidden = false;

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

function showGuideToast(msg) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2400);
    }
}

function generateGuideId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function safeUrl(raw) {
    let u = String(raw || "").trim();
    if (!u) return "";
    if (/^(javascript|data|vbscript):/i.test(u)) return "";
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    return u;
}

/* ============================== Storage / Sync ============================== */

function saveLocalGuide() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(guideState));
    } catch (e) {
        console.error("Driving guide local save error:", e);
    }
}

function loadLocalGuide() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.chapters)) guideState = parsed;
        }
    } catch (e) {
        console.error("Driving guide local load error:", e);
    }
}

async function persistGuide() {
    saveLocalGuide();
    renderDrivingGuideInSheet();

    if (!navigator.onLine) {
        showGuideToast("অফলাইনে সেভ হয়েছে! অনলাইন হলে সিঙ্ক হবে।");
        return;
    }

    try {
        await set(ref(db, DB_PATH), guideState);
        showGuideToast("ড্রাইভিং গাইড সেভ হয়েছে");
    } catch (err) {
        console.error("Firebase driving guide save error:", err);
        showGuideToast("ক্লাউডে সিঙ্ক করতে সমস্যা হয়েছে");
    }
}

function startRealtimeSync() {
    if (isListening) return;
    isListening = true;

    loadLocalGuide();

    onValue(ref(db, DB_PATH), (snapshot) => {
        if (snapshot.exists()) {
            const val = snapshot.val();
            if (val && Array.isArray(val.chapters)) {
                guideState = val;
                saveLocalGuide();
                // এডিটর খোলা থাকলে লেখা নষ্ট না করার জন্য রি-রেন্ডার করা হয় না
                if (isGuideActive && !editingDocId && !editingChapterId && !isEditorOpen()) {
                    renderDrivingGuideInSheet();
                }
            }
        }
    }, (err) => {
        console.warn("Driving guide realtime error:", err);
    });
}

function isEditorOpen() {
    const d = document.getElementById("dgDocEditor");
    const c = document.getElementById("dgChapterEditor");
    return (d && !d.classList.contains("hidden")) || (c && !c.classList.contains("hidden"));
}

/* ============================== Styles ============================== */

function injectModernNotebookStyles() {
    if (document.getElementById("drivingGuideModernStyles")) return;

    const style = document.createElement("style");
    style.id = "drivingGuideModernStyles";
    style.textContent = `
        #drivingGuideSheetView { display:flex; flex-direction:column; gap:14px; padding-bottom:28px; }
        #drivingGuideSheetView.hidden { display:none !important; }
        #drivingGuideSheetView .hidden { display:none !important; }

        /* ===== স্টিকি সার্চ বার (টুলবারের নিচে) ===== */
        .dg-search-sticky {
            position: sticky; top: 0; z-index: 30;
            padding: 8px 0 6px;
            background: linear-gradient(to bottom, var(--bg-color, #f1f5f9) 78%, transparent);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
        }
        body.dark-mode .dg-search-sticky {
            background: linear-gradient(to bottom, var(--bg-color, #020617) 78%, transparent);
        }
        .dg-search-row { display:flex; align-items:center; gap:8px; }
        .dg-search-box {
            flex:1; min-width:0; display:flex; align-items:center; gap:9px;
            background:#ffffff; border:1.5px solid #e2e8f0; border-radius:16px;
            padding:10px 14px; box-shadow:0 6px 18px rgba(2,6,36,0.07);
            transition:border-color .2s, box-shadow .2s;
        }
        .dg-search-box:focus-within {
            border-color:#0ea5e9; box-shadow:0 6px 22px rgba(14,165,233,0.25);
        }
        body.dark-mode .dg-search-box { background:#0f172a; border-color:#1e293b; }
        .dg-search-box .dg-s-icon { font-size:15px; opacity:.75; }
        .dg-search-box input {
            flex:1; min-width:0; border:none; outline:none; background:transparent;
            font-size:15px; font-family:inherit; color:#0f172a;
        }
        body.dark-mode .dg-search-box input { color:#f8fafc; }
        .dg-search-box input::placeholder { color:#94a3b8; }
        .dg-clear-btn {
            border:none; background:#e2e8f0; color:#334155; width:24px; height:24px;
            border-radius:50%; font-size:12px; cursor:pointer; flex-shrink:0;
        }
        body.dark-mode .dg-clear-btn { background:#334155; color:#e2e8f0; }
        .dg-add-btn {
            background:linear-gradient(135deg,#0ea5e9,#2563eb); color:#fff; border:none;
            border-radius:14px; padding:11px 15px; font-size:13.5px; font-weight:700;
            cursor:pointer; white-space:nowrap; flex-shrink:0;
            box-shadow:0 6px 16px rgba(14,165,233,.38);
        }
        .dg-result-count { font-size:12px; color:#64748b; margin:6px 4px 0; }
        body.dark-mode .dg-result-count { color:#94a3b8; }

        /* ===== অধ্যায় কার্ড ===== */
        .dg-chapter-stack { display:flex; flex-direction:column; gap:12px; }
        .dg-notebook-chapter {
            position:relative; display:flex; align-items:center; gap:13px;
            background:#ffffff; border:1px solid #e2e8f0; border-radius:18px;
            padding:14px 14px 14px 12px; cursor:pointer; overflow:hidden;
            box-shadow:0 6px 18px rgba(2,6,36,.06);
            transition:transform .15s ease, box-shadow .15s ease;
        }
        .dg-notebook-chapter::before {
            content:""; position:absolute; left:0; top:0; bottom:0; width:5px;
            background:linear-gradient(to bottom,#0ea5e9,#6366f1);
        }
        body.dark-mode .dg-notebook-chapter { background:#0f172a; border-color:#1e293b; }
        .dg-notebook-chapter:active { transform:scale(.985); }
        .dg-chap-num {
            width:44px; height:44px; flex-shrink:0; border-radius:14px; margin-left:6px;
            display:flex; align-items:center; justify-content:center;
            font-size:18px; font-weight:800; color:#fff;
            background:linear-gradient(135deg,#020624,#1e3a8a);
        }
        .dg-chapter-chip {
            display:inline-block; font-size:11px; font-weight:700; color:#0284c7;
            background:rgba(14,165,233,.12); padding:2px 9px; border-radius:999px; margin-bottom:5px;
        }
        body.dark-mode .dg-chapter-chip { color:#38bdf8; }
        .dg-chapter-heading { margin:0; font-size:16.5px; font-weight:700; color:#0f172a; line-height:1.35; }
        body.dark-mode .dg-chapter-heading { color:#f8fafc; }
        .dg-chapter-desc { margin:4px 0 0; font-size:13px; color:#64748b; line-height:1.45; }
        body.dark-mode .dg-chapter-desc { color:#94a3b8; }

        /* ===== নোটবুক পেজ ===== */
        .dg-notebook-page {
            position:relative; background:#fffefb; border:1px solid #e7e5e4;
            border-radius:20px; padding:20px 18px 18px 22px; overflow:hidden;
            box-shadow:0 10px 28px rgba(2,6,36,.07);
            display:flex; flex-direction:column; gap:12px;
        }
        .dg-notebook-page::before {
            content:""; position:absolute; left:11px; top:0; bottom:0; width:2px;
            background:rgba(239,68,68,.35);
        }
        body.dark-mode .dg-notebook-page { background:#0f172a; border-color:#1e293b; }
        body.dark-mode .dg-notebook-page::before { background:rgba(56,189,248,.35); }
        .dg-page-top {
            display:flex; align-items:center; justify-content:space-between; gap:8px;
            padding-bottom:10px; border-bottom:1px dashed #cbd5e1;
        }
        body.dark-mode .dg-page-top { border-bottom-color:#334155; }
        .dg-page-title { margin:0; font-size:17.5px; font-weight:800; color:#020624; }
        body.dark-mode .dg-page-title { color:#f8fafc; }

        .dg-rich p, .dg-rich li { font-size:15.5px; line-height:1.9; color:#1e293b; }
        body.dark-mode .dg-rich p, body.dark-mode .dg-rich li { color:#e2e8f0; }
        .dg-rich p { margin:0 0 8px; white-space:pre-wrap; word-break:break-word; }
        .dg-rich h3.dg-h1 { margin:14px 0 6px; font-size:19px; font-weight:800; color:#0f172a; }
        .dg-rich h4.dg-h2 { margin:12px 0 4px; font-size:16.5px; font-weight:800; color:#0369a1; }
        body.dark-mode .dg-rich h3.dg-h1 { color:#f8fafc; }
        body.dark-mode .dg-rich h4.dg-h2 { color:#38bdf8; }
        .dg-rich ul { margin:4px 0 10px; padding-left:22px; }
        .dg-rich hr { border:none; border-top:2px dashed #cbd5e1; margin:14px 0; }
        .dg-rich mark, .dg-rich .dg-hl {
            background:#fde68a; color:#111827; padding:0 3px; border-radius:4px;
        }
        .dg-rich a.dg-inline-link { color:#0284c7; font-weight:700; text-decoration:underline; }
        body.dark-mode .dg-rich a.dg-inline-link { color:#38bdf8; }

        .dg-callout {
            margin:10px 0; padding:11px 14px; border-radius:14px;
            font-size:14.5px; line-height:1.7; border-left:5px solid;
        }
        .dg-callout.tip { background:rgba(14,165,233,.1); border-color:#0ea5e9; color:#0c4a6e; }
        .dg-callout.warn { background:rgba(239,68,68,.1); border-color:#ef4444; color:#7f1d1d; }
        body.dark-mode .dg-callout.tip { color:#bae6fd; }
        body.dark-mode .dg-callout.warn { color:#fecaca; }

        /* ===== ছবি ও গ্যালারি ===== */
        .dg-media-figure {
            margin:12px 0; padding:10px; border-radius:16px; background:#f8fafc;
            border:1px solid #e2e8f0; box-shadow:0 3px 10px rgba(0,0,0,.04);
        }
        body.dark-mode .dg-media-figure { background:#1e293b; border-color:#334155; }
        .dg-media-figure img {
            width:100%; max-height:320px; object-fit:cover; border-radius:12px;
            display:block; cursor:zoom-in;
        }
        .dg-media-caption { margin:9px 3px 0; font-size:13.5px; line-height:1.65; color:#475569; font-weight:500; }
        body.dark-mode .dg-media-caption { color:#cbd5e1; }
        .dg-gallery {
            display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:8px;
            margin:12px 0;
        }
        .dg-gallery figure { margin:0; border-radius:14px; overflow:hidden; background:#f1f5f9; }
        body.dark-mode .dg-gallery figure { background:#1e293b; }
        .dg-gallery img { width:100%; height:130px; object-fit:cover; display:block; cursor:zoom-in; }
        .dg-gallery figcaption { font-size:12px; padding:6px 8px; color:#475569; }
        body.dark-mode .dg-gallery figcaption { color:#cbd5e1; }

        .dg-media-link {
            display:inline-flex; align-items:center; gap:6px; margin:6px 6px 6px 0;
            padding:9px 14px; border-radius:12px; background:rgba(2,6,36,.05);
            border:1px solid rgba(14,165,233,.45); color:#0284c7;
            font-size:13.5px; font-weight:700; text-decoration:none;
        }
        body.dark-mode .dg-media-link { background:rgba(56,189,248,.12); color:#38bdf8; }

        /* ===== বাটন ===== */
        .dg-mini-btn {
            border:none; border-radius:10px; padding:8px 12px; font-size:12.5px; font-weight:700;
            cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px;
        }
        .dg-mini-btn.edit { background:#f59e0b; color:#fff; }
        .dg-mini-btn.del { background:#ef4444; color:#fff; }
        .dg-mini-btn.tag { background:#0ea5e9; color:#fff; }
        .dg-mini-btn.ghost { background:#e2e8f0; color:#0f172a; }
        body.dark-mode .dg-mini-btn.ghost { background:#334155; color:#f8fafc; }

        /* ===== এডিটর ===== */
        .dg-editor-panel {
            background:#ffffff; border:1.5px solid #bae6fd; border-radius:20px; padding:16px;
            display:flex; flex-direction:column; gap:12px; box-shadow:0 10px 26px rgba(14,165,233,.12);
        }
        body.dark-mode .dg-editor-panel { background:#0f172a; border-color:#334155; }
        .dg-editor-panel input, .dg-editor-panel textarea {
            width:100%; box-sizing:border-box; padding:13px 14px; border-radius:12px;
            border:1px solid #cbd5e1; background:#f8fafc; color:#0f172a;
            font-size:15px; line-height:1.6; font-family:inherit;
        }
        .dg-editor-panel textarea { min-height:240px; resize:vertical; }
        body.dark-mode .dg-editor-panel input, body.dark-mode .dg-editor-panel textarea {
            background:#1e293b; color:#f8fafc; border-color:#334155;
        }
        .dg-fmt-bar { display:flex; flex-wrap:wrap; gap:6px; }
        .dg-fmt-bar .dg-mini-btn { padding:8px 10px; }
        .dg-editor-tip {
            font-size:12.5px; line-height:1.7; padding:10px 12px; border-radius:12px;
            background:rgba(14,165,233,.09); border-left:4px solid #0ea5e9; color:#334155;
        }
        body.dark-mode .dg-editor-tip { color:#cbd5e1; }
        .dg-editor-tip code {
            background:rgba(2,6,36,.08); padding:1px 5px; border-radius:5px; font-size:12px;
        }
        .dg-preview-box {
            border:1px dashed #94a3b8; border-radius:14px; padding:12px 14px;
        }

        /* ===== লাইটবক্স ===== */
        .dg-lightbox {
            position:fixed; inset:0; z-index:99999; background:rgba(2,6,23,.92);
            display:flex; align-items:center; justify-content:center; padding:16px; cursor:zoom-out;
        }
        .dg-lightbox img { max-width:100%; max-height:100%; border-radius:12px; }
    `;
    document.head.appendChild(style);
}

/* ============================== Rich Text Renderer ==============================
 * সাপোর্টেড সিনট্যাক্স:
 *  [img: লিংক | ক্যাপশন]               → একটি ছবি
 *  [gallery: লিংক1 | লিংক2 | লিংক3]    → পাশাপাশি একাধিক ছবি
 *  [link: নাম | https://...]            → লিংক বাটন (লেখার মাঝেও চলবে)
 *  # বড় শিরোনাম   ## মাঝারি শিরোনাম
 *  - তালিকা
 *  > টিপস বক্স     !! সতর্কতা বক্স
 *  ---  (লাইন ডিভাইডার)
 *  **বোল্ড**   ==হাইলাইট==
 * ================================================================================ */

function highlightHTML(html) {
    if (!guideSearchQuery) return html;
    const re = new RegExp(`(${escapeRegExp(escapeHTML(guideSearchQuery))})`, "gi");
    return html
        .split(/(<[^>]+>)/g)
        .map(seg => (seg.startsWith("<") ? seg : seg.replace(re, "<mark>$1</mark>")))
        .join("");
}

function inlineFormat(text) {
    let h = escapeHTML(text);

    // [link: নাম | url] — escape হওয়ার পরও কাজ করে কারণ [ ] | : escape হয় না
    h = h.replace(/\[link:\s*([^|\]]+?)\s*\|\s*([^\]]+?)\]/gi, (_, label, url) => {
        const href = safeUrl(url.replace(/&amp;/g, "&"));
        if (!href) return label;
        return `<a class="dg-media-link" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">🔗 ${label} ↗</a>`;
    });

    h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/==(.+?)==/g, '<span class="dg-hl">$1</span>');
    return highlightHTML(h);
}

function renderTextBlock(text) {
    const lines = text.split("\n");
    let out = "";
    let listOpen = false;
    const closeList = () => { if (listOpen) { out += "</ul>"; listOpen = false; } };

    lines.forEach(line => {
        const t = line.trim();
        if (!t) { closeList(); return; }

        if (/^---+$/.test(t)) { closeList(); out += "<hr>"; return; }
        if (t.startsWith("## ")) { closeList(); out += `<h4 class="dg-h2">${inlineFormat(t.slice(3))}</h4>`; return; }
        if (t.startsWith("# ")) { closeList(); out += `<h3 class="dg-h1">${inlineFormat(t.slice(2))}</h3>`; return; }
        if (t.startsWith("- ") || t.startsWith("• ")) {
            if (!listOpen) { out += "<ul>"; listOpen = true; }
            out += `<li>${inlineFormat(t.slice(2))}</li>`;
            return;
        }
        closeList();
        if (t.startsWith("!! ")) { out += `<div class="dg-callout warn">⚠️ ${inlineFormat(t.slice(3))}</div>`; return; }
        if (t.startsWith("> ")) { out += `<div class="dg-callout tip">💡 ${inlineFormat(t.slice(2))}</div>`; return; }

        out += `<p>${inlineFormat(line)}</p>`;
    });
    closeList();
    return out;
}

function renderRichTextWithMedia(rawText) {
    const normalized = String(rawText || "").replace(/\r\n/g, "\n");
    const tokenRegex = /(\[img:[^\]]+\]|\[gallery:[^\]]+\])/gi;
    const parts = normalized.split(tokenRegex);

    const html = parts.map(part => {
        if (!part || !part.trim()) return "";

        const imgMatch = part.match(/^\[img:\s*([^|\]]+?)(?:\s*\|\s*([^\]]*))?\]$/i);
        if (imgMatch) {
            const url = escapeHTML(safeUrl(imgMatch[1]));
            const caption = escapeHTML((imgMatch[2] || "").trim());
            return `
                <figure class="dg-media-figure">
                    <img class="dg-zoomable" src="${url}" alt="${caption || "Driving Guide Image"}" loading="lazy">
                    ${caption ? `<figcaption class="dg-media-caption">${highlightHTML(caption)}</figcaption>` : ""}
                </figure>`;
        }

        const galMatch = part.match(/^\[gallery:\s*([^\]]+)\]$/i);
        if (galMatch) {
            const items = galMatch[1].split("|").map(s => s.trim()).filter(Boolean);
            // "লিংক ~ ক্যাপশন" ফরম্যাটও চলবে
            return `<div class="dg-gallery">${items.map(item => {
                const [u, c] = item.split("~").map(s => s.trim());
                return `<figure>
                    <img class="dg-zoomable" src="${escapeHTML(safeUrl(u))}" alt="${escapeHTML(c || "ছবি")}" loading="lazy">
                    ${c ? `<figcaption>${escapeHTML(c)}</figcaption>` : ""}
                </figure>`;
            }).join("")}</div>`;
        }

        return renderTextBlock(part);
    }).join("");

    return `<div class="dg-rich">${html}</div>`;
}

/* ছবি এরর হলে ডিফল্ট ছবি + ক্লিক করলে বড় করে দেখা */
function wireMedia(container) {
    container.querySelectorAll("img.dg-zoomable").forEach(img => {
        img.addEventListener("error", () => {
            if (img.dataset.fallback) return;
            img.dataset.fallback = "1";
            img.src = DEFAULT_GUIDE_IMG;
        });
        img.addEventListener("click", () => {
            const box = document.createElement("div");
            box.className = "dg-lightbox";
            box.innerHTML = `<img src="${escapeHTML(img.src)}" alt="">`;
            box.addEventListener("click", () => box.remove());
            document.body.appendChild(box);
        });
    });
}

/* ============================== Layout / Header ============================== */

function ensureSheetContainer() {
    const sheet = document.getElementById("mainScrollSheet");
    if (!sheet) return null;

    let view = document.getElementById("drivingGuideSheetView");
    if (!view) {
        view = document.createElement("div");
        view.id = "drivingGuideSheetView";
        view.className = "hidden";
        const mainEl = sheet.querySelector("main.container") || sheet;
        mainEl.appendChild(view);
    }
    return view;
}

function setHeaderBackMode(titleText) {
    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");
    const navBtn = document.getElementById("navToggleBtn");

    if (appTitleText) {
        if (!isGuideActive) prevTitleText = appTitleText.textContent;
        appTitleText.textContent = titleText;
    }
    if (menuIcon && backIcon) {
        if (!isGuideActive) {
            prevMenuHidden = menuIcon.classList.contains("hidden");
            prevBackHidden = backIcon.classList.contains("hidden");
        }
        menuIcon.classList.add("hidden");
        backIcon.classList.remove("hidden");
    }

    if (navBtn && !navBtn.dataset.dgBound) {
        navBtn.dataset.dgBound = "1";
        navBtn.addEventListener("click", (e) => {
            if (!isGuideActive) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (activeChapterId) {
                activeChapterId = null;
                editingDocId = null;
                guideSearchQuery = "";
                renderDrivingGuideInSheet();
            } else {
                closeDrivingGuide();
            }
        }, true);
    }
}

function restoreHeaderMode() {
    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");

    if (appTitleText) appTitleText.textContent = prevTitleText || "RMP MT Contacts";
    if (menuIcon && backIcon) {
        menuIcon.classList.remove("hidden");
        backIcon.classList.add("hidden");
    }
}

function hideMainViewsForGuide(hide) {
    const ids = [
        "mainDashboardView", "categoryDetailsView", "dataDetailsView",
        "heroSlider", "searchBox", "subPageHeaderSearchWrapper", "slidingNoticeContainer"
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("hidden", hide);
    });
    const slider = document.getElementById("heroSlider");
    if (slider) slider.style.display = hide ? "none" : "";
}

/* ============================== Search Bar (sticky) ============================== */

function buildSearchBarHTML(placeholder, admin, addBtnId, addBtnLabel) {
    return `
        <div class="dg-search-sticky">
            <div class="dg-search-row">
                <div class="dg-search-box">
                    <span class="dg-s-icon">🔍</span>
                    <input id="dgToolbarSearchInput" type="search" value="${escapeHTML(guideSearchQuery)}"
                        placeholder="${escapeHTML(placeholder)}" autocomplete="off">
                    <button id="dgClearSearchBtn" type="button" class="dg-clear-btn ${guideSearchQuery ? "" : "hidden"}" title="মুছুন">✕</button>
                </div>
                ${admin ? `<button id="${escapeHTML(addBtnId)}" type="button" class="dg-add-btn">${escapeHTML(addBtnLabel)}</button>` : ""}
            </div>
            <div id="dgResultCount" class="dg-result-count"></div>
        </div>
    `;
}

// শুধু তালিকা অংশ রি-রেন্ডার হয়, ফলে টাইপ করার সময় ফোকাস/এডিটর নষ্ট হয় না
function bindSearch(onChange) {
    const input = document.getElementById("dgToolbarSearchInput");
    const clearBtn = document.getElementById("dgClearSearchBtn");

    input?.addEventListener("input", () => {
        guideSearchQuery = input.value.trim().toLowerCase();
        clearBtn?.classList.toggle("hidden", !guideSearchQuery);
        onChange();
    });

    clearBtn?.addEventListener("click", () => {
        guideSearchQuery = "";
        if (input) { input.value = ""; input.focus(); }
        clearBtn.classList.add("hidden");
        onChange();
    });
}

function setResultCount(n, label) {
    const el = document.getElementById("dgResultCount");
    if (!el) return;
    el.textContent = guideSearchQuery ? `${n}টি ${label} পাওয়া গেছে` : "";
}

/* ============================== Chapter List ============================== */

function renderChapterListView(container, admin) {
    setHeaderBackMode("ড্রাইভিং নোটবুক");

    const editingChap = editingChapterId
        ? guideState.chapters.find(c => c.id === editingChapterId)
        : null;

    let html = buildSearchBarHTML("অধ্যায় বা নোট খুঁজুন...", admin, "dgAddChapterBtn", "＋ অধ্যায়");

    if (admin) {
        html += `
            <div id="dgChapterEditor" class="dg-editor-panel ${editingChap ? "" : "hidden"}">
                <input id="dgChapTitleInput" type="text" value="${escapeHTML(editingChap?.title || "")}" placeholder="অধ্যায়ের শিরোনাম (যেমন: ট্রাফিক সিগন্যাল ও আইন)">
                <input id="dgChapDescInput" type="text" value="${escapeHTML(editingChap?.description || "")}" placeholder="সংক্ষিপ্ত পরিচিতি (ঐচ্ছিক)">
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button id="dgChapCancelBtn" type="button" class="dg-mini-btn del">বাতিল</button>
                    <button id="dgChapSaveBtn" type="button" class="dg-mini-btn tag">সেভ করুন</button>
                </div>
            </div>`;
    }

    html += `<div id="dgListArea"></div>`;
    container.innerHTML = html;

    bindSearch(() => fillChapterList(admin));
    fillChapterList(admin);

    document.getElementById("dgAddChapterBtn")?.addEventListener("click", () => {
        editingChapterId = null;
        const panel = document.getElementById("dgChapterEditor");
        if (panel) {
            panel.classList.remove("hidden");
            document.getElementById("dgChapTitleInput").value = "";
            document.getElementById("dgChapDescInput").value = "";
            document.getElementById("dgChapTitleInput").focus();
        }
    });

    document.getElementById("dgChapCancelBtn")?.addEventListener("click", () => {
        editingChapterId = null;
        document.getElementById("dgChapterEditor")?.classList.add("hidden");
    });

    document.getElementById("dgChapSaveBtn")?.addEventListener("click", async () => {
        const title = document.getElementById("dgChapTitleInput")?.value.trim();
        const description = document.getElementById("dgChapDescInput")?.value.trim() || "";
        if (!title) return showGuideToast("অধ্যায়ের শিরোনাম লিখুন");

        if (editingChapterId) {
            const found = guideState.chapters.find(c => c.id === editingChapterId);
            if (found) { found.title = title; found.description = description; }
            editingChapterId = null;
        } else {
            const newChap = { id: generateGuideId("chap"), title, description, docs: [], createdAt: Date.now() };
            guideState.chapters.push(newChap);
            activeChapterId = newChap.id;
        }
        await persistGuide();
    });
}

function fillChapterList(admin) {
    const area = document.getElementById("dgListArea");
    if (!area) return;

    const q = guideSearchQuery;
    const filtered = guideState.chapters
        .map((chap, idx) => ({ chap, idx }))
        .filter(({ chap }) => {
            if (!q) return true;
            const cMatch = (chap.title || "").toLowerCase().includes(q) ||
                (chap.description || "").toLowerCase().includes(q);
            const dMatch = (chap.docs || []).some(d =>
                (d.title || "").toLowerCase().includes(q) ||
                (d.body || "").toLowerCase().includes(q));
            return cMatch || dMatch;
        });

    setResultCount(filtered.length, "অধ্যায়");

    if (!filtered.length) {
        area.innerHTML = `
            <div class="dg-notebook-page" style="text-align:center;">
                <div class="dg-rich"><p style="opacity:.7;">কোনো অধ্যায় বা নোট পাওয়া যায়নি।</p></div>
            </div>`;
        return;
    }

    area.innerHTML = `<div class="dg-chapter-stack">${filtered.map(({ chap, idx }) => {
        const count = Array.isArray(chap.docs) ? chap.docs.length : 0;
        return `
            <div class="dg-notebook-chapter" data-chap-id="${escapeHTML(chap.id)}">
                <div class="dg-chap-num">${idx + 1}</div>
                <div style="min-width:0;flex:1;">
                    <span class="dg-chapter-chip">${count}টি নোট</span>
                    <h3 class="dg-chapter-heading">${highlightHTML(escapeHTML(chap.title))}</h3>
                    ${chap.description ? `<p class="dg-chapter-desc">${highlightHTML(escapeHTML(chap.description))}</p>` : ""}
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                    ${admin ? `<button type="button" class="dg-mini-btn edit dg-edit-chap" data-id="${escapeHTML(chap.id)}">✏️</button>` : ""}
                    ${admin ? `<button type="button" class="dg-mini-btn del dg-del-chap" data-id="${escapeHTML(chap.id)}">🗑️</button>` : ""}
                    <span style="font-size:22px;opacity:.5;">›</span>
                </div>
            </div>`;
    }).join("")}</div>`;

    area.querySelectorAll(".dg-notebook-chapter").forEach(card => {
        card.addEventListener("click", () => {
            activeChapterId = card.getAttribute("data-chap-id");
            editingDocId = null;
            // সার্চ বজায় থাকবে যাতে নোটের ভেতরেও হাইলাইট দেখা যায়
            renderDrivingGuideInSheet();
        });
    });

    area.querySelectorAll(".dg-edit-chap").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            editingChapterId = btn.getAttribute("data-id");
            renderDrivingGuideInSheet();
        });
    });

    area.querySelectorAll(".dg-del-chap").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute("data-id");
            if (!confirm("এই অধ্যায় ও এর সব নোট মুছে ফেলবেন?")) return;
            guideState.chapters = guideState.chapters.filter(c => c.id !== id);
            if (activeChapterId === id) activeChapterId = null;
            if (editingChapterId === id) editingChapterId = null;
            await persistGuide();
        });
    });
}

/* ============================== Chapter Docs (Notebook Pages) ============================== */

function insertAtCursor(textarea, before, after = "", placeholder = "") {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const selected = textarea.value.slice(start, end) || placeholder;
    const needsBreak = before.startsWith("\n") ? "" : "";
    const insert = `${needsBreak}${before}${selected}${after}`;
    textarea.value = textarea.value.slice(0, start) + insert + textarea.value.slice(end);
    const pos = start + insert.length;
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
    textarea.dispatchEvent(new Event("input"));
}

function renderChapterDocsView(container, chapter, admin) {
    setHeaderBackMode(chapter.title);

    const docs = Array.isArray(chapter.docs) ? chapter.docs : [];
    const editingDoc = editingDocId ? docs.find(d => d.id === editingDocId) : null;

    let html = buildSearchBarHTML("নোটের বিষয়, লেখা বা ক্যাপশন খুঁজুন...", admin, "dgAddDocBtn", "＋ নোট");

    if (admin) {
        html += `
            <div id="dgDocEditor" class="dg-editor-panel ${editingDoc ? "" : "hidden"}">
                <input id="dgDocTitleInput" type="text" value="${escapeHTML(editingDoc?.title || "")}" placeholder="নোটের শিরোনাম (ঐচ্ছিক)">

                <div class="dg-fmt-bar">
                    <button type="button" class="dg-mini-btn tag" data-fmt="img">🖼️ ছবি</button>
                    <button type="button" class="dg-mini-btn tag" data-fmt="gallery">🗂️ গ্যালারি</button>
                    <button type="button" class="dg-mini-btn tag" data-fmt="link">🔗 লিংক</button>
                    <button type="button" class="dg-mini-btn ghost" data-fmt="h1">H1</button>
                    <button type="button" class="dg-mini-btn ghost" data-fmt="h2">H2</button>
                    <button type="button" class="dg-mini-btn ghost" data-fmt="bold"><b>B</b></button>
                    <button type="button" class="dg-mini-btn ghost" data-fmt="mark">হাইলাইট</button>
                    <button type="button" class="dg-mini-btn ghost" data-fmt="list">• তালিকা</button>
                    <button type="button" class="dg-mini-btn ghost" data-fmt="tip">💡 টিপস</button>
                    <button type="button" class="dg-mini-btn ghost" data-fmt="warn">⚠️ সতর্কতা</button>
                    <button type="button" class="dg-mini-btn ghost" data-fmt="hr">— লাইন</button>
                </div>

                <textarea id="dgDocBodyInput" placeholder="এখানে লিখুন... লেখার যেকোনো জায়গায় ছবি, গ্যালারি ও লিংক বসাতে উপরের বাটন ব্যবহার করুন।">${escapeHTML(editingDoc?.body || "")}</textarea>

                <div class="dg-editor-tip">
                    <code>[img: লিংক | ক্যাপশন]</code> একটি ছবি &nbsp;•&nbsp;
                    <code>[gallery: লিংক1 ~ ক্যাপশন | লিংক2 | লিংক3]</code> পাশাপাশি অনেক ছবি &nbsp;•&nbsp;
                    <code>[link: নাম | https://...]</code> লিংক (লাইনের মাঝেও চলবে) &nbsp;•&nbsp;
                    <code># বড়</code> <code>## মাঝারি</code> <code>- তালিকা</code> <code>&gt; টিপস</code> <code>!! সতর্কতা</code> <code>**বোল্ড**</code> <code>==হাইলাইট==</code>
                </div>

                <div style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;">
                    <button id="dgPreviewToggleBtn" type="button" class="dg-mini-btn ghost">👁️ প্রিভিউ</button>
                    <div style="display:flex;gap:8px;">
                        <button id="dgDocCancelBtn" type="button" class="dg-mini-btn del">বাতিল</button>
                        <button id="dgDocSaveBtn" type="button" class="dg-mini-btn tag">সেভ করুন</button>
                    </div>
                </div>
                <div id="dgPreviewBox" class="dg-preview-box hidden"></div>
            </div>`;
    }

    html += `<div id="dgListArea"></div>`;
    container.innerHTML = html;

    bindSearch(() => fillDocsList(chapter, admin));
    fillDocsList(chapter, admin);

    if (!admin) return;

    const bodyInput = document.getElementById("dgDocBodyInput");
    const previewBox = document.getElementById("dgPreviewBox");

    const refreshPreview = () => {
        if (previewBox && !previewBox.classList.contains("hidden")) {
            previewBox.innerHTML = renderRichTextWithMedia(bodyInput.value);
            wireMedia(previewBox);
        }
    };
    bodyInput?.addEventListener("input", refreshPreview);

    document.getElementById("dgPreviewToggleBtn")?.addEventListener("click", () => {
        previewBox.classList.toggle("hidden");
        refreshPreview();
    });

    container.querySelectorAll(".dg-fmt-bar [data-fmt]").forEach(btn => {
        btn.addEventListener("click", () => {
            const f = btn.getAttribute("data-fmt");
            switch (f) {
                case "img": {
                    const url = prompt("ছবির লিংক দিন (https://...)");
                    if (!url) return;
                    const cap = prompt("ক্যাপশন বা ছবির পাশের লেখা (ঐচ্ছিক)") || "";
                    insertAtCursor(bodyInput, `\n[img: ${url.trim()}${cap ? " | " + cap.trim() : ""}]\n`);
                    break;
                }
                case "gallery": {
                    const urls = prompt("একাধিক ছবির লিংক দিন, কমা (,) দিয়ে আলাদা করুন");
                    if (!urls) return;
                    const joined = urls.split(",").map(s => s.trim()).filter(Boolean).join(" | ");
                    insertAtCursor(bodyInput, `\n[gallery: ${joined}]\n`);
                    break;
                }
                case "link": {
                    const label = prompt("লিংকের নাম") || "প্রয়োজনীয় লিংক";
                    const url = prompt("লিংক (https://...)");
                    if (!url) return;
                    insertAtCursor(bodyInput, ` [link: ${label.trim()} | ${url.trim()}] `);
                    break;
                }
                case "h1": insertAtCursor(bodyInput, "\n# ", "\n", "বড় শিরোনাম"); break;
                case "h2": insertAtCursor(bodyInput, "\n## ", "\n", "মাঝারি শিরোনাম"); break;
                case "bold": insertAtCursor(bodyInput, "**", "**", "গুরুত্বপূর্ণ"); break;
                case "mark": insertAtCursor(bodyInput, "==", "==", "হাইলাইট"); break;
                case "list": insertAtCursor(bodyInput, "\n- ", "\n", "তালিকার আইটেম"); break;
                case "tip": insertAtCursor(bodyInput, "\n> ", "\n", "টিপস লিখুন"); break;
                case "warn": insertAtCursor(bodyInput, "\n!! ", "\n", "সতর্কতা লিখুন"); break;
                case "hr": insertAtCursor(bodyInput, "\n---\n"); break;
            }
        });
    });

    document.getElementById("dgAddDocBtn")?.addEventListener("click", () => {
        editingDocId = null;
        const panel = document.getElementById("dgDocEditor");
        if (panel) {
            panel.classList.remove("hidden");
            document.getElementById("dgDocTitleInput").value = "";
            bodyInput.value = "";
            refreshPreview();
            document.getElementById("dgDocTitleInput").focus();
            panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    });

    document.getElementById("dgDocCancelBtn")?.addEventListener("click", () => {
        editingDocId = null;
        document.getElementById("dgDocEditor")?.classList.add("hidden");
    });

    document.getElementById("dgDocSaveBtn")?.addEventListener("click", async () => {
        const title = document.getElementById("dgDocTitleInput")?.value.trim() || "";
        const body = bodyInput?.value.trim() || "";
        if (!body) return showGuideToast("নোটের লেখা লিখুন");

        if (!Array.isArray(chapter.docs)) chapter.docs = [];

        if (editingDocId) {
            const target = chapter.docs.find(d => d.id === editingDocId);
            if (target) { target.title = title; target.body = body; target.updatedAt = Date.now(); }
            editingDocId = null;
        } else {
            chapter.docs.push({ id: generateGuideId("doc"), title, body, createdAt: Date.now() });
        }
        await persistGuide();
    });
}

function fillDocsList(chapter, admin) {
    const area = document.getElementById("dgListArea");
    if (!area) return;

    const docs = Array.isArray(chapter.docs) ? chapter.docs : [];
    const q = guideSearchQuery;

    const filtered = docs.filter(doc => !q ||
        (doc.title || "").toLowerCase().includes(q) ||
        (doc.body || "").toLowerCase().includes(q));

    setResultCount(filtered.length, "নোট");

    if (!filtered.length) {
        area.innerHTML = `
            <div class="dg-notebook-page" style="text-align:center;">
                <div class="dg-rich"><p style="opacity:.7;">এই অধ্যায়ে কোনো নোট পাওয়া যায়নি।</p></div>
            </div>`;
        return;
    }

    area.innerHTML = `<div style="display:flex;flex-direction:column;gap:14px;">${filtered.map(doc => `
        <article class="dg-notebook-page">
            ${(doc.title || admin) ? `
                <div class="dg-page-top">
                    <h3 class="dg-page-title">${highlightHTML(escapeHTML(doc.title || "নোট"))}</h3>
                    ${admin ? `
                        <div style="display:flex;gap:6px;">
                            <button type="button" class="dg-mini-btn edit dg-edit-doc" data-id="${escapeHTML(doc.id)}">✏️</button>
                            <button type="button" class="dg-mini-btn del dg-del-doc" data-id="${escapeHTML(doc.id)}">🗑️</button>
                        </div>` : ""}
                </div>` : ""}
            ${renderRichTextWithMedia(doc.body || "")}
        </article>`).join("")}</div>`;

    wireMedia(area);

    area.querySelectorAll(".dg-edit-doc").forEach(btn => {
        btn.addEventListener("click", () => {
            editingDocId = btn.getAttribute("data-id");
            renderDrivingGuideInSheet();
            document.getElementById("dgDocEditor")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    area.querySelectorAll(".dg-del-doc").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (!confirm("এই নোটটি মুছে ফেলবেন?")) return;
            const docId = btn.getAttribute("data-id");
            chapter.docs = (chapter.docs || []).filter(d => d.id !== docId);
            if (editingDocId === docId) editingDocId = null;
            await persistGuide();
        });
    });
}

/* ============================== Public API ============================== */

export function renderDrivingGuideInSheet() {
    const view = ensureSheetContainer();
    if (!view) return;

    const admin = isAdminUser();
    if (activeChapterId) {
        const chapter = guideState.chapters.find(c => c.id === activeChapterId);
        if (chapter) {
            renderChapterDocsView(view, chapter, admin);
            return;
        }
        activeChapterId = null;
    }

    renderChapterListView(view, admin);
}

export async function openDrivingGuide() {
    injectModernNotebookStyles();
    startRealtimeSync();

    if (navigator.onLine) {
        try {
            const snap = await get(ref(db, DB_PATH));
            if (snap.exists() && Array.isArray(snap.val()?.chapters)) {
                guideState = snap.val();
                saveLocalGuide();
            }
        } catch (err) {
            console.warn("Driving guide fetch warning:", err);
        }
    }

    isGuideActive = true;
    guideSearchQuery = "";
    editingChapterId = null;
    editingDocId = null;
    hideMainViewsForGuide(true);

    const view = ensureSheetContainer();
    if (view) {
        view.classList.remove("hidden");
        renderDrivingGuideInSheet();
    }
}

export function closeDrivingGuide() {
    isGuideActive = false;
    activeChapterId = null;
    editingChapterId = null;
    editingDocId = null;
    guideSearchQuery = "";

    const view = document.getElementById("drivingGuideSheetView");
    if (view) {
        view.classList.add("hidden");
        view.innerHTML = "";
    }

    restoreHeaderMode();
    hideMainViewsForGuide(false);

    if (typeof window.showMainDashboardView === "function") {
        window.showMainDashboardView(false);
    } else if (typeof window.refreshCurrentView === "function") {
        window.refreshCurrentView();
    }
}

window.openDrivingGuide = openDrivingGuide;
window.closeDrivingGuide = closeDrivingGuide;
