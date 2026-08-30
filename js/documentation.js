document.addEventListener("DOMContentLoaded", () => {
    const backToRemediation = document.getElementById("backToRemediation");
    backToRemediation.addEventListener("click", () => {
        window.location.href = "AI_Remediation.html";
    });
    const selectedFinding = JSON.parse(
        localStorage.getItem("selectedFinding")
    );
    console.log("DOCUMENTATION FINDING:", selectedFinding);
    if (!selectedFinding) {
        document.getElementById("documentationTitle").textContent =
            "No finding selected";
        return;
    }
    document.getElementById("documentationTitle").textContent =
        `${selectedFinding.title} Documentation`;

    const documentation = {
        "SQL Injection": {
            description:
                "SQL Injection is a web security vulnerability that occurs when an application includes untrusted user input directly inside a database query. An attacker may manipulate the input to change the intended SQL query.",
            impact:
                "An attacker may be able to access unauthorized data, modify or delete database records, bypass authentication, or potentially compromise the underlying database.",
            prevention:
                "Use parameterized queries or prepared statements instead of constructing SQL queries using string concatenation. Validate and sanitize input where appropriate, use least-privilege database accounts, and avoid exposing detailed database errors to users.",
            references:
                "OWASP SQL Injection Prevention Cheat Sheet"
        },


        "Cross-Site Scripting (XSS)": {
            description:
                "Cross-Site Scripting (XSS) occurs when an application allows untrusted input to be inserted into a web page and executed as JavaScript in another user's browser.",
            impact:
                "Successful XSS attacks may allow attackers to steal session information, manipulate page content, perform actions on behalf of users, or redirect users to malicious websites.",
            prevention:
                "Properly encode output before displaying user-controlled data, validate input, use appropriate Content Security Policy headers, and avoid inserting untrusted content directly into HTML or JavaScript.",
            references:
                "OWASP Cross-Site Scripting Prevention Cheat Sheet"
        },


        "Missing Security Headers": {
            description:
                "Security headers are HTTP response headers that instruct browsers to apply additional security protections when interacting with a web application.",
            impact:
                "Missing security headers can increase the risk of attacks such as clickjacking, content injection, MIME-type confusion, and certain types of cross-site scripting attacks.",
            prevention:
                "Configure appropriate security headers such as Content-Security-Policy, X-Content-Type-Options, X-Frame-Options or frame-ancestors, Strict-Transport-Security, and Referrer-Policy.",
            references:
                "OWASP Secure Headers Project"
        },


        "Weak Password Policy": {
            description:
                "A weak password policy allows users to create passwords that are short, predictable, reused, or otherwise easy for attackers to guess or crack.",

            impact:
                "Weak passwords can increase the likelihood of account compromise through password guessing, credential stuffing, brute-force attacks, or the use of previously leaked credentials.",

            prevention:
                "Require sufficiently long passwords, prevent the use of commonly compromised passwords, implement appropriate rate limiting, and support multi-factor authentication where possible.",

            references:
                "OWASP Authentication Cheat Sheet"
        },


        "Information Disclosure": {
            description:
                "Information disclosure occurs when an application unintentionally exposes sensitive or unnecessary information to users or attackers.",

            impact:
                "Exposed information may help attackers understand the application's internal structure, identify technologies and versions, discover sensitive data, or prepare more targeted attacks.",

            prevention:
                "Avoid exposing sensitive information in error messages, API responses, source code, logs, and HTTP headers. Use generic error messages and carefully control the information returned by the application.",

            references:
                "OWASP Information Exposure"
        }

    };


    const info = documentation[selectedFinding.title];
    if (!info) {
        document.getElementById("documentationDescription").innerHTML = `
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
                Documentation
            </h2>

            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Documentation for this finding is not available yet.
            </p>
        `;
        return;
    }


    document.getElementById("documentationDescription").innerHTML = `
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
            What is ${selectedFinding.title}?
        </h2>

        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            ${info.description}
        </p>
    `;


    document.getElementById("documentationImpact").innerHTML = `
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
            Impact
        </h2>

        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            ${info.impact}
        </p>
    `;


    document.getElementById("documentationPrevention").innerHTML = `
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
            Prevention
        </h2>

        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            ${info.prevention}
        </p>
    `;


    document.getElementById("documentationReferences").innerHTML = `
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
            Further Reading
        </h2>

        <p class="mt-2 text-sm text-blue-500 dark:text-blue-400">
            ${info.references}
        </p>
    `;

});