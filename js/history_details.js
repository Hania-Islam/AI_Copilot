document.addEventListener("DOMContentLoaded", () => {
    console.log("HISTORY DETAILS JS UPDATED");
    const selectedUpload = JSON.parse(
        localStorage.getItem("selectedUpload")
    );
    console.log("SELECTED UPLOAD:", selectedUpload);

    // FILE INFORMATION
    document.getElementById("fileName").textContent = selectedUpload.filename;
    document.getElementById("fileType").textContent = selectedUpload.file_type;
    document.getElementById("findingsCount").textContent = selectedUpload.findings_count;
    document.getElementById("fileStatus").lastChild.textContent = selectedUpload.status;
    document.getElementById("uploadTime").textContent =`Uploaded: ${selectedUpload.upload_time}`;

    // RISK SCORE
    const cvssScores = selectedUpload.findings
        .map(finding => Number(finding.cvss))
        .filter(score => !isNaN(score));

    const highestCvss = cvssScores.length
        ? Math.max(...cvssScores)
        : 0;

    const riskScore = Math.round(highestCvss * 10);
    document.getElementById("riskScore").textContent =
        riskScore;
        const riskCircle = document.getElementById("riskCircle");

const circumference = 94.25;
const riskOffset =circumference - (circumference * riskScore / 100);
riskCircle.style.strokeDashoffset = riskOffset;
if (riskScore >= 80) {
    riskCircle.classList.add("text-red-500");
}
else if (riskScore >= 60) {
    riskCircle.classList.add("text-orange-500");
}
else if (riskScore >= 40) {
    riskCircle.classList.add("text-yellow-500");
}
else {
    riskCircle.classList.add("text-green-500");
}

    // CRITICAL COUNT
    const criticalCount = selectedUpload.findings.filter(
        finding => finding.severity === "Critical"
    ).length;

    document.getElementById("criticalCount").textContent = criticalCount;

// FINDINGS
const findingsContainer = document.getElementById("findingsContainer");
selectedUpload.findings.forEach(finding => {
    const findingCard = document.createElement("div");
    findingCard.className =
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-4";

        findingCard.innerHTML = `
        <div class="flex items-start justify-between gap-4">
    
            <div class="min-w-0">
                <div class="flex items-center gap-2 mb-1">
    
                    <span class="text-xs text-slate-500">
                        Finding ${finding.id}
                    </span>
    
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-medium
                        ${finding.severity === "Critical"
                            ? "bg-red-500/10 text-red-500"
                            : finding.severity === "High"
                            ? "bg-orange-500/10 text-orange-500"
                            : finding.severity === "Medium"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-blue-500/10 text-blue-500"
                        }">
                        ${finding.severity}
                    </span>
    
                </div>
    
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
                    ${finding.title}
                </h2>
    
                <p class="text-xs text-slate-500 mt-1">
                    ${finding.endpoint}
                </p>
            </div>
    
            <div class="flex items-center gap-2 shrink-0">
    
                <span class="px-2.5 py-1 rounded-md
                    ${finding.status.toLowerCase() === "fixed"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-slate-500/10 text-slate-500"
                    }
                    text-xs font-medium">
                    ${finding.status}
                </span>
    
                <span class="px-2.5 py-1 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-300 text-xs font-medium">
                    CVSS ${finding.cvss}
                </span>
            </div>
        </div>
    
        <div class="mt-5">
            <p class="text-xs font-medium text-slate-500 mb-1">
                Description
            </p>
    
            <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                ${finding.description}
            </p>
        </div>
    
        <div class="mt-4">
            <p class="text-xs font-medium text-slate-500 mb-1">
                Evidence
            </p>
    
            <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                ${finding.evidence}
            </p>
        </div>
    
        <div class="mt-4">
            <p class="text-xs font-medium text-slate-500 mb-1">
                Recommendation
            </p>
    
            <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                ${finding.recommendation}
            </p>
        </div>
    
        <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span class="text-xs text-slate-500">
                Type:
            </span>
    
            <span class="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">
                ${finding.type}
            </span>
        </div>
    `;
    findingsContainer.appendChild(findingCard);
});

document.getElementById("backToHistory").addEventListener("click", () => {
    window.location.href = "history.html";
});

    // LUCIDE ICONS
    lucide.createIcons();

});