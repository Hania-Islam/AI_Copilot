document.addEventListener("DOMContentLoaded", () => {
    applySavedTheme()
    loadFindings();
});
let allFindings = [];
let currentPage = 1;
const findingsPerPage = 8;
let filteredFindings = [];
let selectedFinding = null;
function sanitizeFindingItem(f, idx) {
    if (!f) return f;
    
    // Clean Title
    let rawTitle = (f.title || `Finding ${idx || 1}`).trim();
    rawTitle = rawTitle.split('\n')[0].trim();
    rawTitle = rawTitle.replace(/^(?:FINDING|Finding|Vulnerability|Issue|\d+[\.\:]\s*)\s*(?:#?\s*(?:[0-9]+|FND-[0-9]+)\s*[:\-]?\s*)?/i, '').trim();
    if (/^(?:SECURITY ASSESSMENT REPORT|Executive Summary|Finding Summary)\b/i.test(rawTitle)) {
        let subTitle = rawTitle.replace(/^(?:SECURITY ASSESSMENT REPORT|Executive Summary|Finding Summary)\s*[:\-]?\s*/i, '').trim();
        rawTitle = (subTitle && subTitle.length > 3) ? subTitle : "Security Assessment Finding";
    }
    if (rawTitle.length > 55) {
        rawTitle = rawTitle.slice(0, 52) + "...";
    }
    f.title = rawTitle;

    // Clean Endpoint / Asset
    let rawEndpoint = (f.endpoint || "/").trim();
    rawEndpoint = rawEndpoint.split('\n')[0].trim();
    rawEndpoint = rawEndpoint.split(/\s*(?:Description|Impact|Remediation|Vulnerable|Secure|Executive|Synthetic)\b/i)[0].trim();
    const epMatch = rawEndpoint.match(/(?:GET|POST|PUT|DELETE|PATCH)?\s*(\/[^\s\?\:\;]*)/i);
    if (epMatch && (epMatch[0] || epMatch[1])) {
        rawEndpoint = (epMatch[0] || epMatch[1]).trim();
    }
    if (rawEndpoint.length > 30) {
        rawEndpoint = rawEndpoint.slice(0, 27) + "...";
    }
    f.endpoint = rawEndpoint || "/";

    // Clean ID
    let rawId = String(f.id || idx || 1).trim();
    rawId = rawId.replace(/^FND-/i, '').trim();
    if (rawId.length > 10) {
        const numMatch = rawId.match(/\d+/);
        rawId = numMatch ? numMatch[0] : rawId.slice(0, 8);
    }
    f.id = rawId;

    return f;
}

async function loadFindings() {
    let findingsList = [];
    try {
        const findingsUrl = window.getApiUrl ? window.getApiUrl('/findings') : '/findings';
        const response = await fetch(findingsUrl);
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.findings)) {
                findingsList = data.findings;
            }
        }
    } catch (error) {
        console.warn("Backend findings fetch failed:", error);
    }

    try {
        const localUploads = JSON.parse(localStorage.getItem("local_user_uploads")) || [];
        localUploads.forEach(lu => {
            if (Array.isArray(lu.findings)) {
                lu.findings.forEach(lf => {
                    const findingWithMeta = { ...lf };
                    if (!findingWithMeta.filename) findingWithMeta.filename = lu.filename || "";
                    if (!findingWithMeta.upload_time) findingWithMeta.upload_time = lu.upload_time || "";
                    findingsList.push(findingWithMeta);
                });
            }
        });
    } catch (e) {}

    // Clean & standardize fields for all findings
    const cleanedList = [];
    const uniqueKeys = new Set();

    findingsList.forEach((f, index) => {
        const cleaned = sanitizeFindingItem({ ...f }, index + 1);
        
        // Filter out raw non-vulnerability report headers
        const tLower = cleaned.title.toLowerCase().trim();
        if (tLower === "security assessment report" || tLower === "executive summary" || tLower === "finding summary" || tLower === "security assessment finding") {
            return;
        }

        const rawDate = cleaned.date_detected || cleaned.date || (cleaned.upload_time ? cleaned.upload_time.split(" ")[0] : "");
        cleaned.date_detected = (rawDate && typeof rawDate === "string" && rawDate.trim() !== "" && rawDate.toLowerCase() !== "undefined" && rawDate.toLowerCase() !== "null" && rawDate.toLowerCase() !== "none") ? rawDate.trim().split(" ")[0] : new Date().toISOString().split("T")[0];
        if (!cleaned.type) cleaned.type = "Other";
        if (!cleaned.cvss) {
            if (cleaned.severity === "Critical") cleaned.cvss = 9.8;
            else if (cleaned.severity === "High") cleaned.cvss = 8.5;
            else if (cleaned.severity === "Medium") cleaned.cvss = 6.5;
            else if (cleaned.severity === "Low") cleaned.cvss = 3.1;
            else cleaned.cvss = 0.0;
        }

        // Deduplicate using filename + report_id/upload_time + id + title key
        const fn = (cleaned.filename || f.filename || '').toLowerCase().trim();
        const rptId = (cleaned.report_id || f.report_id || cleaned.upload_time || f.upload_time || '').toString().trim();
        const key = `${fn}_${rptId}_${cleaned.id || index}_${cleaned.title.toLowerCase().trim()}`;
        if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            cleanedList.push(cleaned);
        }
    });

    // Sort findings: Newest upload/date detected first, then by Severity rank, then by Title
    const severityMap = { "Critical": 1, "High": 2, "Medium": 3, "Low": 4 };
    cleanedList.sort((a, b) => {
        const timeA = (a.upload_time || a.date_detected || "").toString().trim();
        const timeB = (b.upload_time || b.date_detected || "").toString().trim();
        if (timeA && timeB && timeA !== timeB) {
            return timeB.localeCompare(timeA);
        }
        const sevA = severityMap[a.severity] || 5;
        const sevB = severityMap[b.severity] || 5;
        if (sevA !== sevB) return sevA - sevB;
        return a.title.localeCompare(b.title);
    });

    allFindings = cleanedList;
    filteredFindings = allFindings;
    currentPage = 1;
    displayPage(allFindings);
    updatePagination(allFindings);
    updateCriticalCard(allFindings);
    updateHighCard(allFindings);
    updateMediumCard(allFindings);
    updateLowCard(allFindings);
    populateDynamicDropdowns(allFindings);

    const totalCountEl = document.getElementById("totalFindingsCount");
    if (totalCountEl) {
        totalCountEl.textContent = allFindings.length;
    }

    try {
        const severityUrl = window.getApiUrl ? window.getApiUrl('/severity-history') : '/severity-history';
        const severityResponse = await fetch(severityUrl);
        if (severityResponse.ok) {
            const severityHistory = await severityResponse.json();
            updateCriticalGraph(severityHistory);
            updateHighGraph(severityHistory);
            updateMediumGraph(severityHistory);
            updateLowGraph(severityHistory);
        }
    } catch (err) {
        console.warn("Severity history fetch offline:", err);
    }
}

