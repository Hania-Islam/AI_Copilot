from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pypdf import PdfReader
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import io
import json
import csv
import re
   
app = FastAPI()

# CORS setup: Allow requests from Live Server, local network IPs, and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
def api_home():
    return {
        "message": "AI Security Copilot Backend is running!"
    }
BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

app.mount(
    "/profile-pictures",
    StaticFiles(directory=os.path.join(BASE_DIR, "profile_pictures")),
    name="profile-pictures"
)

HISTORY_FILE = os.path.join(BASE_DIR, "upload_history.json")

def load_history():
    tmp_path = "/tmp/upload_history.json"
    if os.path.exists(tmp_path):
        try:
            with open(tmp_path, "r", encoding="utf-8") as file:
                data = json.load(file)
                if data and isinstance(data, list) and len(data) > 0:
                    return data
        except Exception as e:
            print("Error loading history from /tmp:", e)

    candidates = [
        HISTORY_FILE,
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "upload_history.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "upload_history.json"),
        os.path.join(os.getcwd(), "upload_history.json")
    ]
    for filepath in candidates:
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as file:
                    data = json.load(file)
                    if data:
                        return data
            except Exception as e:
                print("Error loading history from", filepath, e)
    return []

def save_history(history):
    saved = False
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as file:
            json.dump(history, file, indent=4)
            saved = True
    except Exception as e:
        print("Could not write to HISTORY_FILE, using /tmp fallback:", e)

    try:
        with open("/tmp/upload_history.json", "w", encoding="utf-8") as file:
            json.dump(history, file, indent=4)
            saved = True
    except Exception as e:
        print("Could not write to /tmp/upload_history.json:", e)

SETTINGS_FILE = os.path.join(BASE_DIR, "settings.json")

def load_settings():
    tmp_path = "/tmp/settings.json"
    if os.path.exists(tmp_path):
        try:
            with open(tmp_path, "r", encoding="utf-8") as file:
                return json.load(file)
        except Exception:
            pass

    candidates = [
        SETTINGS_FILE,
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "settings.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "settings.json"),
        os.path.join(os.getcwd(), "settings.json")
    ]
    for filepath in candidates:
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as file:
                    return json.load(file)
            except Exception as e:
                print("Error loading settings:", e)
    return {
        "api": {
            "api_key": "sk-" + os.urandom(16).hex(),
            "integrations": []
        }
    }

def save_settings(settings):
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as file:
            json.dump(settings, file, indent=4)
    except Exception as e:
        print("Could not save settings to SETTINGS_FILE:", e)

    try:
        with open("/tmp/settings.json", "w", encoding="utf-8") as file:
            json.dump(settings, file, indent=4)
    except Exception as e:
        print("Could not save settings to /tmp/settings.json:", e)

@app.get("/settings/profile")
def get_profile():
    settings = load_settings()
    return settings if settings else {
        "name": "Hania",
        "role": "Admin",
        "email": "hania@example.com",
        "avatar": "/uploads/profile_pictures/default.png"
    }

@app.put("/settings/profile")
def update_profile(profile: dict):
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as file:
            json.dump(profile, file, indent=4)
    except Exception:
        try:
            with open("/tmp/settings.json", "w", encoding="utf-8") as file:
                json.dump(profile, file, indent=4)
        except Exception:
            pass
    return {
        "message": "Profile updated",
        "profile": profile
    }
    return {
        "message": "Profile updated successfully",
        "profile": profile
    }
    
@app.post("/settings/profile-picture")
async def upload_profile_picture(file: UploadFile = File(...)):
    upload_folder = os.path.join(BASE_DIR, "profile_pictures")
    os.makedirs(upload_folder, exist_ok=True)
    print("BASE_DIR:", BASE_DIR)
    print("UPLOAD FOLDER:", upload_folder)
    print("FILES:", os.listdir(upload_folder))
    file_path = os.path.join(upload_folder, file.filename)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # Load existing settings
    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    # Save profile picture filename
    settings["profile_picture"] = file.filename

    # Update settings.json
    with open(SETTINGS_FILE, "w", encoding="utf-8") as settings_file:
        json.dump(settings, settings_file, indent=4)

    return {
        "message": "Profile picture uploaded successfully",
        "filename": file.filename
    }
    
