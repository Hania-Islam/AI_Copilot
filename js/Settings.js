applySavedTheme()
async function loadProfile() {
    try {
        const response = await fetch(window.getApiUrl("/settings/profile"));
        const profile = await response.json();

        document.getElementById("name").value = profile.name;
        document.getElementById("email").value = profile.email;
        document.getElementById("username").value = profile.username;
        document.getElementById("role").value = profile.role;

        const profilePic = document.getElementById("profilePic");
        const defaultProfileIcon = document.getElementById("defaultProfileIcon");

        if (profile.profile_picture) {
            profilePic.src = window.getApiUrl(`/profile-pictures/${profile.profile_picture}`);
            profilePic.classList.remove("hidden");
            defaultProfileIcon.classList.add("hidden");
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

async function loadNotificationSettings() {
    try {
        const response = await fetch(window.getApiUrl("/settings/profile"))
        const settings = await response.json()
        const notifications = settings.notifications
        if (!notifications) {
            return
        }
        setNotificationState("emailNotifBtn",notifications.email)
        setNotificationState("securityAlertBtn",notifications.security)
        setNotificationState("reportsBtn",notifications.reports)
        setNotificationState("updatesBtn",notifications.updates)
    } catch (error) {
        console.error("Error loading notification settings:", error)
    }
}

function setNotificationState(buttonId, enabled) {
    const button = document.getElementById(buttonId)
    if (!button) {
        return
    }
    const circle = button.querySelector("span")
    if (enabled) {
        button.classList.add("bg-blue-600")
        button.classList.remove("bg-slate-600")

        circle.classList.add("right-0.5")
        circle.classList.remove("left-0.5")

    } else {
        button.classList.remove("bg-blue-600")
        button.classList.add("bg-slate-600")

        circle.classList.remove("right-0.5")
        circle.classList.add("left-0.5")
    }
}
loadProfile();
loadNotificationSettings()
loadTheme()
loadSecuritySettings()
loadActiveSessions()
loadActiveSessionCount()
loadApiConfiguration()

const saveChangesBtn=document.getElementById("saveChangesBtn")
saveChangesBtn.addEventListener("click", async () => {
    let name = document.getElementById("name").value
    let email = document.getElementById("email").value
    let username = document.getElementById("username").value
    let role = document.getElementById("role").value

    if (name === "" || email === "" || username === "" || role === "") {
        alert("Please fill in all fields")
        return
    }
    const profile = {
        name: name,
        email: email,
        username: username,
        role: role
    }
    try {
        const response = await fetch(window.getApiUrl("/settings/profile"), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profile)
        })
        const data = await response.json()
        if (response.ok) {
            alert("Changes saved successfully")
        } else {
            alert("Failed to save changes")
        }
    } catch (error) {
        console.error("Error saving profile:", error)
        alert("Could not connect to the backend")
    }
})

const editProfilePicBtn = document.getElementById("editProfilePicBtn")
const profilePicInput = document.getElementById("profilePicInput")
editProfilePicBtn.addEventListener("click", () => {
    profilePicInput.click()
})
profilePicInput.addEventListener("change", async () => {
    const file = profilePicInput.files[0]
    if (!file) {
        return
    }
    const formData = new FormData()
    formData.append("file", file)
    try {
        const response = await fetch(window.getApiUrl("/settings/profile-picture"),
            {
                method: "POST",
                body: formData
            }
        )
        const data = await response.json()
        if (response.ok) {
            console.log("Profile picture uploaded:", data)
            const profilePicContainer = document.getElementById("profilePicContainer")
            const profilePic = document.getElementById("profilePic")
            const defaultProfileIcon = document.getElementById("defaultProfileIcon")
            profilePic.src = window.getApiUrl(`/profile-pictures/${data.filename}`)
            profilePic.classList.remove("hidden")
            defaultProfileIcon.classList.add("hidden") 
        } else {
            console.error("Upload failed:", data)
        }
    } catch (error) {
        console.error("Error uploading profile picture:", error)
    }
})

// Email notification
const emailNotifBtn = document.getElementById("emailNotifBtn")
emailNotifBtn.addEventListener("click", async () => {
    const currentState = emailNotifBtn.classList.contains("bg-blue-600")
    const newState = !currentState
    try {
        const response = await fetch(window.getApiUrl("/settings/notifications/email"),
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    enabled: newState
                })
            }
        )
        const data = await response.json()
        if (response.ok) {
            setNotificationState( "emailNotifBtn", data.enabled
            )
            console.log("Email notification updated:", data)
        } else {
            console.error("Failed to update email notification:", data)
        }
    } catch (error) {
        console.error("Error updating email notification:", error)
    }
})

