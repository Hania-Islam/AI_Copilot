function parseDateString(dateStr) {
    if (!dateStr) return new Date(NaN);
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
    return new Date(NaN);
}

let allUploads = [];
let currentTimeFilter = "All Time";
let currentPage = 1;
const uploadsPerPage = 8;
let filteredUploads = [];
let currentStatusFilter = "All Status";
let currentTypeFilter = "All Types";
let currentSearch = "";
document.addEventListener("DOMContentLoaded", () => {
    applySavedTheme()
    loadHistory();
    // time
});
const severityBtn = document.getElementById("severityBtn");
const severityDropdown = document.getElementById("severityDropdown");
const severityText = document.getElementById("severityText");

severityBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    severityDropdown.classList.toggle("hidden");
});

document.querySelectorAll(".severityOption").forEach(option => {
    option.addEventListener("click", () => {
        currentTimeFilter = option.textContent.trim();
        severityText.textContent = currentTimeFilter;
        severityDropdown.classList.add("hidden");
        applyFilters();
    });
});
async function loadHistory() {
    let uploads = [];
    try {
        const historyUrl = window.getApiUrl ? window.getApiUrl('/upload-history') : '/upload-history';
        const response = await fetch(historyUrl);
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.uploads)) {
                uploads = data.uploads;
            }
        }
    } catch (error) {
        console.warn("Backend history fetch failed:", error);
    }

    try {
        let localUploads = JSON.parse(localStorage.getItem("local_user_uploads")) || [];
        
        // Sync backend uploads into local cache
        uploads.forEach(bu => {
            const exists = localUploads.some(lu => (bu.report_id && lu.report_id === bu.report_id) || (bu.filename === lu.filename && bu.upload_time === lu.upload_time));
            if (!exists) {
                localUploads.push(bu);
            }
        });
        localStorage.setItem("local_user_uploads", JSON.stringify(localUploads.slice(0, 30)));

        // Inject missing local uploads back into display list
        localUploads.forEach(lu => {
            const exists = uploads.some(bu => (bu.report_id && lu.report_id === bu.report_id) || (bu.filename === lu.filename && bu.upload_time === lu.upload_time));
            if (!exists) {
                uploads.unshift(lu);
            }
        });
    } catch (e) {}

    uploads.sort((a, b) => parseDateString(b.upload_time) - parseDateString(a.upload_time));

    allUploads = uploads;
    filteredUploads = allUploads;
    currentPage = 1;
    renderHistoryTable(filteredUploads);
    renderPagination(filteredUploads);
    const totalReports = uploads.length;
    document.getElementById("totalReports").textContent = totalReports;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthReports = uploads.filter(upload => {
            const uploadDate = parseDateString(upload.upload_time);
            return (
                !isNaN(uploadDate.getTime()) &&
                uploadDate.getMonth() === currentMonth &&
                uploadDate.getFullYear() === currentYear
            );
        }).length;
        document.getElementById("reportsChange").textContent =`↑ ${thisMonthReports}`;

        const totalFindings = uploads.reduce(
            (total, upload) => total + Number(upload.findings_count || 0),
            0
        );
        document.getElementById("totalFindings").textContent = totalFindings;

        const thisMonthFindings = uploads
        .filter(upload => {
            const uploadDate = parseDateString(upload.upload_time);
            return (
                !isNaN(uploadDate.getTime()) &&
                uploadDate.getMonth() === currentMonth &&
                uploadDate.getFullYear() === currentYear
            );
        })
        .reduce(
            (total, upload) => total + Number(upload.findings_count || 0),
            0
        );
    document.getElementById("findingsChange").textContent =`↑ ${thisMonthFindings}`;

    // grid 3
    const riskScores = uploads.map(upload =>
        calculateRiskScore(upload.findings)
    );
    const avgRiskScore = riskScores.length
        ? Math.round(
            riskScores.reduce((total, score) => total + score, 0)
            / riskScores.length
          )
        : 0;
    document.getElementById("avgRiskScore").textContent =
        `${avgRiskScore}%`;
        const thisMonthUploads = uploads.filter(upload => {
            const uploadDate = parseDateString(upload.upload_time);
            return (
                !isNaN(uploadDate.getTime()) &&
                uploadDate.getMonth() === currentMonth &&
                uploadDate.getFullYear() === currentYear
            );
        });
        const thisMonthRiskScores = thisMonthUploads.map(upload =>
            calculateRiskScore(upload.findings)
        );
        const thisMonthAvgRisk = thisMonthRiskScores.length
            ? Math.round(
                thisMonthRiskScores.reduce(
                    (total, score) => total + score,
                    0
                ) / thisMonthRiskScores.length
              )
            : 0;
        document.getElementById("riskScoreChange").textContent =
            `↑ ${thisMonthAvgRisk}`;
        
            // grid 4
            const resolvedIssues = uploads.reduce((total, upload) => {
                return total + (upload.findings || []).filter(
                    finding => (finding.status || "").toLowerCase() === "fixed" || (finding.status || "").toLowerCase() === "resolved"
                ).length;
            }, 0);
            document.getElementById("resolvedIssues").textContent =resolvedIssues;

            const thisMonthResolved = uploads
    .filter(upload => {
        const uploadDate = parseDateString(upload.upload_time);

        return (
            !isNaN(uploadDate.getTime()) &&
            uploadDate.getMonth() === currentMonth &&
            uploadDate.getFullYear() === currentYear
        );
    })
    .reduce((total, upload) => {
        return total + (upload.findings || []).filter(
            finding => (finding.status || "").toLowerCase() === "fixed" || (finding.status || "").toLowerCase() === "resolved"
        ).length;
    }, 0);
   document.getElementById("resolvedChange").textContent = `↑ ${thisMonthResolved}`;

    // grid 5
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    uploads.forEach(upload => {
        (upload.findings || []).forEach(finding => {
            if (finding.severity === "Critical") {
                critical++;
            }
            if (finding.severity === "High") {
                high++;
            }
            if (finding.severity === "Medium") {
                medium++;
            }
            if (finding.severity === "Low") {
                low++;
            }
        });
    });
    const totalRiskFindings = critical + high + medium + low;

    const criticalPercent = totalRiskFindings
        ? Math.round((critical / totalRiskFindings) * 100)
        : 0;

    const highPercent = totalRiskFindings
        ? Math.round((high / totalRiskFindings) * 100)
        : 0;

    const mediumPercent = totalRiskFindings
        ? Math.round((medium / totalRiskFindings) * 100)
        : 0;

    const lowPercent = totalRiskFindings
        ? Math.round((low / totalRiskFindings) * 100)
        : 0;
        const criticalEnd = criticalPercent;
        const highEnd = criticalEnd + highPercent;
        const mediumEnd = highEnd + mediumPercent;
        const lowEnd = mediumEnd + lowPercent;
        const riskDonut = document.getElementById("riskDonut");
        if (riskDonut) {
            riskDonut.style.background = `
                conic-gradient(
                    #ef4444 0% ${criticalEnd}%,
                    #f97316 ${criticalEnd}% ${highEnd}%,
                    #eab308 ${highEnd}% ${mediumEnd}%,
                    #22c55e ${mediumEnd}% ${lowEnd}%
                )
            `;
        }
    document.getElementById("criticalRiskCount").textContent = critical;
    document.getElementById("criticalRiskPercent").textContent = `${criticalPercent}%`;

    document.getElementById("highRiskCount").textContent = high;
    document.getElementById("highRiskPercent").textContent = `${highPercent}%`;

    document.getElementById("mediumRiskCount").textContent = medium;
    document.getElementById("mediumRiskPercent").textContent = `${mediumPercent}%`;

    document.getElementById("lowRiskCount").textContent = low;
    document.getElementById("lowRiskPercent").textContent = `${lowPercent}%`;

    document.getElementById("totalRiskFindings").textContent = totalRiskFindings;
        
            const recentActivity = document.getElementById("recentActivity");
            if (recentActivity) {
                const recentUploads = uploads.slice(0, 4);
                recentActivity.innerHTML = "";
                recentUploads.forEach(upload => {
                 const activity = document.createElement("div");
                 const formattedTime = formatUploadTime(upload.upload_time);
                 activity.className = "grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 sm:gap-3 items-start";
                 activity.innerHTML = `
                 <i data-lucide="circle-check"
                    class="w-4 h-4 text-green-500 mt-1 shrink-0"></i>
             
                 <div class="min-w-0">
                     <p class="text-xs text-slate-900 dark:text-white/85 font-semibold leading-4 break-words">
                         ${upload.filename}
                     </p>
             
                     <p class="text-[10px] text-slate-500 dark:text-white/60 mt-0.5">
                         Analysis completed
                     </p>
                 </div>
             
                 <p class="text-[9px] text-slate-500 dark:text-white/50 whitespace-nowrap mt-1">
                       ${formattedTime.time}
                 </p>
             `;
            });
    }
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}
function getFileStyle(fileType) {
    const type = fileType.toUpperCase();
    if (type === "PDF") {
        return {
            icon: "file-type-2",
            iconColor: "text-red-600 dark:text-red-500",
            bgColor: "bg-red-100 dark:bg-red-500/10",
            badge: "bg-red-500/10 text-red-600 dark:text-red-400"
        };
    }
    if (type === "JSON") {
        return {
            icon: "braces",
            iconColor: "text-green-500 dark:text-green-400",
            bgColor: "bg-green-100 dark:bg-green-500/10",
            badge: "bg-green-500/10 text-green-500 dark:text-green-400"
        };
    }
    if (type === "CSV") {
        return {
            icon: "table-2",
            iconColor: "text-green-500 dark:text-green-400",
            bgColor: "bg-green-100 dark:bg-green-500/10",
            badge: "bg-green-500/10 text-green-500 dark:text-green-400"
        };
    }
    if (type === "TXT") {
        return {
            icon: "file-text",
            iconColor: "text-blue-500 dark:text-blue-400",
            bgColor: "bg-blue-100 dark:bg-blue-500/10",
            badge: "bg-blue-500/10 text-blue-500 dark:text-blue-400"
        };
    }
    return {
        icon: "file",
        iconColor: "text-slate-500",
        bgColor: "bg-slate-500/10",
        badge: "bg-slate-500/10 text-slate-500"
    };
}
function formatUploadTime(uploadTime) {
    const [date, time, period] = uploadTime.split(" ");
    return {
        date: date,
        time: `${time} ${period}`
    };
}
function calculateRiskScore(findings) {
    if (!findings || findings.length === 0) {
        return 0;
    }
    const cvssScores = findings.map(finding => {
        let cvss = Number(finding.cvss);
        if (isNaN(cvss) || cvss === 0) {
            const sev = (finding.severity || "").toLowerCase();
            if (sev === "critical") cvss = 9.8;
            else if (sev === "high") cvss = 8.5;
            else if (sev === "medium") cvss = 6.5;
            else if (sev === "low") cvss = 3.1;
            else cvss = 5.0;
        }
        return cvss;
    });

    const highestCvss = Math.max(...cvssScores);
    return Math.min(100, Math.round(highestCvss * 10));
}
function getRiskColor(fileType) {
    switch (String(fileType || "").trim().toUpperCase()) {
        case "PDF":
            return "#ef4444";

        case "CSV":
        case "JSON":
            return "#f97316";

        case "TXT":
            return "#8b5cf6";

        default:
            return "#64748b";
    }
}

