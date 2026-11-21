"use strict";

const APP_LANGUAGE_KEY = "selected_app_language";

const OFFLINE_TRANSLATIONS = {
    "RMP MT Contacts": "RMP MT Contacts",
    "নাম পাওয়া যায়নি": "Name not found",
    "মোবাইল নেই": "Mobile unavailable",
    "টেলিফোন নেই": "Telephone unavailable",
    "পদবী নেই": "Designation unavailable",
    "পদবি নেই": "Designation unavailable",
    "ইমেইল নেই": "Email unavailable",
    "মোবাইল": "Mobile",
    "টেলিফোন": "Telephone",
    "ফোন": "Phone",
    "পদবী": "Designation",
    "পদবি": "Designation",
    "ইমেইল": "Email",
    "ই-মেইল": "Email",
    "বর্তমান ঠিকানা": "Current Office",
    "বর্তমান অফিস": "Current Office",
    "বর্তমান কার্যালয়": "Current Office",
    "বর্তমান কার্যালয়": "Current Office",
    "স্থায়ী ঠিকানা": "Permanent Address",
    "স্থায়ী ঠিকানা": "Permanent Address",
    "প্রশাসনিক তথ্য": "Administrative Information",
    "অ্যাডমিন তথ্য": "Admin Information",
    "Header ছাড়া": "Without Header",
    "Header ছাড়া": "Without Header",
    "হেডার ছাড়া": "Without Header",
    "হেডার ছাড়া": "Without Header",
    "কোনো তথ্য পাওয়া যায়নি": "No information found",
    "কোনো তথ্য পাওয়া যায়নি": "No information found",
    "কোনো ফেভারিট নাম্বার নেই": "No favorite numbers",
    "হার্ট আইকনে ক্লিক করে ফেভারিটে যুক্ত করুন।": "Tap the heart icon to add a favorite.",
    "নতুন Category": "New Category",
    "নতুন Sub-Category": "New Sub-Category",
    "Category এডিট করুন": "Edit Category",
    "Data এডিট করুন": "Edit Data",
    "Data যোগ করুন": "Add Data",
    "Header সেভ করা হয়েছে": "Header saved",
    "Header সেভ করা হয়েছে": "Header saved",
    "ডাটা সেভ হয়েছে": "Data saved",
    "ডাটা সেভ হয়েছে": "Data saved",
    "ডাটা ডিলিট করা হয়েছে": "Data deleted",
    "ডাটা ডিলিট করা হয়েছে": "Data deleted",
    "ডাটা সফলভাবে মুভ করা হয়েছে!": "Data moved successfully!",
    "ডাটা সফলভাবে মুভ করা হয়েছে!": "Data moved successfully!",
    "পিন করা হয়েছে": "Pinned",
    "পিন করা হয়েছে": "Pinned",
    "আনপিন করা হয়েছে": "Unpinned",
    "আনপিন করা হয়েছে": "Unpinned",
    "হেডার পিন করা হয়েছে": "Header pinned",
    "হেডার পিন করা হয়েছে": "Header pinned",
    "হেডার আনপিন করা হয়েছে": "Header unpinned",
    "হেডার আনপিন করা হয়েছে": "Header unpinned",
    "সেভ করা হয়েছে": "Saved",
    "সেভ করা হয়েছে": "Saved",
    "ডিলিট করা হয়েছে": "Deleted",
    "ডিলিট করা হয়েছে": "Deleted",
    "Header ডিলিট করা হয়েছে": "Header deleted",
    "Header ডিলিট করা হয়েছে": "Header deleted",
    "পিন": "Pin",
    "আনপিন": "Unpin",
    "এডিট": "Edit",
    "ডিলিট": "Delete",
    "মুভ": "Move",
    "ফেভারিট": "Favorite",
    "ফেভারিটে যোগ করা হয়েছে": "Added to favorites",
    "ফেভারিটে যোগ করা হয়েছে": "Added to favorites",
    "ফেভারিট থেকে সরানো হয়েছে": "Removed from favorites",
    "ফেভারিট থেকে সরানো হয়েছে": "Removed from favorites",
    "নিশ্চিতকরণ": "Confirmation",
    "হ্যাঁ, মুছুন": "Yes, Delete",
    "বাতিল": "Cancel",
    "লোড হচ্ছে...": "Loading...",
    "কোনো নতুন ভেরিফিকেশন রিকোয়েস্ট নেই": "No new verification requests",
    "কোনো নতুন ভেরিফিকেশন রিকোয়েস্ট নেই": "No new verification requests",
    "ডাটা লোড করতে সমস্যা হয়েছে": "Could not load data",
    "ডাটা লোড করতে সমস্যা হয়েছে": "Could not load data",
    "অ্যাডমিন লগইন সফল হয়েছে!": "Admin login successful!",
    "অ্যাডমিন লগইন সফল হয়েছে!": "Admin login successful!",
    "লগআউট করা হয়েছে": "Logged out",
    "লগআউট করা হয়েছে": "Logged out",
    "লগইন করার জন্য ইন্টারনেট সংযোগ আবশ্যক!": "Internet connection is required for admin login!",
    "ইমেইল এবং পাসওয়ার্ড দিন": "Enter email and password",
    "ইমেইল এবং পাসওয়ার্ড দিন": "Enter email and password",
    "শুধুমাত্র Admin পরিবর্তন সেভ করতে পারবেন": "Only Admin can save changes",
    "অফলাইনে সেভ হয়েছে! ইন্টারনেট এলে ডাটাবেজে যুক্ত হবে।": "Saved offline. It will sync when internet is available.",
    "অফলাইনে সেভ হয়েছে! ইন্টারনেট এলে ডাটাবেজে যুক্ত হবে।": "Saved offline. It will sync when internet is available.",
    "ক্লাউডে সিঙ্ক করতে সমস্যা হয়েছে": "Cloud sync failed",
    "ক্লাউডে সিঙ্ক করতে সমস্যা হয়েছে": "Cloud sync failed",
    "ইন্টারনেট সংযোগ নেই!": "No internet connection!",
    "🟢 অনলাইন মোডে আছেন ": "🟢 You are online ",
    "শিরোনাম এবং বিস্তারিত উভয়ই পূরণ করুন": "Please fill in both title and details",
    "শিরোনাম এবং বিস্তারিত উভয়ই পূরণ করুন": "Please fill in both title and details",
    "নাম প্রদান করুন": "Enter a name",
    "মোবাইল নাম্বার অবশ্যই ১১ ডিজিটের হতে হবে!": "Mobile number must contain 11 digits!",
    "মোবাইল, টেলিফোন অথবা ইমেইল এড্রেস ফাঁকা রাখা যাবে না!": "Mobile, telephone or email cannot all be empty",
    "ক্যাটাগরি সিলেক্ট করা নেই": "No category selected",
    "হেডার নাম লিখুন": "Enter header name",
    "Category Name লিখুন": "Enter Category Name",
    "আপনি কি নিশ্চিত এই Category মুছে ফেলতে চান?": "Are you sure you want to delete this Category?",
    "এই Header ডিলিট করতে চান? ডাটাগুলো সরানো হবে না।": "Delete this Header? The data will not be removed.",
    "আপনি কি এই Data মুছে ফেলতে চান?": "Are you sure you want to delete this Data?",
    "আপনি কি এই রিকোয়েস্টটি ডিলিট করতে চান?": "Do you want to delete this request?",
    "রিকোয়েস্ট ডিলিট করা হয়েছে": "Request deleted",
    "রিকোয়েস্ট ডিলিট করা হয়েছে": "Request deleted",
    "অ্যাপ্রুভ করতে ব্যর্থ হয়েছে": "Approval failed",
    "অ্যাপ্রুভ করতে ব্যর্থ হয়েছে": "Approval failed",
    "রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে": "Failed to send request",
    "রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে": "Failed to send request",
    "দয়া করে নাম এবং পদবী পূরণ করুন": "Please enter name and designation",
    "দয়া করে নাম এবং পদবী পূরণ করুন": "Please enter name and designation",
    "রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!": "Request sent successfully!",
    "রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!": "Request sent successfully!",
    "অ্যাডমিন অপশন অন করা হয়েছে": "Admin option enabled",
    "অ্যাডমিন অপশন অন করা হয়েছে": "Admin option enabled",
    "সার্চ": "Search",
    "ফোনবুক": "Phonebook",
    "নাইট মোড অন করা হয়েছে": "Night mode enabled",
    "নাইট মোড অন করা হয়েছে": "Night mode enabled",
    "ডে মোড অন করা হয়েছে": "Day mode enabled",
    "ডে মোড অন করা হয়েছে": "Day mode enabled",
    "শেয়ার কন্টাক্ট": "Share Contact",
    "শেয়ার কন্টাক্ট": "Share Contact",
    "Get VIP": "Get VIP",
    "ভেরিফাইড": "Verified",
    "অ্যাডমিন": "Admin",
    "নাম": "Name"
};

