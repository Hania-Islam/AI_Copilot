
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

document.addEventListener("DOMContentLoaded", () => {
    applySavedTheme()
const riskDropdownBtn = document.getElementById("riskDropdownBtn");
const riskDropdown = document.getElementById("riskDropdown");
if(riskDropdownBtn && riskDropdown) {
    riskDropdownBtn.addEventListener("click", () => {
       riskDropdown.classList.toggle("hidden");
});
        const riskOptions = document.querySelectorAll(".risk-option");
        riskOptions.forEach((option) => {
            option.addEventListener("click", () => {
                const text = option.textContent.trim();
                const textElement = riskDropdownBtn.querySelector("p");
                if (textElement) {
                    textElement.textContent = text;
                }
                if (text === "Last 7 Days") {
                    selectedRiskPeriod = 7;
                }
                else if (text === "Last 30 Days") {
                    selectedRiskPeriod = 30;
                }
                else if (text === "Last 90 Days") {
                    selectedRiskPeriod = 90;
                }
                else if (text === "Last 6 Months") {
                    selectedRiskPeriod = 180;
                }
                else if (text === "Last Year") {
                    selectedRiskPeriod = 365;
                }
                updateRiskTrend(dashboardUploads);
                riskDropdown.classList.add("hidden");
            });
        })
    }

// Analyze new report button
const analyzeBtn=document.getElementById("analyzeBtn")
if(analyzeBtn){
   analyzeBtn.addEventListener("click",()=>{
      window.location.href="AnalyzeReport.html"
})
}


const viewAllFindings = document.querySelectorAll(".viewAllFindings");
viewAllFindings.forEach(button => {
    button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = "Findings.html";
    });
});


// Search bar
const searchbar = document.getElementById("searchbar");
if (searchbar) {
    searchbar.addEventListener("input", () => {
        const searchText = searchbar.value.toLowerCase().trim();
        const findingRows = document.querySelectorAll("#recentFindingsTable tbody tr");
        findingRows.forEach((row) => {
            const rowText = row.textContent.toLowerCase();
            if (rowText.includes(searchText)) {
                row.classList.remove("hidden");
            } else {
                row.classList.add("hidden");
            }
        });
    });
}
loadDashboardData();
});

// load dashbaord data
async function loadDashboardData() {
    let backendUploads = [];
    try {
        console.log("Loading dashboard data...");
        const apiUrl = window.getApiUrl ? window.getApiUrl('/upload-history') : '/upload-history';
        const response = await fetch(apiUrl);
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.uploads)) {
                backendUploads = data.uploads;
            }
        }
    } catch (error) {
        console.warn("Backend upload history offline or failed:", error);
    }

    try {
        let localUploads = JSON.parse(localStorage.getItem("local_user_uploads")) || [];
        
        // Sync backend uploads into local cache
        backendUploads.forEach(bu => {
            const exists = localUploads.some(lu => (bu.report_id && lu.report_id === bu.report_id) || (bu.filename === lu.filename && bu.upload_time === lu.upload_time));
            if (!exists) {
                localUploads.push(bu);
            }
        });
        localStorage.setItem("local_user_uploads", JSON.stringify(localUploads.slice(0, 30)));

        // Inject missing local uploads back into display list
        localUploads.forEach(lu => {
            const exists = backendUploads.some(bu => (bu.report_id && lu.report_id === bu.report_id) || (bu.filename === lu.filename && bu.upload_time === lu.upload_time));
            if (!exists) {
                backendUploads.unshift(lu);
            }
        });
    } catch (e) {}

    backendUploads.sort((a, b) => parseDateString(b.upload_time) - parseDateString(a.upload_time));

    console.log("Dashboard uploads:", backendUploads);
    updateDashboard(backendUploads);
}