function filterByTime(uploads, filter) {
    const now = new Date();
    return uploads.filter(upload => {
        const uploadDate = parseDateString(upload.upload_time);
        if (filter === "All Time") {
            return true;
        }
        if (filter === "Today") {
            return (
                uploadDate.getDate() === now.getDate() &&
                uploadDate.getMonth() === now.getMonth() &&
                uploadDate.getFullYear() === now.getFullYear()
            );
        }
        if (filter === "Yesterday") {
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            return (
                uploadDate.getDate() === yesterday.getDate() &&
                uploadDate.getMonth() === yesterday.getMonth() &&
                uploadDate.getFullYear() === yesterday.getFullYear()
            );
        }
        if (filter === "Last 7 Days") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return uploadDate >= sevenDaysAgo && uploadDate <= now;
        }
        if (filter === "Last 30 Days") {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return uploadDate >= thirtyDaysAgo && uploadDate <= now;
        }

        if (filter === "Last Month") {
            const firstDayLastMonth = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1
            );
            const firstDayThisMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );
            return (
                uploadDate >= firstDayLastMonth &&
                uploadDate < firstDayThisMonth
            );
        }
        return true;
    });
}

function applyFilters() {
    filteredUploads = allUploads.filter(upload => {

        // TIME FILTER
        const timeMatches = filterByTime(
            [upload],
            currentTimeFilter
        ).length > 0;

        // STATUS FILTER
        const statusMatches =
    currentStatusFilter === "All Status" ||
    (upload.findings || []).some(
        finding =>
            finding.status?.toLowerCase() ===
            currentStatusFilter.toLowerCase()
    );

        // TYPE FILTER
        const typeMatches =
            currentTypeFilter === "All Types" ||
            upload.file_type?.toLowerCase() === currentTypeFilter.toLowerCase();

        // SEARCH FILTER
        const searchMatches =
            currentSearch === "" ||
            upload.filename?.toLowerCase().includes(currentSearch);

        return (
            timeMatches &&
            statusMatches &&
            typeMatches &&
            searchMatches
        );
    });

    currentPage = 1;
    renderHistoryTable(filteredUploads);
    renderPagination(filteredUploads);
}
    function renderHistoryTable(uploads) {
        const historyTableBody = document.getElementById("historyTableBody");
        historyTableBody.innerHTML = "";
        const start = (currentPage - 1) * uploadsPerPage;
        const end = start + uploadsPerPage;
        const pageUploads = uploads.slice(start, end);
        pageUploads.forEach(upload => {
            const riskScore = calculateRiskScore(upload.findings);
            const riskColor = getRiskColor(upload.file_type);
            const fileStyle = getFileStyle(upload.file_type);
            const formattedTime = formatUploadTime(upload.upload_time);
            const row = document.createElement("tr");
            row.className =
                "border-b border-slate-200 dark:border-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition";
    
            row.innerHTML = `
                <td class="px-5 py-3">
                    <div class="flex items-center gap-3">
    
                        <div class="w-8 h-8 rounded-lg ${fileStyle.bgColor} flex items-center justify-center shrink-0">
                            <i
                                data-lucide="${fileStyle.icon}"
                                class="w-4 h-4 ${fileStyle.iconColor}">
                            </i>
                        </div>
    
                        <div class="min-w-0">
    
                            <p class="text-slate-900 dark:text-white font-medium truncate">
                                ${upload.filename}
                            </p>
    
                            <p class="text-slate-500 text-[10px] mt-1">
                                ${upload.file_size || "-"}
                            </p>
    
                        </div>
    
                    </div>
                </td>
    
                <td class="px-4 py-3">
                    <span class="px-2.5 py-1 rounded-md ${fileStyle.badge} font-medium">
                        ${upload.file_type}
                    </span>
                </td>
    
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
    
                    ${formattedTime.date}
    
                    <br>
    
                    <span class="text-[10px]">
                        ${formattedTime.time}
                    </span>
    
                </td>
    
                <td class="px-4 py-3">
    
                    <span
                        class="inline-flex items-center px-2.5 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
    
                        <span class="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
    
                        ${upload.status}
    
                    </span>
    
                </td>
    
                <td class="px-4 py-3">
    
                    <span
                        class="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-400 font-medium">
    
                        ${upload.findings_count}
    
                    </span>
    
                </td>
    
                <td class="px-4 py-3">
    
                    <div class="relative w-12 h-12">
    
                        <svg
                            class="w-12 h-12 -rotate-90"
                            viewBox="0 0 36 36">
    
                            <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                                class="text-slate-200 dark:text-slate-700"
                            />
    
                            <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="none"
                                stroke="${riskColor}"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-dasharray="94.25"
                                stroke-dashoffset="${94.25 - (94.25 * riskScore / 100)}"
                            />
    
                        </svg>
    
                        <div class="absolute inset-0 flex items-center justify-center">
    
                            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                ${riskScore}
                            </span>
    
                        </div>
    
                    </div>
    
                </td>
    
                <td class="px-4 py-3">
    
                    <div class="flex items-center justify-center gap-3">
    
                        <button
                            class="view-btn px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
    
                            View
    
                        </button>
    
                        <button
                            class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
    
                            <i data-lucide="more-vertical" class="w-4 h-4"></i>
    
                        </button>
    
                    </div>
    
                </td>
            `;
            const viewBtn = row.querySelector(".view-btn");
            viewBtn.addEventListener("click", () => {
                localStorage.setItem(
                    "selectedUpload",
                    JSON.stringify(upload)
                )
                window.location.href = "history_detail.html";
    
            });
            historyTableBody.appendChild(row);
        });
        lucide.createIcons();
    }

    function renderPagination(uploads) {
        const paginationInfo = document.getElementById("paginationInfo");
        const paginationControls = document.getElementById("paginationControls");
        const totalUploads = uploads.length;
        const totalPages = Math.ceil(totalUploads / uploadsPerPage);
        const start = totalUploads === 0
            ? 0
            : (currentPage - 1) * uploadsPerPage + 1;
        const end = Math.min(
            currentPage * uploadsPerPage,
            totalUploads
        );
        paginationInfo.textContent =`Showing ${start} to ${end} of ${totalUploads} reports`;
        paginationControls.innerHTML = "";
    
        // Previous button
        const previousButton = document.createElement("button");
        previousButton.className ="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800";
        previousButton.innerHTML =`<i data-lucide="chevron-left" class="w-4 h-4"></i>`;
        previousButton.disabled = currentPage === 1;
        previousButton.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderHistoryTable(uploads);
                renderPagination(uploads);
            }
        });
        paginationControls.appendChild(previousButton);
    
    
        // Page buttons
        for (let page = 1; page <= totalPages; page++) {
            const pageButton = document.createElement("button");
            pageButton.textContent = page;
            pageButton.className ="w-8 h-8 rounded-lg text-xs font-medium " +
                (page === currentPage
                    ? "bg-blue-600 text-white"
                    : "border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800");
    
            pageButton.addEventListener("click", () => {
                currentPage = page;
                renderHistoryTable(uploads);
                renderPagination(uploads);
            });
            paginationControls.appendChild(pageButton);
        }
    
        // Next button
        const nextButton = document.createElement("button");
        nextButton.className ="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800";
        nextButton.innerHTML =`<i data-lucide="chevron-right" class="w-4 h-4"></i>`;
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderHistoryTable(uploads);
                renderPagination(uploads);
            }
        });
        paginationControls.appendChild(nextButton);
        lucide.createIcons();
    }