const OFFLINE_SEARCH_ALIASES = {
    "constable": ["কনস্টেবল"],
    "female constable": ["মহিলা কনস্টেবল", "ফিমেল কনস্টেবল"],
    "driver constable": ["ড্রাইভার কনস্টেবল"],
    "inspector": ["ইন্সপেক্টর"],
    "assistant superintendent": ["সহকারী সুপারিনটেনডেন্ট", "সহকারী সুপারিনটেন্ডেন্ট"],
    "superintendent": ["সুপারিনটেনডেন্ট", "সুপারিনটেন্ডেন্ট"],
    "commandant": ["কমান্ড্যান্ট", "কমান্ডেন্ট"],
    "additional commandant": ["অতিরিক্ত কমান্ড্যান্ট"],
    "deputy commandant": ["ডেপুটি কমান্ড্যান্ট"],
    "assistant commandant": ["সহকারী কমান্ড্যান্ট"],
    "si": ["এসআই", "সাব-ইন্সপেক্টর", "উপ-পরিদর্শক"],
    "sub inspector": ["সাব-ইন্সপেক্টর", "এসআই", "উপ-পরিদর্শক"],
    "asi": ["এএসআই", "সহকারী উপ-পরিদর্শক"],
    "sergeant": ["সার্জেন্ট"],
    "driver": ["ড্রাইভার", "চালক"],
    "office": ["অফিস", "কার্যালয়", "কার্যালয়"],
    "current office": ["বর্তমান অফিস", "বর্তমান কার্যালয়", "বর্তমান কার্যালয়", "বর্তমান ঠিকানা"],
    "permanent address": ["স্থায়ী ঠিকানা", "স্থায়ী ঠিকানা"],
    "address": ["ঠিকানা"],
    "mobile": ["মোবাইল", "মোবাইল নম্বর", "মোবাইল নাম্বার"],
    "phone": ["ফোন", "টেলিফোন"],
    "telephone": ["টেলিফোন", "ফোন"],
    "email": ["ইমেইল", "ই-মেইল"],
    "name": ["নাম"],
    "designation": ["পদবী", "পদবি"],
    "police": ["পুলিশ"],
    "phonebook": ["ফোনবুক", "ফোন বুক"],
    "favorite": ["ফেভারিট"],
    "header": ["হেডার"],
    "category": ["ক্যাটাগরি", "বিভাগ"],
    "sub category": ["সাব-ক্যাটাগরি", "সাব ক্যাটাগরি"],
    "admin": ["অ্যাডমিন", "এডমিন"],
    "verified": ["ভেরিফাইড", "অনুমোদিত"],
    "verification": ["ভেরিফিকেশন", "যাচাই"]
};