// update dashboard
function updateDashboard(uploads) {
    console.log("Total uploads:", uploads.length);
    dashboardUploads = uploads;
    // Calculate total findings
    let totalFindings = 0;
    let criticalFindings = 0;
    let highFindings = 0;
    let mediumFindings = 0;
    let lowFindings = 0;
    let allFindings = [];

    uploads.forEach((upload) => {
        const findings = upload.findings || [];
        totalFindings += findings.length;
        findings.forEach((finding) => {
            allFindings.push({
                ...finding,
                upload_time: upload.upload_time,
                filename: upload.filename
            });
            const severity = (finding.severity || "").toLowerCase();
            if (severity === "critical") {
                criticalFindings++;
            } 
            else if (severity === "high") {
                highFindings++;
            }
            else if (severity === "medium") {
                mediumFindings++;
            }
            else if (severity === "low") {
                lowFindings++;
            }
        });
    });
    allFindings.sort((a, b) => parseDateString(b.upload_time) - parseDateString(a.upload_time));
    console.log("Total findings:", totalFindings);
    console.log("Critical:", criticalFindings);
    console.log("High:", highFindings);
    console.log("Medium:", mediumFindings);
    console.log("Low:", lowFindings);

    // reports analyzed
    setDashboardValue("reportsAnalyzedValue",uploads.length);
    updateReportsAnalyzedChange(uploads);
    // Total findings
    setDashboardValue("totalFindingsValue",totalFindings);
    updateTotalFindingsChange(uploads);
    // Critical Findings
    setDashboardValue("criticalFindingsValue",criticalFindings);
    updateCriticalFindingsChange(uploads);
    // Active threats
    setDashboardValue("activeThreatsValue", criticalFindings + highFindings);
    updateActiveThreatsChange(uploads);
    // Findings by Severity
    updateSeveritySection(criticalFindings,highFindings,mediumFindings,lowFindings,totalFindings);
    // Recent Findings
    updateRecentFindings(allFindings);
    // Last Analysis
    updateLastAnalysis(uploads);
    // Security Score
    updateSecurityScore(totalFindings, criticalFindings, highFindings, mediumFindings, lowFindings);
    updateSecurityScoreChange(uploads);
    // Risk Overview
    updateRiskOverview(totalFindings, criticalFindings, highFindings, mediumFindings, lowFindings);
    updateRiskOverviewChange(uploads);
    updateRiskTrend(uploads);
    // remediation
    updateRemediationProgress(uploads);
    // Top Vulnerable Assets
    updateVulnerableAssets(allFindings);

    const uniqueAssets = new Set(allFindings.map((finding) => finding.endpoint).filter(Boolean));
    setDashboardValue("assetsMonitoredValue", uniqueAssets.size);
    updateAssetsMonitoredChange(uploads);

    const recCount = allFindings.filter(f => f.recommendation && String(f.recommendation).trim() !== "").length;
    setDashboardValue("aiRecommendationsValue", recCount || allFindings.length);
}

function updateReportsAnalyzedChange(uploads) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 0
        ? 11
        : currentMonth - 1;

    const previousMonthYear = currentMonth === 0
        ? currentYear - 1
        : currentYear;

    let currentMonthUploads = 0;
    let previousMonthUploads = 0;

    uploads.forEach((upload) => {
        const uploadDate = parseDateString(upload.upload_time);
        if (isNaN(uploadDate.getTime())) {
            return;
        }
        if (
            uploadDate.getMonth() === currentMonth &&
            uploadDate.getFullYear() === currentYear
        ) {
            currentMonthUploads++;
        }
        else if (
            uploadDate.getMonth() === previousMonth &&
            uploadDate.getFullYear() === previousMonthYear
        ) {
            previousMonthUploads++;
        }
    });

    const changeElement =
        document.getElementById("reportsAnalyzedChange");

    if (!changeElement) {
        return;
    }

    // No previous-month uploads
    if (previousMonthUploads === 0) {
        if (currentMonthUploads > 0) {
            changeElement.textContent =`↑ ${currentMonthUploads}`;
        } else {
            changeElement.textContent = "→ 0%";
        }
        return;
    }

    const percentageChange = Math.round(
        ((currentMonthUploads - previousMonthUploads)
        / previousMonthUploads) * 100
    );
    if (percentageChange > 0) {

        changeElement.textContent =`↑ ${percentageChange}%`;
        changeElement.classList.remove("text-red-400","text-slate-500");
        changeElement.classList.add("text-green-400");

    }

    else if (percentageChange < 0) {
        changeElement.textContent =`↓ ${Math.abs(percentageChange)}%`;
        changeElement.classList.remove("text-green-400","text-slate-500");
        changeElement.classList.add("text-red-400");
    }
    else {
        changeElement.textContent = "→ 0%";
        changeElement.classList.remove("text-green-400","text-red-400");
        changeElement.classList.add("text-slate-500");
    }
}

