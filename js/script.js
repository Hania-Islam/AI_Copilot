applySavedTheme()
 lucide.createIcons();

    const mobileMenuBtn=document.getElementById("mobileMenuBtn")
    const mobileDrawer=document.getElementById("mobileDrawer")
    const mobileCloseBtn=document.getElementById("mobileCloseBtn")
    const mobileOverlay=document.getElementById("mobileOverlay")

    if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click",()=>{
        mobileDrawer.classList.remove("-translate-x-full")
        mobileOverlay.classList.remove("hidden")
    })
}
    if(mobileCloseBtn) {
    mobileCloseBtn.addEventListener("click",()=> {
        mobileDrawer.classList.add("-translate-x-full")
        mobileOverlay.classList.add("hidden")
    })
}
    if(mobileOverlay) {
    mobileOverlay.addEventListener("click",()=>{
        mobileDrawer.classList.add("-translate-x-full")
        mobileOverlay.classList.add("hidden")
    })
}

    const profilebtn=document.getElementById("profilebtn")
    const profileDropdown=document.getElementById("profileDropdown")
    if(profilebtn){
    profilebtn.addEventListener("click",()=>{
        profileDropdown.classList.toggle("hidden");
    })
}
document.addEventListener("click",(event)=>{
    if(!profilebtn.contains(event.target) && !profileDropdown.contains(event.target)) {
        profileDropdown.classList.add("hidden")
    }
})

const brightbtn = document.getElementById("brightBtn")
const html = document.documentElement
const savedTheme = localStorage.getItem("theme")

if (savedTheme === "light") {
    html.classList.remove("dark")
} else if (savedTheme === "dark") {
    html.classList.add("dark")
} else if (savedTheme === "system") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        html.classList.add("dark")
    } else {
        html.classList.remove("dark")
    }
} else {
    // Default theme
    html.classList.add("dark")
}

if (brightbtn) {
    brightbtn.addEventListener("click", () => {
        html.classList.toggle("dark")
        if (html.classList.contains("dark")) {
            localStorage.setItem("theme", "dark")
        } else {
            localStorage.setItem("theme", "light")
        }
    })
}

const notificationBtn=document.getElementById("notificationBtn")
const notificationDropdown=document.getElementById("notificationDropdown")
notificationBtn.addEventListener("click",()=>{
    notificationDropdown.classList.toggle("hidden")
})
document.addEventListener("click",(event)=>{
    if(!notificationBtn.contains(event.target) && !notificationDropdown.contains(event.target)) {
        notificationDropdown.classList.add("hidden")
    }
})

async function loadNotifications() {
    try {
        const apiUrl = window.getApiUrl ? window.getApiUrl('/notifications') : '/notifications';
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error("Failed to load notifications");
        }
        const data = await response.json();
        // Update notification number
        const notificationCount = document.getElementById("notificationCount");
        if (notificationCount) {
            notificationCount.textContent = data.unread_count;
        }

        // Notification list
        const notificationList = document.getElementById("notificationList");
        if (!notificationList) return;
        notificationList.innerHTML = "";
        data.notifications.forEach(notification => {
            let icon = "bell";
            let iconClass = "text-blue-400";
            if (notification.type === "critical") {
                icon = "shield-alert";
                iconClass = "text-red-400";
            }
            else if (notification.type === "success") {
                icon = "file-check";
                iconClass = "text-green-400";
            }
            else if (notification.type === "info") {
                icon = "sparkles";
                iconClass = "text-blue-400";
            }
            notificationList.innerHTML += `
                <div class="flex gap-3 px-3 py-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                    <i data-lucide="${icon}"
                        class="w-4 h-4 ${iconClass} shrink-0">
                    </i>
                    <div>
                        <p class="text-slate-700 dark:text-slate-200 text-xs">
                            ${notification.title}
                        </p>

                        <p class="text-slate-500 text-[11px] mt-1">
                            ${notification.time}
                        </p>
                    </div>
                </div>
            `;
        });
        // Re-render Lucide icons created dynamically
        lucide.createIcons();
    } catch (error) {
        console.error("Error loading notifications:", error);
    }
}
loadNotifications();

const topbarSearch = document.getElementById("searchbar");
console.log("SEARCHBAR:", topbarSearch);
if (topbarSearch) {
    topbarSearch.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
            return;
        }
        const searchValue = topbarSearch.value.trim().toLowerCase();
        if (!searchValue) {
            return;
        }
        if (
            searchValue.includes("dashboard") ||
            searchValue.includes("home")
        ) {
            window.location.href = "dashboard.html";
        }
        else if (
            searchValue.includes("analyze") ||
            searchValue.includes("upload") ||
            searchValue.includes("report")
        ) {
            window.location.href = "Analyze_Report.html";
        }
        else if (searchValue.includes("finding")) {
            window.location.href = "Findings.html";
        }
        else if (
            searchValue.includes("remediation") ||
            searchValue.includes("ai")
        ) {
            window.location.href = "AI_Remediation.html";
        }
        else if (searchValue.includes("history")) {
            window.location.href = "History.html";
        }
        else if (searchValue.includes("profile")) {
            window.location.href = "Settings.html#profileSection";
        }
        else if (searchValue.includes("setting")) {
            window.location.href = "Settings.html";
        }
        else {
            alert("No page found for: " + searchValue);
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
    ) {
        event.preventDefault();
        const topbarSearch = document.getElementById("searchbar");
        if (topbarSearch) {
            topbarSearch.focus();
        }
    }
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        sessionStorage.clear();
    });
}