const BENGALI_LATIN_ALIASES = {
    "জুয়েল": "jewel", "জুয়েল": "jewel", "রানা": "rana",
    "রহমান": "rahman", "হোসেন": "hossain", "হোসাইন": "hossain",
    "আহমেদ": "ahmed", "আলী": "ali", "আলম": "alam", "ইসলাম": "islam",
    "খান": "khan", "মিয়া": "mia", "মিয়া": "mia", "চৌধুরী": "chowdhury",
    "সাহা": "saha", "দাস": "das", "সরকার": "sarkar"
};

export function getCurrentLanguage() {
    return localStorage.getItem(APP_LANGUAGE_KEY) === "en" ? "en" : "bn";
}

function setLanguageCookie(lang) {
    const value = `/bn/${lang}`;
    document.cookie = `googtrans=${value};path=/;max-age=31536000`;
    try {
        document.cookie = `googtrans=${value};domain=${document.domain};path=/;max-age=31536000`;
    } catch (_) {}
}

export function setLanguage(lang) {
    lang = lang === "en" ? "en" : "bn";
    localStorage.setItem(APP_LANGUAGE_KEY, lang);
    setLanguageCookie(lang);

    try {
        document.documentElement.lang = lang === "en" ? "en" : "bn";
    } catch (_) {}

    location.reload();
}