// Security notification
const securityAlertBtn = document.getElementById("securityAlertBtn")
securityAlertBtn.addEventListener("click", async () => {
    const currentState = securityAlertBtn.classList.contains("bg-blue-600")
    const newState = !currentState
    try {
        const response = await fetch(window.getApiUrl("/settings/notifications/security"),
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    enabled: newState
                })
            }
        )
        const data = await response.json()
        if (response.ok) {
            setNotificationState( "securityAlertBtn", data.enabled
            )
            console.log("Security notification updated:", data)
        } else {
            console.error("Failed to update security notification:", data)
        }
    } catch (error) {
        console.error("Error updating security notification:", error)
    }
})

// Weekly reports
const reportsBtn = document.getElementById("reportsBtn")
reportsBtn.addEventListener("click", async () => {
    const currentState = reportsBtn.classList.contains("bg-blue-600")
    const newState = !currentState
    try {
        const response = await fetch(window.getApiUrl("/settings/notifications/reports"),
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    enabled: newState
                })
            }
        )
        const data = await response.json()
        if (response.ok) {
            setNotificationState("reportsBtn",data.enabled
            )
            console.log("Weekly reports updated:", data)
        } else {
            console.error("Failed to update weekly reports:", data)
        }
    } catch (error) {
        console.error("Error updating weekly reports:", error)
    }
})

// Product updates
const updatesBtn = document.getElementById("updatesBtn")
updatesBtn.addEventListener("click", async () => {
    const currentState = updatesBtn.classList.contains("bg-blue-600")
    const newState = !currentState
    try {
        const response = await fetch(window.getApiUrl("/settings/notifications/updates"),
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    enabled: newState
                })
            }
        )
        const data = await response.json()
        if (response.ok) {
            setNotificationState("updatesBtn",data.enabled
            )
            console.log("Product updates updated:", data)
        } else {
            console.error("Failed to update product updates:", data)
        }
    } catch (error) {
        console.error("Error updating product updates:", error)
    }
})

// theme button
const themeBtns = document.querySelectorAll(".themeBtn")
const lightThemeBtn = document.getElementById("lightThemeBtn")
const darkThemeBtn = document.getElementById("darkThemeBtn")
const systemThemeBtn = document.getElementById("systemThemeBtn")
const settingsHtml = document.documentElement