function populateDynamicDropdowns(findings) {
    const assetsDropdown = document.getElementById("assetsDropdown");
    const assetsText = document.getElementById("assetsText");
    if (assetsDropdown && assetsText) {
        const uniqueAssets = Array.from(new Set(findings.map(f => f.endpoint).filter(Boolean)));
        assetsDropdown.innerHTML = `<button class="assetsOption w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">All Assets</button>`;
        uniqueAssets.forEach(asset => {
            assetsDropdown.innerHTML += `<button class="assetsOption w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md truncate">${asset}</button>`;
        });
        
        assetsDropdown.querySelectorAll(".assetsOption").forEach(option => {
            option.addEventListener("click", (e) => {
                e.stopPropagation();
                const selectedAsset = option.textContent.trim();
                assetsText.textContent = selectedAsset;
                assetsDropdown.classList.add("hidden");
                if (selectedAsset === "All Assets") {
                    filteredFindings = allFindings;
                } else {
                    filteredFindings = allFindings.filter(finding => finding.endpoint === selectedAsset);
                }
                currentPage = 1;
                displayPage(filteredFindings);
                updatePagination(filteredFindings);
            });
        });
    }

    const typesDropdown = document.getElementById("typesDropdown");
    const typesText = document.getElementById("typesText");
    if (typesDropdown && typesText) {
        const uniqueTypes = Array.from(new Set(findings.map(f => f.type).filter(Boolean)));
        typesDropdown.innerHTML = `<button class="typesOption w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">All Types</button>`;
        uniqueTypes.forEach(typeVal => {
            typesDropdown.innerHTML += `<button class="typesOption w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">${typeVal}</button>`;
        });

        typesDropdown.querySelectorAll(".typesOption").forEach(option => {
            option.addEventListener("click", (e) => {
                e.stopPropagation();
                const selectedType = option.textContent.trim();
                typesText.textContent = selectedType;
                typesDropdown.classList.add("hidden");
                if (selectedType === "All Types") {
                    filteredFindings = allFindings;
                } else {
                    filteredFindings = allFindings.filter(finding =>
                        (finding.type || "").toLowerCase().includes(selectedType.toLowerCase()) ||
                        (finding.title || "").toLowerCase().includes(selectedType.toLowerCase())
                    );
                }
                currentPage = 1;
                displayPage(filteredFindings);
                updatePagination(filteredFindings);
            });
        });
    }
}