@app.put("/settings/notifications/email")
def update_email_notification(data: dict):
    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    if "notifications" not in settings:
        settings["notifications"] = {}

    settings["notifications"]["email"] = data["enabled"]

    with open(SETTINGS_FILE, "w", encoding="utf-8") as settings_file:
        json.dump(settings, settings_file, indent=4)
    return {
        "message": "Email notification updated successfully",
        "enabled": settings["notifications"]["email"]
    }

@app.put("/settings/notifications/security")
def update_security_notification(data: dict):
    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    if "notifications" not in settings:
        settings["notifications"] = {}

    settings["notifications"]["security"] = data["enabled"]

    with open(SETTINGS_FILE, "w", encoding="utf-8") as settings_file:
        json.dump(settings, settings_file, indent=4)

    return {
        "message": "Security notification updated successfully",
        "enabled": settings["notifications"]["security"]
    }
    
@app.put("/settings/notifications/reports")
def update_reports_notification(data: dict):
    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    if "notifications" not in settings:
        settings["notifications"] = {}

    settings["notifications"]["reports"] = data["enabled"]
    with open(SETTINGS_FILE, "w", encoding="utf-8") as settings_file:
        json.dump(settings, settings_file, indent=4)

    return {
        "message": "Weekly reports notification updated successfully",
        "enabled": settings["notifications"]["reports"]
    }
    
@app.put("/settings/notifications/updates")
def update_updates_notification(data: dict):
    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    if "notifications" not in settings:
        settings["notifications"] = {}

    settings["notifications"]["updates"] = data["enabled"]

    with open(SETTINGS_FILE, "w", encoding="utf-8") as settings_file:
        json.dump(settings, settings_file, indent=4)

    return {
        "message": "Product updates notification updated successfully",
        "enabled": settings["notifications"]["updates"]
    }

@app.get("/notifications")
def get_notifications():
    history = load_history()
    notifications = []
    for upload in history[:5]:
        findings_cnt = upload.get("findings_count", len(upload.get("findings", [])))
        notifications.append({
            "id": upload.get("report_id") or upload.get("filename"),
            "title": f"Report {upload.get('filename')} analyzed ({findings_cnt} findings)",
            "time": upload.get("upload_time", "Recently"),
            "type": "critical" if findings_cnt > 3 else "info"
        })
    return {
        "unread_count": len(notifications),
        "notifications": notifications
    }
    
@app.put("/settings/appearance/theme")
def update_theme(data: dict):

    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    if "appearance" not in settings:
        settings["appearance"] = {}

    settings["appearance"]["theme"] = data["theme"]

    with open(SETTINGS_FILE, "w", encoding="utf-8") as settings_file:
        json.dump(settings, settings_file, indent=4)

    return {
        "message": "Theme updated successfully",
        "theme": settings["appearance"]["theme"]
    }
    
@app.put("/settings/appearance/primary-color")
def update_primary_color(data: dict):

    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    if "appearance" not in settings:
        settings["appearance"] = {}

    settings["appearance"]["primary_color"] = data["primary_color"]

    with open(SETTINGS_FILE, "w", encoding="utf-8") as settings_file:
        json.dump(settings, settings_file, indent=4)

    return {
        "message": "Primary color updated successfully",
        "primary_color": settings["appearance"]["primary_color"]
    }
    
@app.get("/settings/security")
def get_security_settings():
    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)
    security = settings.get("security", {})

    return {
        "two_factor_enabled": security.get("two_factor_enabled", False),
        "active_sessions": security.get("active_sessions", 0),
        "login_history": security.get("login_history", [])
    }
 
class TwoFactorRequest(BaseModel):
    enabled: bool   
@app.put("/settings/security/2fa")
def update_two_factor(data: TwoFactorRequest):

    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    if "security" not in settings:
        settings["security"] = {}

    settings["security"]["two_factor_enabled"] = data.enabled

    with open(SETTINGS_FILE, "w", encoding="utf-8") as settings_file:
        json.dump(settings, settings_file, indent=4)

    return {
        "message": "Two-factor authentication updated successfully",
        "two_factor_enabled": settings["security"]["two_factor_enabled"]
    }
    
@app.get("/settings/security/sessions")
def get_active_sessions():
    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    security = settings.get("security", {})
    sessions = security.get("active_sessions", [])
    return {
        "active_sessions": len(sessions)
    }
    
