// js/about-developer.js

const ABOUT_HIDE_IDS = [
    "mainDashboardView", "categoryDetailsView", "dataDetailsView",
    "searchBox", "subPageHeaderSearchWrapper", "slidingNoticeContainer",
    "subPageHeader", "pageHeader", "headerBadge", "dateTimeBar", "topDateTime"
];

const ABOUT_HIDE_SELECTORS = [
    ".page-header", ".sub-page-header", ".header-logo", ".app-logo",
    ".date-time", ".datetime", ".header-date", ".header-time"
];

const DEV_PHONE_LOCAL = "01723580852";
const DEV_PHONE_INTL = "8801723580852";
const DEV_PROFILE_IMG = "https://i.ibb.co/svHHtGfg/1001087129.jpg";

let isAboutActive = false;
let adDepth = 0;
let adSwallowPop = 0;
let adViewSnapshot = null;
let prevTitleText = "";
let prevBackHidden = true;
let prevMenuHidden = false;
let aboutTitleNow = "";
let aboutObserver = null;
let aboutEnforceTimer = null;
let aboutCurrentLang = localStorage.getItem("dev_page_lang") || "bn";
let aboutRoleIndex = 0;
let aboutCharIndex = 0;
let aboutIsDeleting = false;
let aboutTypingTimer = null;
let aboutParticleFrame = null;
let aboutViewportResizeFn = null;

const ABOUT_ROLES = {
    bn: [
        "অ্যান্ড্রয়েড অ্যাপ ডেভেলপার",
        "ওয়েব অ্যাপ্লিকেশন নির্মাতা",
        "মোবাইল-ফার্স্ট UI ডিজাইনার",
        "Firebase ও অফলাইন সলিউশন এক্সপার্ট"
    ],
    en: [
        "Android App Developer",
        "Web Application Creator",
        "Mobile-First UI Designer",
        "Firebase & Offline Solution Specialist"
    ]
};

function getSavedDarkMode() {
    const devTheme = localStorage.getItem("dev_page_theme");
    if (devTheme === "dark") return true;
    if (devTheme === "light") return false;

    const appTheme = localStorage.getItem("theme");
    if (appTheme === "dark") return true;
    if (appTheme === "light") return false;

    const darkFlag = localStorage.getItem("darkMode");
    if (darkFlag === "true" || darkFlag === "1") return true;
    if (darkFlag === "false" || darkFlag === "0") return false;

    return document.body.classList.contains("dark-mode");
}

function applySavedThemeState() {
    const isDark = getSavedDarkMode();
    document.body.classList.toggle("dark-mode", isDark);
    document.documentElement.classList.toggle("dark-mode", isDark);
    return isDark;
}

