import {
    watchAuth,
    loginAdmin,
    logoutAdmin
} from "./auth.js";

import {
    ref,
    set,
    get,
    onValue,
    remove,
    push
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import {
    db
} from "./firebase.js";

"use strict";

const DEFAULT_CATEGORY_IMAGE = "https://cdn-icons-png.flaticon.com/512/3541/3541850.png";

function escapeHTML(str) {
    return String(str || "").replace(
        /[&<>"']/g,
        match => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[match])
    );
}

let database = {
    categories: [],
    headers: [],
    data: []
};

let currentCategoryId = null;
let currentDataId = null;
let editingItem = null;
let movingDataId = null;
let isAllSearchActive = false;
let isSearchMode = false;
let isFavoriteActive = false;

window.currentUserRole = "guest";
let isDeviceVerified = false;

function getDeviceId() {
    let devId = localStorage.getItem("police_pb_device_id");
    if (!devId) {
        devId = "DEV_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
        localStorage.setItem("police_pb_device_id", devId);
    }
    return devId;
}

function checkDeviceVerificationStatus() {
    const devId = getDeviceId();
    const approvedRef = ref(db, `webapp/approved_devices/${devId}`);
    
    onValue(approvedRef, (snapshot) => {
        if (snapshot.exists() && snapshot.val().status === "approved") {
            isDeviceVerified = true;
            if (!currentCategoryId && !currentDataId && !isAllSearchActive && !isFavoriteActive) {
                document.getElementById("verifiedBadge")?.classList.remove("hidden");
            }
        } else {
            isDeviceVerified = false;
            document.getElementById("verifiedBadge")?.classList.add("hidden");
        }
        refreshCurrentView();
    });
}

function checkOnlineStatus() {
    if (!navigator.onLine) {
        showToast("⚠️ ইন্টারনেট সংযোগ নেই!");
        loadLocalCache();
    }
}

window.addEventListener('online', () => {
    showToast("🟢 অনলাইন মোডে আছেন ");
    loadDatabase();
});

window.addEventListener('offline', checkOnlineStatus);

watchAuth((user, role) => {
    const adminBtn = document.getElementById("adminLoginBtn");

    if (!user) {
        window.currentUser = null;
        window.currentUserRole = "guest";
        if (adminBtn) {
            adminBtn.textContent = "🔑Admin";
            adminBtn.classList.add("hidden");
        }
    } else {
        window.currentUser = user;
        window.currentUserRole = role || "admin";
        if (adminBtn) {
            adminBtn.textContent = "🟢Admin";
            adminBtn.classList.remove("hidden");
        }
    }

    updateAdminUI();
    loadDatabase();
});

function isAllSupportOrSearchActive() {
    return isAllSearchActive || currentCategoryId !== null || currentDataId !== null || isFavoriteActive;
}

function updateAdminUI() {
    const isAdmin = window.currentUserRole === "admin";
    const topbar = document.querySelector(".topbar");

    if (topbar) {
        if (isAdmin) {
            topbar.classList.add("admin-header");
            topbar.classList.remove("user-header");
        } else {
            topbar.classList.add("user-header");
            topbar.classList.remove("admin-header");
        }
    }

    const adminContainer = document.getElementById("adminActionContainer");
    if (adminContainer) {
        if (isAdmin && !isAllSupportOrSearchActive()) {
            adminContainer.classList.remove("flex");
            adminContainer.style.display = "flex";
        } else {
            adminContainer.classList.add("hidden");
            adminContainer.style.display = "none";
        }
    }

    document.querySelectorAll(".admin-only").forEach(el => {
        if (isAdmin) {
            if (el.id === "addCategoryBtn" && (isAllSearchActive || isFavoriteActive)) {
                el.classList.add("hidden");
            } else {
                el.classList.remove("hidden");
            }
        } else {
            el.classList.add("hidden");
        }
    });

    const loginForm = document.getElementById("loginFormContainer");
    const logoutContainer = document.getElementById("logoutContainer");

    if (loginForm) {
        loginForm.style.display = isAdmin ? "none" : "block";
    }

    if (logoutContainer) {
        if (isAdmin) {
            logoutContainer.classList.remove("hidden");
        } else {
            logoutContainer.classList.add("hidden");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initOfflineLanguageSystem();
    setupEvents();
    initTheme();
    updateAdminUI();
    initImageSlider();

    checkDeviceVerificationStatus();
    loadLocalCache();
    checkOnlineStatus();

    history.replaceState({ page: "home" }, "");
    window.addEventListener("popstate", handlePopState);
});

/* ==========================================
   AUTOMATIC IMAGE SLIDER BANNER
========================================== */
function initImageSlider() {
    let currentSlideIndex = 0;
    const slides = document.querySelectorAll(".slide");
    const dots = document.querySelectorAll(".dot");

    if (!slides.length) return;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === index);
        });
    }

    function nextSlide() {
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        showSlide(currentSlideIndex);
    }

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            currentSlideIndex = index;
            showSlide(currentSlideIndex);
        });
    });

    setInterval(nextSlide, 3500);
}

function setNavState(searchOrSubPageActive) {
    isSearchMode = searchOrSubPageActive;
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");

    if (searchOrSubPageActive) {
        menuIcon?.classList.add("hidden");
        backIcon?.classList.remove("hidden");
    } else {
        menuIcon?.classList.remove("hidden");
        backIcon?.classList.add("hidden");
    }
}

