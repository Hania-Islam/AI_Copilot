if (typeof applySavedTheme === "function") {
    applySavedTheme();
}
let selectedFinding = null;
try {
    selectedFinding = JSON.parse(localStorage.getItem("selectedFinding"));
} catch (e) {
    selectedFinding = null;
}

async function initAIRemediation() {
    if (!selectedFinding || !selectedFinding.title) {
        console.log("NO VALID SELECTED FINDING FOUND, FETCHING DEFAULT FROM BACKEND...");
        try {
            const apiUrl = window.getApiUrl ? window.getApiUrl('/findings') : '/findings';
            const res = await fetch(apiUrl);
            const data = await res.json();
            if (data && data.findings && data.findings.length > 0) {
                selectedFinding = data.findings[0];
                localStorage.setItem("selectedFinding", JSON.stringify(selectedFinding));
            }
        } catch (err) {
            console.error("FAILED TO FETCH DEFAULT FINDING:", err);
        }
    }

    if (!selectedFinding || !selectedFinding.title) {
        selectedFinding = {
            id: 1,
            title: "SQL Injection",
            severity: "Critical",
            endpoint: "/api/login.php",
            type: "SQL Injection",
            cvss: "9.8",
            date_detected: "2026-08-30",
            description: "SQL Injection vulnerability found in login endpoint.",
            evidence: "User input is directly concatenated into SQL query string.",
            status: "Open",
            filename: "report.pdf"
        };
        localStorage.setItem("selectedFinding", JSON.stringify(selectedFinding));
    }
    const elemTitle = document.getElementById("remediationFindingTitle");
    if (elemTitle) elemTitle.textContent = selectedFinding.title || "";
    const elemId = document.getElementById("remediationFindingId");
    if (elemId) elemId.textContent = `Finding ID: ${selectedFinding.id || 1}`;
    const elemSev = document.getElementById("remediationFindingSeverity");
    if (elemSev) elemSev.textContent = selectedFinding.severity || "Critical";
    const severityBadge = document.getElementById("remediationFindingSeverity");
    if (severityBadge) {
        severityBadge.classList.remove(
        "bg-red-100",
        "dark:bg-red-500/20",
        "text-red-500",
        "dark:text-red-400",
        "bg-orange-100",
        "dark:bg-orange-500/20",
        "text-orange-500",
        "dark:text-orange-400",
        "bg-yellow-100",
        "dark:bg-yellow-500/20",
        "text-yellow-500",
        "dark:text-yellow-400",
        "bg-blue-100",
        "dark:bg-blue-500/20",
        "text-blue-500",
        "dark:text-blue-400"
    );

    if (selectedFinding.severity === "Critical") {
        severityBadge.classList.add(
            "bg-red-100",
            "dark:bg-red-500/20",
            "text-red-500",
            "dark:text-red-400"
        );
    } else if (selectedFinding.severity === "High") {
        severityBadge.classList.add(
            "bg-orange-100",
            "dark:bg-orange-500/20",
            "text-orange-500",
            "dark:text-orange-400"
        );
    } else if (selectedFinding.severity === "Medium") {
        severityBadge.classList.add(
            "bg-yellow-100",
            "dark:bg-yellow-500/20",
            "text-yellow-500",
            "dark:text-yellow-400"
        );
    } else if (selectedFinding.severity === "Low") {
        severityBadge.classList.add(
            "bg-green-100",
            "dark:bg-green-500/20",
            "text-green-500",
            "dark:text-green-400"
        );
    }
    }
    const elemDate = document.getElementById("remediationFindingDate");
    if (elemDate) elemDate.textContent = `• Detected on ${selectedFinding.date_detected || ''}`;
    const elemEndpoint = document.getElementById("remediationFindingEndpoint");
    if (elemEndpoint) elemEndpoint.textContent = selectedFinding.endpoint || '';
    const elemType = document.getElementById("remediationFindingType");
    if (elemType) elemType.textContent = selectedFinding.type || '';
    const elemCvss = document.getElementById("remediationFindingCvss");
    if (elemCvss) elemCvss.textContent = selectedFinding.cvss || '';
    const elemDesc = document.getElementById("vulnerabilityDescription");
    if (elemDesc) elemDesc.textContent = selectedFinding.description || '';
    const elemSummary = document.getElementById("aiAnalysisSummary");
    if (elemSummary) elemSummary.textContent = `The ${selectedFinding.title} vulnerability was identified at ${selectedFinding.endpoint}. ${selectedFinding.description}`;
    const elemWhy = document.getElementById("whyDangerous");
    if (elemWhy) elemWhy.textContent = selectedFinding.evidence || '';
    const severityAssessment = document.getElementById("severityAssessment");
    if (severityAssessment) {
        severityAssessment.textContent = selectedFinding.severity || '';
        severityAssessment.classList.remove(
        "bg-red-100",
        "dark:bg-red-500/20",
        "text-red-500",
        "dark:text-red-400",
        "bg-orange-100",
        "dark:bg-orange-500/20",
        "text-orange-500",
        "dark:text-orange-400",
        "bg-yellow-100",
        "dark:bg-yellow-500/20",
        "text-yellow-500",
        "dark:text-yellow-400",
        "bg-blue-100",
        "dark:bg-blue-500/20",
        "text-blue-500",
        "dark:text-blue-400"
    );
    if (selectedFinding.severity === "Critical") {
        severityAssessment.classList.add(
            "bg-red-100",
            "dark:bg-red-500/20",
            "text-red-500",
            "dark:text-red-400"
        );
    } else if (selectedFinding.severity === "High") {
        severityAssessment.classList.add(
            "bg-orange-100",
            "dark:bg-orange-500/20",
            "text-orange-500",
            "dark:text-orange-400"
        );

    } else if (selectedFinding.severity === "Medium") {
        severityAssessment.classList.add(
            "bg-yellow-100",
            "dark:bg-yellow-500/20",
            "text-yellow-500",
            "dark:text-yellow-400"
        );
    } else if (selectedFinding.severity === "Low") {
        severityAssessment.classList.add(
            "bg-green-100",
            "dark:bg-green-500/20",
            "text-green-500",
            "dark:text-green-400"
        );
}
    document.getElementById("assessmentCvss").textContent =selectedFinding.cvss;
    const potentialImpact = document.getElementById("potentialImpact");
    let impacts = [];
    if (selectedFinding.title.includes("SQL Injection")) {
        impacts = [
            "Data Breach",
            "Unauthorized Access",
            "Data Modification/Deletion",
            "Complete System Compromise"
        ];
    } else if (selectedFinding.title.includes("Cross-Site Scripting")) {
        impacts = [
            "Account Takeover",
            "Session Hijacking",
            "Malicious Script Execution",
            "User Data Theft"
        ];
    } else if (selectedFinding.title.includes("Password")) {
        impacts = [
            "Account Compromise",
            "Unauthorized Access",
            "Credential Abuse"
        ];
    } else if (selectedFinding.title.includes("Access Control")) {
        impacts = [
            "Unauthorized Data Access",
            "Privilege Escalation",
            "Data Modification"
        ];
    } else if (selectedFinding.title.includes("Information Disclosure")) {
        impacts = [
            "Information Exposure",
            "Reconnaissance",
            "Privacy Impact"
        ];
    } else {
        impacts = [
            "Security Exposure",
            "Unauthorized Access",
            "Potential Data Loss"
        ];
    }
    potentialImpact.innerHTML = "";
    impacts.forEach(impact => {
        const p = document.createElement("p");
        p.className = "text-xs text-slate-600 dark:text-slate-400";
        p.innerHTML = `
            <span class="text-red-400 mr-2">•</span>
            ${impact}
        `;
        potentialImpact.appendChild(p);
    });

    let confidenceScore = 90;
    if (selectedFinding.title.includes("SQL Injection")) {
        confidenceScore = 97;
    } else if (selectedFinding.title.includes("Cross-Site Scripting")) {
        confidenceScore = 95;
    } else if (selectedFinding.title.includes("Missing Security Headers")) {
        confidenceScore = 92;
    } else if (selectedFinding.title.includes("Weak Password Policy")) {
        confidenceScore = 94;
    } else if (selectedFinding.title.includes("Information Disclosure")) {
        confidenceScore = 90;
    } else {
        confidenceScore = 88;
    }
    document.getElementById("aiConfidenceScore").textContent =
        `${confidenceScore}%`;

    document.getElementById("aiConfidenceBar").style.width =
        `${confidenceScore}%`;

    if (confidenceScore >= 90) {
        document.getElementById("aiConfidenceText").textContent =
            "High confidence in this remediation";
    } else if (confidenceScore >= 75) {
        document.getElementById("aiConfidenceText").textContent =
            "Moderate confidence in this remediation";
    } else {
        document.getElementById("aiConfidenceText").textContent =
            "Low confidence in this remediation";
    }


    const status = selectedFinding.status || "Open";
    document.getElementById("statusText").textContent = status;
    const statusDot = document.getElementById("statusDot");
    if (status === "Resolved") {
        statusDot.classList.remove("bg-red-500");
        statusDot.classList.add("bg-green-500");
    } else {
        statusDot.classList.remove("bg-green-500");
        statusDot.classList.add("bg-red-500");
    }

    const similarFindingsContainer =document.getElementById("similarFindingsContainer");
    console.log("SIMILAR FINDINGS CONTAINER:", similarFindingsContainer);
    try {
        const apiUrl = window.getApiUrl ? window.getApiUrl('/findings') : '/findings';
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("FINDINGS RESPONSE:", data);
        const allFindings = data.findings;
        const similarFindings = allFindings.filter(
            finding =>
                finding.filename === selectedFinding.filename &&
                finding.id !== selectedFinding.id
        );
        const uniqueSimilarFindings = [
            ...new Map(
                similarFindings.map(finding => [finding.id, finding])
            ).values()
        ];
        
        console.log("UNIQUE SIMILAR FINDINGS:", uniqueSimilarFindings);
        similarFindingsContainer.innerHTML = "";

        uniqueSimilarFindings.forEach(finding => {
            const row = document.createElement("div");
            row.className =
                "flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-700/50";

            row.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">

                    <i data-lucide="globe-2"
                    class="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0">
                    </i>

                    <span class="text-xs text-slate-600 dark:text-slate-400 truncate">
                        ${finding.title} in ${finding.endpoint}
                    </span>

                </div>

                <span class="px-2 py-1 rounded-md text-xs shrink-0
                    ${
                        finding.severity === "Critical"
                            ? "bg-red-100 dark:bg-red-500/10 text-red-500 dark:text-red-400"
                            : finding.severity === "High"
                            ? "bg-orange-100 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400"
                            : finding.severity === "Medium"
                            ? "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-400"
                            : "bg-blue-100 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400"
                    }">
                    ${finding.severity}
                </span>
            `;
            similarFindingsContainer.appendChild(row);
        });

        lucide.createIcons();
                console.log("SIMILAR FINDINGS:", similarFindings);
                console.table(
                    similarFindings.map(finding => ({
                        id: finding.id,
                        title: finding.title,
                        severity: finding.severity,
                        endpoint: finding.endpoint,
                        filename: finding.filename
                    }))
                );
            } catch (error) {
                console.error("FINDINGS FETCH ERROR:", error);

            }
document.getElementById("learnMoreText").textContent = `Learn more about ${selectedFinding.title} and recommended security practices.`;
const whyThisWorks = document.getElementById("whyThisWorks");

if (selectedFinding.title.includes("SQL Injection")) {

    whyThisWorks.textContent =
        "Prepared statements separate SQL code from user input, ensuring that input is treated as data rather than executable code.";

} else if (selectedFinding.title.includes("Cross-Site Scripting")) {

    whyThisWorks.textContent =
        "Output encoding ensures that user-controlled content is displayed as data instead of being interpreted as executable JavaScript by the browser.";

} else if (selectedFinding.title.includes("Missing Security Headers")) {

    whyThisWorks.textContent =
        "Security headers provide browsers with additional instructions that reduce common attack opportunities and strengthen the application's security controls.";

} else if (selectedFinding.title.includes("Weak Password Policy")) {

    whyThisWorks.textContent =
        "A stronger password policy makes passwords harder to guess or crack and reduces the likelihood of account compromise.";

} else if (selectedFinding.title.includes("Information Disclosure")) {

    whyThisWorks.textContent =
        "Limiting exposed information prevents attackers from obtaining unnecessary details that could help them understand or target the application.";

} else {

    whyThisWorks.textContent =
        "The recommended security controls reduce the attack surface and address the underlying cause of the identified vulnerability.";

}

const additionalRecommendations = document.getElementById("additionalRecommendations");

let recommendations = [];
if (selectedFinding.title.includes("SQL Injection")) {
    recommendations = [
        "Implement input validation on the server side",
        "Use stored procedures where possible",
        "Apply least privilege to database users",
        "Enable web application firewall (WAF)",
        "Monitor and log suspicious activities"
    ];
} else if (selectedFinding.title.includes("Cross-Site Scripting")) {
    recommendations = [
        "Apply context-aware output encoding",
        "Validate and sanitize user-controlled input",
        "Implement a strong Content Security Policy",
        "Use secure HTTP-only cookies",
        "Test all user input points for XSS"
    ];
} else if (selectedFinding.title.includes("Missing Security Headers")) {
    recommendations = [
        "Configure recommended security headers",
        "Implement a strict Content Security Policy",
        "Enable HSTS for HTTPS connections",
        "Configure X-Content-Type-Options",
        "Review security headers regularly"
    ];

} else if (selectedFinding.title.includes("Weak Password Policy")) {
    recommendations = [
        "Require stronger password complexity",
        "Enforce a minimum password length",
        "Implement account lockout or rate limiting",
        "Encourage multi-factor authentication",
        "Monitor repeated authentication failures"
    ];
} else if (selectedFinding.title.includes("Information Disclosure")) {
    recommendations = [
        "Remove unnecessary sensitive information from responses",
        "Disable detailed error messages in production",
        "Review API responses for excessive data",
        "Apply appropriate access controls",
        "Monitor application logs for information exposure"
    ];
} else {
    recommendations = [
        "Validate and sanitize user input",
        "Apply appropriate access controls",
        "Follow secure coding practices",
        "Monitor suspicious activity",
        "Regularly test the application for security issues"
    ];
}
additionalRecommendations.innerHTML = "";
recommendations.forEach(recommendation => {
    const item = document.createElement("div");
    item.className = "flex items-start gap-2";
    item.innerHTML = `
        <i data-lucide="circle-check"
           class="w-3.5 h-3.5 text-green-500 dark:text-green-400 shrink-0 mt-0.5">
        </i>
        <span class="text-xs text-slate-600 dark:text-slate-400">
            ${recommendation}
        </span>
    `;
    additionalRecommendations.appendChild(item);
});
lucide.createIcons();


const implementationSteps = document.getElementById("implementationSteps");
let steps = [];
if (selectedFinding.title.includes("SQL Injection")) {
    steps = [
        "Identify all database queries that use user-controlled input",
        "Replace dynamically constructed queries with prepared statements",
        "Validate and sanitize user input before processing",
        "Apply least-privilege permissions to database accounts"
    ];
} else if (selectedFinding.title.includes("Cross-Site Scripting")) {
    steps = [
        "Identify all locations where user-controlled data is displayed",
        "Apply context-aware output encoding",
        "Validate and sanitize user input",
        "Implement a Content Security Policy",
        "Test the application for reflected and stored XSS"
    ];
} else if (selectedFinding.title.includes("Missing Security Headers")) {
    steps = [
        "Identify the missing security headers",
        "Configure the required headers on the web server",
        "Apply a strict Content Security Policy",
        "Enable HSTS for HTTPS connections",
        "Verify the headers using security testing tools"
    ];
} else if (selectedFinding.title.includes("Weak Password Policy")) {
    steps = [
        "Define minimum password length and complexity requirements",
        "Update the application's password validation rules",
        "Implement protection against repeated login attempts",
        "Encourage or require multi-factor authentication",
        "Test the new password policy"
    ];
} else if (selectedFinding.title.includes("Information Disclosure")) {
    steps = [
        "Identify the sensitive information being exposed",
        "Remove unnecessary information from responses",
        "Disable detailed errors in production",
        "Apply appropriate access controls",
        "Test responses to confirm sensitive information is no longer exposed"
    ];
} else {
    steps = [
        "Identify the root cause of the vulnerability",
        "Apply the recommended security control",
        "Validate and sanitize affected inputs",
        "Test the application after implementing the fix"
    ];

}
implementationSteps.innerHTML = "";
steps.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "flex items-center gap-3";
    item.innerHTML = `
        <span class="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">
            ${index + 1}
        </span>

        <p class="text-xs text-slate-600 dark:text-slate-400">
            ${step}
        </p>
    `;
    implementationSteps.appendChild(item);
});

const vulnerableCode = document.getElementById("vulnerableCode");
let vulnerableExample = "";
if (selectedFinding.title.includes("SQL Injection")) {
    vulnerableExample = 
    `1  $id = $_GET['id'];
            2  $query = "SELECT * FROM users WHERE id = '$id'";
            3  $result = mysqli_query($conn, $query);`;

} else if (selectedFinding.title.includes("Cross-Site Scripting")) {
    vulnerableExample = `1  $search = $_GET['search'];
               2  echo "<h1>Search results for: $search</h1>";`;

} else if (selectedFinding.title.includes("Missing Security Headers")) {
    vulnerableExample = `1  // Response sent without security headers
               2  echo "Application response";`;

} else if (selectedFinding.title.includes("Weak Password Policy")) {
    vulnerableExample = `1  $password = $_POST['password'];
               2  if (strlen($password) >= 4) {
               3      createAccount($password);
               4  }`;

} else if (selectedFinding.title.includes("Information Disclosure")) {
    vulnerableExample = `1  if ($error) {
               2      echo $exception->getMessage();
               3  }`;

} else {
    vulnerableExample = `1  // Vulnerable implementation
               2  // User-controlled data is processed
               3  // without sufficient security controls`;

}
vulnerableCode.textContent = vulnerableExample;

// secure code
const secureCode = document.getElementById("secureCode");
let secureExample = "";
if (selectedFinding.title.includes("SQL Injection")) {
    secureExample = `1  $id = $_GET['id'];
             2  $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
             3  $stmt->bind_param("i", $id);
             4  $stmt->execute();
             5  $result = $stmt->get_result();`;

} else if (selectedFinding.title.includes("Cross-Site Scripting")) {
    secureExample = `1  $search = $_GET['search'];
             2  $safeSearch = htmlspecialchars($search, ENT_QUOTES, 'UTF-8');
             3  echo "<h1>Search results for: $safeSearch</h1>";`;

} else if (selectedFinding.title.includes("Missing Security Headers")) {
    secureExample = `1  header("Content-Security-Policy: default-src 'self'");
             2  header("X-Content-Type-Options: nosniff");
             3  header("Strict-Transport-Security: max-age=31536000");`;

} else if (selectedFinding.title.includes("Weak Password Policy")) {
    secureExample = `1  $password = $_POST['password'];
             2  if (strlen($password) >= 12) {
             3      createAccount($password);
             4  }`;

} else if (selectedFinding.title.includes("Information Disclosure")) {
    secureExample = `1  if ($error) {
             2      error_log($exception->getMessage());
             3      echo "An error occurred.";
             4  }`;

} else {
    secureExample = `1  // Secure implementation
             2  // User-controlled data is validated
             3  // and handled using appropriate security controls`;

}
secureCode.textContent = secureExample;
const secureCodeExplanation = document.getElementById("secureCodeExplanation");
let explanation = "";
if (selectedFinding.title.includes("SQL Injection")) {
    explanation =
        "The secure version uses a prepared statement with parameterized queries. User input is passed separately from the SQL command, so the database treats it as data rather than executable SQL.";

} else if (selectedFinding.title.includes("Cross-Site Scripting")) {
    explanation =
        "The secure version uses output encoding to safely display user-controlled input. Special characters are converted so the browser treats the input as text instead of executable JavaScript.";

} else if (selectedFinding.title.includes("Missing Security Headers")) {
    explanation =
        "The secure version adds important security headers that instruct the browser to apply additional security protections and reduce common attack opportunities.";

} else if (selectedFinding.title.includes("Weak Password Policy")) {
    explanation =
        "The secure version requires a stronger minimum password length, making passwords harder to guess or crack and reducing the risk of account compromise.";

} else if (selectedFinding.title.includes("Information Disclosure")) {
    explanation =
        "The secure version prevents detailed error information from being exposed to users. Sensitive technical details are logged internally while the user receives a generic error message.";

} else {
    explanation =
        "The secure version applies appropriate security controls to validate and safely handle user-controlled data, reducing the risk of exploitation.";

}
const markResolvedBtn = document.getElementById("markResolvedBtn");
const statusText = document.getElementById("statusText");
const markResolvedText = document.getElementById("markResolvedText");
if (markResolvedBtn) {
    markResolvedBtn.addEventListener("click", async () => {
        try {
            const apiUrl = window.getApiUrl ? window.getApiUrl(`/findings/${selectedFinding.id}/status?status=Resolved`) : `/findings/${selectedFinding.id}/status?status=Resolved`;
            const response = await fetch(apiUrl,
                {
                    method: "PATCH"
                }
            );
            const data = await response.json();
            console.log("STATUS UPDATE:", data);
            if (!response.ok) {
                throw new Error(data.detail || "Failed to update status");
            }
            if (statusText) statusText.textContent = "Resolved";
            if (statusDot) {
                statusDot.classList.remove("bg-red-500");
                statusDot.classList.add("bg-green-500");
            }
            if (markResolvedText) markResolvedText.textContent = "Resolved";
        } catch (error) {
            console.error("STATUS UPDATE ERROR:", error);
        }
    });
}

const generateRemediationBtn=document.getElementById("generateRemediationBtn")
const generateRemediationText=document.getElementById("generateRemediationText")
generateRemediationBtn.addEventListener("click", async () => {
    generateRemediationText.textContent = "Generating...";
    try {
        const apiUrl = window.getApiUrl ? window.getApiUrl('/generate-remediation') : '/generate-remediation';
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(selectedFinding)
        });
        const data = await response.json();
        console.log("REMEDIATION RESPONSE:", data);
        document.getElementById("aiRecommendedFix").textContent =data.remediation;
        if (!response.ok) {
            throw new Error(data.detail || "Failed to generate remediation");
        }
        generateRemediationText.textContent = "Remediation Ready";
    } catch (error) {
        console.error("REMEDIATION ERROR:", error);
        generateRemediationText.textContent = "Generate Remediation";
    }
});

const copyVulnerableCode = document.getElementById("copyVulnerableCode");
if (copyVulnerableCode) {
    copyVulnerableCode.addEventListener("click", () => {
        const vulnerableCodeElem = document.getElementById("vulnerableCode");
        const codeText = vulnerableCodeElem ? vulnerableCodeElem.textContent : "";
        navigator.clipboard.writeText(codeText);
        copyVulnerableCode.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-slate-500"></i>`;
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
            copyVulnerableCode.innerHTML = `<i data-lucide="copy" class="w-4 h-4 text-slate-500"></i>`;
            if (window.lucide) lucide.createIcons();
        }, 2000);
    });
}

