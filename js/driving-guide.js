// js/driving-guide.js

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

let guideState = {
    chapters: []
};

let activeChapterId = null;
let editingChapterId = null;
let editingDocId = null;
let guideSearchQuery = "";
let isGuideActive = false;
let isListening = false;
let prevTitleText = "";
let prevBackHidden = true;
let prevMenuHidden = false;

function escapeHTML(str) {
    return String(str || "").replace(
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
            if (parsed && Array.isArray(parsed.chapters)) {
                guideState = parsed;
            }
        }
    } catch (e) {
        console.error("Driving guide local load error:", e);
    }
}

async function persistGuide() {
    saveLocalGuide();
    renderDrivingGuideInSheet();

    if (!navigator.onLine) {
        showGuideToast("অফলাইনে সেভ হয়েছে! অনলাইন হলে সিঙ্ক হবে।");
        return;
    }

    try {
        await set(ref(db, DB_PATH), guideState);
        showGuideToast("ড্রাইভিং গাইড সেভ হয়েছে");
    } catch (err) {
        console.error("Firebase driving guide save error:", err);
        showGuideToast("ক্লাউডে সিঙ্ক করতে সমস্যা হয়েছে");
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
                if (isGuideActive) {
                    renderDrivingGuideInSheet();
                }
            }
        }
    }, (err) => {
        console.warn("Driving guide realtime error:", err);
    });
}

