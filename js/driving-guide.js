// js/driving-guide.js

import {
    ref,
    set,
    get,
    onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { db } from "./firebase.js";

const STORAGE_KEY = "rmp_driving_guide_v1";
const DB_PATH = "webapp/driving_guide";
const DEFAULT_GUIDE_IMG = "https://cdn-icons-png.flaticon.com/512/3097/3097144.png";

let guideState = {
    chapters: []
};

let activeChapterId = null;
let isListening = false;
let currentBlockType = "text";

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
    } else {
        alert(msg);
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
    renderDrivingGuideUI();

    if (!navigator.onLine) {
        showGuideToast("অফলাইনে সেভ হয়েছে! অনলাইন হলে সিঙ্ক হবে।");
        return;
    }

    try {
        await set(ref(db, DB_PATH), guideState);
        showGuideToast("ড্রাইভিং গাইড সেভ ও সিঙ্ক হয়েছে");
    } catch (err) {
        console.error("Firebase driving guide save error:", err);
        showGuideToast("ক্লাউডে সিঙ্ক করতে সমস্যা হয়েছে");
    }
}

function startRealtimeSync() {
    if (isListening) return;
    isListening = true;

    loadLocalGuide();

    const guideRef = ref(db, DB_PATH);
    onValue(guideRef, (snapshot) => {
        if (snapshot.exists()) {
            const val = snapshot.val();
            if (val && Array.isArray(val.chapters)) {
                guideState = val;
                saveLocalGuide();
                if (document.getElementById("drivingGuideModal") && !document.getElementById("drivingGuideModal").classList.contains("hidden")) {
                    renderDrivingGuideUI();
                }
            }
        }
    }, (err) => {
        console.warn("Driving guide realtime listener error:", err);
    });
}