@app.get("/settings/security/sessions/list")
def get_session_list():
    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    security = settings.get("security", {})
    sessions = security.get("active_sessions", [])
    return {
        "sessions": sessions
    }
    
@app.delete("/settings/security/sessions/{session_id}")
def revoke_session(session_id: str):

    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)

    security = settings.get("security", {})

    sessions = security.get("active_sessions", [])

    for session in sessions:

        if session.get("id") == session_id:

            # Don't allow current session to be revoked
            if session.get("current") is True:
                raise HTTPException(
                    status_code=400,
                    detail="Current session cannot be revoked"
                )

            sessions.remove(session)

            security["active_sessions"] = sessions
            settings["security"] = security

            with open(SETTINGS_FILE, "w", encoding="utf-8") as settings_file:
                json.dump(settings, settings_file, indent=4)

            return {
                "message": "Session revoked successfully",
                "session_id": session_id
            }

    raise HTTPException(
        status_code=404,
        detail="Session not found"
    )
    
@app.get("/settings/security/login-history")
def get_login_history():
    with open(SETTINGS_FILE, "r", encoding="utf-8") as settings_file:
        settings = json.load(settings_file)
    security = settings.get("security", {})

    login_history = security.get("login_history", [])
    return {
        "login_history": login_history
    }
    
# =========================
# API CONFIGURATION
# =========================

# Use global Vercel-safe load_settings and save_settings


# Get API configuration
@app.get("/settings/api")
def get_api_settings():

    settings = load_settings()

    api_settings = settings.get("api", {})

    return {
        "api_key": api_settings.get("api_key", ""),
        "integrations": api_settings.get("integrations", [])
    }


# Regenerate API key
@app.post("/settings/api/regenerate")
def regenerate_api_key():

    settings = load_settings()

    # Generate a new API key
    new_api_key = "sk-" + os.urandom(16).hex()

    # Make sure API section exists
    if "api" not in settings:
        settings["api"] = {}

    # Save new API key
    settings["api"]["api_key"] = new_api_key

    # Make sure integrations exists
    if "integrations" not in settings["api"]:
        settings["api"]["integrations"] = []

    save_settings(settings)

    return {
        "message": "API key regenerated successfully",
        "api_key": new_api_key
    }


# Integration request model
class IntegrationRequest(BaseModel):

    service: str
    token: str


# Add integration
@app.post("/settings/api/integrations")
def add_integration(data: IntegrationRequest):

    settings = load_settings()

    # Make sure API section exists
    if "api" not in settings:
        settings["api"] = {}

    # Make sure integrations list exists
    if "integrations" not in settings["api"]:
        settings["api"]["integrations"] = []

    # Create integration
    integration = {
        "id": os.urandom(8).hex(),
        "service": data.service,
        "token": data.token,
        "status": "Connected"
    }

    # Add integration
    settings["api"]["integrations"].append(integration)

    save_settings(settings)

    return {
        "message": "Integration added successfully",
        "integration": integration
    }


# Delete integration
@app.delete("/settings/api/integrations/{integration_id}")
def delete_integration(integration_id: str):

    settings = load_settings()

    integrations = settings.get("api", {}).get("integrations", [])

    for integration in integrations:

        if integration.get("id") == integration_id:

            integrations.remove(integration)

            settings["api"]["integrations"] = integrations

            save_settings(settings)

            return {
                "message": "Integration removed successfully",
                "integration_id": integration_id
            }

    raise HTTPException(
        status_code=404,
        detail="Integration not found"
    )
    
@app.get("/notifications")
async def get_notifications():
    notifications = [
        {
            "id": 1,
            "type": "critical",
            "title": "Critical vulnerability detected",
            "time": "5 minutes ago",
            "read": False
        },
        {
            "id": 2,
            "type": "success",
            "title": "Security report analyzed",
            "time": "1 hour ago",
            "read": False
        },
        {
            "id": 3,
            "type": "info",
            "title": "AI remediation ready",
            "time": "2 hours ago",
            "read": False
        }
    ]
    unread_count = sum(
        1 for notification in notifications
        if not notification["read"]
    )
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }
        
