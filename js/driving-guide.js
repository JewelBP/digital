// js/driving-guide.js

import {
    ref,
    set,
    get,
    onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { db } from "./firebase.js";

const STORAGE_KEY = "rmp_driving_guide_v4";
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

function injectNativeStyles() {
    if (document.getElementById("drivingGuideNativeStyles")) return;

    const style = document.createElement("style");
    style.id = "drivingGuideNativeStyles";
    style.textContent = `
        #drivingGuideSheetView {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        #drivingGuideSheetView.hidden {
            display: none !important;
        }
        .dg-native-toolbar {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 10px 12px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
        }
        body.dark-mode .dg-native-toolbar {
            background: #0f172a;
            border-color: #334155;
        }
        .dg-toolbar-search {
            flex: 1;
            min-width: 170px;
            display: flex;
            align-items: center;
            gap: 6px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 11px;
            padding: 7px 11px;
        }
        body.dark-mode .dg-toolbar-search {
            background: #1e293b;
            border-color: #334155;
        }
        .dg-toolbar-search input {
            width: 100%;
            min-width: 0;
            border: none;
            outline: none;
            background: transparent;
            color: #0f172a;
            font-size: 14px;
            font-family: inherit;
        }
        body.dark-mode .dg-toolbar-search input {
            color: #f8fafc;
        }
        .dg-native-btn {
            background: var(--app-main-color, #020624);
            color: #ffffff;
            border: none;
            border-radius: 11px;
            padding: 10px 14px;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
        }
        .dg-native-btn.secondary {
            background: #0ea5e9;
        }
        .dg-native-btn.edit {
            background: #f59e0b;
            color: #ffffff;
            padding: 7px 11px;
            font-size: 13px;
        }
        .dg-native-btn.danger {
            background: #ef4444;
            padding: 7px 11px;
            font-size: 13px;
        }
        .dg-chapter-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .dg-chapter-row {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 16px;
            min-height: 76px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            cursor: pointer;
        }
        body.dark-mode .dg-chapter-row {
            background: #0f172a;
            border-color: #334155;
        }
        .dg-chapter-row-title {
            margin: 0;
            font-size: 16.5px;
            font-weight: 700;
            color: var(--app-main-color, #020624);
        }
        body.dark-mode .dg-chapter-row-title {
            color: #f8fafc;
        }
        .dg-chapter-row-sub {
            margin: 4px 0 0 0;
            font-size: 13.5px;
            color: #64748b;
        }
        body.dark-mode .dg-chapter-row-sub {
            color: #94a3b8;
        }
        .dg-doc-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 18px;
            min-height: 110px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        body.dark-mode .dg-doc-card {
            background: #0f172a;
            border-color: #334155;
        }
        .dg-doc-heading {
            margin: 0;
            font-size: 17px;
            font-weight: 700;
            color: var(--app-main-color, #020624);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }
        body.dark-mode .dg-doc-heading {
            color: #f8fafc;
        }
        .dg-doc-text {
            margin: 0;
            font-size: 15.5px;
            line-height: 1.8;
            white-space: pre-line;
            color: #1e293b;
        }
        body.dark-mode .dg-doc-text {
            color: #e2e8f0;
        }
        .dg-inline-img-box {
            margin: 14px 0;
            padding: 12px;
            border-radius: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        body.dark-mode .dg-inline-img-box {
            background: #1e293b;
            border-color: #334155;
        }
        .dg-inline-img-box img {
            width: 100%;
            max-height: 290px;
            object-fit: cover;
            border-radius: 12px;
        }
        .dg-inline-img-caption {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
            font-weight: 500;
        }
        body.dark-mode .dg-inline-img-caption {
            color: #cbd5e1;
        }
        .dg-inline-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin: 6px 6px 6px 0;
            padding: 10px 14px;
            border-radius: 12px;
            background: rgba(14, 165, 233, 0.12);
            border: 1px solid rgba(14, 165, 233, 0.35);
            color: #0284c7;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
        }
        body.dark-mode .dg-inline-link {
            color: #38bdf8;
        }
        .dg-editor-box {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 18px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
        }
        body.dark-mode .dg-editor-box {
            background: #0f172a;
            border-color: #334155;
        }
        .dg-editor-box input,
        .dg-editor-box textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 13px 14px;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            color: #0f172a;
            font-size: 15px;
            line-height: 1.5;
            font-family: inherit;
        }
        .dg-editor-box textarea {
            min-height: 190px;
        }
        body.dark-mode .dg-editor-box input,
        body.dark-mode .dg-editor-box textarea {
            background: #1e293b;
            color: #f8fafc;
            border-color: #334155;
        }
        .dg-tag-helper {
            font-size: 12.5px;
            line-height: 1.55;
            background: rgba(14, 165, 233, 0.08);
            border-left: 3px solid #0ea5e9;
            padding: 10px 12px;
            border-radius: 10px;
            color: #334155;
        }
        body.dark-mode .dg-tag-helper {
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
                <div class="dg-inline-img-box">
                    <img src="${url}" alt="${caption || "Driving Guide Image"}" onerror="this.src='${DEFAULT_GUIDE_IMG}'">
                    ${caption ? `<p class="dg-inline-img-caption">${caption}</p>` : ""}
                </div>
            `;
        }

        const linkMatch = part.match(/^\[link:\s*([^|\]]+?)\s*\|\s*([^\]]+)\]$/i);
        if (linkMatch) {
            const label = escapeHTML(linkMatch[1].trim());
            let href = linkMatch[2].trim();
            if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
            return `
                <a class="dg-inline-link" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">
                    🔗 ${label} ↗
                </a>
            `;
        }

        return `<span class="dg-doc-text">${escapeHTML(part)}</span>`;
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