function injectStyles() {
    if (document.getElementById("drivingGuideStyles")) return;

    const style = document.createElement("style");
    style.id = "drivingGuideStyles";
    style.textContent = `
        .dg-modal {
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 36, 0.72);
            backdrop-filter: blur(6px);
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px;
        }
        .dg-modal.hidden {
            display: none !important;
        }
        .dg-sheet {
            width: 100%;
            max-width: 780px;
            height: 90dvh;
            max-height: 860px;
            background: #f8fafc;
            color: #0f172a;
            border-radius: 22px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.14);
        }
        body.dark-mode .dg-sheet {
            background: #0f172a;
            color: #f1f5f9;
            border-color: #1e293b;
        }
        .dg-header {
            background: var(--app-main-color, #020624);
            color: #ffffff;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-shrink: 0;
        }
        .dg-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }
        .dg-title {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .dg-badge {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 999px;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.16);
            color: #e2e8f0;
            flex-shrink: 0;
        }
        .dg-icon-btn {
            background: rgba(255, 255, 255, 0.14);
            border: 1px solid rgba(255, 255, 255, 0.22);
            color: #ffffff;
            border-radius: 10px;
            height: 36px;
            padding: 0 11px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            flex-shrink: 0;
        }
        .dg-icon-btn:active {
            transform: scale(0.97);
        }
        .dg-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .dg-chapter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
            gap: 12px;
        }
        .dg-chapter-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 10px;
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        body.dark-mode .dg-chapter-card {
            background: #1e293b;
            border-color: #334155;
        }
        .dg-chapter-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }
        .dg-chapter-num {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #0ea5e9;
            letter-spacing: 0.4px;
        }
        .dg-chapter-title {
            margin: 3px 0 0 0;
            font-size: 16px;
            font-weight: 700;
            line-height: 1.35;
        }
        .dg-chapter-meta {
            font-size: 12px;
            color: #64748b;
        }
        body.dark-mode .dg-chapter-meta {
            color: #94a3b8;
        }
        .dg-admin-toolbar {
            background: #eef2ff;
            border: 1px solid #c7d2fe;
            border-radius: 16px;
            padding: 12px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
        }
        body.dark-mode .dg-admin-toolbar {
            background: rgba(30, 41, 59, 0.9);
            border-color: #334155;
        }
        .dg-btn-primary {
            background: var(--app-main-color, #020624);
            color: #ffffff;
            border: none;
            border-radius: 10px;
            padding: 9px 14px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .dg-btn-accent {
            background: #0ea5e9;
            color: #ffffff;
            border: none;
            border-radius: 10px;
            padding: 9px 14px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .dg-btn-danger {
            background: #ef4444;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 5px 9px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .dg-btn-soft {
            background: #e2e8f0;
            color: #1e293b;
            border: none;
            border-radius: 8px;
            padding: 5px 9px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        body.dark-mode .dg-btn-soft {
            background: #334155;
            color: #f8fafc;
        }
        .dg-block-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 14px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.03);
        }
        body.dark-mode .dg-block-card {
            background: #1e293b;
            border-color: #334155;
        }
        .dg-block-admin-bar {
            display: flex;
            justify-content: flex-end;
            gap: 6px;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #cbd5e1;
        }
        body.dark-mode .dg-block-admin-bar {
            border-bottom-color: #334155;
        }
        .dg-text-content {
            font-size: 15px;
            line-height: 1.7;
            white-space: pre-line;
            margin: 0;
        }
        .dg-image-block {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .dg-image-block.side-layout {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 14px;
            align-items: center;
        }
        @media (max-width: 540px) {
            .dg-image-block.side-layout {
                grid-template-columns: 1fr;
            }
        }
        .dg-image-block img {
            width: 100%;
            max-height: 260px;
            object-fit: cover;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        body.dark-mode .dg-image-block img {
            border-color: #334155;
        }
        .dg-image-caption-title {
            font-weight: 700;
            font-size: 15px;
            margin: 0 0 4px 0;
        }
        .dg-image-caption-text {
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
            margin: 0;
            white-space: pre-line;
        }
        body.dark-mode .dg-image-caption-text {
            color: #cbd5e1;
        }
        .dg-link-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 14px;
            border-radius: 14px;
            background: rgba(14, 165, 233, 0.08);
            border: 1px solid rgba(14, 165, 233, 0.3);
            text-decoration: none;
            color: inherit;
        }
        .dg-link-title {
            font-weight: 700;
            font-size: 14.5px;
            color: #0284c7;
            margin: 0 0 2px 0;
        }
        body.dark-mode .dg-link-title {
            color: #38bdf8;
        }
        .dg-link-desc {
            font-size: 12.5px;
            color: #64748b;
            margin: 0;
        }
        body.dark-mode .dg-link-desc {
            color: #94a3b8;
        }
        .dg-submodal {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 100010;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }
        .dg-submodal.hidden {
            display: none !important;
        }
        .dg-submodal-box {
            width: 100%;
            max-width: 440px;
            background: #ffffff;
            color: #0f172a;
            border-radius: 18px;
            padding: 18px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        body.dark-mode .dg-submodal-box {
            background: #1e293b;
            color: #f8fafc;
        }
        .dg-field {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .dg-field label {
            font-size: 13px;
            font-weight: 600;
        }
        .dg-field input,
        .dg-field textarea,
        .dg-field select {
            width: 100%;
            box-sizing: border-box;
            padding: 9px 11px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #0f172a;
            font-size: 14px;
            font-family: inherit;
        }
        body.dark-mode .dg-field input,
        body.dark-mode .dg-field textarea,
        body.dark-mode .dg-field select {
            background: #0f172a;
            color: #f8fafc;
            border-color: #334155;
        }
        .dg-empty {
            text-align: center;
            padding: 36px 16px;
            color: #64748b;
        }
    `;
    document.head.appendChild(style);
}