function injectModernNotebookStyles() {
    if (document.getElementById("drivingGuideModernStyles")) return;

    const style = document.createElement("style");
    style.id = "drivingGuideModernStyles";
    style.textContent = `
        #drivingGuideSheetView {
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding-bottom: 24px;
        }
        #drivingGuideSheetView.hidden {
            display: none !important;
        }

        /* টোলবার + ইনলাইন সার্চ */
        .dg-notebook-toolbar {
            background: linear-gradient(135deg, #020624 0%, #0f172a 100%);
            border: 1px solid rgba(148, 163, 184, 0.22);
            border-radius: 18px;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 20px rgba(2, 6, 36, 0.16);
        }
        .dg-toolbar-search-wrap {
            flex: 1;
            min-width: 140px;
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            padding: 7px 11px;
        }
        .dg-toolbar-search-wrap span {
            font-size: 14px;
            line-height: 1;
            opacity: 0.9;
        }
        .dg-toolbar-search-wrap input {
            width: 100%;
            min-width: 0;
            border: none;
            outline: none;
            background: transparent;
            color: #ffffff;
            font-size: 14px;
            font-family: inherit;
        }
        .dg-toolbar-search-wrap input::placeholder {
            color: rgba(226, 232, 240, 0.72);
        }
        .dg-toolbar-clear-btn {
            background: rgba(255, 255, 255, 0.16);
            color: #ffffff;
            border: none;
            border-radius: 8px;
            width: 24px;
            height: 24px;
            font-size: 12px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .dg-toolbar-add-btn {
            background: #0ea5e9;
            color: #ffffff;
            border: none;
            border-radius: 12px;
            padding: 9px 13px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);
            flex-shrink: 0;
        }

        /* নোটবুক অধ্যায় কার্ড */
        .dg-chapter-stack {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .dg-notebook-chapter {
            position: relative;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-left: 5px solid #020624;
            border-radius: 16px;
            padding: 15px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 5px 16px rgba(2, 6, 36, 0.05);
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        body.dark-mode .dg-notebook-chapter {
            background: #0f172a;
            border-color: #1e293b;
            border-left-color: #38bdf8;
        }
        .dg-notebook-chapter:active {
            transform: scale(0.99);
        }
        .dg-chapter-chip {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            color: #0284c7;
            background: rgba(14, 165, 233, 0.12);
            padding: 2px 8px;
            border-radius: 999px;
            margin-bottom: 5px;
        }
        body.dark-mode .dg-chapter-chip {
            color: #38bdf8;
        }
        .dg-chapter-heading {
            margin: 0;
            font-size: 16.5px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.35;
        }
        body.dark-mode .dg-chapter-heading {
            color: #f8fafc;
        }
        .dg-chapter-desc {
            margin: 4px 0 0 0;
            font-size: 13px;
            color: #64748b;
            line-height: 1.45;
        }
        body.dark-mode .dg-chapter-desc {
            color: #94a3b8;
        }

        /* নোটবুক ডকুমেন্ট পেজ কার্ড */
        .dg-notebook-page {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 18px;
            box-shadow: 0 8px 24px rgba(2, 6, 36, 0.06);
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        body.dark-mode .dg-notebook-page {
            background: #0f172a;
            border-color: #1e293b;
        }
        .dg-page-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #cbd5e1;
        }
        body.dark-mode .dg-page-top {
            border-bottom-color: #334155;
        }
        .dg-page-title {
            margin: 0;
            font-size: 17px;
            font-weight: 700;
            color: #020624;
        }
        body.dark-mode .dg-page-title {
            color: #f8fafc;
        }
        .dg-page-body-text {
            margin: 0;
            font-size: 15.5px;
            line-height: 1.85;
            white-space: pre-line;
            color: #1e293b;
        }
        body.dark-mode .dg-page-body-text {
            color: #e2e8f0;
        }

        /* ইনলাইন ইমেজ ও ক্যাপশন */
        .dg-media-figure {
            margin: 14px 0;
            padding: 12px;
            border-radius: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.03);
        }
        body.dark-mode .dg-media-figure {
            background: #1e293b;
            border-color: #334155;
        }
        .dg-media-figure img {
            width: 100%;
            max-height: 300px;
            object-fit: cover;
            border-radius: 12px;
            display: block;
        }
        .dg-media-caption {
            margin: 9px 2px 0 2px;
            font-size: 13.5px;
            line-height: 1.6;
            color: #475569;
            font-weight: 500;
        }
        body.dark-mode .dg-media-caption {
            color: #cbd5e1;
        }

        /* ইনলাইন লিংক বাটন */
        .dg-media-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin: 6px 6px 6px 0;
            padding: 9px 14px;
            border-radius: 12px;
            background: rgba(2, 6, 36, 0.06);
            border: 1px solid rgba(14, 165, 233, 0.45);
            color: #0284c7;
            font-size: 13.5px;
            font-weight: 700;
            text-decoration: none;
        }
        body.dark-mode .dg-media-link {
            background: rgba(56, 189, 248, 0.12);
            color: #38bdf8;
        }

        /* অ্যাকশন বাটন */
        .dg-mini-btn {
            border: none;
            border-radius: 9px;
            padding: 7px 11px;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .dg-mini-btn.edit {
            background: #f59e0b;
            color: #ffffff;
        }
        .dg-mini-btn.del {
            background: #ef4444;
            color: #ffffff;
        }
        .dg-mini-btn.tag {
            background: #0ea5e9;
            color: #ffffff;
            padding: 8px 12px;
        }

        /* বড় এডিটর বক্স */
        .dg-editor-panel {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 18px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-shadow: 0 8px 22px rgba(2, 6, 36, 0.08);
        }
        body.dark-mode .dg-editor-panel {
            background: #0f172a;
            border-color: #334155;
        }
        .dg-editor-panel input,
        .dg-editor-panel textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 13px 14px;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            color: #0f172a;
            font-size: 15px;
            line-height: 1.55;
            font-family: inherit;
        }
        .dg-editor-panel textarea {
            min-height: 210px;
        }
        body.dark-mode .dg-editor-panel input,
        body.dark-mode .dg-editor-panel textarea {
            background: #1e293b;
            color: #f8fafc;
            border-color: #334155;
        }
        .dg-editor-tip {
            font-size: 12.5px;
            line-height: 1.6;
            padding: 10px 12px;
            border-radius: 12px;
            background: rgba(14, 165, 233, 0.09);
            border-left: 4px solid #0ea5e9;
            color: #334155;
        }
        body.dark-mode .dg-editor-tip {
            color: #cbd5e1;
        }
    `;
    document.head.appendChild(style);
}

function renderRichTextWithMedia(rawText) {
    const normalized = String(rawText || "").replace(/\r\n/g, "\n");
    const tokenRegex = /(\[img:[^\]]+\]|\[link:[^\]]+\])/gi;
    const parts = normalized.split(tokenRegex);

    return parts.map(part => {
        if (!part) return "";

        const imgMatch = part.match(/^\[img:\s*([^|\]]+?)(?:\s*\|\s*([^\]]*))?\]$/i);
        if (imgMatch) {
            const url = escapeHTML(imgMatch[1].trim());
            const caption = escapeHTML((imgMatch[2] || "").trim());
            return `
                <figure class="dg-media-figure">
                    <img src="${url}" alt="${caption || "Driving Guide Image"}" onerror="this.src='${DEFAULT_GUIDE_IMG}'">
                    ${caption ? `<figcaption class="dg-media-caption">${caption}</figcaption>` : ""}
                </figure>
            `;
        }

        const linkMatch = part.match(/^\[link:\s*([^|\]]+?)\s*\|\s*([^\]]+)\]$/i);
        if (linkMatch) {
            const label = escapeHTML(linkMatch[1].trim());
            let href = linkMatch[2].trim();
            if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
            return `
                <a class="dg-media-link" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">
                    🔗 ${label} ↗
                </a>
            `;
        }

        return `<span class="dg-page-body-text">${escapeHTML(part)}</span>`;
    }).join("");
}

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

    if (appTitleText) {
        appTitleText.textContent = prevTitleText || "RMP MT Contacts";
    }
    if (menuIcon && backIcon) {
        menuIcon.classList.remove("hidden");
        backIcon.classList.add("hidden");
    }
}

