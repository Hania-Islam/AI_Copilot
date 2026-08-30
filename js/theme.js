async function applySavedTheme() {
    try {
        const apiUrl = window.getApiUrl ? window.getApiUrl('/settings/profile') : '/settings/profile';
        const response = await fetch(apiUrl);
        const settings = await response.json()
        const theme = settings.appearance?.theme
        if (theme === "light") {
            document.documentElement.classList.remove("dark")

        }
        else if (theme === "dark") {
            document.documentElement.classList.add("dark")
        }
        else if (theme === "system") {
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                document.documentElement.classList.add("dark")
            } else {
                document.documentElement.classList.remove("dark")
            }
        }
    } catch (error) {
        console.error("Error applying saved theme:", error)
    }
}
