/**
 * Central API Configuration for AI Copilot
 * Dynamically resolves backend API base URL across local dev, Live Server, local network, and production deployment.
 */
(function() {
    let apiBase = '';

    // 1. Manual override takes highest precedence if set
    if (window.CUSTOM_API_BASE_URL) {
        apiBase = window.CUSTOM_API_BASE_URL;
    }
    // 2. Opened directly as a local file (file://)
    else if (window.location.protocol === 'file:') {
        apiBase = 'http://localhost:8000';
    }
    // 3. Served directly by FastAPI on port 8000 OR production deployment (standard 80/443 without separate dev port)
    else if (window.location.port === '8000' || window.location.port === '' || window.location.port === '80' || window.location.port === '443') {
        apiBase = '';
    }
    // 4. Opened via Live Server or secondary dev port (e.g. 5500, 3000)
    else {
        const protocol = window.location.protocol || 'http:';
        const hostname = window.location.hostname || 'localhost';
        apiBase = `${protocol}//${hostname}:8000`;
    }

    window.API_BASE_URL = apiBase;

    /**
     * Helper to construct full API endpoint URLs
     * @param {string} endpoint - e.g., '/settings/profile' or 'findings'
     * @returns {string} - Full URL
     */
    window.getApiUrl = function(endpoint) {
        if (!endpoint) return window.API_BASE_URL;
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${window.API_BASE_URL}${path}`;
    };

    console.log(`[AI Copilot Config] Connected API Base URL: "${window.API_BASE_URL || '(relative)'}"`);
})();
