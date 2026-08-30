async function initDocumentation() {
    if (typeof applySavedTheme === "function") {
        applySavedTheme();
    }

    const backToRemediation = document.getElementById("backToRemediation");
    if (backToRemediation) {
        backToRemediation.addEventListener("click", () => {
            window.location.href = "AI_Remediation.html";
        });
    }

    let selectedFinding = null;
    try {
        selectedFinding = JSON.parse(localStorage.getItem("selectedFinding"));
    } catch (e) {
        selectedFinding = null;
    }

    // Immediate fallback so page renders instantly without waiting for network
    if (!selectedFinding || !selectedFinding.title) {
        selectedFinding = {
            id: 1,
            title: "SQL Injection",
            severity: "Critical",
            endpoint: "/api/login.php",
            status: "Open"
        };
    }

    const titleElem = document.getElementById("documentationTitle");
    if (titleElem) {
        titleElem.textContent = `${selectedFinding.title} Documentation`;
    }

    const documentation = {
        "SQL Injection": {
            description: "SQL Injection is a web security vulnerability that occurs when an application includes untrusted user input directly inside a database query. An attacker may manipulate the input to execute arbitrary SQL commands.",
            impact: "An attacker may gain unauthorized access to data, modify or delete database records, bypass authentication controls, or compromise the underlying server.",
            prevention: "Use parameterized queries or prepared statements instead of constructing SQL queries using string concatenation. Validate and sanitize user input, enforce least-privilege access on database accounts.",
            references: "OWASP SQL Injection Prevention Cheat Sheet"
        },
        "Cross-Site Scripting (XSS)": {
            description: "Cross-Site Scripting (XSS) occurs when an application inserts untrusted input into a web page without proper encoding, executing malicious scripts in client browsers.",
            impact: "Attackers can steal session cookies, hijack user sessions, manipulate page content, or redirect users to malicious domains.",
            prevention: "Apply contextual output encoding (HTML, attribute, JS encoding), implement Content Security Policy (CSP) headers, and validate input.",
            references: "OWASP Cross-Site Scripting Prevention Cheat Sheet"
        },
        "Missing Security Headers": {
            description: "Security headers instruct client browsers to activate built-in defense mechanisms against common web application threats.",
            impact: "Increases risk of clickjacking, MIME-type sniffing, cross-site scripting, and unauthorized framing.",
            prevention: "Configure response headers such as Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, and Strict-Transport-Security.",
            references: "OWASP Secure Headers Project"
        },
        "Weak Password Policy": {
            description: "A weak password policy allows users to set short, easily guessable, or reused passwords.",
            impact: "Increases vulnerability to brute-force, dictionary, and credential stuffing attacks.",
            prevention: "Enforce a minimum password length (e.g. 12+ characters), check against breach databases, and mandate multi-factor authentication.",
            references: "OWASP Authentication Cheat Sheet"
        },
        "Information Disclosure": {
            description: "Information disclosure occurs when sensitive implementation details, stack traces, or server version headers are exposed to untrusted users.",
            impact: "Provides attackers with technical details needed to craft targeted exploits against the system.",
            prevention: "Disable verbose error responses, mask framework headers, and log detailed exception traces internally.",
            references: "OWASP Information Exposure Guide"
        }
    };

    let info = documentation[selectedFinding.title];
    if (!info) {
        const titleLower = (selectedFinding.title || "").toLowerCase();
        if (titleLower.includes("sql") || titleLower.includes("injection")) {
            info = documentation["SQL Injection"];
        } else if (titleLower.includes("xss") || titleLower.includes("script")) {
            info = documentation["Cross-Site Scripting (XSS)"];
        } else if (titleLower.includes("header")) {
            info = documentation["Missing Security Headers"];
        } else if (titleLower.includes("password") || titleLower.includes("auth")) {
            info = documentation["Weak Password Policy"];
        } else {
            info = documentation["Information Disclosure"];
        }
    }

    const descElem = document.getElementById("documentationDescription");
    if (descElem) {
        descElem.innerHTML = `
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
                What is ${selectedFinding.title}?
            </h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                ${info.description}
            </p>
        `;
    }

    const impactElem = document.getElementById("documentationImpact");
    if (impactElem) {
        impactElem.innerHTML = `
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
                Impact
            </h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                ${info.impact}
            </p>
        `;
    }

    const prevElem = document.getElementById("documentationPrevention");
    if (prevElem) {
        prevElem.innerHTML = `
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
                Prevention & Mitigation
            </h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                ${info.prevention}
            </p>
        `;
    }

    const refElem = document.getElementById("documentationReferences");
    if (refElem) {
        refElem.innerHTML = `
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
                Further Reading & References
            </h2>
            <p class="mt-2 text-sm font-medium text-blue-500 dark:text-blue-400">
                ${info.references}
            </p>
        `;
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDocumentation);
} else {
    initDocumentation();
}