def normalize_finding_dict(finding: dict, fallback_date: str = None) -> dict:
    if not isinstance(finding, dict):
        return finding
    
    date_val = finding.get("date_detected") or finding.get("date")
    if not date_val or str(date_val).strip() == "" or str(date_val).strip().lower() in ["undefined", "null", "none"]:
        if fallback_date and str(fallback_date).strip() and str(fallback_date).strip().lower() not in ["undefined", "null", "none"]:
            d_match = re.search(r'\d{4}-\d{2}-\d{2}', str(fallback_date))
            if d_match:
                date_val = d_match.group(0)
            else:
                date_val = str(fallback_date).strip().split(" ")[0]
        else:
            date_val = datetime.now().strftime("%Y-%m-%d")
    else:
        d_match = re.search(r'\d{4}-\d{2}-\d{2}', str(date_val))
        if d_match:
            date_val = d_match.group(0)
        else:
            date_val = str(date_val).strip().split(" ")[0]

    finding["date_detected"] = date_val
    return finding

def create_finding_object(id_val, title, severity, endpoint, description, evidence, recommendation, cvss=None, impact="", status="Open", date_detected=None, idx=1, report_id="", filename=""):
    severity_clean = severity.strip().capitalize() if severity else "Medium"
    if severity_clean not in ["Critical", "High", "Medium", "Low"]:
        sev_lower = (severity or "").lower()
        if "crit" in sev_lower: severity_clean = "Critical"
        elif "high" in sev_lower: severity_clean = "High"
        elif "med" in sev_lower: severity_clean = "Medium"
        elif "low" in sev_lower: severity_clean = "Low"
        else: severity_clean = "Medium"
    
    cvss_val = 0.0
    if cvss is not None and str(cvss).strip():
        try:
            match = re.search(r'\d+(?:\.\d+)?', str(cvss))
            if match:
                cvss_val = float(match.group())
        except Exception:
            cvss_val = 0.0
    
    if cvss_val == 0.0:
        if severity_clean == "Critical": cvss_val = 9.8
        elif severity_clean == "High": cvss_val = 8.5
        elif severity_clean == "Medium": cvss_val = 6.5
        elif severity_clean == "Low": cvss_val = 3.1

    title_clean = title.strip() if title else f"Finding {idx}"
    title_lower = title_clean.lower()
    if "xss" in title_lower or "cross-site script" in title_lower:
        finding_type = "XSS"
    elif "sql" in title_lower or "injection" in title_lower:
        finding_type = "Injection"
    elif "password" in title_lower or "auth" in title_lower or "credential" in title_lower:
        finding_type = "Authentication"
    elif "access control" in title_lower or "idor" in title_lower or "authorization" in title_lower:
        finding_type = "Access Control"
    elif "configuration" in title_lower or "misconfig" in title_lower:
        finding_type = "Configuration"
    elif "header" in title_lower:
        finding_type = "Security Header"
    elif "disclosure" in title_lower or "leak" in title_lower or "exposure" in title_lower:
        finding_type = "Information Leak"
    elif "dependency" in title_lower or "outdated" in title_lower or "vulnerability" in title_lower:
        finding_type = "Vulnerability"
    else:
        finding_type = "Other"

    if not date_detected or str(date_detected).strip() == "" or str(date_detected).strip().lower() in ["undefined", "null", "none"]:
        date_detected = datetime.now().strftime("%Y-%m-%d")
    else:
        d_match = re.search(r'\d{4}-\d{2}-\d{2}', str(date_detected))
        if d_match:
            date_detected = d_match.group(0)
        else:
            date_detected = str(date_detected).strip().split(" ")[0]

    status_clean = status.strip().capitalize() if status else "Open"
    if status_clean not in ["Open", "Resolved", "Fixed", "In Progress"]:
        status_clean = "Open"

    id_clean = str(id_val).strip() if id_val else f"{idx:03d}"

    return {
        "id": id_clean,
        "report_id": report_id or "",
        "filename": filename or "",
        "title": title_clean,
        "severity": severity_clean,
        "endpoint": (endpoint or "/").strip(),
        "description": (description or f"Vulnerability detected in {endpoint or 'the application'}.").strip(),
        "evidence": (evidence or "Detailed evidence captured during report analysis.").strip(),
        "recommendation": (recommendation or "Apply recommended security patches and validate input.").strip(),
        "cvss": cvss_val,
        "impact": (impact or f"Potential risk associated with {title_clean}.").strip(),
        "status": status_clean,
        "date_detected": date_detected,
        "type": finding_type
    }


