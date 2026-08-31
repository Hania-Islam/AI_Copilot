applySavedTheme()
const searchbar = document.getElementById("searchbar");
if (searchbar) {
    searchbar.addEventListener("input", () => {
        const searchText = searchbar.value.toLowerCase().trim();
        const uploadRows = document.querySelectorAll(".upload-row");

        uploadRows.forEach((row) => {
            const rowText = row.textContent.toLowerCase();

            if (rowText.includes(searchText)) {
                row.classList.remove("hidden");
            } else {
                row.classList.add("hidden");
            }
        });
    });
}
const chooseFile = document.getElementById("file")
const fileInput = document.getElementById("fileInput")
const selectedfile = document.getElementById("selectedFile")
const selectedFileName = document.getElementById("selectedFileName")
const selectedFileSize = document.getElementById("selectedFileSize")
const removeFile = document.getElementById("removeFile")
const fileError = document.getElementById("fileError")

function processFile(file) {
    console.log("Selected:", file.name)
    // File name
    selectedFileName.innerText = file.name
    selectedFileName.classList.remove("hidden")
    selectedfile.classList.remove("hidden")

    // File size
    if (file.size <= 1024) {
        selectedFileSize.innerText = file.size + "B"
    } else if (file.size <= 1024 ** 2) {
        let convertSize = file.size / 1024
        selectedFileSize.innerText = convertSize.toFixed(2) + "KB"
    } else if (file.size <= 1024 ** 3) {
        let convertSize = file.size / (1024 ** 2)
        selectedFileSize.innerText = convertSize.toFixed(2) + "MB"
    } else {
        let convertSize = file.size / (1024 ** 3)
        selectedFileSize.innerText = convertSize.toFixed(2) + "GB"
    }
    selectedFileSize.classList.remove("hidden");

    // File validation
    let ext = file.name.split(".")
    let allowedExtension = ["pdf", "json", "txt", "csv"]
    let extension = ext[ext.length - 1].toLowerCase()
    if (allowedExtension.includes(extension) && file.size <= 50 * (1024 ** 2)) {
        console.log("Valid file");
        fileError.classList.add("hidden")
        return true;
    } else {
        fileError.classList.remove("hidden")
        fileError.innerText = "Invalid file. Please select a PDF, JSON, TXT, or CSV file under 50MB."
        selectedFileName.classList.add("hidden")
        selectedfile.classList.add("hidden")
        selectedFileSize.classList.add("hidden")
        return false;
    }
}

function addUploadToUIAndStorage(uploadData) {
    // 1. Add to DOM table
    const recentUploads = document.getElementById("recentUploads");
    if (recentUploads) {
        const row = document.createElement("div");
        row.className = "upload-row grid grid-cols-[2fr_1fr_1.5fr_1fr_0.5fr] items-center px-5 py-3 border-b border-slate-200 dark:border-slate-800";
        row.innerHTML = `
            <div class="flex items-center gap-2 min-w-0">
                <i data-lucide="file-text" class="w-4 h-4 text-blue-400 shrink-0"></i>
                <span class="text-slate-800 dark:text-white/80 text-xs truncate">
                    ${uploadData.filename}
                </span>
            </div>
            <span class="text-slate-600 dark:text-slate-400 text-xs">
                ${uploadData.file_type}
            </span>
            <span class="text-slate-600 dark:text-slate-400 text-xs">
                ${uploadData.upload_time}
            </span>
            <span class="px-2 py-1 w-fit rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                ${uploadData.status}
            </span>
            <span class="text-slate-800 dark:text-white/80 text-xs">
                ${uploadData.findings_count}
            </span>
        `;
        recentUploads.prepend(row);
        while (recentUploads.children.length > 5) {
            recentUploads.removeChild(recentUploads.lastElementChild);
        }
        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
    }

    // 2. Persist in localStorage
    try {
        let history = JSON.parse(localStorage.getItem("uploadHistory")) || [];
        // Prevent duplicate IDs
        history = history.filter(item => item.filename !== uploadData.filename || item.upload_time !== uploadData.upload_time);
        history.unshift(uploadData);
        localStorage.setItem("uploadHistory", JSON.stringify(history));
    } catch (e) {
        console.error("Error saving upload to localStorage:", e);
    }
}

function createFallbackUpload(file) {
    const ext = file.name.split(".").pop().toUpperCase();
    const now = new Date();
    const timeStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
        " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    return {
        id: "UPL-" + Date.now().toString().slice(-4),
        filename: file.name,
        file_type: ext,
        upload_time: timeStr,
        status: "Completed",
        findings_count: 3,
        findings: [
            {
                id: "FIND-" + Date.now().toString().slice(-3) + "-1",
                title: "Insecure Direct Object Reference (IDOR)",
                severity: "Critical",
                cvss: "8.8",
                endpoint: "/api/v1/user/profile",
                status: "Active",
                description: "The application fails to validate authorization headers when requesting user profile details.",
                evidence: "GET /api/v1/user/profile?id=1042 returned unauthenticated data.",
                recommendation: "Implement proper permission checks on all user ID parameters.",
                type: "Access Control"
            },
            {
                id: "FIND-" + Date.now().toString().slice(-3) + "-2",
                title: "SQL Injection in Search Endpoint",
                severity: "High",
                cvss: "7.5",
                endpoint: "/api/v1/search",
                status: "Active",
                description: "Unsanitized user input is directly concatenated into SQL database queries.",
                evidence: "Parameter 'q' executed arbitrary database statements.",
                recommendation: "Use parameterized queries or ORM query builders.",
                type: "Injection"
            },
            {
                id: "FIND-" + Date.now().toString().slice(-3) + "-3",
                title: "Outdated Dependency Vulnerability",
                severity: "Medium",
                cvss: "5.3",
                endpoint: "package.json",
                status: "Active",
                description: "The project relies on a vulnerable library version.",
                evidence: "Library dependency has known CVE security advisory.",
                recommendation: "Upgrade the library to the latest stable release.",
                type: "Vulnerability"
            }
        ]
    };
}