function updateTotalFindingsChange(uploads) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 0
        ? 11
        : currentMonth - 1;

    const previousMonthYear = currentMonth === 0
        ? currentYear - 1
        : currentYear;

    let currentMonthFindings = 0;
    let previousMonthFindings = 0;

    uploads.forEach((upload) => {
        const uploadDate = parseDateString(upload.upload_time);
        if (isNaN(uploadDate.getTime())) {
            return;
        }

        const findings = upload.findings || [];
        if (
            uploadDate.getMonth() === currentMonth &&
            uploadDate.getFullYear() === currentYear
        ) {
            currentMonthFindings += findings.length;
        }
        else if (
            uploadDate.getMonth() === previousMonth &&
            uploadDate.getFullYear() === previousMonthYear
        ) {
            previousMonthFindings += findings.length;
        }
    });
    const changeElement =
        document.getElementById("totalFindingsChange");

    if (!changeElement) {
        return;
    }
    if (previousMonthFindings === 0) {
        if (currentMonthFindings > 0) {
            changeElement.textContent =`↑ ${currentMonthFindings}`;
        } else {
            changeElement.textContent = "→ 0%";
        }
        return;
    }
    const percentageChange = Math.round(
        ((currentMonthFindings - previousMonthFindings)
        / previousMonthFindings) * 100
    );

    if (percentageChange > 0) {
        changeElement.textContent =`↑ ${percentageChange}%`;
        changeElement.classList.remove("text-red-400","text-slate-500"
        );
        changeElement.classList.add("text-green-400");
    }
    else if (percentageChange < 0) {
        changeElement.textContent =`↓ ${Math.abs(percentageChange)}%`;
        changeElement.classList.remove("text-green-400","text-slate-500");
        changeElement.classList.add("text-red-400");
    }
    else {
        changeElement.textContent = "→ 0%";
        changeElement.classList.remove("text-green-400","text-red-400" );
        changeElement.classList.add("text-slate-500");
    }
}

function updateCriticalFindingsChange(uploads) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 0
        ? 11
        : currentMonth - 1;

    const previousMonthYear = currentMonth === 0
        ? currentYear - 1
        : currentYear;

    let currentCritical = 0;
    let previousCritical = 0;

    uploads.forEach((upload) => {
        const uploadDate = parseDateString(upload.upload_time);
        if (isNaN(uploadDate.getTime())) {
            return;
        }
        const findings = upload.findings || [];
        const criticalCount = findings.filter(
            (finding) =>
                (finding.severity || "").toLowerCase() === "critical"
        ).length;
        if (
            uploadDate.getMonth() === currentMonth &&
            uploadDate.getFullYear() === currentYear
        ) {
            currentCritical += criticalCount;
        }
        else if (
            uploadDate.getMonth() === previousMonth &&
            uploadDate.getFullYear() === previousMonthYear
        ) {
            previousCritical += criticalCount;
        }
    });

    const changeElement = document.getElementById("criticalFindingsChange");
    if (!changeElement) {
        return;
    }
    if (previousCritical === 0) {
        if (currentCritical > 0) {
            changeElement.textContent =`↑ ${currentCritical}`;
        } else {
            changeElement.textContent = "→ 0%";
        }
        return;
    }
    const percentageChange = Math.round(
        ((currentCritical - previousCritical)
        / previousCritical) * 100
    );
    if (percentageChange > 0) {
        changeElement.textContent =`↑ ${percentageChange}%`;
        changeElement.classList.remove("text-green-400");
        changeElement.classList.add("text-red-500");
    }
    else if (percentageChange < 0) {
        changeElement.textContent =`↓ ${Math.abs(percentageChange)}%`;
        changeElement.classList.remove("text-red-500");
        changeElement.classList.add("text-green-400");
    }
    else {
        changeElement.textContent = "→ 0%";
        changeElement.classList.remove("text-red-500","text-green-400");
        changeElement.classList.add("text-slate-500");
    }
}

