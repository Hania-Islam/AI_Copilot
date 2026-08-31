document.addEventListener("DOMContentLoaded", () => {
    applySavedTheme()
    loadFindings();
});
let allFindings = [];
let currentPage = 1;
const findingsPerPage = 8;
let filteredFindings = [];
let selectedFinding = null;
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
                    const exists = findingsList.some(bf => String(bf.id) === String(lf.id) && bf.filename === lf.filename);
                    if (!exists) {
                        findingsList.unshift(lf);
                    }
                });
            }
        });
    } catch (e) {}

    // Clean & standardize fields for all findings
    findingsList.forEach(f => {
        const rawDate = f.date_detected || f.date || (f.upload_time ? f.upload_time.split(" ")[0] : "");
        f.date_detected = (rawDate && typeof rawDate === "string" && rawDate.trim() !== "" && rawDate.toLowerCase() !== "undefined" && rawDate.toLowerCase() !== "null" && rawDate.toLowerCase() !== "none") ? rawDate.trim().split(" ")[0] : new Date().toISOString().split("T")[0];
        if (!f.type) f.type = "Other";
        if (!f.cvss) {
            if (f.severity === "Critical") f.cvss = 9.8;
            else if (f.severity === "High") f.cvss = 8.5;
            else if (f.severity === "Medium") f.cvss = 6.5;
            else if (f.severity === "Low") f.cvss = 3.1;
            else f.cvss = 0.0;
        }
    });

    allFindings = findingsList;
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
        const viewBtn = row.querySelector(".viewFindingBtn");
        if (viewBtn) {
            viewBtn.addEventListener("click", () => {
                localStorage.setItem("selectedFinding", JSON.stringify(finding));
                const paramId = encodeURIComponent(finding.id || "");
                const paramFile = encodeURIComponent(finding.filename || "");
                window.location.href = `AI_Remediation.html?id=${paramId}&filename=${paramFile}`;
            });
        }
        tableBody.appendChild(row);
    });
    lucide.createIcons();
}

function updateCriticalCard(findings) {
    const criticalCount = findings.filter(
        finding => finding.severity === "Critical"
    ).length;
    const totalFindings = findings.length;
    let percentage = 0;
    if (totalFindings > 0) {
        percentage = Math.round((criticalCount / totalFindings) * 100);
    }
    document.getElementById("criticalCount").textContent = criticalCount;
    document.getElementById("criticalPercentage").textContent =
        `${percentage}% of total`;
}

function updateCriticalGraph(history) {
    const criticalSvg = document.getElementById("criticalsvg");
    const values = history.Critical;
    if (!values || values.length === 0) {
        criticalSvg.innerHTML = "";
        return;
    }
    const maxValue = Math.max(...values, 1);
    const points = values.map((value, index) => {
        const x = 2 + (index * 96 / (values.length - 1));
        const y = 25 - (value / maxValue) * 18;
        return `${x},${y}`;
    }).join(" L ");
    criticalSvg.innerHTML = `
        <path d="M${points}" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
}

    function updateHighCard(findings) {
        let highCount = 0;
        findings.forEach(finding => {
            if (finding.severity === "High") {
                highCount++;
            }
    
        });
        const totalFindings = findings.length;
        const percentage = totalFindings > 0
            ? Math.round((highCount / totalFindings) * 100)
            : 0;
    
        document.getElementById("highCount").textContent = highCount;
        document.getElementById("highPercentage").textContent =
            `${percentage}% of total`;
    }

    function updateHighGraph(history) {
        const highSvg = document.getElementById("highsvg");
        const values = history.High;
        if (!values || values.length === 0) {
            highSvg.innerHTML = "";
            return;
        }    
        const maxValue = Math.max(...values, 1);    
        const points = values.map((value, index) => {    
            const x = 2 + (index * 96 / (values.length - 1));    
            const y = 25 - (value / maxValue) * 18;    
            return `${x},${y}`;    
        }).join(" L ");    
        highSvg.innerHTML = `
            <path d="M${points}" stroke="#f97316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />`;
    }

    function updateMediumCard(findings) {
        let mediumCount = 0;
        findings.forEach(finding => {
            if (finding.severity === "Medium") {
                mediumCount++;
            }
        });
        const totalFindings = findings.length;
        const percentage = totalFindings > 0
            ? Math.round((mediumCount / totalFindings) * 100)
            : 0;
        document.getElementById("mediumCount").textContent = mediumCount;
        document.getElementById("mediumPercentage").textContent =
            `${percentage}% of total`;
    }

    function updateMediumGraph(history) {
        const mediumSvg = document.getElementById("mediumsvg");
        const values = history.Medium;
        if (!values || values.length === 0) {
            mediumSvg.innerHTML = "";
            return;
        }
        const maxValue = Math.max(...values, 1);
        const points = values.map((value, index) => {
            const x = 2 + (index * 96 / (values.length - 1));
            const y = 25 - (value / maxValue) * 18;
            return `${x},${y}`;
        }).join(" L ");
        mediumSvg.innerHTML = `
            <path d="M${points}" stroke="#eab308" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    }

    function updateLowCard(findings) {
        const lowCount = findings.filter(
            finding => finding.severity === "Low"
        ).length;
        const totalFindings = findings.length;
        const percentage = totalFindings > 0
            ? Math.round((lowCount / totalFindings) * 100)
            : 0;
        document.getElementById("lowCount").textContent = lowCount;
        document.getElementById("lowPercentage").textContent =
            `${percentage}% of total`;
    }

    function updateLowGraph(history) {
        const lowSvg = document.getElementById("lowsvg");
        const values = history.Low;
        if (!values || values.length === 0) {
            lowSvg.innerHTML = "";
            return;
        }
        const maxValue = Math.max(...values, 1);
        const points = values.map((value, index) => {
            const x = 2 + (index * 96 / (values.length - 1));
            const y = 25 - (value / maxValue) * 18;
            return `${x},${y}`;
        }).join(" L ");
        lowSvg.innerHTML = `
            <path d="M${points}" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
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
    paginationInfo.textContent =`Showing ${start} to ${end} of ${findings.length} findings`;
    for (let page = 1; page <= totalPages; page++) {
        const button = document.createElement("button");
        button.textContent = page;
        button.className ="w-8 h-8 rounded-lg text-xs";
        if (page === currentPage) {
            button.classList.add("bg-blue-600","text-white"
            );
        } else {
            button.classList.add( "border", "border-slate-300", "dark:border-slate-700", "text-slate-500", "dark:text-slate-400", "hover:bg-slate-100", "dark:hover:bg-slate-800");
        }

        button.addEventListener("click", () => {
            currentPage = page;
            displayPage(filteredFindings);
            updatePagination(filteredFindings);
        });
        paginationNumbers.appendChild(button);
    }
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