// SEARCH/filter by name
const filterInput = document.getElementById("filterInput");
filterInput.addEventListener("input", () => {
    currentSearch = filterInput.value.toLowerCase().trim();
    applyFilters();
});


const statusBtn = document.getElementById("statusBtn");
const statusDropdown = document.getElementById("statusDropdown");
const statusText = document.getElementById("statusText");
statusBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    statusDropdown.classList.toggle("hidden");
});

document.querySelectorAll(".statusOption").forEach(option => {
    option.addEventListener("click", () => {
        currentStatusFilter = option.textContent.trim();
        statusText.textContent = currentStatusFilter;
        statusDropdown.classList.add("hidden");
        applyFilters();
    });

});

     // TYPES
     const typesBtn = document.getElementById("typesBtn");
     const typesDropdown = document.getElementById("typesDropdown");
     const typesText = document.getElementById("typesText");
 
     typesBtn.addEventListener("click", (e) => {
         e.stopPropagation();
         typesDropdown.classList.toggle("hidden");
     });
 
     document.querySelectorAll(".typesOption").forEach(option => {
        option.addEventListener("click", () => {
            currentTypeFilter = option.textContent.trim();
            typesText.textContent = currentTypeFilter;
            typesDropdown.classList.add("hidden");
            applyFilters();
        });
    });

    //  Export button
     const exportBtn = document.getElementById("exportBtn");
    exportBtn.addEventListener("click", () => {
        // Give all table rows that are currently visible
    const rows = document.querySelectorAll("tbody tr:not(.hidden)");
    let csv = [];

    // Table headers
    const headers = document.querySelectorAll("thead th");
    let headerRow = [];
    headers.forEach(header => {
        headerRow.push(`"${header.textContent.trim()}"`);
    });
    csv.push(headerRow.join(","));
    // Visible rows
    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        let rowData = [];
        cells.forEach(cell => {
            rowData.push(`"${cell.textContent.trim()}"`);
        });
        csv.push(rowData.join(","));
    });

    // Create CSV file
    const csvContent = csv.join("\n");
    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "security-findings.csv";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

    document.addEventListener("click", () => {
        statusDropdown.classList.add("hidden");
        typesDropdown.classList.add("hidden");
    });