async function saveTheme(theme) {
    try {
        const response = await fetch(window.getApiUrl("/settings/appearance/theme"),
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    theme: theme
                })
            }
        )
        const data = await response.json()
        if (response.ok) {
            console.log("Theme updated:", data)
        } else {
            console.error("Failed to update theme:", data)
        }
    } catch (error) {
        console.error("Error updating theme:", error)
    }
}
themeBtns.forEach((button) => {
    button.addEventListener("click", async () => {
        let selectedTheme
        if (button === lightThemeBtn) {
            selectedTheme = "light"
        }
        else if (button === darkThemeBtn) {
            selectedTheme = "dark"
        }
        else if (button === systemThemeBtn) {
            selectedTheme = "system"
        }

        // Apply theme visually
        if (selectedTheme === "light") {
            settingsHtml.classList.remove("dark")
        }
        else if (selectedTheme === "dark") {
            settingsHtml.classList.add("dark")
        }
        else if (selectedTheme === "system") {
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                settingsHtml.classList.add("dark")
            } else {
                settingsHtml.classList.remove("dark")
            }
        }
        // Save theme to backend
        await saveTheme(selectedTheme)
        // Active button styling
        themeBtns.forEach((btn) => {
            btn.classList.remove(
                "border-blue-500",
                "bg-blue-500/5",
                "text-blue-500",
                "dark:text-blue-400"
            )
            btn.classList.add(
                "border-slate-300",
                "dark:border-slate-700",
                "text-slate-500",
                "dark:text-slate-400"
            )
        })
        button.classList.remove(
            "border-slate-300",
            "dark:border-slate-700",
            "text-slate-500",
            "dark:text-slate-400"
        )
        button.classList.add(
            "border-blue-500",
            "bg-blue-500/5",
            "text-blue-500",
            "dark:text-blue-400"
        )
    })

})

async function loadTheme() {
    try {
        const response = await fetch(window.getApiUrl("/settings/profile"))
        const settings = await response.json()
        const savedTheme = settings.appearance?.theme
        if (!savedTheme) {
            return
        }

        // Apply saved theme
        if (savedTheme === "light") {
            settingsHtml.classList.remove("dark")
        }
        else if (savedTheme === "dark") {
            settingsHtml.classList.add("dark")
        }
        else if (savedTheme === "system") {
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                settingsHtml.classList.add("dark")
            } else {
                settingsHtml.classList.remove("dark")
            }
        }
        // Highlight saved theme button
        themeBtns.forEach((button) => {
            button.classList.remove(
                "border-blue-500",
                "bg-blue-500/5",
                "text-blue-500",
                "dark:text-blue-400"
            )
            button.classList.add(
                "border-slate-300",
                "dark:border-slate-700",
                "text-slate-500",
                "dark:text-slate-400"
            )
        })
        let activeButton
        if (savedTheme === "light") {
            activeButton = lightThemeBtn
        }
        else if (savedTheme === "dark") {
            activeButton = darkThemeBtn
        }
        else if (savedTheme === "system") {
            activeButton = systemThemeBtn
        }
        if (activeButton) {
            activeButton.classList.remove(
                "border-slate-300",
                "dark:border-slate-700",
                "text-slate-500",
                "dark:text-slate-400"
            )
            activeButton.classList.add(
                "border-blue-500",
                "bg-blue-500/5",
                "text-blue-500",
                "dark:text-blue-400"
            )

        }
    } catch (error) {
        console.error("Error loading theme:", error)
    }
}

// Primary colors
const primaryColorBtns = document.querySelectorAll(".primaryColorBtn")
const primaryColors = {
    violet: {
        bg: "bg-violet-600",
        text: "text-violet-500",
        border: "border-violet-500"
    },

    blue: {
        bg: "bg-blue-600",
        text: "text-blue-500",
        border: "border-blue-500"
    },

    green: {
        bg: "bg-emerald-600",
        text: "text-emerald-500",
        border: "border-emerald-500"
    },

    orange: {
        bg: "bg-orange-600",
        text: "text-orange-500",
        border: "border-orange-500"
    },

    red: {
        bg: "bg-red-600",
        text: "text-red-500",
        border: "border-red-500"
    },

    pink: {
        bg: "bg-pink-600",
        text: "text-pink-500",
        border: "border-pink-500"
    }
}