function replaceKnownTranslations(text) {
    let result = String(text ?? "");
    const keys = Object.keys(OFFLINE_TRANSLATIONS)
        .filter(k => k && k !== OFFLINE_TRANSLATIONS[k])
        .sort((a, b) => b.length - a.length);

    for (const key of keys) {
        result = result.split(key).join(OFFLINE_TRANSLATIONS[key]);
    }
    return result;
}

export function applyOfflineLanguage(root = document.body) {
    if (!root || getCurrentLanguage() !== "en") return;

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(parent.tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(textNode => {
        const oldText = textNode.nodeValue;
        const newText = replaceKnownTranslations(oldText);
        if (newText !== oldText) textNode.nodeValue = newText;
    });

    root.querySelectorAll?.("[placeholder], [title], [aria-label]").forEach(el => {
        ["placeholder", "title", "aria-label"].forEach(attr => {
            if (!el.hasAttribute(attr)) return;
            const oldValue = el.getAttribute(attr);
            const newValue = replaceKnownTranslations(oldValue);
            if (newValue !== oldValue) el.setAttribute(attr, newValue);
        });
    });
}

function getSearchVariants(query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];

    const variants = new Set([q]);
    const compact = q.replace(/[\s_-]+/g, " ").trim();
    variants.add(compact);

    Object.entries(OFFLINE_SEARCH_ALIASES).forEach(([english, bengaliList]) => {
        if (english === q || english.includes(q) || q.includes(english)) {
            bengaliList.forEach(v => variants.add(String(v).toLowerCase()));
        }
        bengaliList.forEach(v => {
            if (String(v).toLowerCase() === q) variants.add(english);
        });
    });

    q.split(/\s+/).filter(Boolean).forEach(token => {
        if (OFFLINE_SEARCH_ALIASES[token]) {
            OFFLINE_SEARCH_ALIASES[token].forEach(v => variants.add(String(v).toLowerCase()));
        }
    });

    return [...variants];
}

function bengaliToSearchLatin(text) {
    let result = String(text || "").toLowerCase();
    Object.entries(BENGALI_LATIN_ALIASES)
        .sort((a, b) => b[0].length - a[0].length)
        .forEach(([bn, en]) => {
            result = result.split(bn).join(en);
        });
    return result;
}

export function isMatch(sourceText, query) {
    if (sourceText === null || sourceText === undefined || query === null || query === undefined) {
        return false;
    }

    const source = String(sourceText).trim();
    const q = String(query).trim().toLowerCase();
    if (!source || !q) return false;

    const sourceLower = source.toLowerCase();
    const sourceLatin = bengaliToSearchLatin(sourceLower);
    const variants = getSearchVariants(q);

    if (variants.some(v => v && (sourceLower.includes(v) || sourceLatin.includes(v)))) {
        return true;
    }

    const words = q.split(/\s+/).filter(w => w.length > 1);
    if (words.length > 1) {
        return words.every(word => {
            const wordVariants = getSearchVariants(word);
            return wordVariants.some(v => sourceLower.includes(v) || sourceLatin.includes(v));
        });
    }

    return false;
}

function getDataSearchText(item, categories = [], headers = []) {
    if (!item) return "";
    const category = categories.find(c => c.id === item.categoryId);
    const header = headers.find(h => h.id === item.headerId);

    return [
        item.name, item.mobile, item.phone, item.designation, item.email,
        item.currentOffice, item.permanentAddress, item.adminInfo,
        item.enName, item.enDesignation, item.enCurrentOffice,
        item.enPermanentAddress, category?.name, header?.title
    ].filter(v => v !== null && v !== undefined && String(v).trim() !== "").join(" ");
}

export function isDataMatch(item, query, categories = [], headers = []) {
    if (!query) return true;
    return isMatch(getDataSearchText(item, categories, headers), query);
}