function renderToolbarWithSearch(placeholderText, admin, addBtnId, addBtnLabel) {
    return `
        <div class="dg-native-toolbar">
            ${admin ? `<button id="${escapeHTML(addBtnId)}" type="button" class="dg-native-btn">${escapeHTML(addBtnLabel)}</button>` : ""}
            <div class="dg-toolbar-search">
                <span>🔍</span>
                <input id="dgSearchInput" type="search" value="${escapeHTML(guideSearchQuery)}" placeholder="${escapeHTML(placeholderText)}" autocomplete="off">
            </div>
        </div>
    `;
}

function bindSearchInput() {
    const input = document.getElementById("dgSearchInput");
    if (!input) return;
    input.addEventListener("input", () => {
        guideSearchQuery = input.value.trim().toLowerCase();
        renderDrivingGuideInSheet();
        const updatedInput = document.getElementById("dgSearchInput");
        if (updatedInput) {
            updatedInput.focus();
            const len = updatedInput.value.length;
            updatedInput.setSelectionRange(len, len);
        }
    });
}

function renderChapterListView(container, admin) {
    setHeaderBackMode("ড্রাইভিং গাইড");

    let html = renderToolbarWithSearch("অধ্যায় খুঁজুন...", admin, "dgNewChapterBtn", "＋ নতুন অধ্যায়");

    if (admin) {
        const editingChap = editingChapterId
            ? guideState.chapters.find(c => c.id === editingChapterId)
            : null;
        const formVisible = editingChap ? "" : "hidden";

        html += `
            <div id="dgChapterFormBox" class="dg-editor-box ${formVisible}">
                <input id="dgChapTitleIn" type="text" value="${escapeHTML(editingChap?.title || "")}" placeholder="অধ্যায়ের নাম (যেমন: ট্রাফিক আইন ও সিগন্যাল)">
                <input id="dgChapDescIn" type="text" value="${escapeHTML(editingChap?.description || "")}" placeholder="অধ্যায়ের সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)">
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button id="dgChapCancelBtn" type="button" class="dg-native-btn danger">বাতিল</button>
                    <button id="dgChapSaveBtn" type="button" class="dg-native-btn secondary">সেভ করুন</button>
                </div>
            </div>
        `;
    }

    const filteredChapters = guideState.chapters.filter(chap => {
        if (!guideSearchQuery) return true;
        const titleMatch = (chap.title || "").toLowerCase().includes(guideSearchQuery);
        const descMatch = (chap.description || "").toLowerCase().includes(guideSearchQuery);
        const docMatch = (chap.docs || []).some(d =>
            (d.title || "").toLowerCase().includes(guideSearchQuery) ||
            (d.body || "").toLowerCase().includes(guideSearchQuery)
        );
        return titleMatch || descMatch || docMatch;
    });

    if (!filteredChapters.length) {
        html += `
            <div class="dg-doc-card" style="text-align:center;">
                <p class="dg-doc-text" style="opacity:0.75;">কোনো অধ্যায় বা তথ্য পাওয়া যায়নি।</p>
            </div>
        `;
    } else {
        html += `<div class="dg-chapter-list">`;
        filteredChapters.forEach((chap, idx) => {
            const docCount = Array.isArray(chap.docs) ? chap.docs.length : 0;
            html += `
                <div class="dg-chapter-row" data-chap-id="${escapeHTML(chap.id)}">
                    <div>
                        <h3 class="dg-chapter-row-title">${idx + 1}. ${escapeHTML(chap.title)}</h3>
                        <p class="dg-chapter-row-sub">${escapeHTML(chap.description || `${docCount}টি ডকুমেন্ট`)}</p>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${admin ? `<button type="button" class="dg-native-btn edit dg-edit-chap" data-id="${escapeHTML(chap.id)}">✏️</button>` : ""}
                        ${admin ? `<button type="button" class="dg-native-btn danger dg-del-chap" data-id="${escapeHTML(chap.id)}">🗑️</button>` : ""}
                        <span style="font-size:18px;opacity:0.6;">›</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
    bindSearchInput();

    document.getElementById("dgNewChapterBtn")?.addEventListener("click", () => {
        editingChapterId = null;
        const box = document.getElementById("dgChapterFormBox");
        if (box) {
            box.classList.remove("hidden");
            document.getElementById("dgChapTitleIn").value = "";
            document.getElementById("dgChapDescIn").value = "";
        }
    });

    document.getElementById("dgChapCancelBtn")?.addEventListener("click", () => {
        editingChapterId = null;
        document.getElementById("dgChapterFormBox")?.classList.add("hidden");
    });

    document.getElementById("dgChapSaveBtn")?.addEventListener("click", async () => {
        const title = document.getElementById("dgChapTitleIn")?.value.trim();
        const description = document.getElementById("dgChapDescIn")?.value.trim() || "";
        if (!title) return showGuideToast("অধ্যায়ের নাম লিখুন");

        if (editingChapterId) {
            const target = guideState.chapters.find(c => c.id === editingChapterId);
            if (target) {
                target.title = title;
                target.description = description;
            }
            editingChapterId = null;
        } else {
            const chap = {
                id: generateGuideId("chap"),
                title,
                description,
                docs: [],
                createdAt: Date.now()
            };
            guideState.chapters.push(chap);
            activeChapterId = chap.id;
        }
        await persistGuide();
    });

    container.querySelectorAll(".dg-chapter-row").forEach(row => {
        row.addEventListener("click", () => {
            activeChapterId = row.getAttribute("data-chap-id");
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

    let html = renderToolbarWithSearch("বিষয় খুঁজুন...", admin, "dgToggleDocEditorBtn", "＋ নতুন ডকুমেন্ট");

    const docs = Array.isArray(chapter.docs) ? chapter.docs : [];
    const editingDoc = editingDocId ? docs.find(d => d.id === editingDocId) : null;

    if (admin) {
        const editorVisible = editingDoc ? "" : "hidden";
        html += `
            <div id="dgDocEditorBox" class="dg-editor-box ${editorVisible}">
                <input id="dgDocTitleIn" type="text" value="${escapeHTML(editingDoc?.title || "")}" placeholder="ডকুমেন্টের শিরোনাম (ঐচ্ছিক)">
                <div class="dg-tag-helper">
                    একটিমাত্র লেখার ভেতরে একাধিক ছবি ও লিংক দিতে নিচের ফরম্যাট ব্যবহার করুন:<br>
                    <strong>[img: ছবির_লিংক | ছবির_ক্যাপশন_বা_ব্যাখ্যা]</strong><br>
                    <strong>[link: লিংকের_নাম | https://example.com]</strong>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                    <button id="dgInsertImgTagBtn" type="button" class="dg-native-btn secondary">+ ছবি ট্যাগ</button>
                    <button id="dgInsertLinkTagBtn" type="button" class="dg-native-btn secondary">+ লিংক ট্যাগ</button>
                </div>
                <textarea id="dgDocBodyIn" rows="8" placeholder="এখানে মূল লেখা লিখুন এবং লেখার মাঝে মাঝে [img: ...] ট্যাগ দিয়ে যত খুশি ছবি যুক্ত করুন...">${escapeHTML(editingDoc?.body || "")}</textarea>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button id="dgDocCancelBtn" type="button" class="dg-native-btn danger">বাতিল</button>
                    <button id="dgDocSaveBtn" type="button" class="dg-native-btn secondary">ডকুমেন্ট সেভ করুন</button>
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
            <div class="dg-doc-card" style="text-align:center;">
                <p class="dg-doc-text" style="opacity:0.75;">কোনো ডকুমেন্ট পাওয়া যায়নি।</p>
            </div>
        `;
    } else {
        filteredDocs.forEach(doc => {
            html += `
                <article class="dg-doc-card">
                    ${(doc.title || admin) ? `
                        <h3 class="dg-doc-heading">
                            <span>${escapeHTML(doc.title || "নোট")}</span>
                            <span style="display:inline-flex;gap:6px;">
                                ${admin ? `<button type="button" class="dg-native-btn edit dg-edit-doc" data-doc-id="${escapeHTML(doc.id)}">✏️</button>` : ""}
                                ${admin ? `<button type="button" class="dg-native-btn danger dg-del-doc" data-doc-id="${escapeHTML(doc.id)}">🗑️</button>` : ""}
                            </span>
                        </h3>
                    ` : ""}
                    <div>${renderRichTextWithMedia(doc.body || "")}</div>
                </article>
            `;
        });
    }

    container.innerHTML = html;
    bindSearchInput();

    const bodyArea = document.getElementById("dgDocBodyIn");

    document.getElementById("dgToggleDocEditorBtn")?.addEventListener("click", () => {
        editingDocId = null;
        const box = document.getElementById("dgDocEditorBox");
        if (box) {
            box.classList.remove("hidden");
            document.getElementById("dgDocTitleIn").value = "";
            document.getElementById("dgDocBodyIn").value = "";
        }
    });

    document.getElementById("dgDocCancelBtn")?.addEventListener("click", () => {
        editingDocId = null;
        document.getElementById("dgDocEditorBox")?.classList.add("hidden");
    });

    document.getElementById("dgInsertImgTagBtn")?.addEventListener("click", () => {
        if (!bodyArea) return;
        const snippet = `\n[img: https://example.com/image.jpg | ছবির সাথে অতিরিক্ত লেখা বা ক্যাপশন]\n`;
        bodyArea.value += snippet;
        bodyArea.focus();
    });

    document.getElementById("dgInsertLinkTagBtn")?.addEventListener("click", () => {
        if (!bodyArea) return;
        const snippet = `\n[link: রেফারেন্স লিংক | https://example.com]\n`;
        bodyArea.value += snippet;
        bodyArea.focus();
    });

    document.getElementById("dgDocSaveBtn")?.addEventListener("click", async () => {
        const title = document.getElementById("dgDocTitleIn")?.value.trim() || "";
        const body = document.getElementById("dgDocBodyIn")?.value.trim() || "";
        if (!body) return showGuideToast("ডকুমেন্টের লেখা লিখুন");

        if (!Array.isArray(chapter.docs)) chapter.docs = [];

        if (editingDocId) {
            const targetDoc = chapter.docs.find(d => d.id === editingDocId);
            if (targetDoc) {
                targetDoc.title = title;
                targetDoc.body = body;
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
            editingDocId = btn.getAttribute("data-doc-id");
            renderDrivingGuideInSheet();
        });
    });

    container.querySelectorAll(".dg-del-doc").forEach(btn => {
        btn.addEventListener("click", async () => {
            const docId = btn.getAttribute("data-doc-id");
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
    injectNativeStyles();
    startRealtimeSync();

    if (navigator.onLine) {
        try {
            const snap = await get(ref(db, DB_PATH));
            if (snap.exists() && Array.isArray(snap.val()?.chapters)) {
                guideState = snap.val();
                saveLocalGuide();
            }
        } catch (err) {
            console.warn("Driving guide fetch error:", err);
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