// HELPER — SET VALUE
function setDashboardValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }

}
// FINDINGS BY SEVERITY
function updateSeveritySection( critical, high, medium, low, total) {
    setDashboardValue("criticalSeverityValue",critical);
    setDashboardValue("highSeverityValue",high);
    setDashboardValue("mediumSeverityValue",medium);
    setDashboardValue("lowSeverityValue",low);
    setDashboardValue("totalSeverityValue",total);
    const donut = document.getElementById("severityDonut");
    if (total === 0) {
        setDashboardValue("criticalSeverityPercent", "0%");
        setDashboardValue("highSeverityPercent", "0%");
        setDashboardValue("mediumSeverityPercent", "0%");
        setDashboardValue("lowSeverityPercent", "0%");

        if(donut) {
            donut.style.background = "#334155";
        }
        return
    }
    const criticalPercent =Math.round((critical / total) * 100);
    const highPercent = Math.round((high / total) * 100);
    const mediumPercent =Math.round((medium / total) * 100);
    const lowPercent = Math.round((low / total) * 100);


setDashboardValue("criticalSeverityPercent",`${criticalPercent}%`);
setDashboardValue("highSeverityPercent",`${highPercent}%`);
setDashboardValue("mediumSeverityPercent",`${mediumPercent}%`);
setDashboardValue("lowSeverityPercent",`${lowPercent}%`);

// Calculate angles for the donut
const criticalAngle = (critical / total) * 360;
const highAngle = (high / total) * 360;
const mediumAngle = (medium / total) * 360;
const criticalEnd = criticalAngle;
const highEnd = criticalAngle + highAngle;
const mediumEnd = criticalAngle + highAngle + mediumAngle;
// Update donut
if (donut) {
    donut.style.background =
        `conic-gradient(
            #ef4444 0% ${criticalPercent}%,
            #f97316 ${criticalPercent}% ${criticalPercent + highPercent}%,
            #eab308 ${criticalPercent + highPercent}% ${criticalPercent + highPercent + mediumPercent}%,
            #22c55e ${criticalPercent + highPercent + mediumPercent}% 100%
        )`;
}
}