function openHeaderSearch() {
    const searchBox = document.getElementById("searchBox");
    const appTitle = document.getElementById("appTitle");
    const searchBtn = document.getElementById("searchBtn");

    if (searchBox && appTitle) {
        searchBox.classList.remove("hidden");
        appTitle.classList.add("hidden");
        if (searchBtn) searchBtn.classList.add("hidden");
        setNavState(true);
        document.getElementById("searchInput")?.focus();
    }
}

function closeHeaderSearch() {
    const searchBox = document.getElementById("searchBox");
    const appTitle = document.getElementById("appTitle");
    const searchBtn = document.getElementById("searchBtn");
    const input = document.getElementById("searchInput");

    if (searchBox && appTitle) {
        searchBox.classList.add("hidden");
        appTitle.classList.remove("hidden");
        
        if (currentCategoryId || currentDataId || isAllSearchActive || isFavoriteActive) {
            if (searchBtn) searchBtn.classList.remove("hidden");
        } else {
            if (searchBtn) searchBtn.classList.add("hidden");
        }

        if (input) input.value = "";
        
        if (!currentCategoryId && !currentDataId && !isAllSearchActive && !isFavoriteActive) {
            setNavState(false);
        }
        handleSearch();
    }
}

function handlePopState(event) {
    closeHeaderSearch();
    const state = event.state;

    if (!state || state.page === "home") {
        isFavoriteActive = false;
        closeAllSearchUI();
        showMainDashboardView(false);
    } else if (state.page === "allSearch") {
        isFavoriteActive = false;
        showAllSearchPage(false);
    } else if (state.page === "favorite") {
        isFavoriteActive = true;
        closeAllSearchUI();
        renderFavoriteView(false);
    } else if (state.page === "category") {
        isFavoriteActive = false;
        closeAllSearchUI();
        showCategoryView(state.categoryId, false);
    } else if (state.page === "data") {
        isFavoriteActive = false;
        closeAllSearchUI();
        showDataPage(state.dataId, false);
    }
}

function initTheme() {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    showToast(isDark ? "নাইট মোড অন করা হয়েছে" : "ডে মোড অন করা হয়েছে");
}

function loadLocalCache() {
    const cached = localStorage.getItem("police_phonebook_data");
    if (cached) {
        try {
            database = JSON.parse(cached);
            if (!database.categories) database.categories = [];
            if (!database.headers) database.headers = [];
            if (!database.data) database.data = [];
            refreshCurrentView();
        } catch (e) {
            console.error("Local Cache Error:", e);
        }
    }
}

async function loadDatabase() {
    loadLocalCache();
    if (!navigator.onLine) return;

    try {
        const snapshot = await get(ref(db, "webapp/public_data"));
        if (snapshot.exists()) {
            database = snapshot.val();
            if (!database.categories) database.categories = [];
            if (!database.headers) database.headers = [];
            if (!database.data) database.data = [];
            
            localStorage.setItem("police_phonebook_data", JSON.stringify(database));
            refreshCurrentView();
        }
    } catch (error) {
        console.error("Database load error:", error);
    }
}

async function saveDatabase() {
    if (window.currentUserRole !== "admin") {
        showToast("শুধুমাত্র Admin পরিবর্তন সেভ করতে পারবেন");
        return;
    }

    localStorage.setItem("police_phonebook_data", JSON.stringify(database));
    refreshCurrentView();

    if (!navigator.onLine) {
        showToast("অফলাইনে সেভ হয়েছে! ইন্টারনেট এলে ডাটাবেজে যুক্ত হবে।");
        return;
    }

    set(ref(db, "webapp/public_data"), database).catch((error) => {
        console.error("Database background save error:", error);
        showToast("ক্লাউডে সিঙ্ক করতে সমস্যা হয়েছে");
    });
}

function generateId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
}

function sortItemsByPin(items) {
    return items.sort((a, b) => {
        const pinA = a.isPinned || a.pinned ? 1 : 0;
        const pinB = b.isPinned || b.pinned ? 1 : 0;
        
        if (pinA && !pinB) return -1;
        if (!pinA && pinB) return 1;

        if (pinA && pinB) {
            return (a.pinnedAt || a.pinnedOrder || 0) - (b.pinnedAt || b.pinnedOrder || 0);
        }

        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        
        return timeA - timeB;
    });
}

function sortContactData(items) {
    return items.sort((a, b) => {
        const pinA = a.isPinned || a.pinned ? 1 : 0;
        const pinB = b.isPinned || b.pinned ? 1 : 0;
        
        if (pinA && !pinB) return -1;
        if (!pinA && pinB) return 1;

        if (pinA && pinB) {
            return (a.pinnedAt || a.pinnedOrder || 0) - (b.pinnedAt || b.pinnedOrder || 0);
        }

        let nameA = String(a.name || "").trim();
        let nameB = String(b.name || "").trim();

        return nameA.localeCompare(nameB, 'bn', { numeric: true, sensitivity: 'base' });
    });
}

function setupEvents() {
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);

    document.getElementById("navToggleBtn")?.addEventListener("click", (e) => {
        const searchBox = document.getElementById("searchBox");
        const isSearchOpen = searchBox && !searchBox.classList.contains("hidden");

        if (isSearchOpen) {
            e.stopImmediatePropagation();
            e.preventDefault();
            closeHeaderSearch();
            return;
        }

        if (currentCategoryId || currentDataId || isAllSearch