// Give each button a color name
primaryColorBtns.forEach((button) => {
    if (button.classList.contains("bg-violet-500")) {
        button.dataset.color = "violet"
    }
    else if (button.classList.contains("bg-blue-500")) {
        button.dataset.color = "blue"
    }
    else if (button.classList.contains("bg-emerald-500")) {
        button.dataset.color = "green"
    }
    else if (button.classList.contains("bg-orange-500")) {
        button.dataset.color = "orange"
    }
    else if (button.classList.contains("bg-red-500")) {
        button.dataset.color = "red"
    }
    else if (button.classList.contains("bg-pink-500")) {
        button.dataset.color = "pink"
    }

    // Click
    button.addEventListener("click", async () => {
        const selectedColor = button.dataset.color
        try {
            const response = await fetch(window.getApiUrl("/settings/appearance/primary-color"),
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        primary_color: selectedColor
                    })
                }
            )
            const data = await response.json()
            if (response.ok) {
                console.log("Primary color updated:", data)

                // Show selected color
                primaryColorBtns.forEach((btn) => {
                    btn.classList.remove("ring-2")
                })
                button.classList.add("ring-2")
            } else {
                console.error("Failed to update primary color:",data)
            }
        } catch (error) {
            console.error("Error updating primary color:",error)
        }
    })
})

async function loadSecuritySettings() {
    try {
        const response = await fetch(window.getApiUrl("/settings/security"))
        const security = await response.json()
        console.log("SECURITY SETTINGS:", security)
        // Two-Factor Authentication
        const twoFactorStatus =document.getElementById("twoFactorStatus")
        const modalTwoFactorStatus =document.getElementById("modalTwoFactorStatus")
        if (security.two_factor_enabled) {
            if (twoFactorStatus) {
                twoFactorStatus.textContent = "Enabled"
            }
            if (modalTwoFactorStatus) {
                modalTwoFactorStatus.textContent = "Enabled"
            }
        } else {
            if (twoFactorStatus) {
                twoFactorStatus.textContent = "Disabled"
            }
            if (modalTwoFactorStatus) {
                modalTwoFactorStatus.textContent = "Disabled"
            }
        }
        // Active Sessions
        const activeSessionsCount =document.getElementById("activeSessionsCount")
        const modalActiveSessionsCount =document.getElementById("modalActiveSessionsCount")

        if (activeSessionsCount) {
            activeSessionsCount.textContent =
                security.active_sessions
        }
        if (modalActiveSessionsCount) {
            modalActiveSessionsCount.textContent =
                security.active_sessions
        }
    } catch (error) {
        console.error(
            "Error loading security settings:",
            error
        )
    }
}

const twoFactorBtn = document.getElementById("twoFactorBtn")
if (twoFactorBtn) {
    twoFactorBtn.addEventListener("click", async () => {
        const status =document.getElementById("modalTwoFactorStatus")
        const currentState =status.textContent.trim() === "Enabled"
        const newState = !currentState
        try {
            const response = await fetch(window.getApiUrl("/settings/security/2fa"),
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        enabled: newState
                    })
                }
            )
            const data = await response.json()
            if (response.ok) {
                const enabled = data.two_factor_enabled

                // Update modal status
                status.textContent =enabled ? "Enabled" : "Disabled"
                // Update main Security section
                const mainStatus =document.getElementById("twoFactorStatus")
                if (mainStatus) {
                    mainStatus.textContent =
                        enabled ? "Enabled" : "Disabled"
                }

                // Update styling
                if (enabled) {
                    status.classList.add(
                        "bg-emerald-500/10",
                        "text-emerald-500",
                        "dark:text-emerald-400"
                    )
                    status.classList.remove(
                        "bg-slate-500/10",
                        "text-slate-500"
                    )
                } else {
                    status.classList.remove(
                        "bg-emerald-500/10",
                        "text-emerald-500",
                        "dark:text-emerald-400"
                    )
                    status.classList.add(
                        "bg-slate-500/10",
                        "text-slate-500"
                    )
                }
                // Update main section styling too
                if (mainStatus) {
                    if (enabled) {
                        mainStatus.classList.add(
                            "bg-emerald-500/10",
                            "text-emerald-500",
                            "dark:text-emerald-400"
                        )
                        mainStatus.classList.remove(
                            "bg-slate-500/10",
                            "text-slate-500"
                        )
                    } else {
                        mainStatus.classList.remove(
                            "bg-emerald-500/10",
                            "text-emerald-500",
                            "dark:text-emerald-400"
                        )
                        mainStatus.classList.add(
                            "bg-slate-500/10",
                            "text-slate-500"
                        )
                    }
                }
                console.log("2FA updated:",data)
            } else {

                console.error("Failed to update 2FA:",data)
            }
        } catch (error) {
            console.error("Error updating 2FA:",error
            )
        }
    })
}