// Recent findings
function updateRecentFindings(findings) {
    const tableBody =document.querySelector("#recentFindingsTable tbody");
    if (!tableBody) {
        return;
    }
    tableBody.innerHTML = "";
    // newest findings first
    const recentFindings = findings.slice(0, 5);
    recentFindings.forEach((finding) => {
        const row = document.createElement("tr");
        row.className ="border-b border-slate-200 dark:border-slate-700/40 text-sm font-normal";
        const severity =(finding.severity || "Unknown").toLowerCase();

        let severityClass ="bg-green-500/30 border-green-500 text-green-600 dark:text-green-400";
        if (severity === "critical") {
            severityClass ="bg-red-500/30 border-red-500 text-red-500 dark:text-red-400";
        }
        else if (severity === "high") {
            severityClass ="bg-orange-500/30 border-orange-500 text-orange-500 dark:text-orange-400";
        }
        else if (severity === "medium") {
            severityClass ="bg-yellow-500/30 border-yellow-500 text-yellow-600 dark:text-yellow-400";
        }
        row.innerHTML = `
            <td class="px-4 py-3 text-slate-900 dark:text-white text-sm">
                ${escapeHTML(finding.title || "Unknown")}
            </td>

            <td class="px-4 py-3">
                <button class="${severityClass}
                    border px-2 rounded-lg text-xs">
                    ${escapeHTML(finding.severity || "Unknown")}
                </button>
            </td>

            <td class="px-4 py-3 text-slate-700 dark:text-white">
                ${escapeHTML(finding.endpoint || "Unknown")}
            </td>

            <td class="px-4 py-3 text-slate-700 dark:text-white text-xs">
                ${escapeHTML(finding.upload_time || "Unknown")}
            </td>

            <td class="px-4 py-3 text-slate-700 dark:text-white">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    <p>Open</p>
                </div>
            </td>

            <td class="px-4 py-3">
                <button type="button" class="viewFindingBtn bg-transparent border border-slate-400 dark:border-slate-500 px-2 rounded-lg text-slate-700 dark:text-white">
                    View
                </button>
            </td>
        `;
        tableBody.appendChild(row);
        const viewButton = row.querySelector(".viewFindingBtn");
        if (viewButton) {
            viewButton.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                openFindingModal(finding);
            });
        }
    });
}

function openFindingModal(finding) {

    const modal = document.getElementById("findingModal");

    if (!modal) {
        return;
    }

    setDashboardValue(
        "modalFindingTitle",
        finding.title || "Unknown"
    );

    setDashboardValue(
        "modalFindingSeverity",
        finding.severity || "Unknown"
    );

    setDashboardValue(
        "modalFindingStatus",
        finding.status || "Open"
    );

    setDashboardValue(
        "modalFindingEndpoint",
        finding.endpoint || "Unknown"
    );

    setDashboardValue(
        "modalFindingDate",
        finding.upload_time || "Unknown"
    );

    setDashboardValue(
        "modalFindingId",
        finding.id || finding.finding_id || "N/A"
    );

    setDashboardValue(
        "modalFindingDescription",
        finding.description || "No description available."
    );

    modal.classList.remove("hidden");
}
document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("findingModal");

    const closeModal = () => {
        if (modal) {
            modal.classList.add("hidden");
        }
    };

    const closeBtn = document.getElementById("closeFindingModal");
    const closeBtnFooter = document.getElementById("closeFindingModalBtn");

    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    if (closeBtnFooter) {
        closeBtnFooter.addEventListener("click", closeModal);
    }

    if (modal) {
        modal.addEventListener("click", (event) => {

            if (event.target === modal) {
                closeModal();
            }

        });
    }

});

// LAST ANALYSIS
function updateLastAnalysis(uploads) {
    if (!uploads.length) {
        return;
    }
    const latestUpload = uploads[0]
    setDashboardValue("lastAnalysisTime","Latest analysis");
    setDashboardValue("lastAnalysisDate",latestUpload.upload_time);
}

// SECURITY SCORE
function updateSecurityScore(total, critical, high, medium, low) {
    if (total === 0) {
        setDashboardValue("securityScoreValue", "100");
        const circle = document.getElementById("securityScoreCircle");
        if (circle) circle.style.background = `conic-gradient(#2563eb 100%, #1e293b 100%)`;
        return;
    }

    const weightedRisk = (critical * 1.0) + (high * 0.7) + ((medium || 0) * 0.3) + ((low || 0) * 0.1);
    const riskValue = Math.max(0, Math.min(100, Math.round((weightedRisk / total) * 100)));
    const score = 100 - riskValue;

    setDashboardValue("securityScoreValue", Math.round(score));

    const circle = document.getElementById("securityScoreCircle");
    if (circle) {
        circle.style.background = `conic-gradient(#2563eb ${score}%, #1e293b ${score}%)`;
    }
}