function hideMainViewsForGuide(hide) {
    const ids = [
        "mainDashboardView",
        "categoryDetailsView",
        "dataDetailsView",
        "heroSlider",
        "searchBox",
        "subPageHeaderSearchWrapper",
        "slidingNoticeContainer"
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("hidden", hide);
    });
    const slider = document.getElementById("heroSlider");
    if (slider) slider.style.display = hide ? "none" : "";
}

function buildToolbarHTML(searchPlaceholder, admin, addBtnId, addBtnLabel) {
    return `
        <div class="dg-notebook-toolbar">
            <div class="dg-toolbar-search-wrap">
                <span>🔍</span>
                <input id="dgToolbarSearchInput" type="search" value="${escapeHTML(guideSearchQuery)}" placeholder="${escapeHTML(searchPlaceholder)}" autocomplete="off">
                ${guideSearchQuery ? `<button id="dgClearSearchBtn" type="button" class="dg-toolbar-clear-btn" title="মুছুন">✕</button>` : ""}
            </div>
            ${admin ? `<button id="${escapeHTML(addBtnId)}" type="button" class="dg-toolbar-add-btn">${escapeHTML(addBtnLabel)}</button>` : ""}
        </div>
    `;
}

function bindToolbarEvents() {
    const input = document.getElementById("dgToolbarSearchInput");
    if (input) {
        input.addEventListener("input", () => {
            guideSearchQuery = input.value.trim().toLowerCase();
            renderDrivingGuideInSheet();
            const freshInput = document.getElementById("dgToolbarSearchInput");
            if (freshInput) {
                freshInput.focus();
                const end = freshInput.value.length;
                freshInput.setSelectionRange(end, end);
            }
        });
    }

    document.getElementById("dgClearSearchBtn")?.addEventListener("click", () => {
        guideSearchQuery = "";
        renderDrivingGuideInSheet();
    });
}