async function loadActiveSessions() {
    try {
        const response = await fetch(window.getApiUrl("/settings/security/sessions"))
        const data = await response.json()
        console.log("ACTIVE SESSIONS:", data)
        const activeSessionsCount =document.getElementById("activeSessionsCount")
        const modalActiveSessionsCount =document.getElementById("modalActiveSessionsCount")

        if (activeSessionsCount) {
            activeSessionsCount.textContent =
                data.active_sessions
        }
        if (modalActiveSessionsCount) {
            modalActiveSessionsCount.textContent =
                data.active_sessions
        }
    } catch (error) {
        console.error("Error loading active sessions:",error)
}
}

// ACTIVE SESSIONS MODAL
const activeSessionsBtn =document.getElementById("activeSessionsBtn")
const activeSessionsModal =document.getElementById("activeSessionsModal")
const activeSessionsOverlay =document.getElementById("activeSessionsOverlay")
const closeActiveSessionsModal =document.getElementById("closeActiveSessionsModal")
const sessionsContainer =document.getElementById("sessionsContainer")
function openActiveSessionsModal() {
    activeSessionsModal.classList.remove("hidden")
    loadSessionList()
}

function closeActiveSessions() {
    activeSessionsModal.classList.add("hidden")
}
if (activeSessionsBtn) {
    activeSessionsBtn.addEventListener("click", () => {
        openActiveSessionsModal()
    })
}
if (closeActiveSessionsModal) {
    closeActiveSessionsModal.addEventListener("click", () => {
        closeActiveSessions()
    })
}

if (activeSessionsOverlay) {
    activeSessionsOverlay.addEventListener("click", () => {
        closeActiveSessions()
    })
}