function saveThemeState(isDark) {
    localStorage.setItem("dev_page_theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    localStorage.setItem("darkMode", isDark ? "true" : "false");
    document.body.classList.toggle("dark-mode", isDark);
    document.documentElement.classList.toggle("dark-mode", isDark);
}

// পেজ লোড বা রিফ্রেশের পরও সেভ থাকা থিম বহাল রাখে
applySavedThemeState();

function backIconSvg() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`;
}

function moonIconSvg() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
}

function sunIconSvg() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
}

function langIconSvg() {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
}

function checkIconSvg() {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
}

function showAboutToast(msg) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2400);
    }
}

function getMainTopHeader() {
    const nav = document.getElementById("navToggleBtn");
    if (!nav) return null;
    const sheet = document.getElementById("mainScrollSheet");

    const byTag = nav.closest("header, .app-header, .top-bar, .topbar, .header, .navbar, .app-bar");
    if (byTag && !byTag.contains(sheet) && byTag !== document.body) return byTag;

    let el = nav;
    while (el.parentElement && el.parentElement !== document.body &&
           !(sheet && el.parentElement.contains(sheet))) {
        el = el.parentElement;
    }
    return el !== nav ? el : null;
}

function getExtraHeaderElements() {
    const found = new Set();
    const topHeader = getMainTopHeader();
    if (topHeader) found.add(topHeader);
    ABOUT_HIDE_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) found.add(el);
    });
    ABOUT_HIDE_SELECTORS.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            if (!el.closest("#aboutDeveloperSheetView")) {
                found.add(el);
            }
        });
    });
    return Array.from(found);
}

function injectAboutDeveloperStyles() {
    const oldStyle = document.getElementById("aboutDeveloperModuleStyles");
    if (oldStyle) oldStyle.remove();

    const style = document.createElement("style");
    style.id = "aboutDeveloperModuleStyles";
    style.textContent = `
        html.ad-about-lock,
        body.ad-about-active {
            overflow: hidden !important;
            height: 100% !important;
            max-height: 100% !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            overscroll-behavior: none !important;
        }

        #aboutDeveloperSheetView {
            --ad-main: var(--app-main-color, var(--primary-color, #020624));
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            z-index: 9990 !important;
            background: var(--bg-color, #f1f5f9) !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
        }
        body.dark-mode #aboutDeveloperSheetView {
            background: #03071e !important;
        }
        #aboutDeveloperSheetView.hidden {
            display: none !important;
        }

        #aboutDeveloperSheetView .ad-header {
            flex: 0 0 auto !important;
            flex-shrink: 0 !important;
            position: relative !important;
            width: 100% !important;
            z-index: 20 !important;
            background: radial-gradient(circle at top right, #13277a 0%, #07103a 52%, #020624 100%) !important;
            box-shadow: 0 10px 26px rgba(2, 6, 36, 0.38) !important;
            border-radius: 0 0 32px 32px !important;
            overflow: hidden !important;
            touch-action: none !important;
        }

        #aboutDeveloperSheetView .ad-topbar {
            position: relative !important;
            z-index: 3 !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            box-sizing: border-box !important;
            padding: calc(env(safe-area-inset-top, 0px) + 10px) 14px 6px !important;
            color: #ffffff !important;
            background: transparent !important;
        }
        #aboutDeveloperSheetView .ad-topbar-title {
            flex: 1 !important;
            min-width: 0 !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            color: #ffffff !important;
        }
        #aboutDeveloperSheetView .ad-pill-btn {
            background: rgba(255, 255, 255, 0.14) !important;
            border: 1px solid rgba(255, 255, 255, 0.24) !important;
            color: #ffffff !important;
            padding: 5px 11px !important;
            border-radius: 999px !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            font-family: inherit !important;
            min-height: 36px !important;
            box-sizing: border-box !important;
        }
        #aboutDeveloperSheetView .ad-back-btn,
        #aboutDeveloperSheetView .ad-theme-btn {
            width: 36px !important;
            height: 36px !important;
            padding: 0 !important;
            flex-shrink: 0 !important;
        }

        #aboutDeveloperSheetView .ad-hero-full-fixed {
            position: relative !important;
            width: 100% !important;
            overflow: hidden !important;
            background: transparent !important;
            padding: 8px 16px 20px !important;
            margin: 0 !important;
            text-align: center !important;
            color: #ffffff !important;
            box-sizing: border-box !important;
        }

        #aboutDeveloperSheetView .ad-hero-full-fixed::after {
            content: "" !important;
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            height: 18px !important;
            background: linear-gradient(to bottom, transparent, rgba(2, 6, 36, 0.28)) !important;
            pointer-events: none !important;
        }

        #aboutDeveloperSheetView .ad-scroll-body {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            height: 0 !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior-y: contain !important;
            touch-action: pan-y !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
            padding: 16px 14px calc(env(safe-area-inset-bottom, 0px) + 60px) !important;
            position: relative !important;
            z-index: 10 !important;
            box-sizing: border-box !important;
        }

        #adParticleCanvas {
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            opacity: 0.45;
        }

        .ad-hero-content {
            position: relative;
            z-index: 2;
            max-width: 600px;
            margin: 0 auto;
        }

        .ad-avatar-wrapper {
            position: relative;
            width: 104px;
            height: 104px;
            margin: 0 auto 10px;
            cursor: pointer;
        }

        .ad-avatar-ring {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            padding: 3.5px;
            background: linear-gradient(135deg, #00d2ff, #f59e0b, #a855f7);
            box-shadow: 0 8px 24px rgba(0, 210, 255, 0.35);
        }

        .ad-avatar-inner {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #020624;
            padding: 3px;
            overflow: hidden;
        }

        .ad-avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ad-avatar-img img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            display: block;
        }

        .ad-verified-badge {
            position: absolute;
            bottom: 2px;
            right: 2px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: #ffffff;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 2.5px solid #020624;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
        }

        .ad-dev-name {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 2px;
            color: #ffffff;
        }

        .ad-dev-subname {
            font-family: "Poppins", sans-serif;
            font-size: 11.5px;
            color: #00d2ff;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin: 0 0 9px;
        }

        .ad-typing-role {
            display: block;
            width: fit-content;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 5px 15px;
            border-radius: 22px;
            font-size: 13px;
            color: #f8fafc;
            min-height: 30px;
        }

        .ad-cursor {
            display: inline-block;
            width: 2px;
            background-color: #00d2ff;
            animation: adBlink 0.8s infinite;
        }

        @keyframes adBlink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
        }

        .ad-card {
            background: #ffffff;
            border-radius: 20px;
            padding: 18px;
            box-shadow: 0 8px 22px rgba(2, 6, 36, 0.08);
            border: 1px solid rgba(2, 6, 36, 0.08);
            color: #0f172a;
            flex-shrink: 0;
        }

        body.dark-mode #aboutDeveloperSheetView .ad-card {
            background: #070d2d;
            border-color: rgba(0, 210, 255, 0.16);
            color: #f8fafc;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
        }

        .ad-section-title {
            font-size: 16.5px;
            font-weight: 700;
            margin: 0 0 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .ad-section-title .ad-sec-icon {
            color: #00d2ff;
            background: var(--ad-main);
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            flex-shrink: 0;
        }

        .ad-bio-text {
            font-size: 14.5px;
            line-height: 1.7;
            color: #475569;
            margin: 0;
            text-align: justify;
        }

        body.dark-mode #aboutDeveloperSheetView .ad-bio-text {
            color: #cbd5e1;
        }

        .ad-highlight-banner {
            margin-top: 12px;
            background: linear-gradient(135deg, rgba(2, 6, 36, 0.05), rgba(0, 210, 255, 0.12));
            border-left: 4px solid #f59e0b;
            padding: 10px 13px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            font-weight: 600;
        }

        .ad-highlight-banner i,
        .ad-highlight-banner svg {
            color: #f59e0b;
            font-size: 17px;
            flex-shrink: 0;
        }

        .ad-skill-bars {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 14px;
        }

        .ad-skill-top {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .ad-skill-pct {
            font-family: "Poppins", sans-serif;
            color: var(--ad-main);
        }

        body.dark-mode #aboutDeveloperSheetView .ad-skill-pct {
            color: #00d2ff;
        }

        .ad-progress-track {
            width: 100%;
            height: 8px;
            background: rgba(148, 163, 184, 0.25);
            border-radius: 10px;
            overflow: hidden;
        }

        .ad-progress-fill {
            height: 100%;
            border-radius: 10px;
            background: linear-gradient(90deg, var(--ad-main), #00d2ff);
        }

        .ad-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .ad-chip {
            background: rgba(148, 163, 184, 0.14);
            border: 1px solid rgba(148, 163, 184, 0.25);
            padding: 6px 11px;
            border-radius: 12px;
            font-size: 12.5px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .ad-filter-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }

        .ad-filter-tab {
            background: rgba(148, 163, 184, 0.15);
            border: 1px solid rgba(148, 163, 184, 0.25);
            color: inherit;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
        }

        .ad-filter-tab.active {
            background: var(--ad-main);
            color: #ffffff;
            border-color: var(--ad-main);
        }

        .ad-project-item {
            background: rgba(148, 163, 184, 0.1);
            border-radius: 14px;
            padding: 13px;
            margin-bottom: 10px;
            border-left: 4px solid var(--ad-main);
        }

        body.dark-mode #aboutDeveloperSheetView .ad-project-item {
            border-left-color: #00d2ff;
        }

        .ad-project-item:last-child {
            margin-bottom: 0;
        }

        .ad-project-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
        }

        .ad-project-title {
            font-weight: 700;
            font-size: 14.5px;
        }

        .ad-project-badge {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 8px;
            background: var(--ad-main);
            color: #ffffff;
            font-family: "Poppins", sans-serif;
            white-space: nowrap;
        }

        .ad-project-desc {
            font-size: 13px;
            color: #475569;
            margin: 0 0 8px;
        }

        body.dark-mode #aboutDeveloperSheetView .ad-project-desc {
            color: #cbd5e1;
        }

        .ad-project-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .ad-p-tag {
            font-size: 11px;
            font-family: "Poppins", sans-serif;
            padding: 2px 8px;
            border-radius: 6px;
            border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .ad-timeline {
            padding-left: 18px;
            border-left: 2px dashed rgba(0, 210, 255, 0.55);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .ad-timeline-step {
            position: relative;
        }

        .ad-timeline-step::before {
            content: "";
            position: absolute;
            left: -24px;
            top: 5px;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #00d2ff;
        }

        .ad-timeline-title {
            font-size: 13.5px;
            font-weight: 700;
        }

        .ad-timeline-sub {
            font-size: 12.5px;
            color: #475569;
        }

        body.dark-mode #aboutDeveloperSheetView .ad-timeline-sub {
            color: #cbd5e1;
        }

        .ad-action-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }

        .ad-action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 11px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            font-family: inherit;
            color: #ffffff;
        }

        .ad-btn-call { background: linear-gradient(135deg, #10b981, #059669); }
        .ad-btn-wa { background: linear-gradient(135deg, #25d366, #128c7e); }
        .ad-btn-email { background: linear-gradient(135deg, #020624, #172554); }
        .ad-btn-gh { background: linear-gradient(135deg, #334155, #1e293b); }

        .ad-full-btn {
            width: 100%;
            margin-top: 10px;
            padding: 11px;
            border-radius: 12px;
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-family: inherit;
        }

        .ad-feedback-btn {
            background: transparent;
            color: inherit;
            border: 1.5px solid var(--ad-main);
        }

        body.dark-mode #aboutDeveloperSheetView .ad-feedback-btn {
            border-color: #00d2ff;
        }

        .ad-share-btn {
            background: linear-gradient(90deg, var(--ad-main), #1e3a8a);
            color: #ffffff;
            border: none;
        }

        .ad-modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 36, 0.92);
            z-index: 99999;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .ad-modal-overlay.open {
            display: flex;
        }

        .ad-modal-close {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.16);
            color: #ffffff;
            border: none;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
        }

        .ad-modal-avatar {
            width: 220px;
            height: 220px;
            border-radius: 50%;
            border: 4px solid #00d2ff;
            overflow: hidden;
        }

        .ad-modal-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .ad-feedback-box {
            background: #ffffff;
            color: #0f172a;
            width: 100%;
            max-width: 400px;
            border-radius: 20px;
            padding: 20px;
        }

        body.dark-mode .ad-feedback-box {
            background: #070d2d;
            color: #f8fafc;
        }

        .ad-feedback-input, .ad-feedback-textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 10px 12px;
            margin-top: 10px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            font-family: inherit;
            font-size: 13.5px;
        }

        .ad-feedback-textarea {
            min-height: 88px;
            resize: none;
        }
    `;
    document.head.appendChild(style);
}

function syncAboutViewportHeight() {
    const view = document.getElementById("aboutDeveloperSheetView");
    if (!view || !isAboutActive) return;
    const h = window.innerHeight || document.documentElement.clientHeight;
    view.style.setProperty("height", h + "px", "important");
    view.style.setProperty("max-height", h + "px", "important");
}

function ensureAboutSheetContainer() {
    let view = document.getElementById("aboutDeveloperSheetView");
    if (!view) {
        view = document.createElement("div");
        view.id = "aboutDeveloperSheetView";
        view.className = "hidden";
    }
    if (view.parentElement !== document.body) {
        document.body.appendChild(view);
    }
    return view;
}

function pushAboutState(level) {
    let pushed = false;
    try {
        history.pushState({ adLevel: level }, "", location.href);
        pushed = true;
    } catch (e) { pushed = false; }
    adDepth = pushed ? level : 0;
}

window.addEventListener("popstate", (e) => {
    if (adSwallowPop > 0) {
        adSwallowPop--;
        e.stopImmediatePropagation();
        return;
    }
    if (!isAboutActive) {
        if (adViewSnapshot) hideMainViewsForAbout(false);
        return;
    }

    e.stopImmediatePropagation();
    const lvl = e.state && typeof e.state.adLevel === "number" ? e.state.adLevel : 0;
    if (lvl >= 1) {
        adDepth = lvl;
        return;
    }
    adDepth = 0;
    closeAboutDeveloper(true);
}, true);

window.addEventListener("pageshow", (e) => {
    applySavedThemeState();
    if (!e || !e.persisted) return;
    if (isAboutActive) { enforceAboutUI(); return; }
    if (adViewSnapshot) hideMainViewsForAbout(false);
});

window.addEventListener("DOMContentLoaded", () => {
    applySavedThemeState();
});

function setAboutHeaderMode() {
    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");
    const navBtn = document.getElementById("navToggleBtn");

    aboutTitleNow = "";
    if (appTitleText) appTitleText.textContent = "";
    if (menuIcon && backIcon) {
        menuIcon.classList.add("hidden");
        backIcon.classList.remove("hidden");
    }

    if (navBtn && !navBtn.dataset.adBound) {
        navBtn.dataset.adBound = "1";
        navBtn.addEventListener("click", (e) => {
            if (!isAboutActive) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (adDepth > 0) {
                history.back();
            } else {
                closeAboutDeveloper();
            }
        }, true);
    }
}

function captureAboutHeaderState() {
    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");
    prevTitleText = appTitleText ? appTitleText.textContent : "";
    prevMenuHidden = menuIcon ? menuIcon.classList.contains("hidden") : false;
    prevBackHidden = backIcon ? backIcon.classList.contains("hidden") : true;
}

function restoreAboutHeaderMode() {
    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");

    if (appTitleText) appTitleText.textContent = prevTitleText || "RMP MT Contacts";
    if (menuIcon) menuIcon.classList.toggle("hidden", prevMenuHidden);
    if (backIcon) backIcon.classList.toggle("hidden", prevBackHidden);
}

function restoreHeroSlider() {
    const slider = document.getElementById("heroSlider");
    if (!slider) return;
    slider.classList.remove("hidden");
    slider.style.removeProperty("display");
    if (getComputedStyle(slider).display === "none") {
        slider.style.display = "";
    }
}

function hideMainViewsForAbout(hide) {
    if (hide) {
        adViewSnapshot = { ids: {}, extras: [] };
        ABOUT_HIDE_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            adViewSnapshot.ids[id] = { hidden: el.classList.contains("hidden"), display: el.style.display };
            el.classList.add("hidden");
        });
        getExtraHeaderElements().forEach(el => {
            adViewSnapshot.extras.push({
                el,
                hidden: el.classList.contains("hidden"),
                display: el.style.display
            });
            el.classList.add("hidden");
            el.style.display = "none";
        });
        const slider = document.getElementById("heroSlider");
        if (slider) {
            adViewSnapshot.slider = { hidden: slider.classList.contains("hidden"), display: slider.style.display };
            slider.style.display = "none";
        }
        return;
    }

    if (adViewSnapshot) {
        ABOUT_HIDE_IDS.forEach(id => {
            const el = document.getElementById(id);
            const snap = adViewSnapshot.ids ? adViewSnapshot.ids[id] : null;
            if (!el || !snap) return;
            el.classList.toggle("hidden", snap.hidden);
            el.style.display = snap.display;
        });
        if (Array.isArray(adViewSnapshot.extras)) {
            adViewSnapshot.extras.forEach(item => {
                if (!item.el) return;
                item.el.classList.toggle("hidden", item.hidden);
                item.el.style.display = item.display;
            });
        }
        if (adViewSnapshot.slider) {
            const slider = document.getElementById("heroSlider");
            if (slider) {
                slider.classList.toggle("hidden", adViewSnapshot.slider.hidden);
                slider.style.display = adViewSnapshot.slider.display;
            }
        }
        adViewSnapshot = null;
    }
    restoreHeroSlider();
}

function restoreMainVisibilityFallback() {
    const viewIds = ["mainDashboardView", "categoryDetailsView", "dataDetailsView"];
    const anyVisible = viewIds.some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains("hidden") && el.style.display !== "none";
    });
    if (!anyVisible) {
        const dash = document.getElementById("mainDashboardView");
        if (dash) {
            dash.classList.remove("hidden");
            dash.style.display = "";
        }
    }
    restoreHeroSlider();
}

function enforceAboutUI() {
    if (!isAboutActive) return;

    ABOUT_HIDE_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains("hidden")) el.classList.add("hidden");
    });
    getExtraHeaderElements().forEach(el => {
        if (!el.classList.contains("hidden")) el.classList.add("hidden");
        if (el.style.display !== "none") el.style.display = "none";
    });
    const slider = document.getElementById("heroSlider");
    if (slider && slider.style.display !== "none") slider.style.display = "none";

    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");
    if (appTitleText && appTitleText.textContent !== aboutTitleNow) {
        appTitleText.textContent = aboutTitleNow;
    }
    if (menuIcon && !menuIcon.classList.contains("hidden")) menuIcon.classList.add("hidden");
    if (backIcon && backIcon.classList.contains("hidden")) backIcon.classList.remove("hidden");

    const view = document.getElementById("aboutDeveloperSheetView");
    if (view && view.classList.contains("hidden")) view.classList.remove("hidden");
    syncAboutViewportHeight();
}

function scheduleAboutEnforce() {
    if (!isAboutActive || aboutEnforceTimer) return;
    aboutEnforceTimer = setTimeout(() => {
        aboutEnforceTimer = null;
        enforceAboutUI();
    }, 30);
}

function startAboutObserver() {
    stopAboutObserver();
    aboutObserver = new MutationObserver(scheduleAboutEnforce);
    const attrs = { attributes: true, attributeFilter: ["class", "style"] };
    [...ABOUT_HIDE_IDS, "menuIcon", "backIcon"].forEach(id => {
        const el = document.getElementById(id);
        if (el) aboutObserver.observe(el, attrs);
    });
    getExtraHeaderElements().forEach(el => {
        aboutObserver.observe(el, attrs);
    });
}

function stopAboutObserver() {
    if (aboutObserver) { aboutObserver.disconnect(); aboutObserver = null; }
    if (aboutEnforceTimer) { clearTimeout(aboutEnforceTimer); aboutEnforceTimer = null; }
}

function avatarSvgFallbackMarkup() {
    return `
        <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="adBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#020624"/>
                    <stop offset="100%" stop-color="#1e3a8a"/>
                </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#adBgGrad)"/>
            <circle cx="100" cy="76" r="36" fill="#e2e8f0"/>
            <path d="M40 185 C40 135, 160 135, 160 185" fill="#00d2ff"/>
            <text x="100" y="168" font-family="Poppins, sans-serif" font-size="22" font-weight="700" fill="#020624" text-anchor="middle">&lt;JR /&gt;</text>
        </svg>`;
}

function avatarMarkup() {
    return `<img src="${DEV_PROFILE_IMG}" alt="Md. Jewel Rana" loading="eager" onerror="this.parentElement.innerHTML = avatarSvgFallbackMarkup();">`;
}

function startAboutParticles() {
    if (aboutParticleFrame) cancelAnimationFrame(aboutParticleFrame);
    const canvas = document.getElementById("adParticleCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
        canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth : 360;
        canvas.height = canvas.parentElement ? canvas.parentElement.offsetHeight : 240;
        canvas.style.width = canvas.width + "px";
        canvas.style.height = canvas.height + "px";
    };
    resize();

    const particles = Array.from({ length: 20 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.8,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.35
    }));

    function step() {
        if (!isAboutActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0, 210, 255, 0.48)";
        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
        aboutParticleFrame = requestAnimationFrame(step);
    }
    step();
}

function startAboutTyping() {
    clearTimeout(aboutTypingTimer);
    aboutCharIndex = 0;
    aboutIsDeleting = false;

    function typeLoop() {
        if (!isAboutActive) return;
        const typedSpan = document.getElementById("adTypedText");
        if (!typedSpan) return;

        const list = ABOUT_ROLES[aboutCurrentLang] || ABOUT_ROLES.bn;
        const word = list[aboutRoleIndex % list.length];

        if (aboutIsDeleting) {
            typedSpan.textContent = word.substring(0, aboutCharIndex - 1);
            aboutCharIndex--;
        } else {
            typedSpan.textContent = word.substring(0, aboutCharIndex + 1);
            aboutCharIndex++;
        }

        let speed = aboutIsDeleting ? 40 : 80;
        if (!aboutIsDeleting && aboutCharIndex === word.length) {
            speed = 1800;
            aboutIsDeleting = true;
        } else if (aboutIsDeleting && aboutCharIndex === 0) {
            aboutIsDeleting = false;
            aboutRoleIndex++;
            speed = 400;
        }
        aboutTypingTimer = setTimeout(typeLoop, speed);
    }
    typeLoop();
}

function applyAboutLanguage(view, lang) {
    aboutCurrentLang = lang;
    localStorage.setItem("dev_page_lang", lang);

    const langText = view.querySelector("#adLangText");
    if (langText) langText.textContent = lang === "bn" ? "EN" : "বাংলা";

    setAboutHeaderMode();

    view.querySelectorAll("[data-bn]").forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });

    startAboutTyping();
    syncAboutViewportHeight();
}

function renderAboutDeveloperView(view) {
    setAboutHeaderMode();
    const isDarkNow = applySavedThemeState();

    view.innerHTML = `
        <div class="ad-header" id="adHeader">
            <canvas id="adParticleCanvas"></canvas>
            <div class="ad-topbar">
                <button type="button" class="ad-pill-btn ad-back-btn" id="adBackBtn" aria-label="Back">
                    ${backIconSvg()}
                </button>
                <div class="ad-topbar-title" data-bn="ডেভেলপার পরিচিতি" data-en="About Developer">ডেভেলপার পরিচিতি</div>
                <button type="button" class="ad-pill-btn" id="adLangBtn">
                    ${langIconSvg()} <span id="adLangText">${aboutCurrentLang === "bn" ? "EN" : "বাংলা"}</span>
                </button>
                <button type="button" class="ad-pill-btn ad-theme-btn" id="adThemeBtn" title="Toggle Dark Mode" aria-label="Toggle Theme">
                    <span id="adThemeIconWrap">${isDarkNow ? sunIconSvg() : moonIconSvg()}</span>
                </button>
            </div>

            <section class="ad-hero-full-fixed">
                <div class="ad-hero-content">
                    <div class="ad-avatar-wrapper" id="adAvatarOpen">
                        <div class="ad-avatar-ring">
                            <div class="ad-avatar-inner">
                                <div class="ad-avatar-img">${avatarMarkup()}</div>
                            </div>
                        </div>
                        <div class="ad-verified-badge" title="Verified Developer">
                            ${checkIconSvg()}
                        </div>
                    </div>

                    <h1 class="ad-dev-name" data-bn="মোঃ জুয়েল রানা" data-en="Md. Jewel Rana">মোঃ জুয়েল রানা</h1>
                    <p class="ad-dev-subname">Jewel Rana • App & Web Developer</p>

                    <div class="ad-typing-role">
                        <span id="adTypedText"></span><span class="ad-cursor">&nbsp;</span>
                    </div>
                </div>
            </section>
        </div>

        <div class="ad-scroll-body">
            <div class="ad-card">
                <h2 class="ad-section-title">
                    <span class="ad-sec-icon"><i class="fas fa-user-tie"></i></span>
                    <span data-bn="সংক্ষিপ্ত পরিচিতি" data-en="About Me">সংক্ষিপ্ত পরিচিতি</span>
                </h2>
                <p class="ad-bio-text" data-bn="আসসালামু আলাইকুম। আমি মোঃ জুয়েল রানা। পেশাগত দায়িত্ব পালনের পাশাপাশি প্রযুক্তির প্রতি ভালোবাসা থেকে আমি অ্যান্ড্রয়েড অ্যাপ এবং আধুনিক মোবাইল-ফ্রেন্ডলি ওয়েব অ্যাপ্লিকেশন ডেভেলপ করে থাকি। আমার তৈরি প্রতিটি অ্যাপ্লিকেশন ব্যবহারকারীদের দৈনন্দিন কাজ সহজ, দ্রুত এবং ইন্টারনেট ছাড়াও (Offline) নির্ভরযোগ্যভাবে ব্যবহার করার লক্ষ্যে ডিজাইন করা হয়।" data-en="Assalamu Alaikum. I am Md. Jewel Rana. Alongside my professional duties, my passion for technology drives me to build Android apps and modern mobile-friendly web applications. Every application I create is crafted to make daily workflows faster, simpler, and reliable even offline.">
                    আসসালামু আলাইকুম। আমি মোঃ জুয়েল রানা। পেশাগত দায়িত্ব পালনের পাশাপাশি প্রযুক্তির প্রতি ভালোবাসা থেকে আমি অ্যান্ড্রয়েড অ্যাপ এবং আধুনিক মোবাইল-ফ্রেন্ডলি ওয়েব অ্যাপ্লিকেশন ডেভেলপ করে থাকি। আমার তৈরি প্রতিটি অ্যাপ্লিকেশন ব্যবহারকারীদের দৈনন্দিন কাজ সহজ, দ্রুত এবং ইন্টারনেট ছাড়াও (Offline) নির্ভরযোগ্যভাবে ব্যবহার করার লক্ষ্যে ডিজাইন করা হয়।
                </p>
                <div class="ad-highlight-banner">
                    <i class="fas fa-mobile-screen-button"></i>
                    <span data-bn="বিশেষ অর্জন: কোনো কম্পিউটার ছাড়াই সম্পূর্ণ কোডিং, ডিজাইন ও অ্যাপ বিল্ডিং মোবাইল ফোনের মাধ্যমে সম্পন্ন।" data-en="Unique Achievement: 100% of coding, UI design, and app building executed directly on a mobile phone.">বিশেষ অর্জন: কোনো কম্পিউটার ছাড়াই সম্পূর্ণ কোডিং, ডিজাইন ও অ্যাপ বিল্ডিং মোবাইল ফোনের মাধ্যমে সম্পন্ন।</span>
                </div>
            </div>

            <div class="ad-card">
                <h2 class="ad-section-title">
                    <span class="ad-sec-icon"><i class="fas fa-code"></i></span>
                    <span data-bn="দক্ষতা ও প্রযুক্তিসমূহ" data-en="Skills & Technologies">দক্ষতা ও প্রযুক্তিসমূহ</span>
                </h2>

                <div class="ad-skill-bars">
                    <div>
                        <div class="ad-skill-top"><span>HTML5, CSS3 & Responsive Mobile UI</span><span class="ad-skill-pct">95%</span></div>
                        <div class="ad-progress-track"><div class="ad-progress-fill" style="width:95%;"></div></div>
                    </div>
                    <div>
                        <div class="ad-skill-top"><span>JavaScript & Offline LocalStorage</span><span class="ad-skill-pct">90%</span></div>
                        <div class="ad-progress-track"><div class="ad-progress-fill" style="width:90%;"></div></div>
                    </div>
                    <div>
                        <div class="ad-skill-top"><span>Firebase Realtime DB, Auth & FCM Push</span><span class="ad-skill-pct">88%</span></div>
                        <div class="ad-progress-track"><div class="ad-progress-fill" style="width:88%;"></div></div>
                    </div>
                    <div>
                        <div class="ad-skill-top"><span>Android App Dev (Sketchware Pro & GitHub)</span><span class="ad-skill-pct">92%</span></div>
                        <div class="ad-progress-track"><div class="ad-progress-fill" style="width:92%;"></div></div>
                    </div>
                </div>

                <div class="ad-chips">
                    <div class="ad-chip"><i class="fab fa-html5" style="color:#e34f26;"></i> HTML5</div>
                    <div class="ad-chip"><i class="fab fa-css3-alt" style="color:#1572b6;"></i> CSS3</div>
                    <div class="ad-chip"><i class="fab fa-js" style="color:#eab308;"></i> JavaScript</div>
                    <div class="ad-chip"><i class="fas fa-fire" style="color:#f59e0b;"></i> Firebase & FCM</div>
                    <div class="ad-chip"><i class="fab fa-android" style="color:#10b981;"></i> Sketchware Pro</div>
                    <div class="ad-chip"><i class="fab fa-github" style="color:#6366f1;"></i> GitHub Actions</div>
                </div>
            </div>

            <div class="ad-card">
                <h2 class="ad-section-title">
                    <span class="ad-sec-icon"><i class="fas fa-layer-group"></i></span>
                    <span data-bn="উল্লেখযোগ্য প্রজেক্টসমূহ" data-en="Featured Projects">উল্লেখযোগ্য প্রজেক্টসমূহ</span>
                </h2>

                <div class="ad-filter-tabs">
                    <button type="button" class="ad-filter-tab active" data-filter="all" data-bn="সব প্রজেক্ট (৩)" data-en="All (3)">সব প্রজেক্ট (৩)</button>
                    <button type="button" class="ad-filter-tab" data-filter="web" data-bn="ওয়েব অ্যাপ" data-en="Web Apps">ওয়েব অ্যাপ</button>
                    <button type="button" class="ad-filter-tab" data-filter="android" data-bn="অ্যান্ড্রয়েড" data-en="Android">অ্যান্ড্রয়েড</button>
                </div>

                <div class="ad-project-item" data-category="web android">
                    <div class="ad-project-head">
                        <span class="ad-project-title">RMP MT CONTACTS</span>
                        <span class="ad-project-badge">Web & Android</span>
                    </div>
                    <p class="ad-project-desc" data-bn="অফলাইন ফেভারিট সিস্টেম, অ্যাডমিন ম্যানেজমেন্ট প্যানেল, কাস্টম কালার ফরম্যাটার এবং ফুল-স্ক্রিন প্রোফাইল ভিউয়ার সমৃদ্ধ ডিরেক্টরি অ্যাপ।" data-en="Directory web & mobile app featuring offline favorites, admin management panel, custom color formatter, and full-screen profile viewer.">
                        অফলাইন ফেভারিট সিস্টেম, অ্যাডমিন ম্যানেজমেন্ট প্যানেল, কাস্টম কালার ফরম্যাটার এবং ফুল-স্ক্রিন প্রোফাইল ভিউয়ার সমৃদ্ধ ডিরেক্টরি অ্যাপ।
                    </p>
                    <div class="ad-project-tags">
                        <span class="ad-p-tag">Firebase</span>
                        <span class="ad-p-tag">Offline Cache</span>
                        <span class="ad-p-tag">Admin Panel</span>
                    </div>
                </div>

                <div class="ad-project-item" data-category="android">
                    <div class="ad-project-head">
                        <span class="ad-project-title">Tanore Thana Info App</span>
                        <span class="ad-project-badge">Android • Java</span>
                    </div>
                    <p class="ad-project-desc" data-bn="জরুরি যোগাযোগ, নোটিশ বোর্ড এবং Firebase Cloud Messaging পুশ নোটিফিকেশন সুবিধাসহ তথ্যসেবা অ্যান্ড্রয়েড অ্যাপ্লিকেশন।" data-en="Information & emergency contact Android application integrated with Firebase Cloud Messaging push notifications.">
                        জরুরি যোগাযোগ, নোটিশ বোর্ড এবং Firebase Cloud Messaging পুশ নোটিফিকেশন সুবিধাসহ তথ্যসেবা অ্যান্ড্রয়েড অ্যাপ্লিকেশন।
                    </p>
                    <div class="ad-project-tags">
                        <span class="ad-p-tag">Sketchware Pro</span>
                        <span class="ad-p-tag">FCM Push</span>
                        <span class="ad-p-tag">Topic Alerts</span>
                    </div>
                </div>

                <div class="ad-project-item" data-category="web">
                    <div class="ad-project-head">
                        <span class="ad-project-title">Smart Phone Log & Notice Portal</span>
                        <span class="ad-project-badge">Web • Firebase</span>
                    </div>
                    <p class="ad-project-desc" data-bn="ক্যাটাগরি ভিত্তিক কন্টাক্ট ম্যানেজমেন্ট এবং রিয়েল-টাইম নোটিশ আপডেট সিস্টেম।" data-en="Category-based contact management and real-time notice board system hosted via GitHub.">
                        ক্যাটাগরি ভিত্তিক কন্টাক্ট ম্যানেজমেন্ট এবং রিয়েল-টাইম নোটিশ আপডেট সিস্টেম।
                    </p>
                    <div class="ad-project-tags">
                        <span class="ad-p-tag">HTML/CSS/JS</span>
                        <span class="ad-p-tag">GitHub Pages</span>
                    </div>
                </div>
            </div>

            <div class="ad-card">
                <h2 class="ad-section-title">
                    <span class="ad-sec-icon"><i class="fas fa-bolt"></i></span>
                    <span data-bn="কাজের বৈশিষ্ট্য ও লক্ষ্য" data-en="Development Philosophy">কাজের বৈশিষ্ট্য ও লক্ষ্য</span>
                </h2>
                <div class="ad-timeline">
                    <div class="ad-timeline-step">
                        <div class="ad-timeline-title" data-bn="১০০% অফলাইন ফার্স্ট আর্কিটেকচার" data-en="100% Offline-First Architecture">১০০% অফলাইন ফার্স্ট আর্কিটেকচার</div>
                        <div class="ad-timeline-sub" data-bn="ইন্টারনেট সংযোগ না থাকলেও যেন জরুরি তথ্য ও ফেভারিট লিস্ট দেখা যায়।" data-en="Ensuring critical contacts and favorites remain accessible without internet.">ইন্টারনেট সংযোগ না থাকলেও যেন জরুরি তথ্য ও ফেভারিট লিস্ট দেখা যায়।</div>
                    </div>
                    <div class="ad-timeline-step">
                        <div class="ad-timeline-title" data-bn="সহজ ও দ্রুতগতির ইউজার ইন্টারফেস" data-en="Clean & Fast Mobile UI">সহজ ও দ্রুতগতির ইউজার ইন্টারফেস</div>
                        <div class="ad-timeline-sub" data-bn="যেকোনো অ্যান্ড্রয়েড ডিভাইসে ল্যাগ-ফ্রি এবং চোখের জন্য আরামদায়ক ডিজাইন।" data-en="Lag-free, eye-friendly design optimized for all Android screen sizes.">যেকোনো অ্যান্ড্রয়েড ডিভাইসে ল্যাগ-ফ্রি এবং চোখের জন্য আরামদায়ক ডিজাইন।</div>
                    </div>
                    <div class="ad-timeline-step">
                        <div class="ad-timeline-title" data-bn="রিয়েল-টাইম ক্লাউড আপডেট" data-en="Real-Time Cloud Sync">রিয়েল-টাইম ক্লাউড আপডেট</div>
                        <div class="ad-timeline-sub" data-bn="অ্যাপ আপডেট না করেই মুহূর্তের মধ্যে নতুন তথ্য ও নোটিশ যুক্ত করার সুবিধা।" data-en="Instant data and notice updates via Firebase without reinstalling the app.">অ্যাপ আপডেট না করেই মুহূর্তের মধ্যে নতুন তথ্য ও নোটিশ যুক্ত করার সুবিধা।</div>
                    </div>
                </div>
            </div>

            <div class="ad-card">
                <h2 class="ad-section-title">
                    <span class="ad-sec-icon"><i class="fas fa-headset"></i></span>
                    <span data-bn="যোগাযোগ ও মতামত" data-en="Contact & Feedback">যোগাযোগ ও মতামত</span>
                </h2>
                <p class="ad-bio-text" style="margin-bottom:12px;" data-bn="অ্যাপ সংক্রান্ত যেকোনো পরামর্শ, নতুন ফিচারের অনুরোধ অথবা কারিগরি সহায়তার জন্য সরাসরি যোগাযোগ করুন:" data-en="For any app feedback, feature requests, or technical support, feel free to connect directly:">
                    অ্যাপ সংক্রান্ত যেকোনো পরামর্শ, নতুন ফিচারের অনুরোধ অথবা কারিগরি সহায়তার জন্য সরাসরি যোগাযোগ করুন:
                </p>

                <div class="ad-action-grid">
                    <a href="tel:+${DEV_PHONE_INTL}" class="ad-action-btn ad-btn-call">
                        <i class="fas fa-phone-alt"></i>
                        <span data-bn="সরাসরি কল" data-en="Call Now">সরাসরি কল</span>
                    </a>
                    <a href="https://wa.me/${DEV_PHONE_INTL}" target="_blank" rel="noopener noreferrer" class="ad-action-btn ad-btn-wa">
                        <i class="fab fa-whatsapp"></i>
                        <span>WhatsApp</span>
                    </a>
                    <button type="button" class="ad-action-btn ad-btn-email" id="adCopyEmailBtn">
                        <i class="fas fa-envelope"></i>
                        <span data-bn="ইমেইল কপি" data-en="Copy Email">ইমেইল কপি</span>
                    </button>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="ad-action-btn ad-btn-gh">
                        <i class="fab fa-github"></i>
                        <span>GitHub</span>
                    </a>
                </div>

                <button type="button" class="ad-full-btn ad-feedback-btn" id="adOpenFeedbackBtn">
                    <i class="fas fa-comment-dots"></i>
                    <span data-bn="সরাসরি বার্তা / মতামত পাঠান" data-en="Send Direct Feedback">সরাসরি বার্তা / মতামত পাঠান</span>
                </button>

                <button type="button" class="ad-full-btn ad-share-btn" id="adShareBtn">
                    <i class="fas fa-share-nodes"></i>
                    <span data-bn="ডেভেলপার প্রোফাইল শেয়ার করুন" data-en="Share Developer Profile">ডেভেলপার প্রোফাইল শেয়ার করুন</span>
                </button>
            </div>
        </div>

        <div class="ad-modal-overlay" id="adProfileModal">
            <button type="button" class="ad-modal-close" id="adCloseProfileModal">&times;</button>
            <div class="ad-modal-avatar">${avatarMarkup()}</div>
            <div style="color:#ffffff; margin-top:14px; font-size:17px; font-weight:700;">মোঃ জুয়েল রানা (Jewel Rana)</div>
        </div>

        <div class="ad-modal-overlay" id="adFeedbackModal">
            <div class="ad-feedback-box">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:17px;" data-bn="ডেভেলপারকে বার্তা পাঠান" data-en="Message Developer">ডেভেলপারকে বার্তা পাঠান</h3>
                    <button type="button" id="adCloseFeedbackModal" style="background:none; border:none; color:inherit; font-size:20px; cursor:pointer;">&times;</button>
                </div>
                <input type="text" id="adSenderName" class="ad-feedback-input" placeholder="আপনার নাম / Your Name">
                <textarea id="adSenderMsg" class="ad-feedback-textarea" placeholder="আপনার পরামর্শ বা বার্তা লিখুন... / Write your message..."></textarea>
                <button type="button" class="ad-action-btn ad-btn-wa" style="width:100%; margin-top:12px;" id="adSendWaBtn">
                    <i class="fab fa-whatsapp"></i>
                    <span data-bn="WhatsApp-এ পাঠান" data-en="Send via WhatsApp">WhatsApp-এ পাঠান</span>
                </button>
            </div>
        </div>
    `;

    view.querySelector("#adBackBtn")?.addEventListener("click", () => {
        if (adDepth > 0) history.back(); else closeAboutDeveloper();
    });

    view.querySelector("#adLangBtn")?.addEventListener("click", () => {
        const nextLang = aboutCurrentLang === "bn" ? "en" : "bn";
        applyAboutLanguage(view, nextLang);
        showAboutToast(nextLang === "bn" ? "ভাষা বাংলায় পরিবর্তন করা হয়েছে" : "Language switched to English");
    });

    view.querySelector("#adThemeBtn")?.addEventListener("click", () => {
        const nextDark = !document.body.classList.contains("dark-mode");
        saveThemeState(nextDark);
        const iconWrap = view.querySelector("#adThemeIconWrap");
        if (iconWrap) iconWrap.innerHTML = nextDark ? sunIconSvg() : moonIconSvg();
    });

    view.querySelectorAll(".ad-filter-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            view.querySelectorAll(".ad-filter-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            const filter = tab.getAttribute("data-filter");
            view.querySelectorAll(".ad-project-item").forEach(item => {
                const cats = item.getAttribute("data-category") || "";
                item.style.display = (filter === "all" || cats.includes(filter)) ? "block" : "none";
            });
        });
    });

    const pModal = view.querySelector("#adProfileModal");
    view.querySelector("#adAvatarOpen")?.addEventListener("click", () => pModal?.classList.add("open"));
    view.querySelector("#adCloseProfileModal")?.addEventListener("click", () => pModal?.classList.remove("open"));
    pModal?.addEventListener("click", (e) => { if (e.target === pModal) pModal.classList.remove("open"); });

    const fModal = view.querySelector("#adFeedbackModal");
    view.querySelector("#adOpenFeedbackBtn")?.addEventListener("click", () => fModal?.classList.add("open"));
    view.querySelector("#adCloseFeedbackModal")?.addEventListener("click", () => fModal?.classList.remove("open"));
    fModal?.addEventListener("click", (e) => { if (e.target === fModal) fModal.classList.remove("open"); });

    view.querySelector("#adSendWaBtn")?.addEventListener("click", () => {
        const name = view.querySelector("#adSenderName")?.value.trim() || "User";
        const msg = view.querySelector("#adSenderMsg")?.value.trim() || "";
        if (!msg) {
            showAboutToast(aboutCurrentLang === "bn" ? "অনুগ্রহ করে আপনার বার্তা লিখুন" : "Please write your message");
            return;
        }
        const text = encodeURIComponent(`Assalamu Alaikum Jewel Rana,\nName: ${name}\nMessage: ${msg}`);
        window.open(`https://wa.me/${DEV_PHONE_INTL}?text=${text}`, "_blank");
        fModal?.classList.remove("open");
    });

    view.querySelector("#adCopyEmailBtn")?.addEventListener("click", () => {
        const email = "jewelrana.dev@example.com";
        navigator.clipboard?.writeText(email).then(() => {
            showAboutToast(aboutCurrentLang === "bn" ? "ইমেইল কপি করা হয়েছে: " + email : "Copied: " + email);
        });
    });

    view.querySelector("#adShareBtn")?.addEventListener("click", () => {
        const shareData = {
            title: "মোঃ জুয়েল রানা (Jewel Rana) - Developer",
            text: "অ্যান্ড্রয়েড ও ওয়েব অ্যাপ ডেভেলপার মোঃ জুয়েল রানার প্রোফাইল দেখুন।",
            url: window.location.href
        };
        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else {
            navigator.clipboard?.writeText(window.location.href);
            showAboutToast(aboutCurrentLang === "bn" ? "লিংক কপি করা হয়েছে" : "Link copied");
        }
    });

    applyAboutLanguage(view, aboutCurrentLang);
    syncAboutViewportHeight();
    startAboutParticles();
}

export function openAboutDeveloper() {
    applySavedThemeState();
    injectAboutDeveloperStyles();

    if (!isAboutActive) {
        captureAboutHeaderState();
        hideMainViewsForAbout(true);
        pushAboutState(1);
    }

    isAboutActive = true;
    document.documentElement.classList.add("ad-about-lock");
    document.body.classList.add("ad-about-active");

    const view = ensureAboutSheetContainer();
    if (view) {
        view.classList.remove("hidden");
        renderAboutDeveloperView(view);
    }

    if (aboutViewportResizeFn) window.removeEventListener("resize", aboutViewportResizeFn);
    aboutViewportResizeFn = syncAboutViewportHeight;
    window.addEventListener("resize", aboutViewportResizeFn);

    startAboutObserver();
}

export function closeAboutDeveloper(fromPop = false) {
    if (!isAboutActive) return;

    if (fromPop !== true && adDepth > 0) {
        adSwallowPop++;
        try { history.go(-adDepth); } catch (e) { adSwallowPop = 0; }
        setTimeout(() => { adSwallowPop = 0; }, 800);
    }
    adDepth = 0;

    clearTimeout(aboutTypingTimer);
    if (aboutParticleFrame) cancelAnimationFrame(aboutParticleFrame);
    if (aboutViewportResizeFn) {
        window.removeEventListener("resize", aboutViewportResizeFn);
        aboutViewportResizeFn = null;
    }
    stopAboutObserver();
    isAboutActive = false;
    document.documentElement.classList.remove("ad-about-lock");
    document.body.classList.remove("ad-about-active");

    const view = document.getElementById("aboutDeveloperSheetView");
    if (view) {
        view.classList.add("hidden");
        view.innerHTML = "";
    }

    restoreAboutHeaderMode();
    hideMainViewsForAbout(false);
    restoreMainVisibilityFallback();
    applySavedThemeState();
}

window.openAboutDeveloper = openAboutDeveloper;
window.closeAboutDeveloper = () => closeAboutDeveloper();