function displayFindings(findings) {
    const tableBody = document.getElementById("findingsTableBody");
    tableBody.innerHTML = "";
    findings.forEach(finding => {
        let severityClass = "";
        if (finding.severity === "Critical") {
            severityClass ="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20";
        } else if (finding.severity === "High") {
            severityClass ="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20";
        } else if (finding.severity === "Medium") {
            severityClass ="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20";
        } else if (finding.severity === "Low") {
            severityClass ="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20";
        } else {
            severityClass ="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
        }


        let status = finding.status;

        let statusClass = "";
        let statusDotClass = "";
        if (
            status.toLowerCase() === "fixed" ||
            status.toLowerCase() === "resolved"
        ) {
            statusClass = "text-green-500 dark:text-green-400";
            statusDotClass = "bg-green-500";
        } else if (
            status.toLowerCase() === "in progress"
        ) {
            statusClass = "text-blue-500 dark:text-blue-400";
            statusDotClass = "bg-blue-500";
        } else {
            statusClass = "text-red-500 dark:text-red-400";
            statusDotClass = "bg-red-500";
        }

        const row = document.createElement("tr");
        row.className ="border-b border-slate-200 dark:border-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition";
        row.innerHTML = `
            <!-- FINDING -->
            <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                    <div class=" w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <i data-lucide="shield-alert" class="w-4 h-4 text-blue-500"></i>
                    </div>

                    <div>
                        <p class=" text-slate-900 dark:text-white font-medium ">
                            ${finding.title}
                        </p>

                        <p class=" text-slate-500 text-[10px] mt-1">
                            FND-${finding.id}
                        </p>
                    </div>
                </div>
            </td>


            <!-- SEVERITY -->
            <td class="px-4 py-4">
                <span class=" inline-flex px-2.5 py-1 rounded-md font-medium ${severityClass}">
                    ${finding.severity}
                </span>
            </td>

            <!-- ASSET -->
            <td class=" px-4 py-4 text-slate-600 dark:text-slate-300">
                ${finding.endpoint || "-"}
            </td>

            <!-- TYPE -->
            <td class=" px-4 py-4 text-slate-600 dark:text-slate-300">
                ${finding.type}
            </td>

            <!-- DETECTED ON -->
            <td class=" px-4 py-4 text-slate-500 dark:text-slate-400">
               ${finding.date_detected}
            </td>

            <!-- STATUS -->
            <td class="px-4 py-4">
                <span class=" flex items-center gap-2 ${statusClass}">
                    <span class=" w-2 h-2 rounded-full ${statusDotClass}"></span>
                    ${status}
                </span>
            </td>


            <!-- ACTION -->
            <td class="px-4 py-4">
                <div class=" flex items-center justify-center gap-3">
                    <button class=" viewFindingBtn px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition" data-id="${finding.id}" >
                        View
                    </button>

                    <button class=" text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        <i data-lucide="more-vertical" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>`;
        tableBody.appendChild(row);
    });
    lucide.createIcons();
}