// Load sessions
async function loadSessionList() {
    try {
        const response = await fetch(window.getApiUrl("/settings/security/sessions/list"))
        const data = await response.json()
        console.log("SESSION LIST:", data)
        sessionsContainer.innerHTML = ""
        if (!data.sessions || data.sessions.length === 0) {
            sessionsContainer.innerHTML = `
                <p class="text-xs text-slate-500 text-center py-4">
                    No active sessions
                </p>
            `
            return
        }
        data.sessions.forEach(session => {
            const sessionElement = document.createElement("div")
            sessionElement.className ="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700"
            sessionElement.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <i data-lucide="monitor-smartphone"
                           class="w-4 h-4 text-slate-500 dark:text-slate-400">
                        </i>
                    </div>
        
                    <div class="min-w-0">
                        <p class="text-xs font-medium text-slate-900 dark:text-white/90">
                            ${session.device} · ${session.browser}
                        </p>
        
                        <p class="text-[10px] text-slate-500 mt-1">
                            ${session.location} · ${session.last_active}
                        </p>
                    </div>
                </div>
                ${
                    session.current
                    ? `
                        <span class="shrink-0 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[10px] font-medium">
                            Current
                        </span>
                    `
                    : `
                        <button
                            class="revokeSessionBtn shrink-0 px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-medium hover:bg-red-500/20 transition-colors"
                            data-session-id="${session.id}">
                            Revoke
                        </button>
                    `
                }
        
            `
            sessionsContainer.appendChild(sessionElement)
        })
        document.querySelectorAll(".revokeSessionBtn").forEach(button => {
            button.addEventListener("click", async () => {
                const sessionId = button.dataset.sessionId
                if (!confirm("Are you sure you want to revoke this session?")) {
                    return
                }
                try {
                    const response = await fetch(window.getApiUrl(`/settings/security/sessions/${sessionId}`),
                        {
                            method: "DELETE"
                        }
                    )
                    const data = await response.json()
                    if (response.ok) {
                        console.log("SESSION REVOKED:", data)
                        await loadSessionList()
                        // Update count badge
                        loadActiveSessionCount()
                    } else {
                        console.error("Failed to revoke session:", data)
                    }
                } catch (error) {
        
                    console.error("Error revoking session:", error)
                }
            })
        })
    } catch (error) {
        console.error("Error loading session list:",error)
    }
}
async function loadActiveSessionCount() {
    try {
        const response = await fetch(window.getApiUrl("/settings/security/sessions"))
        const data = await response.json()
        const countElement =document.querySelector("#activeSessionsBtn span")
        if (countElement) {
            countElement.textContent = data.active_sessions
        }
    } catch (error) {
        console.error("Error loading active session count:",error
        )
    }
}

// LOGIN HISTORY MODAL
const loginHistoryBtn =document.getElementById("loginHistoryBtn")
const loginHistoryModal =document.getElementById("loginHistoryModal")
const loginHistoryOverlay =document.getElementById("loginHistoryOverlay")
const closeLoginHistoryModal =document.getElementById("closeLoginHistoryModal")
const loginHistoryContainer =document.getElementById("loginHistoryContainer")
function openLoginHistoryModal() {
    loginHistoryModal.classList.remove("hidden")
    loadLoginHistory()
}
function closeLoginHistory() {
    loginHistoryModal.classList.add("hidden")
}

if (loginHistoryBtn) {
    loginHistoryBtn.addEventListener("click", () => {
        openLoginHistoryModal()
    })
}

if (closeLoginHistoryModal) {
    closeLoginHistoryModal.addEventListener("click", () => {
        closeLoginHistory()
    })
}

if (loginHistoryOverlay) {
    loginHistoryOverlay.addEventListener("click", () => {
        closeLoginHistory()
    })
}

// Load login history
async function loadLoginHistory() {
    try {
        const response = await fetch(window.getApiUrl("/settings/security/login-history"))
        const data = await response.json()
        console.log("LOGIN HISTORY:", data)
        loginHistoryContainer.innerHTML = ""
        if (
            !data.login_history ||
            data.login_history.length === 0
        ) {
            loginHistoryContainer.innerHTML = `
                <p class="text-xs text-slate-500 text-center py-4">
                    No login history available
                </p>
            `
            return

        }
        data.login_history.forEach(login => {
            const loginElement =document.createElement("div")
            loginElement.className ="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700"
            loginElement.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">

                        <i data-lucide="log-in"
                           class="w-4 h-4 text-slate-500 dark:text-slate-400">
                        </i>
                    </div>

                    <div class="min-w-0">
                        <p class="text-xs font-medium text-slate-900 dark:text-white/90">
                            ${login.device}
                        </p>

                        <p class="text-[10px] text-slate-500 mt-1">
                            ${login.location} · ${login.date} · ${login.time}
                        </p>
                    </div>
                </div>

                <span class="shrink-0 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[10px] font-medium">
                    ${login.status}
                </span>

            `
            loginHistoryContainer.appendChild(loginElement)
        })
        if (typeof lucide !== "undefined") {
            lucide.createIcons()
        }
    } catch (error) {
        console.error("Error loading login history:",error
        )
        loginHistoryContainer.innerHTML = `
            <p class="text-xs text-red-500 text-center py-4">
                Failed to load login history
            </p>
        `
    }
}

