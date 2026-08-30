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
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except:
        return []

def save_history(history):
    with open(HISTORY_FILE, "w", encoding="utf-8") as file:
        json.dump(history, file, indent=4)
        
SETTINGS_FILE = os.path.join(BASE_DIR, "settings.json")
@app.get("/settings/profile")
def get_profile():
    with open(SETTINGS_FILE, "r", encoding="utf-8") as file:
        settings = json.load(file)
    return settings 

@app.put("/settings/profile")
def update_profile(profile: dict):
    print("SETTINGS FILE:", SETTINGS_FILE)
    print("PROFILE RECEIVED:", profile)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as file:
        json.dump(profile, file, indent=4)
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

def load_settings():
    with open(SETTINGS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def save_settings(settings):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as file:
        json.dump(settings, file, indent=4)


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
        
def analyze_report(report_text):
    print("ANALYZING REPORT...")
    findings = report_text.split("FINDING ")[1:]
    print("NUMBER OF FINDINGS:", len(findings))
    all_findings = []
    for finding_text in findings:
        print("CURRENT FINDING:")
        print(finding_text)
        # Extracting finding id
        finding_id = finding_text.split("\n")[0].strip()
        print("FINDING ID:", finding_id)
        # extracting title
        finding_title = finding_text.split("\n")[1].replace("Title:", "").strip()
        print("FINDING TITLE:", finding_title)
        # extracting severity
        finding_severity = finding_text.split("\n")[2].replace("Severity:", "").strip()
        print("FINDING SEVERITY:", finding_severity)
        # extracting affected Endpoint
        finding_endpoint = finding_text.split("\n")[3].replace("Affected Endpoint:", "").strip()
        print("FINDING ENDPOINT:", finding_endpoint)
        # extracting description
        finding_description = finding_text.split("\n")[4].replace("Description:", "").strip()
        print("FINDING DESCRIPTION:", finding_description)
        # extracting evidence
        finding_evidence = finding_text.split("\n")[5].replace("Evidence:", "").strip()
        print("FINDING EVIDENCE:", finding_evidence)
        # extracting recommendation
        finding_recommendation = finding_text.split("\n")[6].replace("Recommendation:", "").strip()
        print("FINDING RECOMMENDATION:", finding_recommendation)
        
        finding = {
            "id": finding_id,
            "title": finding_title,
            "severity": finding_severity,
            "endpoint": finding_endpoint,
            "description": finding_description,
            "evidence": finding_evidence,
            "recommendation": finding_recommendation,
            "status": "Open",
            "date_detected": datetime.now().strftime("%Y-%m-%d")
        }
        if "Cross-Site Scripting" in finding_title:
            finding_type = "XSS"
        elif "SQL Injection" in finding_title:
            finding_type = "Injection"
        elif "Password" in finding_title:
            finding_type = "Authentication"
        elif "Access Control" in finding_title:
            finding_type = "Access Control"
        elif "Authentication" in finding_title:
            finding_type = "Authentication"
        elif "Configuration" in finding_title or "Misconfiguration" in finding_title:
            finding_type = "Configuration"
        elif "Security Headers" in finding_title:
            finding_type = "Security Header"
        elif "Information Disclosure" in finding_title:
            finding_type = "Information Leak"
        elif "Information Leak" in finding_title:
            finding_type = "Information Leak"
        elif "Data Exposure" in finding_title:
            finding_type = "Data Exposure"
        else:
            finding_type = "Other"
        
        finding["type"] = finding_type
            
        print("FINDING OBJECT:")
        print(finding)
        all_findings.append(finding)
    print("ALL FINDINGS:")
    print(all_findings)
    return all_findings
            


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    print("UPLOADED FILE:", file.filename)
    extension = os.path.splitext(file.filename)[1].lower()
    print("FILE TYPE:", extension)
            
    upload_folder = os.path.join(BASE_DIR, "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, file.filename)

    print("SAVING FILE TO:", file_path)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        file_size = len(content)
        file_size_mb = round(file_size / (1024 * 1024), 2)
    if file.filename.lower().endswith(".pdf"):
        reader=PdfReader(io.BytesIO(content))
        report_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                report_text += text + "\n"
    else:
        report_text = content.decode("utf-8")
    analysis = analyze_report(report_text)

    print("RETURNED ANALYSIS:")
    print(analysis)
    upload_time = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
    
    upload_record = {
        "filename": file.filename,
        "file_type": file.filename.split(".")[-1].upper(),
        "file_size": f"{file_size_mb} MB",
        "status": "Completed",
        "findings_count": len(analysis),
        "upload_time": upload_time,
        "findings": analysis
    }

    # Load existing history
    history = load_history()
    # Add newest upload at the beginning
    history.insert(0, upload_record)
    # Save history
    save_history(history)
    print("UPLOAD HISTORY SAVED")
    print("TOTAL UPLOADS:", len(history))
    return upload_record

@app.get("/upload-history")
def get_upload_history():
    history = load_history()
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
        for finding in upload["findings"]:

            if "status" not in finding or not finding["status"]:
                finding["status"] = "Open"

            if "date_detected" not in finding:
                finding["date_detected"] = datetime.now().strftime("%Y-%m-%d")

            if "type" not in finding:
                title = finding.get("title", "")

                if "Cross-Site Scripting" in title:
                    finding["type"] = "XSS"
                elif "SQL Injection" in title:
                    finding["type"] = "Injection"
                elif "Password" in title:
                    finding["type"] = "Authentication"
                elif "Access Control" in title:
                    finding["type"] = "Access Control"
                elif "Authentication" in title:
                    finding["type"] = "Authentication"
                elif "Configuration" in title or "Misconfiguration" in title:
                    finding["type"] = "Configuration"
                elif "Security Headers" in title:
                    finding["type"] = "Security Header"
                elif "Information Disclosure" in title:
                    finding["type"] = "Information Leak"
                elif "Information Leak" in title:
                    finding["type"] = "Information Leak"
                elif "Data Exposure" in title:
                    finding["type"] = "Data Exposure"
                else:
                    finding["type"] = "Other"
            
            if "cvss" not in finding:
                if finding.get("severity") == "Critical":
                    finding["cvss"] = 9.8
                elif finding.get("severity") == "High":
                    finding["cvss"] = 8.5
                elif finding.get("severity") == "Medium":
                    finding["cvss"] = 6.5
                elif finding.get("severity") == "Low":
                    finding["cvss"] = 3.1
                else:
                    finding["cvss"] = 0.0

            finding["filename"] = upload["filename"]
            all_findings.append(finding)

    save_history(history)

    return {
        "findings": all_findings,
        "previous_findings_count": 0
    }
    
@app.patch("/findings/{finding_id}/status")
def update_finding_status(finding_id: str, status: str):
    history = load_history()
    for upload in history:
        for finding in upload["findings"]:
            if finding.get("id") == finding_id:
                finding["status"] = status
                save_history(history)
                return {
                    "message": "Finding status updated",
                    "finding_id": finding_id,
                    "status": status
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
def get_finding(filename: str, finding_id: str):
    history = load_history()
    for upload in history:
        if upload["filename"] == filename:
            for finding in upload["findings"]:
                if finding["id"] == finding_id:
                    return {
                        "finding": finding
                    }
    return {
        "error": "Finding not found"
    }
    
@app.get("/ai-remediation")
def get_ai_remediation(filename: str, finding_id: str):
    history = load_history()
    for upload in history:
        if upload["filename"] == filename:
            for finding in upload["findings"]:
                if finding["id"] == finding_id:
                    return {
                        "finding": finding,
                        "remediation": {
                            "recommended_fix": finding.get("recommendation", ""),
                            "why_this_works": "The recommended remediation addresses the root cause of the vulnerability and reduces the risk of exploitation.",
                            "additional_recommendations": [],
                            "implementation_steps": [],
                            "confidence": 95
                        }
                    }
    return {
        "error": "Finding not found"
    }
    
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
        os.path.join(BASE_DIR, "index.html")
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