function drawSparkline(svgElement, values, colorHex, currentCount) {
    if (!svgElement) return;
    let dataPoints = (Array.isArray(values) && values.length > 0) ? values : [];
    
    if (dataPoints.length < 2) {
        const count = typeof currentCount === "number" ? currentCount : (dataPoints[0] || 2);
        dataPoints = [
            Math.max(1, Math.round(count * 0.4)),
            Math.max(1, Math.round(count * 0.7)),
            Math.max(1, Math.round(count * 0.5)),
            Math.max(1, Math.round(count * 0.9)),
            Math.max(1, count)
        ];
    }

    const maxValue = Math.max(...dataPoints, 1);
    const denominator = Math.max(dataPoints.length - 1, 1);
    const points = dataPoints.map((value, index) => {
        const x = 2 + (index * 96 / denominator);
        const y = 25 - (value / maxValue) * 18;
        return `${x},${y}`;
    }).join(" L ");

    svgElement.innerHTML = `
        <path d="M${points}" stroke="${colorHex}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
}

function computeDynamicSeverityTrend(findings, severityType) {
    const matching = findings.filter(f => (f.severity || "").toLowerCase() === severityType.toLowerCase());
    const count = matching.length;
    if (count === 0) return [0, 0, 0, 0, 0];

    const dateCounts = {};
    matching.forEach(f => {
        const d = f.date_detected || "2026-08-31";
        dateCounts[d] = (dateCounts[d] || 0) + 1;
    });

    const sortedDates = Object.keys(dateCounts).sort();
    if (sortedDates.length === 1) {
        return [
            Math.max(1, Math.round(count * 0.3)),
            Math.max(1, Math.round(count * 0.6)),
            Math.max(1, Math.round(count * 0.4)),
            Math.max(1, Math.round(count * 0.8)),
            count
        ];
    }

    let cumulative = 0;
    const points = sortedDates.map(d => {
        cumulative += dateCounts[d];
        return cumulative;
    });

    while (points.length < 5) {
        points.unshift(Math.max(1, Math.round(points[0] * 0.7)));
    }
    return points.slice(-5);
}

function updateCriticalCard(findings) {
    const criticalCount = findings.filter(finding => finding.severity === "Critical").length;
    const totalFindings = findings.length;
    let percentage = totalFindings > 0 ? Math.round((criticalCount / totalFindings) * 100) : 0;
    document.getElementById("criticalCount").textContent = criticalCount;
    document.getElementById("criticalPercentage").textContent = `${percentage}% of total`;
    const points = computeDynamicSeverityTrend(findings, "Critical");
    drawSparkline(document.getElementById("criticalsvg"), points, "#ef4444", criticalCount);
}

function updateCriticalGraph(history) {
    // Retained for compatibility but uses current findings state
    updateCriticalCard(allFindings);
}

function updateHighCard(findings) {
    let highCount = findings.filter(finding => finding.severity === "High").length;
    const totalFindings = findings.length;
    const percentage = totalFindings > 0 ? Math.round((highCount / totalFindings) * 100) : 0;
    document.getElementById("highCount").textContent = highCount;
    document.getElementById("highPercentage").textContent = `${percentage}% of total`;
    const points = computeDynamicSeverityTrend(findings, "High");
    drawSparkline(document.getElementById("highsvg"), points, "#f97316", highCount);
}

function updateHighGraph(history) {
    updateHighCard(allFindings);
}

function updateMediumCard(findings) {
    let mediumCount = findings.filter(finding => finding.severity === "Medium").length;
    const totalFindings = findings.length;
    const percentage = totalFindings > 0 ? Math.round((mediumCount / totalFindings) * 100) : 0;
    document.getElementById("mediumCount").textContent = mediumCount;
    document.getElementById("mediumPercentage").textContent = `${percentage}% of total`;
    const points = computeDynamicSeverityTrend(findings, "Medium");
    drawSparkline(document.getElementById("mediumsvg"), points, "#eab308", mediumCount);
}

function updateMediumGraph(history) {
    updateMediumCard(allFindings);
}

function updateLowCard(findings) {
    const lowCount = findings.filter(finding => finding.severity === "Low").length;
    const totalFindings = findings.length;
    const percentage = totalFindings > 0 ? Math.round((lowCount / totalFindings) * 100) : 0;
    document.getElementById("lowCount").textContent = lowCount;
    document.getElementById("lowPercentage").textContent = `${percentage}% of total`;
    const points = computeDynamicSeverityTrend(findings, "Low");
    drawSparkline(document.getElementById("lowsvg"), points, "#22c55e", lowCount);
}

function updateLowGraph(history) {
    updateLowCard(allFindings);
}

    function updateTotalFindingsPercentage(currentCount, previousCount) {
        const percentageElement = document.getElementById("totalFindingsPercentage");
        if (!percentageElement) return;
    
        // No previous upload to compare with
        if (previousCount === 0) {
            percentageElement.textContent = "0% change";
            return;
        }
        const change = ((currentCount - previousCount) / previousCount) * 100;
        if (change > 0) {
            percentageElement.textContent = `↑ ${Math.round(change)}% from previous`;
            percentageElement.className =
                "ml-10 text-[12px] text-green-500 dark:text-green-400 font-semibold mt-4";
    
        } else if (change < 0) {
            percentageElement.textContent = `↓ ${Math.abs(Math.round(change))}% from previous`;
            percentageElement.className =
                "ml-10 text-[12px] text-red-500 dark:text-red-400 font-semibold mt-4";
    
        } else {
            percentageElement.textContent = "0% change";
            percentageElement.className =
                "ml-10 text-[12px] text-slate-500 dark:text-white/60 font-semibold mt-4";
        }
    }

    // Search
const findingSearch = document.getElementById("findingSearch");
findingSearch.addEventListener("input", () => {
    const searchValue = findingSearch.value.toLowerCase().trim();
    filteredFindings = allFindings.filter(finding => {
        return (
            finding.title.toLowerCase().includes(searchValue) ||
            finding.severity.toLowerCase().includes(searchValue) ||
            String(finding.id).toLowerCase().includes(searchValue) ||
            (finding.endpoint || "").toLowerCase().includes(searchValue)
        );
    });
    currentPage=1;
    displayPage(filteredFindings)
    updatePagination(filteredFindings)
});

//Severity dropdown
    const severityBtn = document.getElementById("severityBtn");
    const severityDropdown = document.getElementById("severityDropdown");
    const severityText = document.getElementById("severityText");

    // Open / close dropdown
    severityBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        severityDropdown.classList.toggle("hidden");
    });

    // Select option
    document.querySelectorAll(".severityOption").forEach(option => {
        option.addEventListener("click", () => {
            const selectedSeverity = option.textContent.trim();
            severityText.textContent = selectedSeverity;
            severityDropdown.classList.add("hidden");
            if (selectedSeverity === "All Severity") {
                filteredFindings = allFindings;
                currentPage = 1;
                displayPage(filteredFindings);
                updatePagination(filteredFindings);
                return;
            }
            filteredFindings = allFindings.filter(finding =>
                finding.severity === selectedSeverity
            );
            currentPage=1;
            displayPage(filteredFindings)
            updatePagination(filteredFindings)
        });
    
    });

    // Close when clicking outside
    document.addEventListener("click", () => {
        severityDropdown.classList.add("hidden");
    });


    // STATUS
    const statusBtn = document.getElementById("statusBtn");
    const statusDropdown = document.getElementById("statusDropdown");
    const statusText = document.getElementById("statusText");

    statusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        statusDropdown.classList.toggle("hidden");
    });

    document.querySelectorAll(".statusOption").forEach(option => {
        option.addEventListener("click", () => {
            const selectedStatus = option.textContent.trim();
            statusText.textContent = selectedStatus;
            statusDropdown.classList.add("hidden");
            if (selectedStatus === "All Status") {
                filteredFindings = allFindings;
            } else {
                filteredFindings = allFindings.filter(finding =>
                    finding.status === selectedStatus
                );
            }
            currentPage = 1;
            displayPage(filteredFindings);
            updatePagination(filteredFindings);
    
        });
    });


    // ASSETS
    const assetsBtn = document.getElementById("assetsBtn");
    const assetsDropdown = document.getElementById("assetsDropdown");
    const assetsText = document.getElementById("assetsText");

    assetsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        assetsDropdown.classList.toggle("hidden");
    });

    document.querySelectorAll(".assetsOption").forEach(option => {
        option.addEventListener("click", () => {
            const selectedAsset = option.textContent.trim();
            assetsText.textContent = selectedAsset;
            assetsDropdown.classList.add("hidden");
            if (selectedAsset === "All Assets") {
                filteredFindings = allFindings;
            } else {
                filteredFindings = allFindings.filter(finding =>
                    finding.endpoint === selectedAsset
                );
    
            }
            currentPage = 1;
            displayPage(filteredFindings);
            updatePagination(filteredFindings);
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
            const selectedTypes = option.textContent.trim();
            typesText.textContent = selectedTypes;
            typesDropdown.classList.add("hidden");
            if (selectedTypes === "All Types") {
                filteredFindings = allFindings;
            } else {
                filteredFindings = allFindings.filter(finding =>
                    finding.title.toLowerCase().includes(selectedTypes.toLowerCase())
                );
    
            }
            currentPage = 1;
            displayPage(filteredFindings);
            updatePagination(filteredFindings);
        });
    });


    const moreFiltersBtn=document.getElementById("moreFiltersBtn")
    const moreFiltersPanel=document.getElementById("moreFiltersPanel")
    moreFiltersBtn.addEventListener("click",(e)=>{
        e.stopPropagation();
        moreFiltersPanel.classList.toggle("hidden");
    })
    moreFiltersPanel.addEventListener("click",(e)=>{
        e.stopPropagation();
    })

    const applyMoreFilters=document.getElementById("applyMoreFilters")
    const findingIdFilter = document.getElementById("findingIdFilter")
    const dateFilter=document.getElementById("dateFilter")
    const remediationFilter = document.getElementById("remediationFilter");
    const cvssFilter = document.getElementById("cvssFilter");
    const confidenceFilter = document.getElementById("confidenceFilter");
    
    applyMoreFilters.addEventListener("click", () => {
        const enteredId = findingIdFilter.value.trim().toLowerCase();
        const selectedRemediation = remediationFilter.value;
        const selectedCvss = cvssFilter.value;
        const selectedDate = dateFilter.value;
        const selectedConfidence = confidenceFilter.value;
        filteredFindings = allFindings.filter(finding => {
            const idMatch =
                enteredId === "" ||
                String(finding.id).toLowerCase().includes(enteredId);
    
            let remediationMatch = true;
            if (selectedRemediation === "available") {
                remediationMatch =
                    finding.recommendation &&
                    finding.recommendation.trim() !== "";
            }
            if (selectedRemediation === "none") {
                remediationMatch =
                    !finding.recommendation ||
                    finding.recommendation.trim() === "";
            }

            let cvssMatch = true;
            if (selectedCvss === "low") {
                cvssMatch = finding.severity === "Low";
            }
            if (selectedCvss === "medium") {
                cvssMatch = finding.severity === "Medium";
            }
            if (selectedCvss === "high") {
                cvssMatch = finding.severity === "High";
            }
            if (selectedCvss === "critical") {
                cvssMatch = finding.severity === "Critical";
            }

            let dateMatch = true;
            if (selectedDate !== "any") {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const detectedDate = new Date(finding.date_detected);
                detectedDate.setHours(0, 0, 0, 0);
                const difference = today - detectedDate;
                const days = difference / (1000 * 60 * 60 * 24);
                if (selectedDate === "today") {
                    dateMatch = days === 0;
                }
                if (selectedDate === "7days") {
                    dateMatch = days >= 0 && days <= 7;
                }
                if (selectedDate === "30days") {
                    dateMatch = days >= 0 && days <= 30;
                }
            }

            let confidenceMatch = true;
            if (selectedConfidence === "high") {
                confidenceMatch = finding.severity === "Critical" ||
                                finding.severity === "High";
            }
            if (selectedConfidence === "medium") {
                confidenceMatch = finding.severity === "Medium";
            }
            if (selectedConfidence === "low") {
                confidenceMatch = finding.severity === "Low";
            }

            return idMatch && remediationMatch && cvssMatch && dateMatch && confidenceMatch;
        });
        console.log("FILTERED:", filteredFindings);
        currentPage = 1;
        displayPage(filteredFindings);
        updatePagination(filteredFindings);
        moreFiltersPanel.classList.add("hidden");
    });
          

    
    const clearMoreFilters = document.getElementById("clearMoreFilters")
    clearMoreFilters.addEventListener("click", () => {
        findingIdFilter.value = ""
        dateFilter.value = "any"
        remediationFilter.value = "all";
        cvssFilter.value = "all";
        confidenceFilter.value = "all";
        filteredFindings = allFindings;
        currentPage = 1;

        displayFindings(filteredFindings);
        updatePagination(filteredFindings);
    })

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



document.getElementById("findingsTableBody").addEventListener("click", (e) => {
    const button = e.target.closest(".viewFindingBtn");
    if (!button) return;
    const findingId = button.dataset.id;
    const finding = allFindings.find(
        f => String(f.id) === String(findingId)
    );
    if (!finding) {
        console.error("Finding not found:", findingId);
        return;
    }
    selectedFinding = finding;
    const modal = document.getElementById("viewFindingModal");
    document.getElementById("viewFindingTitle").textContent =
        finding.title || "-";

    document.getElementById("viewFindingId").textContent =
        `FND-${finding.id}`;

    document.getElementById("viewFindingSeverity").textContent =
        finding.severity || "-";

    document.getElementById("viewFindingType").textContent =
        finding.type || "Other";

    document.getElementById("viewFindingEndpoint").textContent =
        finding.endpoint || "-";

    const modalDate = finding.date_detected && finding.date_detected !== "undefined" && finding.date_detected !== "null" ? finding.date_detected : new Date().toISOString().split("T")[0];
    document.getElementById("viewFindingDate").textContent = modalDate;

    document.getElementById("viewFindingDescription").textContent =
        finding.description || "-";

    document.getElementById("viewFindingEvidence").textContent =
        finding.evidence || "-";

    document.getElementById("viewFindingRecommendation").textContent =
        finding.recommendation || "-";

    modal.classList.remove("hidden");

});

const closeViewFinding = document.getElementById("closeViewFinding");
closeViewFinding.addEventListener("click", () => {
    const modal = document.getElementById("viewFindingModal");
    modal.classList.add("hidden");

});

const aiRemediationBtn = document.getElementById("aiRemediationBtn");
if (aiRemediationBtn) {
    aiRemediationBtn.addEventListener("click", () => {
        if (selectedFinding) {
            localStorage.setItem("selectedFinding", JSON.stringify(selectedFinding));
            const paramId = encodeURIComponent(selectedFinding.id || "");
            const paramFile = encodeURIComponent(selectedFinding.filename || "");
            window.location.href = `AI_Remediation.html?id=${paramId}&filename=${paramFile}`;
        } else {
            window.location.href = "AI_Remediation.html";
        }
    });
}

function displayPage(findings) {
    const start = (currentPage - 1) * findingsPerPage;
    const end = start + findingsPerPage;
    const pageFindings = findings.slice(start, end);
    displayFindings(pageFindings);

}

function updatePagination(findings) {
    const paginationNumbers = document.getElementById("paginationNumbers");
    const paginationInfo = document.getElementById("paginationInfo");
    const totalPages = Math.ceil(findings.length / findingsPerPage);
    paginationNumbers.innerHTML = "";
    if (findings.length === 0) {
        paginationInfo.textContent = "Showing 0 to 0 of 0 findings";
        return;
    }
    const start = (currentPage - 1) * findingsPerPage + 1;
    const end = Math.min(currentPage * findingsPerPage, findings.length);
    paginationInfo.textContent = `Showing ${start} to ${end} of ${findings.length} findings`;

    // Compact windowed pagination (max 5 buttons visible)
    let pagesToDisplay = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pagesToDisplay.push(i);
    } else {
        if (currentPage <= 3) {
            pagesToDisplay = [1, 2, 3, 4, 5];
        } else if (currentPage >= totalPages - 2) {
            pagesToDisplay = [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pagesToDisplay = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
        }
    }

    pagesToDisplay.forEach(page => {
        const button = document.createElement("button");
        button.textContent = page;
        button.className = "w-8 h-8 rounded-lg text-xs shrink-0 flex items-center justify-center font-medium transition";
        if (page === currentPage) {
            button.classList.add("bg-blue-600", "text-white");
        } else {
            button.classList.add("border", "border-slate-300", "dark:border-slate-700", "text-slate-500", "dark:text-slate-400", "hover:bg-slate-100", "dark:hover:bg-slate-800");
        }

        button.addEventListener("click", () => {
            currentPage = page;
            displayPage(filteredFindings);
            updatePagination(filteredFindings);
        });
        paginationNumbers.appendChild(button);
    });
}

const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
prevPage.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        displayPage(filteredFindings);
        updatePagination(filteredFindings);
    }
});

nextPage.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredFindings.length / findingsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayPage(filteredFindings);
        updatePagination(filteredFindings);
    }
});
    document.addEventListener("click", () => {
        statusDropdown.classList.add("hidden");
        assetsDropdown.classList.add("hidden");
        typesDropdown.classList.add("hidden");
        severityDropdown.classList.add("hidden");
        moreFiltersPanel.classList.add("hidden");
    });