// API CONFIGURATION
const manageApiKeyBtn = document.getElementById("manageApiKeyBtn")
const apiKeyModal = document.getElementById("apiKeyModal")
const apiKeyOverlay = document.getElementById("apiKeyOverlay")
const closeApiKeyModal = document.getElementById("closeApiKeyModal")
const closeApiKeyBtn = document.getElementById("closeApiKeyBtn")

const apiKeyInput = document.getElementById("apiKeyInput")
const toggleApiKey = document.getElementById("toggleApiKey")
const regenerateApiKeyBtn = document.getElementById("regenerateApiKeyBtn")
// OPEN API KEY MODAL
function openApiKeyModal() {
    apiKeyModal.classList.remove("hidden")
    loadApiKey()
}

// CLOSE API KEY MODAL
function closeApiKey() {
    apiKeyModal.classList.add("hidden")
}
if (manageApiKeyBtn) {
    manageApiKeyBtn.addEventListener("click", () => {
        openApiKeyModal()
    })
}
if (closeApiKeyModal) {
    closeApiKeyModal.addEventListener("click", () => {
        closeApiKey()
    })
}
if (closeApiKeyBtn) {
    closeApiKeyBtn.addEventListener("click", () => {
        closeApiKey()
    })
}

if (apiKeyOverlay) {
    apiKeyOverlay.addEventListener("click", () => {
        closeApiKey()
    })
}

// LOAD API KEY
async function loadApiKey() {
    try {
        const response = await fetch(window.getApiUrl("/settings/api"))
        const data = await response.json()
        if (response.ok) {
            apiKeyInput.value = data.api_key || ""
            console.log("API SETTINGS:", data)
        } else {
            console.error("Failed to load API settings:", data)
        }
    } catch (error) {
        console.error("Error loading API settings:", error)
    }
}

// SHOW / HIDE API KEY
if (toggleApiKey) {
    toggleApiKey.addEventListener("click", () => {
        if (apiKeyInput.type === "password") {
            apiKeyInput.type = "text"
            toggleApiKey.innerHTML = `
                <i data-lucide="eye-off" class="w-4 h-4"></i>
            `
        } else {
            apiKeyInput.type = "password"
            toggleApiKey.innerHTML = `
                <i data-lucide="eye" class="w-4 h-4"></i>
            `
        }
        if (typeof lucide !== "undefined") {
            lucide.createIcons()
        }
    })
}

// REGENERATE API KEY
if (regenerateApiKeyBtn) {
    regenerateApiKeyBtn.addEventListener("click", async () => {
        const confirmed = confirm("Are you sure you want to regenerate your API key? The old key will no longer be valid."
        )
        if (!confirmed) {
            return
        }
        try {
            const response = await fetch(window.getApiUrl("/settings/api/regenerate"),
                {
                    method: "POST"
                }
            )
            const data = await response.json()
            if (response.ok) {
                apiKeyInput.value = data.api_key
                console.log("API KEY REGENERATED:", data)
                alert("API key regenerated successfully.")
            } else {
                console.error("Failed to regenerate API key:",data
                )
                alert("Failed to regenerate API key.")
            }
        } catch (error) {
            console.error("Error regenerating API key:",error)
            alert("Could not connect to the backend.")
        }
    })
}