function renderChapterListView(container, admin) {
    setHeaderBackMode("ড্রাইভিং গাইড");

    let html = buildToolbarHTML("অধ্যায় খুঁজুন...", admin, "dgAddChapterBtn", "＋ অধ্যায়");

    if (admin) {
        const editingChap = editingChapterId
            ? guideState.chapters.find(c => c.id === editingChapterId)
            : null;

        html += `
            <div id="dgChapterEditor" class="dg-editor-panel ${editingChap ? "" : "hidden"}">
                <input id="dgChapTitleInput" type="text" value="${escapeHTML(editingChap?.title || "")}" placeholder="অধ্যায়ের শিরোনাম (যেমন: ট্রাফিক সিগন্যাল ও আইন)">
                <input id="dgChapDescInput" type="text" value="${escapeHTML(editingChap?.description || "")}" placeholder="সংক্ষিপ্ত পরিচিতি (ঐচ্ছিক)">
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button id="dgChapCancelBtn" type="button" class="dg-mini-btn del">বাতিল</button>
                    <button id="dgChapSaveBtn" type="button" class="dg-mini-btn tag">সেভ করুন</button>
                </div>
            </div>
        `;
    }

    const filtered = guideState.chapters.filter(chap => {
        if (!guideSearchQuery) return true;
        const cMatch = (chap.title || "").toLowerCase().includes(guideSearchQuery) ||
            (chap.description || "").toLowerCase().includes(guideSearchQuery);
        const dMatch = (chap.docs || []).some(d =>
            (d.title || "").toLowerCase().includes(guideSearchQuery) ||
            (d.body || "").toLowerCase().includes(guideSearchQuery)
        );
        return cMatch || dMatch;
    });

    if (!filtered.length) {
        html += `
            <div class="dg-notebook-page" style="text-align:center;">
                <p class="dg-page-body-text" style="opacity:0.7;">কোনো অধ্যায় বা নোট পাওয়া যায়নি।</p>
            </div>
        `;
    } else {
        html += `<div class="dg-chapter-stack">`;
        filtered.forEach((chap, idx) => {
            const count = Array.isArray(chap.docs) ? chap.docs.length : 0;
            html += `
                <div class="dg-notebook-chapter" data-chap-id="${escapeHTML(chap.id)}">
                    <div style="min-width:0;">
                        <span class="dg-chapter-chip">অধ্যায় ${idx + 1} • ${count}টি নোট</span>
                        <h3 class="dg-chapter-heading">${escapeHTML(chap.title)}</h3>
                        ${chap.description ? `<p class="dg-chapter-desc">${escapeHTML(chap.description)}</p>` : ""}
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                        ${admin ? `<button type="button" class="dg-mini-btn edit dg-edit-chap" data-id="${escapeHTML(chap.id)}">✏️</button>` : ""}
                        ${admin ? `<button type="button" class="dg-mini-btn del dg-del-chap" data-id="${escapeHTML(chap.id)}">🗑️</button>` : ""}
                        <span style="font-size:20px;opacity:0.55;">›</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
    bindToolbarEvents();

    document.getElementById("dgAddChapterBtn")?.addEventListener("click", () => {
        editingChapterId = null;
        const panel = document.getElementById("dgChapterEditor");
        if (panel) {
            panel.classList.remove("hidden");
            document.getElementById("dgChapTitleInput").value = "";
            document.getElementById("dgChapDescInput").value = "";
        }
    });

    document.getElementById("dgChapCancelBtn")?.addEventListener("click", () => {
        editingChapterId = null;
        document.getElementById("dgChapterEditor")?.classList.add("hidden");
    });

    document.getElementById("dgChapSaveBtn")?.addEventListener("click", async () => {
        const title = document.getElementById("dgChapTitleInput")?.value.trim();
        const description = document.getElementById("dgChapDescInput")?.value.trim() || "";
        if (!title) return showGuideToast("অধ্যায়ের শিরোনাম লিখুন");

        if (editingChapterId) {
            const found = guideState.chapters.find(c => c.id === editingChapterId);
            if (found) {
                found.title = title;
                found.description = description;
            }
            editingChapterId = null;
        } else {
            const newChap = {
                id: generateGuideId("chap"),
                title,
                description,
                docs: [],
                createdAt: Date.now()
            };
            guideState.chapters.push(newChap);
            activeChapterId = newChap.id;
        }
        await persistGuide();
    });

    container.querySelectorAll(".dg-notebook-chapter").forEach(card => {
        card.addEventListener("click", () => {
            activeChapterId = card.getAttribute("data-chap-id");
            editingDocId = null;
            guideSearchQuery = "";
            renderDrivingGuideInSheet();
        });
    });

    container.querySelectorAll(".dg-edit-chap").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            editingChapterId = btn.getAttribute("data-id");
            renderDrivingGuideInSheet();
        });
    });

    container.querySelectorAll(".dg-del-chap").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute("data-id");
            guideState.chapters = guideState.chapters.filter(c => c.id !== id);
            if (activeChapterId === id) activeChapterId = null;
            if (editingChapterId === id) editingChapterId = null;
            await persistGuide();
        });
    });
}

function renderChapterDocsView(container, chapter, admin) {
    setHeaderBackMode(chapter.title);

    let html = buildToolbarHTML("বিষয় বা ক্যাপশন খুঁজুন...", admin, "dgAddDocBtn", "＋ নোট");

    const docs = Array.isArray(chapter.docs) ? chapter.docs : [];
    const editingDoc = editingDocId ? docs.find(d => d.id === editingDocId) : null;

    if (admin) {
        html += `
            <div id="dgDocEditor" class="dg-editor-panel ${editingDoc ? "" : "hidden"}">
                <input id="dgDocTitleInput" type="text" value="${escapeHTML(editingDoc?.title || "")}" placeholder="ডকুমেন্ট বা নোটের শিরোনাম (ঐচ্ছিক)">
                <div class="dg-editor-tip">
                    একটিমাত্র লেখার ভেতরে একাধিক ছবি ও লিংক যুক্ত করতে:<br>
                    <strong>[img: ছবির_লিংক | ছবির_ক্যাপশন_বা_অতিরিক্ত_লেখা]</strong><br>
                    <strong>[link: লিংকের_নাম | https://example.com]</strong>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button id="dgAddImgTagBtn" type="button" class="dg-mini-btn tag">+ ছবি যুক্ত করুন</button>
                    <button id="dgAddLinkTagBtn" type="button" class="dg-mini-btn tag">+ লিংক যুক্ত করুন</button>
                </div>
                <textarea id="dgDocBodyInput" placeholder="এখানে মূল লেখা লিখুন এবং লেখার মাঝে মাঝে যত খুশি [img: ...] ট্যাগ ব্যবহার করুন...">${escapeHTML(editingDoc?.body || "")}</textarea>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button id="dgDocCancelBtn" type="button" class="dg-mini-btn del">বাতিল</button>
                    <button id="dgDocSaveBtn" type="button" class="dg-mini-btn tag">সেভ করুন</button>
                </div>
            </div>
        `;
    }

    const filteredDocs = docs.filter(doc => {
        if (!guideSearchQuery) return true;
        return (
            (doc.title || "").toLowerCase().includes(guideSearchQuery) ||
            (doc.body || "").toLowerCase().includes(guideSearchQuery)
        );
    });

    if (!filteredDocs.length) {
        html += `
            <div class="dg-notebook-page" style="text-align:center;">
                <p class="dg-page-body-text" style="opacity:0.7;">এই অধ্যায়ে কোনো ডকুমেন্ট পাওয়া যায়নি।</p>
            </div>
        `;
    } else {
        filteredDocs.forEach(doc => {
            html += `
                <article class="dg-notebook-page">
                    ${(doc.title || admin) ? `
                        <div class="dg-page-top">
                            <h3 class="dg-page-title">${escapeHTML(doc.title || "ডকুমেন্ট নোট")}</h3>
                            ${admin ? `
                                <div style="display:flex;gap:6px;">
                                    <button type="button" class="dg-mini-btn edit dg-edit-doc" data-id="${escapeHTML(doc.id)}">✏️</button>
                                    <button type="button" class="dg-mini-btn del dg-del-doc" data-id="${escapeHTML(doc.id)}">🗑️</button>
                                </div>
                            ` : ""}
                        </div>
                    ` : ""}
                    <div>${renderRichTextWithMedia(doc.body || "")}</div>
                </article>
            `;
        });
    }

    container.innerHTML = html;
    bindToolbarEvents();

    const bodyInput = document.getElementById("dgDocBodyInput");

    document.getElementById("dgAddDocBtn")?.addEventListener("click", () => {
        editingDocId = null;
        const panel = document.getElementById("dgDocEditor");
        if (panel) {
            panel.classList.remove("hidden");
            document.getElementById("dgDocTitleInput").value = "";
            document.getElementById("dgDocBodyInput").value = "";
        }
    });

    document.getElementById("dgDocCancelBtn")?.addEventListener("click", () => {
        editingDocId = null;
        document.getElementById("dgDocEditor")?.classList.add("hidden");
    });

    document.getElementById("dgAddImgTagBtn")?.addEventListener("click", () => {
        if (!bodyInput) return;
        bodyInput.value += `\n[img: https://example.com/photo.jpg | ছবির নিচে বা পাশে অতিরিক্ত লেখা]\n`;
        bodyInput.focus();
    });

    document.getElementById("dgAddLinkTagBtn")?.addEventListener("click", () => {
        if (!bodyInput) return;
        bodyInput.value += `\n[link: প্রয়োজনীয় লিংক | https://example.com]\n`;
        bodyInput.focus();
    });

    document.getElementById("dgDocSaveBtn")?.addEventListener("click", async () => {
        const title = document.getElementById("dgDocTitleInput")?.value.trim() || "";
        const body = document.getElementById("dgDocBodyInput")?.value.trim() || "";
        if (!body) return showGuideToast("ডকুমেন্টের লেখা লিখুন");

        if (!Array.isArray(chapter.docs)) chapter.docs = [];

        if (editingDocId) {
            const target = chapter.docs.find(d => d.id === editingDocId);
            if (target) {
                target.title = title;
                target.body = body;
            }
            editingDocId = null;
        } else {
            chapter.docs.push({
                id: generateGuideId("doc"),
                title,
                body,
                createdAt: Date.now()
            });
        }
        await persistGuide();
    });

    container.querySelectorAll(".dg-edit-doc").forEach(btn => {
        btn.addEventListener("click", () => {
            editingDocId = btn.getAttribute("data-id");
            renderDrivingGuideInSheet();
        });
    });

    container.querySelectorAll(".dg-del-doc").forEach(btn => {
        btn.addEventListener("click", async () => {
            const docId = btn.getAttribute("data-id");
            chapter.docs = (chapter.docs || []).filter(d => d.id !== docId);
            if (editingDocId === docId) editingDocId = null;
            await persistGuide();
        });
    });
}

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
