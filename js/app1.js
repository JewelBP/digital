const APP_LANGUAGE_KEY = "selected_app_language";[span_1](start_span)[span_1](end_span)

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
};[span_2](start_span)[span_2](end_span)

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
};[span_3](start_span)[span_3](end_span)

const BENGALI_LATIN_ALIASES = {
    "জুয়েল": "jewel", "জুয়েল": "jewel", "রানা": "rana",
    "রহমান": "rahman", "হোসেন": "hossain", "হোসাইন": "hossain",
    "আহমেদ": "ahmed", "আলী": "ali", "আলম": "alam", "ইসলাম": "islam",
    "খান": "khan", "মিয়া": "mia", "মিয়া": "mia", "চৌধুরী": "chowdhury",
    "সাহা": "saha", "দাস": "das", "সরকার": "sarkar"
};[span_4](start_span)[span_4](end_span)

export function getCurrentLanguage() {
    return localStorage.getItem(APP_LANGUAGE_KEY) === "en" ? "en" : "bn";
}[span_5](start_span)[span_5](end_span)

function setLanguageCookie(lang) {
    const value = `/bn/${lang}`;
    document.cookie = `googtrans=${value};path=/;max-age=31536000`;
    try {
        document.cookie = `googtrans=${value};domain=${document.domain};path=/;max-age=31536000`;
    } catch (_) {}
}[span_6](start_span)[span_6](end_span)

export function setLanguage(lang) {
    lang = lang === "en" ? "en" : "bn";
    localStorage.setItem(APP_LANGUAGE_KEY, lang);
    setLanguageCookie(lang);

    try {
        document.documentElement.lang = lang === "en" ? "en" : "bn";
    } catch (_) {}

    location.reload();
}[span_7](start_span)[span_7](end_span)

function replaceKnownTranslations(text) {
    let result = String(text ?? "");
    const keys = Object.keys(OFFLINE_TRANSLATIONS)
        .filter(k => k && k !== OFFLINE_TRANSLATIONS[k])
        .sort((a, b) => b.length - a.length);

    for (const key of keys) {
        result = result.split(key).join(OFFLINE_TRANSLATIONS[key]);
    }
    return result;
}[span_8](start_span)[span_8](end_span)

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
}[span_9](start_span)[span_9](end_span)

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
}[span_10](start_span)[span_10](end_span)

function bengaliToSearchLatin(text) {
    let result = String(text || "").toLowerCase();
    Object.entries(BENGALI_LATIN_ALIASES)
        .sort((a, b) => b[0].length - a[0].length)
        .forEach(([bn, en]) => {
            result = result.split(bn).join(en);
        });
    return result;
}[span_11](start_span)[span_11](end_span)

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
}[span_12](start_span)[span_12](end_span)

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
}[span_13](start_span)[span_13](end_span)

export function isDataMatch(item, query, categories = [], headers = []) {
    if (!query) return true;
    return isMatch(getDataSearchText(item, categories, headers), query);
}[span_14](start_span)[span_14](end_span)

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
}[span_15](start_span)[span_15](end_span)

/* ==========================================
   FULL-SCREEN PROFILE IMAGE ZOOM VIEWER
========================================== */
export function openProfileImageViewer(photoUrl, personName) {
    const modal = document.getElementById("imageZoomModal");
    const imgEl = document.getElementById("zoomTargetImage");
    const fallbackEl = document.getElementById("zoomFallbackIcon");
    const titleEl = document.getElementById("zoomModalTitle");
    const canvasArea = document.getElementById("zoomCanvasArea");

    if (!modal || !imgEl || !fallbackEl || !canvasArea) return;

    if (titleEl) titleEl.textContent = personName || "প্রোফাইল ছবি";

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let activeTarget = null;

    function updateTransform(withTransition = false) {
        if (!activeTarget) return;
        activeTarget.style.transition = withTransition ? "transform 0.2s ease-out" : "none";
        activeTarget.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    function resetZoom() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform(true);
    }

    if (photoUrl && photoUrl.trim() !== "") {
        imgEl.src = photoUrl;
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
        imgEl.classList.add("hidden");
        fallbackEl.classList.remove("hidden");
        activeTarget = fallbackEl;
    }

    resetZoom();
    modal.classList.remove("hidden");

    history.pushState({ page: "imageZoom" }, "");

    const closeViewer = () => {
        if (!modal.classList.contains("hidden")) {
            modal.classList.add("hidden");
            if (history.state && history.state.page === "imageZoom") {
                history.back();
            }
        }
    };

    const popStateListener = (e) => {
        if (e.state && e.state.page === "imageZoom") {
            return;
        }
        modal.classList.add("hidden");
        window.removeEventListener("popstate", popStateListener);
    };
    window.addEventListener("popstate", popStateListener);

    document.getElementById("zoomInBtn").onclick = () => {
        scale = Math.min(scale + 0.5, 5);
        updateTransform(true);
    };

    document.getElementById("zoomOutBtn").onclick = () => {
        scale = Math.max(scale - 0.5, 1);
        if (scale === 1) {
            translateX = 0;
            translateY = 0;
        }
        updateTransform(true);
    };

    document.getElementById("zoomResetBtn").onclick = resetZoom;

    let lastTap = 0;
    canvasArea.onclick = () => {
        const now = Date.now();
        if (now - lastTap < 300) {
            if (scale > 1) {
                resetZoom();
            } else {
                scale = 2.5;
                updateTransform(true);
            }
        }
        lastTap = now;
    };

    canvasArea.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.3 : -0.3;
        scale = Math.min(Math.max(1, scale + delta), 5);
        if (scale === 1) {
            translateX = 0;
            translateY = 0;
        }
        updateTransform(false);
    };

    let initialPinchDistance = null;
    let initialScale = 1;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    canvasArea.ontouchstart = (e) => {
        if (e.touches.length === 2) {
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
            scale = Math.min(Math.max(1, initialScale * (currentDistance / initialPinchDistance)), 5);
            if (scale === 1) {
                translateX = 0;
                translateY = 0;
            }
            updateTransform(false);
        } else if (e.touches.length === 1 && isDragging && scale > 1) {
            e.preventDefault();
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            updateTransform(false);
        }
    };

    canvasArea.ontouchend = () => {
        initialPinchDistance = null;
        isDragging = false;
    };

    document.getElementById("closeImageZoomBtn").onclick = () => {
        closeViewer();
        window.removeEventListener("popstate", popStateListener);
    };
}[span_16](start_span)[span_16](end_span)

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
}[span_17](start_span)[span_17](end_span)

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
}[span_18](start_span)[span_18](end_span)