// LOAD API CONFIGURATION
async function loadApiConfiguration() {
    try {
        const response = await fetch(window.getApiUrl("/settings/api"))
        const data = await response.json()
        console.log("API CONFIGURATION:", data)
        if (!response.ok) {

            console.error("Failed to load API configuration:",data)
            return
        }
        renderIntegrations(data.integrations || [])
    } catch (error) {
        console.error( "Error loading API configuration:", error )
    }
}
// ADD INTEGRATION
const addIntegrationBtn = document.getElementById("addIntegrationBtn")
const integrationModal =document.getElementById("integrationModal")
const integrationOverlay =document.getElementById("integrationOverlay")
const closeIntegrationModal =document.getElementById("closeIntegrationModal")
const cancelIntegrationBtn =document.getElementById("cancelIntegrationBtn")
const saveIntegrationBtn =document.getElementById("saveIntegrationBtn")
const integrationType =document.getElementById("integrationType")
const integrationToken =document.getElementById("integrationToken")
function openIntegrationModal() {
    integrationModal.classList.remove("hidden")
}
function closeIntegration() {
    integrationModal.classList.add("hidden")
    integrationType.value = ""
    integrationToken.value = ""
}
if (addIntegrationBtn) {
    addIntegrationBtn.addEventListener("click", () => {
        openIntegrationModal()
    })
}
if (closeIntegrationModal) {
    closeIntegrationModal.addEventListener("click", () => {
        closeIntegration()
    })
}
if (cancelIntegrationBtn) {
    cancelIntegrationBtn.addEventListener("click", () => {
        closeIntegration()
    })
}
if (integrationOverlay) {
    integrationOverlay.addEventListener("click", () => {
        closeIntegration()
    })
}

// SAVE INTEGRATION
if (saveIntegrationBtn) {
    saveIntegrationBtn.addEventListener("click", async () => {
        const service = integrationType.value.trim()
        const token = integrationToken.value.trim()
        if (service === "" || token === "") {
            alert("Please select a service and enter an API token.")
            return
        }
        try {
            const response = await fetch(window.getApiUrl("/settings/api/integrations"),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        service: service,
                        token: token
                    })
                }
            )
            const data = await response.json()
            if (response.ok) {
                console.log( "Integration added:", data
                )
                alert("Integration added successfully.")
                closeIntegration()
                loadApiConfiguration()
            } else {
                console.error("Failed to add integration:",data
                )
                alert("Failed to add integration.")
            }
        } catch (error) {
            console.error("Error adding integration:",error
            )
            alert("Could not connect to the backend.")
        }
    })
}

// RENDER DYNAMIC INTEGRATIONS
function renderIntegrations(integrations) {
    const container = document.getElementById("dynamicIntegrations")
    if (!container) {
        return
    }
    container.innerHTML = ""
    integrations.forEach(integration => {
        const card = document.createElement("div")
        card.className = "flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/40"
        card.innerHTML = `
            <div class="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <i data-lucide="plug" class="w-5 h-5 text-blue-500 dark:text-blue-400">
                </i>

            </div>

            <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-slate-900 dark:text-white/85 truncate">
                    ${integration.service}
                </p>

                <div class="flex items-center gap-1 mt-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span class="text-[10px] text-emerald-500 dark:text-emerald-400">
                        ${integration.status}
                    </span>
                </div>
            </div>

            <button
                type="button"
                class="deleteIntegrationBtn text-[10px] text-red-500 hover:text-red-600"
                data-id="${integration.id}">
                Remove
            </button>

        `
        container.appendChild(card)
    })
    if (typeof lucide !== "undefined") {
        lucide.createIcons()
    }

    // Remove buttons
    document.querySelectorAll(".deleteIntegrationBtn").forEach(button => {
            button.addEventListener("click", () => {
                deleteIntegration(
                    button.dataset.id
                )
            })
        })
}

// DELETE INTEGRATION
async function deleteIntegration(integrationId) {
    const confirmed = confirm( "Are you sure you want to remove this integration?" )
    if (!confirmed) {
        return
    }
    try {
        const response = await fetch(window.getApiUrl(`/settings/api/integrations/${integrationId}`),
            {
                method: "DELETE"
            }
        )
        const data = await response.json()
        if (response.ok) {
            console.log("Integration removed:",data)
            alert("Integration removed successfully.")
            loadApiConfiguration()
        } else {
            console.error("Failed to remove integration:",data)
            alert("Failed to remove integration.")
        }
    } catch (error) {
        console.error("Error removing integration:", error
        )
        alert("Could not connect to the backend.")
    }
}