const copySecureCode = document.getElementById("copySecureCode");
if (copySecureCode) {
    copySecureCode.addEventListener("click", () => {
        const secureCodeElem = document.getElementById("secureCode");
        const secureCodeText = secureCodeElem ? secureCodeElem.textContent : "";
        navigator.clipboard.writeText(secureCodeText);
        copySecureCode.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-slate-500"></i>`;
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
            copySecureCode.innerHTML = `<i data-lucide="copy" class="w-4 h-4 text-slate-500"></i>`;
            if (window.lucide) lucide.createIcons();
        }, 2000);
    });
}

const viewDocumentationBtn = document.getElementById("viewDocumentationBtn");
if (viewDocumentationBtn) {
    viewDocumentationBtn.addEventListener("click", () => {
        window.location.href = "findings_documentation.html";
    });
}
}
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAIRemediation);
} else {
    initAIRemediation();
}

function initTabs() {
    const aiAnalysisTab = document.getElementById("aiAnalysisTab");
    const remediationTab = document.getElementById("remediationTab");
    const codeExampleTab = document.getElementById("codeExampleTab");
    const referenceTab = document.getElementById("referenceTab");

    const aiAnalysisContent = document.getElementById("aiAnalysisContent");
    const remediationContent = document.getElementById("remediationContent");
    const codeExampleContent = document.getElementById("codeExampleContent");
    const referencesContent = document.getElementById("referencesContent");

    if (!aiAnalysisTab || !remediationTab || !codeExampleTab || !referenceTab) return;

    const tabs = [aiAnalysisTab, remediationTab, codeExampleTab, referenceTab];
    const contents = [aiAnalysisContent, remediationContent, codeExampleContent, referencesContent];

    function resetTabs() {
        tabs.forEach(function (tab) {
            if (tab) {
                tab.classList.remove("text-blue-500", "underline", "decoration-blue-500", "decoration-2", "underline-offset-4");
                tab.classList.add("text-slate-500", "dark:text-slate-400");
            }
        });
    }

    function hideAllContent() {
        contents.forEach(function (content) {
            if (content) content.classList.add("hidden");
        });
    }

    function showTab(activeTab, activeContent) {
        resetTabs();
        hideAllContent();
        if (activeTab) {
            activeTab.classList.remove("text-slate-500", "dark:text-slate-400");
            activeTab.classList.add("text-blue-500", "underline", "decoration-blue-500", "decoration-2", "underline-offset-4");
        }
        if (activeContent) activeContent.classList.remove("hidden");
    }

    aiAnalysisTab.addEventListener("click", function () {
        showTab(aiAnalysisTab, aiAnalysisContent);
    });

    remediationTab.addEventListener("click", function () {
        showTab(remediationTab, remediationContent);
    });

    codeExampleTab.addEventListener("click", function () {
        showTab(codeExampleTab, codeExampleContent);
    });

    referenceTab.addEventListener("click", function () {
        showTab(referenceTab, referencesContent);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTabs);
} else {
    initTabs();
}