// RISK OVERVIEW
function updateRiskOverview(total, critical, high, medium, low) {
    if (total === 0) {
        setDashboardValue("riskPercentage", "0%");
        setDashboardValue("riskLabel", "Low Risk");
        return;
    }
    const weightedRisk = (critical * 1.0) + (high * 0.7) + ((medium || 0) * 0.3) + ((low || 0) * 0.1);
    const risk = Math.round((weightedRisk / total) * 100);
    const riskValue = Math.max(0, Math.min(100, risk));
    setDashboardValue("riskPercentage", `${riskValue}%`);
    let label = "Low Risk";
    if (riskValue >= 70) {
        label = "High Risk";
    }
    else if (riskValue >= 40) {
        label = "Medium Risk";
    }
    setDashboardValue("riskLabel", label);

    // Needle rotation
    const needle = document.getElementById("riskNeedle");
    if (needle) {
        const rotation = -90 + (riskValue * 1.8);
        needle.style.transform = `rotate(${rotation}deg)`;
    }
}

function updateRemediationProgress(uploads) {
    if (!uploads.length) {
        setDashboardValue("remediationCompleted", 0);
        setDashboardValue("issuesFixed", 0);
        setDashboardValue("issuesRemaining", 0);
        return;
    }
    const latestUpload = uploads[0];
    const findings = latestUpload.findings || [];
    const total = findings.length;
    const fixed = findings.filter(
        (finding) => (finding.status || "").toLowerCase() === "fixed"
    ).length;
    const remaining = total - fixed;
    const completed = total === 0? 0: Math.round((fixed / total) * 100);
    setDashboardValue("remediationCompleted", completed);
    setDashboardValue("issuesFixed", fixed);
    setDashboardValue("issuesRemaining", remaining);
    const circle = document.getElementById("remediationCircle");
    if (circle) {
        circle.style.background =
            `conic-gradient(#2563eb ${completed}%, #1e293b ${completed}%)`;
    }
}

function updateAssetsMonitoredChange(uploads) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = currentMonth === 0
        ? currentYear - 1
        : currentYear;

    const currentMonthAssets = new Set();
    const previousMonthAssets = new Set();
    uploads.forEach((upload) => {
        const uploadDate = parseDateString(upload.upload_time);
        if (isNaN(uploadDate.getTime())) {
            return;
        }
        const findings = upload.findings || [];
        findings.forEach((finding) => {
            const endpoint = finding.endpoint;
            if (!endpoint) {
                return;
            }
            if (
                uploadDate.getMonth() === currentMonth &&
                uploadDate.getFullYear() === currentYear
            ) {
                currentMonthAssets.add(endpoint);
            }
            if (
                uploadDate.getMonth() === previousMonth &&
                uploadDate.getFullYear() === previousMonthYear
            ) {
                previousMonthAssets.add(endpoint);
            }

        });
    });
    const newAssets = [...currentMonthAssets].filter(
        (asset) => !previousMonthAssets.has(asset)
    ).length;

    setDashboardValue(
        "assetsMonitoredChange",
        `↑ ${newAssets}`
    );
}

function updateActiveThreatsChange(uploads) {
    const today = new Date();
    const todayDate = today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const yesterdayDate = yesterday.toDateString();
    let todayThreats = 0;
    let yesterdayThreats = 0;
    uploads.forEach((upload) => {
        const uploadDate = parseDateString(upload.upload_time);
        if (isNaN(uploadDate.getTime())) {
            return;
        }

        const findings = upload.findings || [];
        const activeThreats = findings.filter((finding) => {
            const severity = (finding.severity || "").toLowerCase();
            return severity === "critical" || severity === "high";
        }).length;

        if (uploadDate.toDateString() === todayDate) {
            todayThreats += activeThreats;
        }

        else if (uploadDate.toDateString() === yesterdayDate) {
            yesterdayThreats += activeThreats;

        }

    });

    const difference = todayThreats - yesterdayThreats;

    const changeElement = document.getElementById("activeThreatsChange");

    if (!changeElement) {
        return;
    }

    if (difference > 0) {

        changeElement.textContent = `↑ ${difference}`;
        changeElement.classList.remove("text-green-500");
        changeElement.classList.add("text-red-500");

    }

    else if (difference < 0) {

        changeElement.textContent = `↓ ${Math.abs(difference)}`;
        changeElement.classList.remove("text-red-500");
        changeElement.classList.add("text-green-500");

    }

    else {

        changeElement.textContent = "→ 0";
        changeElement.classList.remove("text-red-500", "text-green-500");
        changeElement.classList.add("text-slate-500");

    }
}