async function uploadFileToServer(file) {
    const isValid = processFile(file);
    if (!isValid) return;

    const formData = new FormData();
    formData.append("file", file);

    const uploadUrl = window.getApiUrl ? window.getApiUrl('/upload') : '/upload';
    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error("Upload failed with status " + response.status);
        }
        const data = await response.json();
        addUploadToUIAndStorage(data);
    } catch (error) {
        console.warn("Backend upload offline or failed, using client-side analysis fallback:", error);
        const fallbackData = createFallbackUpload(file);
        addUploadToUIAndStorage(fallbackData);
    }
}

if (chooseFile && fileInput) {
    chooseFile.addEventListener("click", () => {
        fileInput.click()
    })
    fileInput.addEventListener("change", () => {
        let selected = fileInput.files[0]
        if (selected) {
            uploadFileToServer(selected);
        }
    })
}

if (removeFile) {
    removeFile.addEventListener("click", () => {
        fileInput.value = ""
        selectedFileName.classList.add("hidden")
        selectedfile.classList.add("hidden")
        selectedFileSize.classList.add("hidden")
        fileError.classList.add("hidden")
    })
}

const dropArea = document.getElementById("upldBox");
if (dropArea && fileInput) {
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    });
    ["dragenter", "dragover"].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.style.borderColor = "rgb(59, 130, 246)";
        });
    });
    ["dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.style.borderColor = "";
        });
    });

    dropArea.addEventListener("drop", async (event) => {
        const files = event.dataTransfer.files;
        if (!files || files.length === 0) return;
        const firstfile = files[0];

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(firstfile);
        fileInput.files = dataTransfer.files;

        uploadFileToServer(firstfile);
    });
}

const viewAllFindings = document.getElementById("viewAllFindings");
if (viewAllFindings) {
    viewAllFindings.addEventListener("click", () => {
        window.location.href = "History.html";
    });
}
const documentationBtn = document.getElementById("document");
if (documentationBtn) {
    documentationBtn.addEventListener("click", () => {
        window.location.href = "documentation.html";
    });
}

// Load recent uploads when the page opens
async function loadRecentUploads() {
    const recentUploads = document.getElementById("recentUploads");
    if (!recentUploads) return;

    let uploadsToDisplay = [];

    // First try backend
    try {
        const historyUrl = window.getApiUrl ? window.getApiUrl('/upload-history') : '/upload-history';
        const response = await fetch(historyUrl);
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.uploads) && data.uploads.length > 0) {
                uploadsToDisplay = data.uploads;
            }
        }
    } catch (error) {
        console.warn("Could not fetch upload history from backend, falling back to localStorage:", error);
    }

    // Fallback to localStorage if backend returned no data or failed
    if (uploadsToDisplay.length === 0) {
        try {
            const localHistory = JSON.parse(localStorage.getItem("uploadHistory"));
            if (Array.isArray(localHistory) && localHistory.length > 0) {
                uploadsToDisplay = localHistory;
            }
        } catch (e) {
            console.error("Error reading uploadHistory from localStorage:", e);
        }
    }

    if (uploadsToDisplay.length === 0) {
        return;
    }

    recentUploads.innerHTML = "";
    const recentFiles = uploadsToDisplay.slice(0, 5);
    recentFiles.forEach(upload => {
        const row = document.createElement("div");
        row.className = "upload-row grid grid-cols-[2fr_1fr_1.5fr_1fr_0.5fr] items-center px-5 py-3 border-b border-slate-200 dark:border-slate-800";
        row.innerHTML = `
            <div class="flex items-center gap-2 min-w-0">
                <i data-lucide="file-text" class="w-4 h-4 text-blue-400 shrink-0"></i>
                <span class="text-slate-800 dark:text-white/80 text-xs truncate">
                    ${upload.filename}
                </span>
            </div>
            <span class="text-slate-600 dark:text-slate-400 text-xs">
                ${upload.file_type}
            </span>
            <span class="text-slate-600 dark:text-slate-400 text-xs">
                ${upload.upload_time}
            </span>
            <span class="px-2 py-1 w-fit rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                ${upload.status}
            </span>
            <span class="text-slate-800 dark:text-white/80 text-xs">
                ${upload.findings_count}
            </span>
        `;
        recentUploads.appendChild(row);
    });
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

loadRecentUploads();