def analyze_report(report_text, filename="", report_id=""):
    print("ANALYZING REPORT for file:", filename)
    all_findings = []
    
    # 1. Try JSON parsing
    cleaned_text = report_text.strip()
    if cleaned_text.startswith("{") or cleaned_text.startswith("["):
        try:
            data = json.loads(cleaned_text)
            raw_findings = []
            if isinstance(data, list):
                raw_findings = data
            elif isinstance(data, dict):
                raw_findings = data.get("findings", data.get("vulnerabilities", [data]))
            
            for idx, item in enumerate(raw_findings, 1):
                if not isinstance(item, dict):
                    continue
                finding_id = str(item.get("id", f"{idx:03d}"))
                finding_title = str(item.get("title", item.get("name", item.get("vulnerability", f"Finding {idx}"))))
                finding_severity = str(item.get("severity", "Medium"))
                finding_endpoint = str(item.get("endpoint", item.get("asset", item.get("url", "/"))))
                finding_desc = str(item.get("description", ""))
                finding_evidence = str(item.get("evidence", item.get("proof", "")))
                finding_recom = str(item.get("recommendation", item.get("remediation", "")))
                finding_cvss = item.get("cvss", item.get("cvss_score"))
                finding_impact = str(item.get("impact", ""))
                finding_status = str(item.get("status", "Open"))
                finding_date = str(item.get("date_detected", item.get("date", datetime.now().strftime("%Y-%m-%d"))))

                finding = create_finding_object(
                    id_val=finding_id,
                    title=finding_title,
                    severity=finding_severity,
                    endpoint=finding_endpoint,
                    description=finding_desc,
                    evidence=finding_evidence,
                    recommendation=finding_recom,
                    cvss=finding_cvss,
                    impact=finding_impact,
                    status=finding_status,
                    date_detected=finding_date,
                    idx=idx,
                    report_id=report_id,
                    filename=filename
                )
                all_findings.append(finding)
            if all_findings:
                print("Parsed JSON findings count:", len(all_findings))
                return all_findings
        except Exception as e:
            print("JSON parse attempt failed, falling back to text parsing:", e)

    # 2. Try CSV parsing
    if filename.lower().endswith(".csv") or ("," in report_text and "\n" in report_text and ("title" in report_text.lower() or "severity" in report_text.lower() or "vulnerability" in report_text.lower())):
        try:
            reader = csv.DictReader(io.StringIO(report_text))
            rows = list(reader)
            if rows and any(k for k in (rows[0].keys() or []) if k and any(x in k.lower() for x in ["title", "severity", "vulnerability", "finding", "asset"])):
                for idx, row in enumerate(rows, 1):
                    def get_val(keys):
                        for k, v in row.items():
                            if k and any(key in k.lower() for key in keys):
                                return v
                        return ""
                    
                    finding_id = get_val(["id"]) or f"{idx:03d}"
                    finding_title = get_val(["title", "vulnerability", "name"]) or f"Finding {idx}"
                    finding_severity = get_val(["severity"]) or "Medium"
                    finding_endpoint = get_val(["endpoint", "asset", "url", "location"]) or "/"
                    finding_desc = get_val(["description", "details", "desc"])
                    finding_evidence = get_val(["evidence", "proof"])
                    finding_recom = get_val(["recommendation", "remediation", "solution", "fix"])
                    finding_cvss = get_val(["cvss"])
                    finding_impact = get_val(["impact"])
                    finding_status = get_val(["status"]) or "Open"
                    finding_date = get_val(["date", "detected"]) or datetime.now().strftime("%Y-%m-%d")

                    finding = create_finding_object(
                        id_val=finding_id,
                        title=finding_title,
                        severity=finding_severity,
                        endpoint=finding_endpoint,
                        description=finding_desc,
                        evidence=finding_evidence,
                        recommendation=finding_recom,
                        cvss=finding_cvss,
                        impact=finding_impact,
                        status=finding_status,
                        date_detected=finding_date,
                        idx=idx,
                        report_id=report_id,
                        filename=filename
                    )
                    all_findings.append(finding)
                if all_findings:
                    print("Parsed CSV findings count:", len(all_findings))
                    return all_findings
        except Exception as e:
            print("CSV parse attempt failed, falling back to text parsing:", e)

    # 3. Flexible Text / PDF Parsing
    pattern = r'(?:^|\n)(?=(?:FINDING|Finding|Vulnerability|VULNERABILITY|ISSUE|Issue|\[Finding|\d+\.\s+Finding|\d+\.\s+Vulnerability))'
    blocks = re.split(pattern, report_text)
    blocks = [b.strip() for b in blocks if b.strip()]

    if len(blocks) <= 1:
        blocks = re.split(r'\n\s*\n(?=[A-Za-z0-9_\-\s]+:|\bFINDING\b|\bFinding\b|\bTitle\b)', report_text)
        blocks = [b.strip() for b in blocks if b.strip()]

    for idx, block in enumerate(blocks, 1):
        if not block:
            continue
        
        def extract_field(field_names, default=""):
            for name in field_names:
                match = re.search(r'(?i)(?:^|\n|\b)' + re.escape(name) + r'\s*:\s*(.*?)(?=\n\s*(?:Title|Finding Title|Vulnerability|Severity|Risk Level|CVSS|CVSS Score|Affected Endpoint|Endpoint|Asset|Description|Evidence|Recommendation|Remediation|Solution|Impact|Status|Date|Date Detected|Detected On|FINDING|Finding|Vulnerability)\s*:|\Z)', block, re.DOTALL)
                if match:
                    val = match.group(1).strip()
                    return val
            return default

        finding_id_match = re.search(r'(?i)(?:FINDING|Finding|Vulnerability|Issue)\s*#?\s*([0-9]+|FND-[0-9]+|ID-[0-9]+)(?:\s*:|\s*\n|\Z)', block)
        finding_id = extract_field(["ID", "Finding ID"]) or (finding_id_match.group(1) if finding_id_match else f"{idx:03d}")
        
        finding_title = extract_field(["Title", "Finding Title", "Vulnerability", "Name"])
        if not finding_title:
            lines = [l.strip() for l in block.split('\n') if l.strip()]
            if lines:
                candidate = re.sub(r'(?i)^(?:FINDING|Finding|Vulnerability|Issue|\d+[\.\:]\s*)\s*(?:#?\s*(?:[0-9]+|FND-[0-9]+)\s*[:\-]?\s*)?', '', lines[0]).strip()
                if candidate and len(candidate) > 2:
                    finding_title = candidate
                elif len(lines) > 1:
                    finding_title = lines[1].strip()

        if not finding_title:
            finding_title = f"Finding {idx}"

        finding_severity = extract_field(["Severity", "Risk Level", "Risk"]) or "Medium"
        finding_endpoint = extract_field(["Affected Endpoint", "Endpoint", "Asset", "URL", "Location"]) or "/"
        finding_description = extract_field(["Description", "Details", "Summary"])
        finding_evidence = extract_field(["Evidence", "Proof of Concept", "Proof"])
        finding_recommendation = extract_field(["Recommendation", "Remediation", "Solution", "Fix"])
        finding_cvss = extract_field(["CVSS", "CVSS Score", "CVSS v3"])
        finding_impact = extract_field(["Impact"])
        finding_status = extract_field(["Status"]) or "Open"
        finding_date = extract_field(["Date", "Date Detected", "Detected On"]) or datetime.now().strftime("%Y-%m-%d")

        finding = create_finding_object(
            id_val=finding_id,
            title=finding_title,
            severity=finding_severity,
            endpoint=finding_endpoint,
            description=finding_description,
            evidence=finding_evidence,
            recommendation=finding_recommendation,
            cvss=finding_cvss,
            impact=finding_impact,
            status=finding_status,
            date_detected=finding_date,
            idx=idx,
            report_id=report_id,
            filename=filename
        )
        all_findings.append(finding)

    print("Parsed Text/PDF findings count:", len(all_findings))
    return all_findings


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    print("UPLOADED FILE:", file.filename)
    extension = os.path.splitext(file.filename)[1].lower()
    print("FILE TYPE:", extension)
            
    content = await file.read()
    file_size = len(content)
    file_size_mb = round(file_size / (1024 * 1024), 2)

    # Save to disk with Vercel /tmp fallback for read-only filesystem
    try:
        upload_folder = os.path.join(BASE_DIR, "uploads")
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as save_err:
        print("Could not save file to BASE_DIR/uploads (Vercel read-only filesystem):", save_err)
        try:
            tmp_upload_folder = "/tmp/uploads"
            os.makedirs(tmp_upload_folder, exist_ok=True)
            tmp_file_path = os.path.join(tmp_upload_folder, file.filename)
            with open(tmp_file_path, "wb") as buffer:
                buffer.write(content)
        except Exception:
            pass

    # Extract text content cleanly
    report_text = ""
    if file.filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(content))
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    report_text += text + "\n"
        except Exception as pdf_err:
            print("PDF reading error, falling back to text decoding:", pdf_err)
            report_text = content.decode("utf-8", errors="ignore")
    else:
        report_text = content.decode("utf-8", errors="ignore")
    
    report_id = f"RPT-{int(datetime.now().timestamp()*1000)}"
    analysis = analyze_report(report_text, filename=file.filename, report_id=report_id)

    print("RETURNED ANALYSIS COUNT:", len(analysis))
    upload_time = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
    
    upload_record = {
        "report_id": report_id,
        "filename": file.filename,
        "file_type": file.filename.split(".")[-1].upper(),
        "file_size": f"{file_size_mb} MB",
        "status": "Completed",
        "findings_count": len(analysis),
        "upload_time": upload_time,
        "date_detected": datetime.now().strftime("%Y-%m-%d"),
        "findings": analysis
    }

    # Load existing history
    history = load_history()
    # Add newest upload at the beginning
    history.insert(0, upload_record)
    # Save history
    save_history(history)
    print("UPLOAD HISTORY SAVED. TOTAL UPLOADS:", len(history))
    return upload_record