function updateSecurityScoreChange(uploads) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = currentMonth === 0
        ? currentYear - 1
        : currentYear;

    let currentFindings = [];
    let previousFindings = [];

    uploads.forEach((upload) => {
        const uploadDate = parseDateString(upload.upload_time);
        if (isNaN(uploadDate.getTime())) {
            return;
        }
        const findings = upload.findings || [];
        if (
            uploadDate.getMonth() === currentMonth &&
            uploadDate.getFullYear() === currentYear
        ) {
            currentFindings.push(...findings);
        }
        if (
            uploadDate.getMonth() === previousMonth &&
            uploadDate.getFullYear() === previousMonthYear
        ) {
            previousFindings.push(...findings);
        }

    });

    function calculateScore(findings) {
        if (findings.length === 0) {
            return 100;
        }
        let score = 100;
        findings.forEach((finding) => {
            const severity = (finding.severity || "").toLowerCase();
            if (severity === "critical") {
                score -= 5;
            }
            else if (severity === "high") {
                score -= 2;
            }
        });
        return Math.max(0, Math.min(100, score));
    }
    const currentScore = calculateScore(currentFindings);
    const previousScore = calculateScore(previousFindings);
    const difference = currentScore - previousScore;
    const changeElement = document.getElementById("securityScoreChange");
    if (!changeElement) {
        return;
    }
    if (difference > 0) {
        changeElement.textContent = `↑ ${difference}%`;
        changeElement.classList.remove("text-red-400", "text-slate-500");
        changeElement.classList.add("text-green-400");
    }
    else if (difference < 0) {
        changeElement.textContent = `↓ ${Math.abs(difference)}%`;
        changeElement.classList.remove("text-green-400", "text-slate-500");
        changeElement.classList.add("text-red-400");
    }
    else {
        changeElement.textContent = "→ 0%";
        changeElement.classList.remove("text-green-400", "text-red-400");
        changeElement.classList.add("text-slate-500");
    }
}

function updateRiskOverviewChange(uploads) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 0
        ? 11
        : currentMonth - 1;

    const previousMonthYear = currentMonth === 0
        ? currentYear - 1
        : currentYear;

    let currentFindings = [];
    let previousFindings = [];

    uploads.forEach((upload) => {
        const uploadDate = parseDateString(upload.upload_time);
        if (isNaN(uploadDate.getTime())) {
            return;
        }
        const findings = upload.findings || [];
        if (
            uploadDate.getMonth() === currentMonth &&
            uploadDate.getFullYear() === currentYear
        ) {
            currentFindings.push(...findings);
        }
        else if (
            uploadDate.getMonth() === previousMonth &&
            uploadDate.getFullYear() === previousMonthYear
        ) {
            previousFindings.push(...findings);
        }

    });

    function calculateRisk(findings) {
        if (findings.length === 0) {
            return 0;
        }

        let critical = 0;
        let high = 0;

        findings.forEach((finding) => {

            const severity = (finding.severity || "").toLowerCase();

            if (severity === "critical") {
                critical++;
            }
            else if (severity === "high") {
                high++;
            }
        });
        const risk = Math.round(
            ((critical * 1) + (high * 0.6))
            / findings.length
            * 100
        );
        return Math.max(0, Math.min(100, risk));
    }
    const currentRisk = calculateRisk(currentFindings);
    const previousRisk = calculateRisk(previousFindings);
    const difference = currentRisk - previousRisk;
    const changeElement = document.getElementById("riskChange");
    if (!changeElement) {
        return;
    }
    if (difference > 0) {
        changeElement.textContent =`↑ ${difference}% higher than last month`;
        changeElement.classList.remove("text-green-400","text-slate-500"
        );
        changeElement.classList.add("text-red-400");
    }
    else if (difference < 0) {
        changeElement.textContent =`↓ ${Math.abs(difference)}% lower than last month`;
        changeElement.classList.remove("text-red-400","text-slate-500"
        );
        changeElement.classList.add("text-green-400");
    }
    else {
        changeElement.textContent ="→ 0% from last month";
        changeElement.classList.remove("text-red-400","text-green-400");
        changeElement.classList.add("text-slate-500");
    }
}