export function initOfflineLanguageSystem() {
    const savedLang = getCurrentLanguage();

    try {
        document.documentElement.lang = savedLang === "en" ? "en" : "bn";
    } catch (_) {}

    const radioEn = document.getElementById("langEn");
    const radioBn = document.getElementById("langBn");
    if (radioEn) radioEn.checked = savedLang === "en";
    if (radioBn) radioBn.checked = savedLang !== "en";

    document.querySelectorAll('input[name="appLanguage"]').forEach(input => {
        if (input.dataset.offlineLangBound === "1") return;
        input.dataset.offlineLangBound = "1";
        input.addEventListener("change", () => setLanguage(input.value));
    });

    if (savedLang === "en") {
        applyOfflineLanguage(document.body);

        if (!window.__offlineLanguageObserver) {
            let timer = null;
            window.__offlineLanguageObserver = new MutationObserver(() => {
                if (getCurrentLanguage() !== "en") return;
                clearTimeout(timer);
                timer = setTimeout(() => applyOfflineLanguage(document.body), 0);
            });

            window.__offlineLanguageObserver.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }
}

/* ==========================================
   FULL-SCREEN PROFILE IMAGE ZOOM VIEWER
========================================== */
let activeZoomPopstateListener = null;
let pushedZoomHistoryState = false;

export function openProfileImageViewer(photoUrl, personName) {
    const modal = document.getElementById("imageZoomModal");
    const imgEl = document.getElementById("zoomTargetImage");
    const fallbackEl = document.getElementById("zoomFallbackIcon");
    const titleEl = document.getElementById("zoomModalTitle");
    const canvasArea = document.getElementById("zoomCanvasArea");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const zoomResetBtn = document.getElementById("zoomResetBtn");
    const closeBtn = document.getElementById("closeImageZoomBtn");

    if (!modal || !imgEl || !fallbackEl || !canvasArea) return;

    if (activeZoomPopstateListener) {
        window.removeEventListener("popstate", activeZoomPopstateListener);
        activeZoomPopstateListener = null;
    }

    if (titleEl) titleEl.textContent = personName || "প্রোফাইল ছবি";

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let activeTarget = null;
    let closedByBackButton = false;

    function clampTranslation() {
        if (scale <= 1) {
            scale = 1;
            translateX = 0;
            translateY = 0;
            return;
        }
        const maxOffsetX = Math.max(80, (canvasArea.clientWidth * (scale - 1)) / 2);
        const maxOffsetY = Math.max(80, (canvasArea.clientHeight * (scale - 1)) / 2);
        translateX = Math.min(Math.max(translateX, -maxOffsetX), maxOffsetX);
        translateY = Math.min(Math.max(translateY, -maxOffsetY), maxOffsetY);
    }

    function updateTransform(withTransition = false) {
        if (!activeTarget) return;
        clampTranslation();
        activeTarget.style.transition = withTransition ? "transform 0.2s ease-out" : "none";
        activeTarget.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
    }

    function resetZoom() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform(true);
    }

    function setZoomScale(newScale, withTransition = true) {
        scale = Math.min(Math.max(1, newScale), 5);
        if (scale === 1) {
            translateX = 0;
            translateY = 0;
        }
        updateTransform(withTransition);
    }

    imgEl.onerror = null;
    imgEl.onload = null;

    if (photoUrl && String(photoUrl).trim() !== "") {
        imgEl.src = String(photoUrl).trim();
        imgEl.classList.remove("hidden");
        fallbackEl.classList.add("hidden");
        activeTarget = imgEl;

        imgEl.onerror = () => {
            imgEl.classList.add("hidden");
            fallbackEl.classList.remove("hidden");
            activeTarget = fallbackEl;
            resetZoom();
        };
    } else {
        imgEl.removeAttribute("src");
        imgEl.classList.add("hidden");
        fallbackEl.classList.remove("hidden");
        activeTarget = fallbackEl;
    }

    resetZoom();
    modal.classList.remove("hidden");

    pushedZoomHistoryState = false;
    try {
        history.pushState({ page: "imageZoom" }, "");
        pushedZoomHistoryState = true;
    } catch (_) {}

    const cleanupViewer = (fromPopState = false) => {
        modal.classList.add("hidden");
        if (activeZoomPopstateListener) {
            window.removeEventListener("popstate", activeZoomPopstateListener);
            activeZoomPopstateListener = null;
        }
        if (!fromPopState && pushedZoomHistoryState && history.state && history.state.page === "imageZoom") {
            pushedZoomHistoryState = false;
            closedByBackButton = true;
            try {
                history.back();
            } catch (_) {}
        }
    };

    activeZoomPopstateListener = () => {
        if (closedByBackButton) {
            closedByBackButton = false;
            return;
        }
        pushedZoomHistoryState = false;
        cleanupViewer(true);
    };
    window.addEventListener("popstate", activeZoomPopstateListener);

    if (zoomInBtn) {
        zoomInBtn.onclick = (e) => {
            e.stopPropagation();
            setZoomScale(scale + 0.5, true);
        };
    }

    if (zoomOutBtn) {
        zoomOutBtn.onclick = (e) => {
            e.stopPropagation();
            setZoomScale(scale - 0.5, true);
        };
    }

    if (zoomResetBtn) {
        zoomResetBtn.onclick = (e) => {
            e.stopPropagation();
            resetZoom();
        };
    }

    let lastTap = 0;
    canvasArea.onclick = (e) => {
        if (e.target.closest("button")) return;
        const now = Date.now();
        if (now - lastTap < 300) {
            lastTap = 0;
            if (scale > 1) {
                resetZoom();
            } else {
                setZoomScale(2.5, true);
            }
        } else {
            lastTap = now;
        }
    };

    canvasArea.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.35 : -0.35;
        setZoomScale(scale + delta, false);
    };

    let initialPinchDistance = null;
    let initialScale = 1;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    canvasArea.ontouchstart = (e) => {
        if (e.touches.length === 2) {
            isDragging = false;
            initialPinchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialScale = scale;
        } else if (e.touches.length === 1 && scale > 1) {
            isDragging = true;
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
        }
    };

    canvasArea.ontouchmove = (e) => {
        if (e.touches.length === 2 && initialPinchDistance) {
            e.preventDefault();
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            setZoomScale(initialScale * (currentDistance / initialPinchDistance), false);
        } else if (e.touches.length === 1 && isDragging && scale > 1) {
            e.preventDefault();
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            updateTransform(false);
        }
    };

    canvasArea.ontouchend = (e) => {
        if (e.touches.length < 2) {
            initialPinchDistance = null;
        }
        if (e.touches.length === 0) {
            isDragging = false;
        }
    };

    canvasArea.ontouchcancel = () => {
        initialPinchDistance = null;
        isDragging = false;
    };

    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            cleanupViewer(false);
        };
    }
}