@app.get("/upload-history")
def get_upload_history():
    history = load_history()
    for upload in history:
        raw_time = upload.get("upload_time", "")
        rep_id = upload.get("report_id", "")
        fn = upload.get("filename", "")
        for finding in upload.get("findings", []):
            finding["report_id"] = finding.get("report_id") or rep_id
            finding["filename"] = finding.get("filename") or fn
            normalize_finding_dict(finding, fallback_date=raw_time)
    return {
        "uploads": history
    }
    
@app.get("/findings")
def get_findings():
    history = load_history()
    if not history:
        return {
            "findings": [],
            "previous_findings_count": 0
        }
    all_findings = []   
    for upload in history:
        raw_time = upload.get("upload_time", "")
        rep_id = upload.get("report_id", "")
        fn = upload.get("filename", "")
        d_match = re.search(r'\d{4}-\d{2}-\d{2}', raw_time)
        upload_date = d_match.group(0) if d_match else (raw_time.split(" ")[0] if raw_time else datetime.now().strftime("%Y-%m-%d"))
        for finding in upload.get("findings", []):
            finding_copy = dict(finding)
            finding_copy["report_id"] = finding_copy.get("report_id") or rep_id
            finding_copy["filename"] = finding_copy.get("filename") or fn
            normalize_finding_dict(finding_copy, fallback_date=upload_date)
            if "status" not in finding_copy or not finding_copy["status"]:
                finding_copy["status"] = "Open"

            if "type" not in finding_copy or not finding_copy["type"]:
                title = finding_copy.get("title", "")
                title_lower = title.lower()
                if "xss" in title_lower or "cross-site script" in title_lower:
                    finding_copy["type"] = "XSS"
                elif "sql" in title_lower or "injection" in title_lower:
                    finding_copy["type"] = "Injection"
                elif "password" in title_lower or "auth" in title_lower:
                    finding_copy["type"] = "Authentication"
                elif "access control" in title_lower or "idor" in title_lower:
                    finding_copy["type"] = "Access Control"
                elif "configuration" in title_lower or "misconfig" in title_lower:
                    finding_copy["type"] = "Configuration"
                elif "header" in title_lower:
                    finding_copy["type"] = "Security Header"
                elif "disclosure" in title_lower or "leak" in title_lower:
                    finding_copy["type"] = "Information Leak"
                elif "dependency" in title_lower or "vulnerability" in title_lower:
                    finding_copy["type"] = "Vulnerability"
                else:
                    finding_copy["type"] = "Other"

            if "cvss" not in finding_copy or finding_copy["cvss"] is None:
                sev = finding_copy.get("severity", "Medium")
                if sev == "Critical": finding_copy["cvss"] = 9.8
                elif sev == "High": finding_copy["cvss"] = 8.5
                elif sev == "Medium": finding_copy["cvss"] = 6.5
                elif sev == "Low": finding_copy["cvss"] = 3.1
                else: finding_copy["cvss"] = 0.0

            all_findings.append(finding_copy)

    # Clean list of findings directly from upload history
    return {
        "findings": all_findings,
        "previous_findings_count": 0
    }

    