// RISK TREND CHART
let riskTrendChart = null;
let selectedRiskPeriod = 30;
let dashboardUploads = [];
function updateRiskTrend(uploads) {
    const canvas = document.getElementById("riskTrendChart");
    if (!canvas) {
        return;
    }
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - selectedRiskPeriod);
    uploads = uploads.filter((upload) => {
        const uploadDate = parseDateString(upload.upload_time);
        return !isNaN(uploadDate.getTime()) && uploadDate >= cutoffDate;
    });
    // Convert uploads into risk-score data
    const riskData = [];
    uploads.forEach((upload) => {
        const findings = upload.findings || [];
        if (findings.length === 0) {
            return;
        }
        let critical = 0;
        let high = 0;
        findings.forEach((finding) => {
            const severity =
                (finding.severity || "").toLowerCase();

            if (severity === "critical") {
                critical++;
            }
            else if (severity === "high") {
                high++;
            }
        });
        const total = findings.length;
        const risk = Math.round(
            ((critical * 1) + (high * 0.6))
            / total * 100
        );
        riskData.push({
            date: upload.upload_time,
            risk: Math.max(0, Math.min(100, risk))
        });
    });
    // Oldest → newest
    riskData.reverse();
    const labels = riskData.map((item) => item.date);
    const values = riskData.map((item) => item.risk);
    // Remove previous chart
    if (riskTrendChart) {
        riskTrendChart.destroy();
    }

    riskTrendChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Risk Score",
                data: values,
                borderWidth: 2,
                tension: 0.35,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 25
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Risk Score: ${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
}

// TOP VULNERABLE ASSETS
function updateVulnerableAssets(findings) {
    const assetContainer = document.getElementById("vulnerableAssetsContainer");
    if (!assetContainer) {
        return;
    }
    const assetCounts = {};
    findings.forEach((finding) => {
        const endpoint =finding.endpoint || "Unknown";
        assetCounts[endpoint] =(assetCounts[endpoint] || 0) + 1;
    });
    const assets =Object.entries(assetCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    assetContainer.innerHTML = "";
    const max =assets.length? assets[0][1]: 1;
    assets.forEach(([asset, count]) => {
        const percentage =Math.round((count / max) * 100);
        const div =document.createElement("div");
        div.className ="flex items-center gap-2";
        div.innerHTML = `
            <div class="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center">
                <i data-lucide="globe"
                   class="w-3 h-3 text-purple-400">
                </i>
            </div>

            <span class="text-slate-600 dark:text-slate-300 text-xs w-28 truncate">
                ${escapeHTML(asset)}
            </span>

            <div class="flex-1 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full">
                <div
                    class="h-1.5 bg-red-500 rounded-full"
                    style="width: ${percentage}%">
                </div>
            </div>

            <span class="text-slate-600 dark:text-slate-300 text-xs w-5 text-right">
                ${count}
            </span>
        `;
        assetContainer.appendChild(div);
    });

    if (window.lucide) {
        lucide.createIcons();
    }
}

// SECURITY HELPER
function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