export function setupSmartCallAndWhatsApp(element, rawNumber, typeName, showToast) {
    if (!element) return;

    if (!rawNumber || rawNumber === "মোবাইল নেই" || rawNumber === "টেলিফোন নেই" || rawNumber.toLowerCase().includes("নেই")) {
        element.addEventListener("click", (e) => {
            e.preventDefault();
            showToast(`⚠️ কোনো ${typeName} নাম্বার নেই!`);
        });
        return;
    }

    let pressTimer = null;
    let isLongPress = false;

    const startPress = () => {
        isLongPress = false;
        pressTimer = setTimeout(() => {
            isLongPress = true;
            if (navigator.vibrate) navigator.vibrate(60);
            let cleanNumber = rawNumber.replace(/\D/g, "");
            if (cleanNumber.length === 11 && cleanNumber.startsWith("0")) cleanNumber = "88" + cleanNumber;
            if (cleanNumber) {
                window.open(`https://wa.me/${cleanNumber}`, "_blank");
            } else {
                showToast(`⚠️ কোনো বৈধ ${typeName} নাম্বার নেই!`);
            }
        }, 600);
    };

    const cancelPress = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    element.addEventListener("mousedown", startPress);
    element.addEventListener("touchstart", startPress, { passive: true });
    element.addEventListener("mouseup", cancelPress);
    element.addEventListener("mouseleave", cancelPress);
    element.addEventListener("touchend", cancelPress);
    element.addEventListener("touchcancel", cancelPress);

    element.addEventListener("click", (e) => {
        e.preventDefault();
        if (!isLongPress) {
            let cleanNumber = rawNumber.replace(/[^\d+]/g, "");
            if (cleanNumber) {
                const callLink = document.createElement("a");
                callLink.href = `tel:${cleanNumber}`;
                callLink.style.display = "none";
                document.body.appendChild(callLink);
                callLink.click();
                setTimeout(() => callLink.remove(), 1000);
            } else {
                showToast(`⚠️ কোনো বৈধ ${typeName} নাম্বার নেই!`);
            }
        }
        isLongPress = false;
    });
}

export function setupEmailAction(element, rawEmail, showToast) {
    if (!element) return;

    if (!rawEmail || rawEmail === "ইমেইল নেই" || rawEmail.toLowerCase().includes("নেই")) {
        element.addEventListener("click", (e) => {
            e.preventDefault();
            showToast("⚠️ কোনো ইমেইল অ্যাড্রেস নেই!");
        });
        return;
    }

    element.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = `mailto:${rawEmail}`;
    });
}