@app.patch("/findings/{finding_id}/status")
def update_finding_status(finding_id: str, status: str):
    history = load_history()
    for upload in history:
        for finding in upload.get("findings", []):
            if str(finding.get("id")) == str(finding_id):
                finding["status"] = status.capitalize()
                save_history(history)
                return {
                    "message": "Finding status updated",
                    "finding_id": finding_id,
                    "status": status.capitalize()
                }
    raise HTTPException(status_code=404, detail="Finding not found")

@app.post("/generate-remediation")
def generate_remediation(finding: dict):

    title = finding.get("title", "")
    severity = finding.get("severity", "")
    description = finding.get("description", "")

    return {
        "finding_id": finding.get("id"),
        "title": title,
        "severity": severity,
        "remediation": "Review the vulnerability and apply appropriate security controls.",
        "description": description
    }
    
@app.get("/finding")
def get_finding(filename: str = None, finding_id: str = None):
    history = load_history()
    for upload in history:
        if not filename or upload.get("filename") == filename:
            for finding in upload.get("findings", []):
                if str(finding.get("id")) == str(finding_id):
                    norm_finding = normalize_finding_dict(dict(finding), fallback_date=upload.get("upload_time"))
                    norm_finding["filename"] = upload.get("filename")
                    norm_finding["report_id"] = upload.get("report_id")
                    return {
                        "finding": norm_finding
                    }
    raise HTTPException(status_code=404, detail="Finding not found")
    