function buildModalDOM() {
    if (document.getElementById("drivingGuideModal")) return;

    const html = `
        <div id="drivingGuideModal" class="dg-modal hidden" role="dialog" aria-modal="true">
            <div class="dg-sheet">
                <div class="dg-header">
                    <div class="dg-header-left">
                        <button id="dgBackBtn" type="button" class="dg-icon-btn hidden">← অধ্যায়</button>
                        <h2 id="dgHeaderTitle" class="dg-title">🚗 ড্রাইভিং গাইড</h2>
                        <span id="dgRoleBadge" class="dg-badge">User</span>
                    </div>
                    <button id="dgCloseBtn" type="button" class="dg-icon-btn" title="বন্ধ করুন">✕</button>
                </div>

                <div id="dgBody" class="dg-body"></div>
            </div>
        </div>

        <!-- অধ্যায় তৈরির মডাল -->
        <div id="dgChapterModal" class="dg-submodal hidden">
            <div class="dg-submodal-box">
                <h3 style="margin:0;font-size:17px;">নতুন অধ্যায় যোগ করুন</h3>
                <div class="dg-field">
                    <label>অধ্যায়ের শিরোনাম *</label>
                    <input id="dgChapterTitleInput" type="text" placeholder="যেমন: ট্রাফিক আইন ও সিগন্যাল">
                </div>
                <div class="dg-field">
                    <label>সংক্ষিপ্ত বর্ণনা</label>
                    <input id="dgChapterDescInput" type="text" placeholder="যেমন: সড়কে নিরাপদ চলাচলের নিয়মাবলি">
                </div>
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
                    <button id="dgCancelChapterBtn" type="button" class="dg-btn-soft">বাতিল</button>
                    <button id="dgSaveChapterBtn" type="button" class="dg-btn-primary">সেভ করুন</button>
                </div>
            </div>
        </div>

        <!-- কন্টেন্ট ব্লক (Text / Image / Link) তৈরির মডাল -->
        <div id="dgBlockModal" class="dg-submodal hidden">
            <div class="dg-submodal-box">
                <h3 id="dgBlockModalTitle" style="margin:0;font-size:17px;">নতুন কন্টেন্ট যুক্ত করুন</h3>

                <div id="dgTextFields" class="dg-field">
                    <label>লেখা / ডকুমেন্ট *</label>
                    <textarea id="dgTextContentInput" rows="5" placeholder="এখানে অধ্যায়ের লেখা লিখুন..."></textarea>
                </div>

                <div id="dgImageFields" class="hidden" style="display:flex;flex-direction:column;gap:10px;">
                    <div class="dg-field">
                        <label>ছবির লিঙ্ক (URL) *</label>
                        <input id="dgImageUrlInput" type="url" placeholder="https://example.com/sign.png">
                    </div>
                    <div class="dg-field">
                        <label>ছবির অবস্থান / লেআউট</label>
                        <select id="dgImageLayoutInput">
                            <option value="full">ছবির নিচে লেখা (Full Width)</option>
                            <option value="side">ছবির পাশে লেখা (Side by Side)</option>
                        </select>
                    </div>
                    <div class="dg-field">
                        <label>ছবির শিরোনাম (ঐচ্ছিক)</label>
                        <input id="dgImageHeadingInput" type="text" placeholder="যেমন: ওয়ান-ওয়ে সাইন">
                    </div>
                    <div class="dg-field">
                        <label>ছবির সাথে অতিরিক্ত লেখা / ক্যাপশন</label>
                        <textarea id="dgImageCaptionInput" rows="3" placeholder="ছবিটি সম্পর্কে বিস্তারিত বা নির্দেশনা লিখুন..."></textarea>
                    </div>
                </div>

                <div id="dgLinkFields" class="hidden" style="display:flex;flex-direction:column;gap:10px;">
                    <div class="dg-field">
                        <label>লিংকের নাম / শিরোনাম *</label>
                        <input id="dgLinkTitleInput" type="text" placeholder="যেমন: BRTA ড্রাইভিং লাইসেন্স নির্দেশিকা">
                    </div>
                    <div class="dg-field">
                        <label>লিংক (URL) *</label>
                        <input id="dgLinkUrlInput" type="url" placeholder="https://example.com">
                    </div>
                    <div class="dg-field">
                        <label>লিংক সম্পর্কে সংক্ষিপ্ত নোট</label>
                        <input id="dgLinkDescInput" type="text" placeholder="যেমন: প্রয়োজনীয় কাগজপত্র ও নিয়ম">
                    </div>
                </div>

                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
                    <button id="dgCancelBlockBtn" type="button" class="dg-btn-soft">বাতিল</button>
                    <button id="dgSaveBlockBtn" type="button" class="dg-btn-accent">যুক্ত করুন</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    document.getElementById("dgCloseBtn").addEventListener("click", closeDrivingGuide);
    document.getElementById("dgBackBtn").addEventListener("click", () => {
        activeChapterId = null;
        renderDrivingGuideUI();
    });

    document.getElementById("drivingGuideModal").addEventListener("click", (e) => {
        if (e.target.id === "drivingGuideModal") closeDrivingGuide();
    });

    document.getElementById("dgCancelChapterBtn").addEventListener("click", () => {
        document.getElementById("dgChapterModal").classList.add("hidden");
    });
    document.getElementById("dgSaveChapterBtn").addEventListener("click", handleSaveChapter);

    document.getElementById("dgCancelBlockBtn").addEventListener("click", () => {
        document.getElementById("dgBlockModal").classList.add("hidden");
    });
    document.getElementById("dgSaveBlockBtn").addEventListener("click", handleSaveBlock);
}

function openChapterModal() {
    if (!isAdminUser()) return;
    document.getElementById("dgChapterTitleInput").value = "";
    document.getElementById("dgChapterDescInput").value = "";
    document.getElementById("dgChapterModal").classList.remove("hidden");
}

async function handleSaveChapter() {
    if (!isAdminUser()) return;
    const title = document.getElementById("dgChapterTitleInput").value.trim();
    const desc = document.getElementById("dgChapterDescInput").value.trim();

    if (!title) {
        return showGuideToast("অধ্যায়ের শিরোনাম লিখুন");
    }

    const newChapter = {
        id: generateGuideId("chap"),
        title,
        description: desc,
        blocks: [],
        createdAt: Date.now()
    };

    guideState.chapters.push(newChapter);
    activeChapterId = newChapter.id;
    document.getElementById("dgChapterModal").classList.add("hidden");
    await persistGuide();
}

function openBlockModal(type) {
    if (!isAdminUser() || !activeChapterId) return;
    currentBlockType = type;

    const modal = document.getElementById("dgBlockModal");
    const titleEl = document.getElementById("dgBlockModalTitle");
    const textBox = document.getElementById("dgTextFields");
    const imgBox = document.getElementById("dgImageFields");
    const linkBox = document.getElementById("dgLinkFields");

    textBox.classList.add("hidden");
    imgBox.classList.add("hidden");
    linkBox.classList.add("hidden");

    if (type === "text") {
        titleEl.textContent = "📝 নতুন লেখা / ডকুমেন্ট যুক্ত করুন";
        textBox.classList.remove("hidden");
        document.getElementById("dgTextContentInput").value = "";
    } else if (type === "image") {
        titleEl.textContent = "🖼️ লেখা/ক্যাপশনসহ ইমেজ যুক্ত করুন";
        imgBox.classList.remove("hidden");
        document.getElementById("dgImageUrlInput").value = "";
        document.getElementById("dgImageLayoutInput").value = "full";
        document.getElementById("dgImageHeadingInput").value = "";
        document.getElementById("dgImageCaptionInput").value = "";
    } else if (type === "link") {
        titleEl.textContent = "🔗 লিংক যুক্ত করুন";
        linkBox.classList.remove("hidden");
        document.getElementById("dgLinkTitleInput").value = "";
        document.getElementById("dgLinkUrlInput").value = "";
        document.getElementById("dgLinkDescInput").value = "";
    }

    modal.classList.remove("hidden");
}

async function handleSaveBlock() {
    if (!isAdminUser() || !activeChapterId) return;
    const chapter = guideState.chapters.find(c => c.id === activeChapterId);
    if (!chapter) return;

    if (!Array.isArray(chapter.blocks)) chapter.blocks = [];

    let newBlock = null;

    if (currentBlockType === "text") {
        const text = document.getElementById("dgTextContentInput").value.trim();
        if (!text) return showGuideToast("লেখা লিখুন");
        newBlock = {
            id: generateGuideId("blk"),
            type: "text",
            content: text
        };
    } else if (currentBlockType === "image") {
        const imageUrl = document.getElementById("dgImageUrlInput").value.trim();
        const layout = document.getElementById("dgImageLayoutInput").value;
        const heading = document.getElementById("dgImageHeadingInput").value.trim();
        const caption = document.getElementById("dgImageCaptionInput").value.trim();

        if (!imageUrl) return showGuideToast("ছবির লিঙ্ক দিন");
        newBlock = {
            id: generateGuideId("blk"),
            type: "image",
            imageUrl,
            layout,
            heading,
            caption
        };
    } else if (currentBlockType === "link") {
        const linkTitle = document.getElementById("dgLinkTitleInput").value.trim();
        const url = document.getElementById("dgLinkUrlInput").value.trim();
        const description = document.getElementById("dgLinkDescInput").value.trim();

        if (!linkTitle || !url) return showGuideToast("লিংকের নাম ও URL দিন");
        const safeUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        newBlock = {
            id: generateGuideId("blk"),
            type: "link",
            title: linkTitle,
            url: safeUrl,
            description
        };
    }

    if (newBlock) {
        chapter.blocks.push(newBlock);
        document.getElementById("dgBlockModal").classList.add("hidden");
        await persistGuide();
    }
}

async function moveBlock(chapterId, blockId, direction) {
    if (!isAdminUser()) return;
    const chapter = guideState.chapters.find(c => c.id === chapterId);
    if (!chapter || !Array.isArray(chapter.blocks)) return;

    const idx = chapter.blocks.findIndex(b => b.id === blockId);
    if (idx < 0) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= chapter.blocks.length) return;

    const temp = chapter.blocks[idx];
    chapter.blocks[idx] = chapter.blocks[targetIdx];
    chapter.blocks[targetIdx] = temp;

    await persistGuide();
}

async function deleteBlock(chapterId, blockId) {
    if (!isAdminUser()) return;
    const chapter = guideState.chapters.find(c => c.id === chapterId);
    if (!chapter || !Array.isArray(chapter.blocks)) return;

    chapter.blocks = chapter.blocks.filter(b => b.id !== blockId);
    await persistGuide();
}

async function deleteChapter(chapterId) {
    if (!isAdminUser()) return;
    guideState.chapters = guideState.chapters.filter(c => c.id !== chapterId);
    if (activeChapterId === chapterId) activeChapterId = null;
    await persistGuide();
}

function renderChapterList(bodyEl, admin) {
    let html = "";

    if (admin) {
        html += `
            <div class="dg-admin-toolbar">
                <button id="dgAddChapterBtn" type="button" class="dg-btn-primary">＋ নতুন অধ্যায় যোগ করুন</button>
                <span style="font-size:12px;opacity:0.8;">অ্যাডমিন প্যানেল সক্রিয়</span>
            </div>
        `;
    }

    if (!guideState.chapters.length) {
        html += `
            <div class="dg-empty">
                <div style="font-size:40px;margin-bottom:8px;">📘</div>
                <h3 style="margin:0 0 6px 0;">এখনো কোনো অধ্যায় যুক্ত করা হয়নি</h3>
                <p style="margin:0;font-size:13px;">${admin ? "উপরের বাটনে ক্লিক করে প্রথম অধ্যায় তৈরি করুন।" : "অ্যাডমিন অধ্যায় যুক্ত করলে এখানে দেখা যাবে।"}</p>
            </div>
        `;
        bodyEl.innerHTML = html;
        document.getElementById("dgAddChapterBtn")?.addEventListener("click", openChapterModal);
        return;
    }

    html += `<div class="dg-chapter-grid">`;
    guideState.chapters.forEach((chap, index) => {
        const blockCount = Array.isArray(chap.blocks) ? chap.blocks.length : 0;
        html += `
            <div class="dg-chapter-card" data-chap-id="${escapeHTML(chap.id)}">
                <div>
                    <div class="dg-chapter-num">অধ্যায় ${index + 1}</div>
                    <h3 class="dg-chapter-title">${escapeHTML(chap.title)}</h3>
                    ${chap.description ? `<p class="dg-chapter-meta" style="margin:6px 0 0 0;">${escapeHTML(chap.description)}</p>` : ""}
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                    <span class="dg-chapter-meta">${blockCount}টি সেকশন</span>
                    ${admin ? `<button type="button" class="dg-btn-danger dg-del-chap" data-del-id="${escapeHTML(chap.id)}">🗑️</button>` : ""}
                </div>
            </div>
        `;
    });
    html += `</div>`;

    bodyEl.innerHTML = html;

    document.getElementById("dgAddChapterBtn")?.addEventListener("click", openChapterModal);

    bodyEl.querySelectorAll(".dg-chapter-card").forEach(card => {
        card.addEventListener("click", () => {
            activeChapterId = card.getAttribute("data-chap-id");
            renderDrivingGuideUI();
        });
    });

    bodyEl.querySelectorAll(".dg-del-chap").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute("data-del-id");
            await deleteChapter(id);
        });
    });
}

function renderChapterReader(bodyEl, chapter, admin) {
    let html = "";

    if (admin) {
        html += `
            <div class="dg-admin-toolbar">
                <button id="dgAddTextBtn" type="button" class="dg-btn-primary">📝 লেখা যুক্ত করুন</button>
                <button id="dgAddImageBtn" type="button" class="dg-btn-accent">🖼️ ছবি + লেখা যুক্ত করুন</button>
                <button id="dgAddLinkBtn" type="button" class="dg-btn-primary" style="background:#059669;">🔗 লিংক যুক্ত করুন</button>
            </div>
        `;
    }

    if (chapter.description) {
        html += `
            <div class="dg-block-card" style="border-left:4px solid #0ea5e9;">
                <p class="dg-text-content" style="font-size:14px;">${escapeHTML(chapter.description)}</p>
            </div>
        `;
    }

    const blocks = Array.isArray(chapter.blocks) ? chapter.blocks : [];

    if (!blocks.length) {
        html += `
            <div class="dg-empty">
                <p style="margin:0;">এই অধ্যায়ে এখনো কোনো ডকুমেন্ট বা কন্টেন্ট নেই।</p>
            </div>
        `;
    } else {
        blocks.forEach((blk, idx) => {
            html += `<div class="dg-block-card">`;

            if (admin) {
                html += `
                    <div class="dg-block-admin-bar">
                        ${idx > 0 ? `<button type="button" class="dg-btn-soft dg-move-up" data-blk-id="${escapeHTML(blk.id)}">↑ উপরে</button>` : ""}
                        ${idx < blocks.length - 1 ? `<button type="button" class="dg-btn-soft dg-move-down" data-blk-id="${escapeHTML(blk.id)}">↓ নিচে</button>` : ""}
                        <button type="button" class="dg-btn-danger dg-del-blk" data-blk-id="${escapeHTML(blk.id)}">🗑️</button>
                    </div>
                `;
            }

            if (blk.type === "text") {
                html += `<p class="dg-text-content">${escapeHTML(blk.content)}</p>`;
            } else if (blk.type === "image") {
                const layoutClass = blk.layout === "side" ? "dg-image-block side-layout" : "dg-image-block";
                const safeImg = escapeHTML(blk.imageUrl || DEFAULT_GUIDE_IMG);
                html += `
                    <div class="${layoutClass}">
                        <img src="${safeImg}" alt="${escapeHTML(blk.heading || "Driving Guide Image")}" onerror="this.src='${DEFAULT_GUIDE_IMG}'">
                        <div>
                            ${blk.heading ? `<h4 class="dg-image-caption-title">${escapeHTML(blk.heading)}</h4>` : ""}
                            ${blk.caption ? `<p class="dg-image-caption-text">${escapeHTML(blk.caption)}</p>` : ""}
                        </div>
                    </div>
                `;
            } else if (blk.type === "link") {
                html += `
                    <a class="dg-link-card" href="${escapeHTML(blk.url)}" target="_blank" rel="noopener noreferrer">
                        <div>
                            <h4 class="dg-link-title">🔗 ${escapeHTML(blk.title)}</h4>
                            ${blk.description ? `<p class="dg-link-desc">${escapeHTML(blk.description)}</p>` : ""}
                        </div>
                        <span style="font-size:16px;font-weight:700;color:#0284c7;">↗</span>
                    </a>
                `;
            }

            html += `</div>`;
        });
    }

    bodyEl.innerHTML = html;

    if (admin) {
        document.getElementById("dgAddTextBtn")?.addEventListener("click", () => openBlockModal("text"));
        document.getElementById("dgAddImageBtn")?.addEventListener("click", () => openBlockModal("image"));
        document.getElementById("dgAddLinkBtn")?.addEventListener("click", () => openBlockModal("link"));

        bodyEl.querySelectorAll(".dg-move-up").forEach(btn => {
            btn.addEventListener("click", () => moveBlock(chapter.id, btn.getAttribute("data-blk-id"), -1));
        });
        bodyEl.querySelectorAll(".dg-move-down").forEach(btn => {
            btn.addEventListener("click", () => moveBlock(chapter.id, btn.getAttribute("data-blk-id"), 1));
        });
        bodyEl.querySelectorAll(".dg-del-blk").forEach(btn => {
            btn.addEventListener("click", () => deleteBlock(chapter.id, btn.getAttribute("data-blk-id")));
        });
    }
}

export function renderDrivingGuideUI() {
    const modal = document.getElementById("drivingGuideModal");
    const bodyEl = document.getElementById("dgBody");
    const titleEl = document.getElementById("dgHeaderTitle");
    const badgeEl = document.getElementById("dgRoleBadge");
    const backBtn = document.getElementById("dgBackBtn");

    if (!modal || !bodyEl) return;

    const admin = isAdminUser();
    if (badgeEl) {
        badgeEl.textContent = admin ? "Admin Panel" : "User View";
    }

    if (activeChapterId) {
        const chapter = guideState.chapters.find(c => c.id === activeChapterId);
        if (chapter) {
            if (titleEl) titleEl.textContent = chapter.title;
            backBtn?.classList.remove("hidden");
            renderChapterReader(bodyEl, chapter, admin);
            return;
        }
        activeChapterId = null;
    }

    if (titleEl) titleEl.textContent = "🚗 ড্রাইভিং গাইড";
    backBtn?.classList.add("hidden");
    renderChapterList(bodyEl, admin);
}

export async function openDrivingGuide() {
    injectStyles();
    buildModalDOM();
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

    renderDrivingGuideUI();
    document.getElementById("drivingGuideModal")?.classList.remove("hidden");
}

export function closeDrivingGuide() {
    document.getElementById("drivingGuideModal")?.classList.add("hidden");
}

window.openDrivingGuide = openDrivingGuide;
window.closeDrivingGuide = closeDrivingGuide;
