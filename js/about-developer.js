// js/about-developer.js

const ABOUT_HIDE_IDS = [
    "mainDashboardView", "categoryDetailsView", "dataDetailsView",
    "heroSlider", "searchBox", "subPageHeaderSearchWrapper", "slidingNoticeContainer"
];

let isAboutActive = false;
let adDepth = 0;
let adSwallowPop = 0;
let adViewSnapshot = null;
let prevTitleText = "";
let prevBackHidden = true;
let prevMenuHidden = false;
let aboutTitleNow = "ডেভেলপার পরিচিতি";
let aboutObserver = null;
let aboutEnforceTimer = null;
let aboutCurrentLang = localStorage.getItem("dev_page_lang") || "bn";
let aboutRoleIndex = 0;
let aboutCharIndex = 0;
let aboutIsDeleting = false;
let aboutTypingTimer = null;
let aboutParticleFrame = null;

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

function showAboutToast(msg) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2400);
    }
}

function injectAboutDeveloperStyles() {
    if (document.getElementById("aboutDeveloperModuleStyles")) return;

    const style = document.createElement("style");
    style.id = "aboutDeveloperModuleStyles";
    style.textContent = `
        #aboutDeveloperSheetView {
            --ad-main: var(--app-main-color, var(--primary-color, #020624));
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding-bottom: 32px;
        }
        #aboutDeveloperSheetView.hidden {
            display: none !important;
        }

        .ad-hero-card {
            position: relative;
            overflow: hidden;
            background: radial-gradient(circle at top right, color-mix(in srgb, var(--ad-main) 78%, #3b82f6) 0%, var(--ad-main) 62%, #020624 100%);
            border-radius: 24px;
            padding: 24px 18px 26px;
            text-align: center;
            color: #ffffff;
            box-shadow: 0 12px 28px rgba(2, 6, 36, 0.22);
            border: 1px solid rgba(255, 255, 255, 0.12);
        }

        #adParticleCanvas {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0.45;
        }

        .ad-hero-content {
            position: relative;
            z-index: 2;
        }

        .ad-top-controls {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-bottom: 12px;
        }

        .ad-pill-btn {
            background: rgba(255, 255, 255, 0.14);
            border: 1px solid rgba(255, 255, 255, 0.24);
            color: #ffffff;
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-family: inherit;
        }

        .ad-status-pill {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: rgba(16, 185, 129, 0.18);
            border: 1px solid rgba(16, 185, 129, 0.45);
            color: #6ee7b7;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11.5px;
            font-weight: 600;
            margin-bottom: 14px;
        }

        .ad-pulse-dot {
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            animation: adPulseGreen 1.8s infinite;
        }

        @keyframes adPulseGreen {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        /* স্থির রাউন্ড অ্যাভাটার রিং — কোনো ঘূর্ণন বা স্লাইডিং নেই */
        .ad-avatar-wrapper {
            position: relative;
            width: 116px;
            height: 116px;
            margin: 0 auto 14px;
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

        .ad-verified-badge {
            position: absolute;
            bottom: 3px;
            right: 3px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: #ffffff;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2.5px solid #020624;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }

        .ad-dev-name {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 2px;
            color: #ffffff;
        }

        .ad-dev-subname {
            font-family: "Poppins", sans-serif;
            font-size: 12.5px;
            color: #00d2ff;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin: 0 0 12px;
        }

        .ad-typing-role {
            display: inline-block;
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 6px 15px;
            border-radius: 22px;
            font-size: 13px;
            color: #f8fafc;
            min-height: 32px;
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
            box-shadow: 0 6px 18px rgba(2, 6, 36, 0.06);
            border: 1px solid rgba(2, 6, 36, 0.08);
            color: #0f172a;
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

        .ad-section-title i {
            color: #00d2ff;
            background: var(--ad-main);
            width: 32px;
            height: 32px;
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

        .ad-highlight-banner i {
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
            z-index: 9999;
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

function ensureAboutSheetContainer() {
    const sheet = document.getElementById("mainScrollSheet");
    if (!sheet) return null;

    let view = document.getElementById("aboutDeveloperSheetView");
    if (!view) {
        view = document.createElement("div");
        view.id = "aboutDeveloperSheetView";
        view.className = "hidden";
        const mainEl = sheet.querySelector("main.container") || sheet;
        mainEl.appendChild(view);
    }
    return view;
}

function pushAboutState(level) {
    try { history.pushState({ adLevel: level }, "", location.href); } catch (e) { /* ignore */ }
    adDepth = level;
}

window.addEventListener("popstate", (e) => {
    if (adSwallowPop > 0) {
        adSwallowPop--;
        e.stopImmediatePropagation();
        return;
    }
    if (!isAboutActive) return;

    e.stopImmediatePropagation();
    const lvl = e.state && typeof e.state.adLevel === "number" ? e.state.adLevel : 0;
    if (lvl >= 1) {
        adDepth = lvl;
        return;
    }
    adDepth = 0;
    closeAboutDeveloper(true);
}, true);

function setAboutHeaderMode(titleText) {
    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");
    const navBtn = document.getElementById("navToggleBtn");

    aboutTitleNow = titleText;
    if (appTitleText) appTitleText.textContent = titleText;
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

function hideMainViewsForAbout(hide) {
    if (hide) {
        adViewSnapshot = {};
        ABOUT_HIDE_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            adViewSnapshot[id] = { hidden: el.classList.contains("hidden"), display: el.style.display };
            el.classList.add("hidden");
        });
        const slider = document.getElementById("heroSlider");
        if (slider) slider.style.display = "none";
        return;
    }

    if (!adViewSnapshot) return;
    ABOUT_HIDE_IDS.forEach(id => {
        const el = document.getElementById(id);
        const snap = adViewSnapshot[id];
        if (!el || !snap) return;
        el.classList.toggle("hidden", snap.hidden);
        el.style.display = snap.display;
    });
    adViewSnapshot = null;
}

function enforceAboutUI() {
    if (!isAboutActive) return;

    ABOUT_HIDE_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains("hidden")) el.classList.add("hidden");
    });
    const slider = document.getElementById("heroSlider");
    if (slider && slider.style.display !== "none") slider.style.display = "none";

    const appTitleText = document.querySelector(".app-title-text");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");
    if (appTitleText && aboutTitleNow && appTitleText.textContent !== aboutTitleNow) {
        appTitleText.textContent = aboutTitleNow;
    }
    if (menuIcon && !menuIcon.classList.contains("hidden")) menuIcon.classList.add("hidden");
    if (backIcon && backIcon.classList.contains("hidden")) backIcon.classList.remove("hidden");

    const view = document.getElementById("aboutDeveloperSheetView");
    if (view && view.classList.contains("hidden")) view.classList.remove("hidden");
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
}

function stopAboutObserver() {
    if (aboutObserver) { aboutObserver.disconnect(); aboutObserver = null; }
    if (aboutEnforceTimer) { clearTimeout(aboutEnforceTimer); aboutEnforceTimer = null; }
}

function avatarSvgMarkup() {
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

function startAboutParticles() {
    if (aboutParticleFrame) cancelAnimationFrame(aboutParticleFrame);
    const canvas = document.getElementById("adParticleCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
        canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth : 360;
        canvas.height = canvas.parentElement ? canvas.parentElement.offsetHeight : 280;
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

    const nextTitle = lang === "bn" ? "ডেভেলপার পরিচিতি" : "About Developer";
    setAboutHeaderMode(nextTitle);

    view.querySelectorAll("[data-bn]").forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });

    startAboutTyping();
}

function renderAboutDeveloperView(view) {
    setAboutHeaderMode(aboutCurrentLang === "bn" ? "ডেভেলপার পরিচিতি" : "About Developer");

    view.innerHTML = `
        <section class="ad-hero-card">
            <canvas id="adParticleCanvas"></canvas>
            <div class="ad-hero-content">
                <div class="ad-top-controls">
                    <button type="button" class="ad-pill-btn" id="adLangBtn">
                        <i class="fas fa-language"></i> <span id="adLangText">${aboutCurrentLang === "bn" ? "EN" : "বাংলা"}</span>
                    </button>
                    <button type="button" class="ad-pill-btn" id="adThemeBtn" title="Toggle Dark Mode">
                        <i class="fas fa-moon" id="adThemeIcon"></i>
                    </button>
                </div>

                <div class="ad-status-pill">
                    <span class="ad-pulse-dot"></span>
                    <span data-bn="অ্যাপ ডেভেলপমেন্ট ও সাপোর্টের জন্য সক্রিয়" data-en="Available for App Dev & Support">অ্যাপ ডেভেলপমেন্ট ও সাপোর্টের জন্য সক্রিয়</span>
                </div>

                <div class="ad-avatar-wrapper" id="adAvatarOpen">
                    <div class="ad-avatar-ring">
                        <div class="ad-avatar-inner">
                            <div class="ad-avatar-img">${avatarSvgMarkup()}</div>
                        </div>
                    </div>
                    <div class="ad-verified-badge" title="Verified Developer">
                        <i class="fas fa-check"></i>
                    </div>
                </div>

                <h1 class="ad-dev-name" data-bn="মোঃ জুয়েল রানা" data-en="Md. Jewel Rana">মোঃ জুয়েল রানা</h1>
                <p class="ad-dev-subname">Jewel Rana • App & Web Developer</p>

                <div class="ad-typing-role">
                    <span id="adTypedText"></span><span class="ad-cursor">&nbsp;</span>
                </div>
            </div>
        </section>

        <div class="ad-card">
            <h2 class="ad-section-title">
                <i class="fas fa-user-tie"></i>
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
                <i class="fas fa-code"></i>
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
                <i class="fas fa-layer-group"></i>
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
                <i class="fas fa-bolt"></i>
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
                <i class="fas fa-headset"></i>
                <span data-bn="যোগাযোগ ও মতামত" data-en="Contact & Feedback">যোগাযোগ ও মতামত</span>
            </h2>
            <p class="ad-bio-text" style="margin-bottom:12px;" data-bn="অ্যাপ সংক্রান্ত যেকোনো পরামর্শ, নতুন ফিচারের অনুরোধ অথবা কারিগরি সহায়তার জন্য সরাসরি যোগাযোগ করুন:" data-en="For any app feedback, feature requests, or technical support, feel free to connect directly:">
                অ্যাপ সংক্রান্ত যেকোনো পরামর্শ, নতুন ফিচারের অনুরোধ অথবা কারিগরি সহায়তার জন্য সরাসরি যোগাযোগ করুন:
            </p>

            <div class="ad-action-grid">
                <a href="tel:+8801700000000" class="ad-action-btn ad-btn-call">
                    <i class="fas fa-phone-alt"></i>
                    <span data-bn="সরাসরি কল" data-en="Call Now">সরাসরি কল</span>
                </a>
                <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" class="ad-action-btn ad-btn-wa">
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

        <div class="ad-modal-overlay" id="adProfileModal">
            <button type="button" class="ad-modal-close" id="adCloseProfileModal"><i class="fas fa-times"></i></button>
            <div class="ad-modal-avatar">${avatarSvgMarkup()}</div>
            <div style="color:#ffffff; margin-top:14px; font-size:17px; font-weight:700;">মোঃ জুয়েল রানা (Jewel Rana)</div>
        </div>

        <div class="ad-modal-overlay" id="adFeedbackModal">
            <div class="ad-feedback-box">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:17px;" data-bn="ডেভেলপারকে বার্তা পাঠান" data-en="Message Developer">ডেভেলপারকে বার্তা পাঠান</h3>
                    <button type="button" id="adCloseFeedbackModal" style="background:none; border:none; color:inherit; font-size:18px; cursor:pointer;">
                        <i class="fas fa-times"></i>
                    </button>
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

    const themeIcon = view.querySelector("#adThemeIcon");
    if (themeIcon) {
        themeIcon.className = document.body.classList.contains("dark-mode") ? "fas fa-sun" : "fas fa-moon";
    }

    view.querySelector("#adLangBtn")?.addEventListener("click", () => {
        const nextLang = aboutCurrentLang === "bn" ? "en" : "bn";
        applyAboutLanguage(view, nextLang);
        showAboutToast(nextLang === "bn" ? "ভাষা বাংলায় পরিবর্তন করা হয়েছে" : "Language switched to English");
    });

    view.querySelector("#adThemeBtn")?.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-mode");
        localStorage.setItem("dev_page_theme", isDark ? "dark" : "light");
        if (themeIcon) themeIcon.className = isDark ? "fas fa-sun" : "fas fa-moon";
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
        window.open(`https://wa.me/8801700000000?text=${text}`, "_blank");
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
    startAboutParticles();
}

export function openAboutDeveloper() {
    injectAboutDeveloperStyles();

    if (!isAboutActive) {
        captureAboutHeaderState();
        hideMainViewsForAbout(true);
        pushAboutState(1);
    }

    isAboutActive = true;
    const view = ensureAboutSheetContainer();
    if (view) {
        view.classList.remove("hidden");
        renderAboutDeveloperView(view);
    }
    startAboutObserver();
}

export function closeAboutDeveloper(fromPop = false) {
    if (!isAboutActive) return;

    if (fromPop !== true && adDepth > 0) {
        adSwallowPop++;
        try { history.go(-adDepth); } catch (e) { adSwallowPop = 0; }
    }
    adDepth = 0;

    clearTimeout(aboutTypingTimer);
    if (aboutParticleFrame) cancelAnimationFrame(aboutParticleFrame);
    stopAboutObserver();
    isAboutActive = false;

    const view = document.getElementById("aboutDeveloperSheetView");
    if (view) {
        view.classList.add("hidden");
        view.innerHTML = "";
    }

    restoreAboutHeaderMode();
    hideMainViewsForAbout(false);
}

window.openAboutDeveloper = openAboutDeveloper;
window.closeAboutDeveloper = () => closeAboutDeveloper();