@app.get("/ai-remediation")
def get_ai_remediation(filename: str = None, finding_id: str = None):
    history = load_history()
    for upload in history:
        if not filename or upload.get("filename") == filename:
            for finding in upload.get("findings", []):
                if str(finding.get("id")) == str(finding_id):
                    norm_finding = normalize_finding_dict(dict(finding), fallback_date=upload.get("upload_time"))
                    norm_finding["filename"] = upload.get("filename")
                    norm_finding["report_id"] = upload.get("report_id")
                    return {
                        "finding": norm_finding,
                        "remediation": {
                            "recommended_fix": norm_finding.get("recommendation", ""),
                            "why_this_works": "The recommended remediation addresses the root cause of the vulnerability.",
                            "additional_recommendations": [],
                            "implementation_steps": [],
                            "confidence": 95
                        }
                    }
    raise HTTPException(status_code=404, detail="Finding not found")
    
@app.get("/severity-history")
def get_severity_history():
    history = load_history()
    severity_history = {
        "Critical": [],
        "High": [],
        "Medium": [],
        "Low": []
    }
    for upload in history:
        counts = {
            "Critical": 0,
            "High": 0,
            "Medium": 0,
            "Low": 0
        }
        for finding in upload["findings"]:
            severity = finding.get("severity")
            if severity in counts:
                counts[severity] += 1
        severity_history["Critical"].append(counts["Critical"])
        severity_history["High"].append(counts["High"])
        severity_history["Medium"].append(counts["Medium"])
        severity_history["Low"].append(counts["Low"])
        
    return severity_history

@app.put("/update-finding-status")
def update_finding_status(filename: str, finding_id: str, status: str):
    history = load_history()
    for upload in history:
        if upload["filename"] == filename:
            for finding in upload["findings"]:
                if finding["id"] == finding_id:
                    finding["status"] = status.capitalize()
                    save_history(history)
                    return {
                        "message": "Finding status updated",
                        "finding": finding
                    }
    return {
        "error": "Finding not found"
    }
@app.get("/")
def serve_index():
    return FileResponse(
        os.path.join(BASE_DIR, "dashboard.html")
    )

@app.get("/{page_name}.html")
def serve_page(page_name: str):
    file_path = os.path.join(
        BASE_DIR,
        f"{page_name}.html"
    )
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {
        "error": "Page not found"
    }


# Serve JS files
app.mount(
    "/js",
    StaticFiles(
        directory=os.path.join(BASE_DIR, "js")
    ),
    name="js"
)


# Serve assets
app.mount(
    "/assets",
    StaticFiles(
        directory=os.path.join(BASE_DIR, "assets")
    ),
    name="assets"
)

# Serve uploaded files
app.mount(
    "/uploads",
    StaticFiles(
        directory=os.path.join(BASE_DIR, "uploads")
    ),
    name="uploads"
)