/* ==========================================
   IMGBB IMAGE PICKER & UPLOAD (MAX 300 KB)
========================================== */
const MAX_IMAGE_UPLOAD_BYTES = 300 * 1024;

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("ফাইল পড়া যায়নি"));
        reader.readAsDataURL(file);
    });
}

function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("ছবি লোড করা যায়নি"));
        img.src = src;
    });
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), type, quality);
    });
}

async function prepareImageUnderLimit(file, maxBytes = MAX_IMAGE_UPLOAD_BYTES) {
    if (file.size <= maxBytes) {
        return file;
    }

    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImageElement(dataUrl);

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    const maxDimension = 1280;

    if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
        } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
        }
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

    for (let scaleStep = 0; scaleStep < 5; scaleStep++) {
        canvas.width = Math.max(1, Math.round(width));
        canvas.height = Math.max(1, Math.round(height));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (outputType === "image/jpeg") {
            let quality = 0.85;
            while (quality >= 0.35) {
                const blob = await canvasToBlob(canvas, "image/jpeg", quality);
                if (blob && blob.size <= maxBytes) {
                    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
                }
                quality -= 0.1;
            }
        } else {
            const pngBlob = await canvasToBlob(canvas, "image/png");
            if (pngBlob && pngBlob.size <= maxBytes) {
                return new File([pngBlob], file.name, { type: "image/png" });
            }
            let quality = 0.85;
            while (quality >= 0.4) {
                const jpgBlob = await canvasToBlob(canvas, "image/jpeg", quality);
                if (jpgBlob && jpgBlob.size <= maxBytes) {
                    return new File([jpgBlob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
                }
                quality -= 0.15;
            }
        }

        width *= 0.8;
        height *= 0.8;
    }

    return null;
}

export async function uploadImageToImgBB(file, apiKey, onLoadingChange, showToast) {
    const toast = typeof showToast === "function" ? showToast : () => {};
    const setLoading = typeof onLoadingChange === "function" ? onLoadingChange : () => {};

    if (!file) return null;

    if (!file.type || !file.type.startsWith("image/")) {
        toast("⚠️ অনুগ্রহ করে একটি বৈধ ছবি নির্বাচন করুন!");
        return null;
    }

    if (!apiKey || apiKey === "YOUR_IMGBB_API_KEY") {
        toast("⚠️ ImgBB API Key সেট করা নেই!");
        return null;
    }

    if (!navigator.onLine) {
        toast("⚠️ ছবি আপলোড করার জন্য ইন্টারনেট সংযোগ আবশ্যক!");
        return null;
    }

    setLoading(true);
    try {
        toast("⏳ ছবি যাচাই ও আপলোড হচ্ছে...");

        const readyFile = await prepareImageUnderLimit(file, MAX_IMAGE_UPLOAD_BYTES);
        if (!readyFile || readyFile.size > MAX_IMAGE_UPLOAD_BYTES) {
            toast("⚠️ ছবির সাইজ ৩০০ KB-এর বেশি! অনুগ্রহ করে ৩০০ KB বা তার কম সাইজের ছবি নির্বাচন করুন।");
            return null;
        }

        const formData = new FormData();
        formData.append("image", readyFile);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        if (response.ok && result?.success && result?.data?.url) {
            toast("✅ ছবি সফলভাবে আপলোড হয়েছে!");
            return result.data.display_url || result.data.url;
        }

        toast("❌ ছবি আপলোড ব্যর্থ হয়েছে!");
        return null;
    } catch (error) {
        console.error("ImgBB upload error:", error);
        toast("❌ ছবি আপলোড করতে সমস্যা হয়েছে!");
        return null;
    } finally {
        setLoading(false);
    }
}
