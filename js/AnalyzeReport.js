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

function parseDateString(dateStr) {
    if (!dateStr) return new Date(0);
    if (dateStr instanceof Date) return dateStr;
    let cleaned = String(dateStr).trim();
    let normalized = cleaned.replace(/^(\d{4})[\./](\d{1,2})[\./](\d{1,2})/, '$1-$2-$3');
    normalized = normalized.replace(/a\.m\./i, 'AM').replace(/p\.m\./i, 'PM');

    const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2})[:.](\d{1,2})(?:[:.](\d{1,2}))?\s*(AM|PM)?)?/i);
    if (match) {
        let year = parseInt(match[1], 10);
        let month = parseInt(match[2], 10) - 1;
        let day = parseInt(match[3], 10);
        let hour = match[4] ? parseInt(match[4], 10) : 0;
        let min = match[5] ? parseInt(match[5], 10) : 0;
        let sec = match[6] ? parseInt(match[6], 10) : 0;
        let ampm = match[7] ? match[7].toUpperCase() : null;
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        return new Date(year, month, day, hour, min, sec);
    }
    
    let d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;
    return new Date(0);
}

function renderRecentUploads(uploads) {
    const recentUploads = document.getElementById("recentUploads");
    if (!recentUploads) return;

    recentUploads.innerHTML = "";
    const recentFiles = (uploads || []).slice(0, 5);
    if (recentFiles.length === 0) {
        recentUploads.innerHTML = `<div class="px-5 py-4 text-center text-xs text-slate-500">No recent uploads</div>`;
        return;
    }

    recentFiles.forEach(upload => {
        const row = document.createElement("div");
        row.className = "upload-row grid grid-cols-[2fr_1fr_1.5fr_1fr_0.5fr] items-center px-5 py-3 border-b border-slate-200 dark:border-slate-800";
        row.innerHTML = `
            <div class="flex items-center gap-2 min-w-0">
                <i data-lucide="file-text" class="w-4 h-4 text-blue-400 shrink-0"></i>
                <span class="text-slate-800 dark:text-white/80 text-xs truncate">
                    ${upload.filename || 'Report'}
                </span>
            </div>
            <span class="text-slate-600 dark:text-slate-400 text-xs">
                ${upload.file_type || (upload.filename ? upload.filename.split('.').pop().toUpperCase() : 'TXT')}
            </span>
            <span class="text-slate-600 dark:text-slate-400 text-xs">
                ${upload.upload_time || 'Just now'}
            </span>
            <span class="px-2 py-1 w-fit rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                ${upload.status || 'Completed'}
            </span>
            <span class="text-slate-800 dark:text-white/80 text-xs">
                ${upload.findings_count !== undefined ? upload.findings_count : (upload.findings ? upload.findings.length : 0)}
            </span>
        `;
        recentUploads.appendChild(row);
    });
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

function addUploadToUIAndStorage(uploadData) {
    let localHistory = [];
    try {
        localHistory = JSON.parse(localStorage.getItem("uploadHistory")) || [];
    } catch (e) {
        localHistory = [];
    }

    localHistory = localHistory.filter(item =>
        item.filename !== uploadData.filename || item.upload_time !== uploadData.upload_time
    );

    localHistory.unshift(uploadData);
    localHistory.sort((a, b) => parseDateString(b.upload_time) - parseDateString(a.upload_time));

    try {
        localStorage.setItem("uploadHistory", JSON.stringify(localHistory));
    } catch (e) {
        console.error("Error saving upload to localStorage:", e);
    }

    renderRecentUploads(localHistory);
}

async function parseFileClientSide(file) {
    const ext = file.name.split(".").pop().toUpperCase();
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const hoursRaw = now.getHours();
    const ampm = hoursRaw >= 12 ? 'PM' : 'AM';
    const hours12 = hoursRaw % 12 || 12;
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(hours12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${ampm}`;

    let textContent = "";
    try {
        textContent = await file.text();
    } catch (e) {
        textContent = "";
    }

    let findings = [];
    if (textContent.trim()) {
        // Try JSON parsing
        if (textContent.trim().startsWith("{") || textContent.trim().startsWith("[")) {
            try {
                const parsedData = JSON.parse(textContent);
                const rawList = Array.isArray(parsedData) ? parsedData : (parsedData.findings || parsedData.vulnerabilities || [parsedData]);
                rawList.forEach((item, idx) => {
                    if (typeof item === 'object' && item !== null) {
                        const sev = item.severity || "Medium";
                        let cvss = Number(item.cvss);
                        if (isNaN(cvss) || cvss === 0) {
                            if (sev === "Critical") cvss = 9.8;
                            else if (sev === "High") cvss = 8.5;
                            else if (sev === "Medium") cvss = 6.5;
                            else cvss = 3.1;
                        }
                        findings.push({
                            id: String(item.id || (idx + 1)),
                            title: item.title || item.name || `Finding ${idx + 1}`,
                            severity: sev,
                            endpoint: item.endpoint || item.asset || item.url || "/",
                            description: item.description || `Vulnerability detected in ${file.name}`,
                            evidence: item.evidence || "Evidence captured during analysis.",
                            recommendation: item.recommendation || item.remediation || "Apply recommended patches.",
                            cvss: cvss,
                            impact: item.impact || "Security risk detected.",
                            status: item.status || "Open",
                            date_detected: (item.date_detected && item.date_detected !== "undefined" && item.date_detected !== "null") ? item.date_detected : dateStr,
                            type: item.type || "Other",
                            filename: file.name
                        });
                    }
                });
            } catch (e) {}
        }
        
        // Try Text / PDF Regex Extraction
        if (findings.length === 0) {
            const blocks = textContent.split(/(?=(?:FINDING|Finding|Vulnerability|Issue|\d+\.\s+Finding))/g).filter(b => b.trim());
            blocks.forEach((block, idx) => {
                const extractField = (keys) => {
                    for (const k of keys) {
                        const re = new RegExp('(?:^|\\n|\\b)' + k + '\\s*:\\s*(.*?)(?=\\n\\s*(?:Title|Severity|CVSS|Endpoint|Asset|Description|Evidence|Recommendation|Remediation|Impact|Status|Date|FINDING|Finding|Vulnerability)\\s*:|$)', 'is');
                        const m = block.match(re);
                        if (m && m[1]) return m[1].trim();
                    }
                    return "";
                };

                let title = extractField(["Title", "Finding Title", "Vulnerability", "Name"]);
                if (!title) {
                    const firstLine = block.split("\n")[0].trim();
                    title = firstLine.replace(/^(?:FINDING|Finding|Vulnerability|Issue|\d+\.|\#\d+)\s*(?:#?\s*[A-Za-z0-9_\-]+[:\s]*)?/i, '').trim();
                }
                if (!title || title.length < 3) title = `Finding ${idx + 1}`;

                const sev = extractField(["Severity", "Risk Level"]) || "Medium";
                let cvss = Number(extractField(["CVSS", "CVSS Score"]));
                if (isNaN(cvss) || cvss === 0) {
                    if (sev === "Critical") cvss = 9.8;
                    else if (sev === "High") cvss = 8.5;
                    else if (sev === "Medium") cvss = 6.5;
                    else cvss = 3.1;
                }

                const titleLower = title.toLowerCase();
                let typeVal = "Other";
                if (titleLower.includes("xss") || titleLower.includes("script")) typeVal = "XSS";
                else if (titleLower.includes("sql") || titleLower.includes("injection")) typeVal = "Injection";
                else if (titleLower.includes("header")) typeVal = "Security Header";
                else if (titleLower.includes("idor") || titleLower.includes("access")) typeVal = "Access Control";
                else if (titleLower.includes("password") || titleLower.includes("auth")) typeVal = "Authentication";
                else if (titleLower.includes("dependency") || titleLower.includes("component")) typeVal = "Vulnerability";

                findings.push({
                    id: String(idx + 1),
                    title: title,
                    severity: sev,
                    endpoint: extractField(["Endpoint", "Asset", "URL", "Location"]) || "/",
                    description: extractField(["Description", "Details"]) || `Vulnerability detected in ${file.name}`,
                    evidence: extractField(["Evidence", "Proof"]) || "Evidence captured during analysis.",
                    recommendation: extractField(["Recommendation", "Remediation", "Solution"]) || "Apply appropriate security controls.",
                    cvss: cvss,
                    impact: extractField(["Impact"]) || "Security risk identified.",
                    status: extractField(["Status"]) || "Open",
                    date_detected: (() => { const d = extractField(["Date", "Date Detected"]); return (d && d !== "undefined" && d !== "null") ? d : dateStr; })(),
                    type: typeVal,
                    filename: file.name
                });
            });
        }
    }

    if (findings.length === 0) {
        findings.push({
            id: "1",
            title: `Analyzed Report: ${file.name}`,
            severity: "Medium",
            cvss: 6.5,
            endpoint: "/",
            status: "Open",
            date_detected: dateStr,
            filename: file.name,
            description: `Security analysis completed for ${file.name}.`,
            evidence: "Report file processed.",
            recommendation: "Review findings and apply patches.",
            impact: "Potential security risk.",
            type: "Other"
        });
    }

    return {
        id: "UPL-" + Date.now().toString().slice(-4),
        filename: file.name,
        file_type: ext,
        file_size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        upload_time: timeStr,
        status: "Completed",
        findings_count: findings.length,
        findings: findings
    };
}

async function uploadFileToServer(file) {
    const isValid = processFile(file);
    if (!isValid) return;

    fileError.classList.add("hidden");
    const formData = new FormData();
    formData.append("file", file);

    const uploadUrl = window.getApiUrl ? window.getApiUrl('/upload') : '/upload';
    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || "Upload failed with status " + response.status);
        }
        const data = await response.json();
        console.log("Upload successful:", data);
        await loadRecentUploads();
    } catch (error) {
        console.error("Backend upload failed:", error);
        fileError.innerText = `Upload failed: ${error.message || "Could not connect to backend server."}`;
        fileError.classList.remove("hidden");
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

// Load recent uploads directly from backend API
async function loadRecentUploads() {
    const recentUploads = document.getElementById("recentUploads");
    if (!recentUploads) return;

    let backendUploads = [];
    try {
        const historyUrl = window.getApiUrl ? window.getApiUrl('/upload-history') : '/upload-history';
        const response = await fetch(historyUrl);
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.uploads)) {
                backendUploads = data.uploads;
            }
        }
    } catch (error) {
        console.warn("Could not fetch upload history from backend:", error);
    }

    backendUploads.sort((a, b) => parseDateString(b.upload_time) - parseDateString(a.upload_time));
    renderRecentUploads(backendUploads);
}

loadRecentUploads();
document.addEventListener("DOMContentLoaded", loadRecentUploads);


