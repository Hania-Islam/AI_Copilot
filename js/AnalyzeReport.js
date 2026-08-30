applySavedTheme()
const searchbar = document.getElementById("searchbar");
if (searchbar) {
    searchbar.addEventListener("input", () => {
        const searchText = searchbar.value.toLowerCase().trim();
        const uploadRows = document.querySelectorAll(".upload-row");

        uploadRows.forEach((row) => {
            const rowText = row.textContent.toLowerCase();

            if (rowText.includes(searchText)) {
                row.classList.remove("hidden");
            } else {
                row.classList.add("hidden");
            }
        });
    });
}
const chooseFile=document.getElementById("file")
const fileInput=document.getElementById("fileInput")
const selectedfile=document.getElementById("selectedFile")
const selectedFileName=document.getElementById("selectedFileName")
const selectedFileSize=document.getElementById("selectedFileSize")
const removeFile=document.getElementById("removeFile")
const fileError = document.getElementById("fileError")
function processFile(file) {
    console.log("Selected:",file.name)
    // File name
    selectedFileName.innerText=file.name
    selectedFileName.classList.remove("hidden")
    selectedfile.classList.remove("hidden")

    // File size
    if(file.size<=1024) {
        selectedFileSize.innerText=file.size+"B"
    } else if(file.size<=1024**2) {
        let convertSize = file.size / 1024
         selectedFileSize.innerText=convertSize.toFixed(2)+"KB"
    } else if(file.size<=1024**3)  {
        let convertSize = file.size / (1024 ** 2)
         selectedFileSize.innerText=convertSize.toFixed(2)+"MB"
    }else{
        let convertSize = file.size / (1024 ** 3)
         selectedFileSize.innerText=convertSize.toFixed(2)+"GB"
    }

    // File validation
    let ext=file.name.split(".")
        let allowedExtension=["pdf", "json", "txt", "csv"]
        let extension = ext[ext.length - 1].toLowerCase()
        if (allowedExtension.includes(extension) && file.size<=50*(1024**2)) {
            console.log("Valid file");
            fileError.classList.add("hidden")
        } else {
            fileError.classList.remove("hidden")
                fileError.innerText = "Invalid file. Please select a PDF, JSON, TXT, or CSV file under 50MB."
                selectedFileName.classList.add("hidden")
        selectedfile.classList.add("hidden")
        }
}
if(chooseFile) {
    chooseFile.addEventListener("click",()=>{
        fileInput.click()
    })
    fileInput.addEventListener("change",()=>{
        let selected=fileInput.files[0]
        if(selected) {
            console.log("1. FILE SELECTED:", selected.name);
            processFile(selected)
            console.log("2. PROCESS FILE FINISHED");
            const formData=new FormData()
            formData.append("file",selected)
            console.log("3. ABOUT TO SEND TO FASTAPI");
            //post to fastAPI
            console.log("BEFORE FETCH");
            const uploadUrl = window.getApiUrl ? window.getApiUrl('/upload') : '/upload';
            fetch(uploadUrl, {
                method:'POST',
                body:formData
            })
            //fastAPI returns json
            .then(response=> {
                console.log("4. BACKEND STATUS:", response.status);
                if (!response.ok) {
                    throw new Error("Upload failed");
                }
                return response.json()
            })
            .then(data=>{
                console.log("NEW UPLOAD RESPONSE");
                console.log("DATA:", data);

                console.log("FastAPI response:",data)
                console.log("FINDINGS FROM BACKEND:", data.findings);
                console.log("UPLOAD TIME:", data.upload_time);
                const recentUploads = document.getElementById("recentUploads");
                if (recentUploads) {
                    const row = document.createElement("div");
                    row.className ="upload-row grid grid-cols-[2fr_1fr_1.5fr_1fr_0.5fr] items-center px-5 py-3 border-b border-slate-200 dark:border-slate-800";
                    row.innerHTML = 
                    `<div class="flex items-center gap-2 min-w-0">
                    <i data-lucide="file-text"
                   class="w-4 h-4 text-blue-400 shrink-0"></i>
                <span class="text-slate-800 dark:text-white/80 text-xs truncate">
                    ${data.filename}
                </span>
            </div>
                 
            <span class="text-slate-600 dark:text-slate-400 text-xs">
                ${data.file_type}
            </span>

            <span class="text-slate-600 dark:text-slate-400 text-xs">
                ${data.upload_time}
            </span>

            <span class="px-2 py-1 w-fit rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                ${data.status}
            </span>

            <span class="text-slate-800 dark:text-white/80 text-xs">
                ${data.findings_count}
            </span>
        `;
        recentUploads.prepend(row);
        while (recentUploads.children.length > 5) {
            recentUploads.removeChild(recentUploads.lastElementChild);
        }
        lucide.createIcons();
    }
})
            .catch(error=>{
                console.log("Upload error:",error)
            })
            console.log("AFTER FETCH STARTED");
        }
})

    removeFile.addEventListener("click", () => {
    fileInput.value = ""
    selectedFileName.classList.add("hidden")
    selectedfile.classList.add("hidden")
    selectedFileSize.classList.add("hidden")
    fileError.classList.add("hidden")
})
}


const dropArea = document.getElementById("upldBox");
if (dropArea && fileInput) {
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    });
    ["dragenter", "dragover"].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.style.borderColor =
                "rgb(59, 130, 246)";
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.style.borderColor = "";
        });
    });

    dropArea.addEventListener("drop", async (event) => {
        console.log("DROP EVENT FIRED");
        const files = event.dataTransfer.files;
        console.log("FILES:", files);
        if (!files || files.length === 0) {
            console.log("NO FILE FOUND");
            return;
        }
        const firstfile = files[0];
        console.log("DROPPED FILE:",firstfile.name);
        // Put dropped file into file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(firstfile);
        fileInput.files = dataTransfer.files;
        // Display + validate
        processFile(firstfile);
        // Upload
        const formData = new FormData();
        formData.append("file", firstfile);
        console.log("SENDING DROPPED FILE TO BACKEND...");
        try {
            const uploadUrl = window.getApiUrl ? window.getApiUrl('/upload') : '/upload';
            const response = await fetch(uploadUrl,{
                    method: "POST",
                    body: formData
                }
            );
            console.log("DROP UPLOAD STATUS:",response.status);
            if (!response.ok) {
                throw new Error(
                    "Upload failed: " +
                    response.status
                );
            }
            const data = await response.json();
            console.log("DROP UPLOAD RESPONSE:",data);
            console.log("FINDINGS FROM BACKEND:",data.findings)
        } catch (error) {
            console.error(
                "DROP UPLOAD ERROR:",
                error
            );
        }
    });
}


const viewAllFindings = document.getElementById("viewAllFindings");
if (viewAllFindings) {
    viewAllFindings.addEventListener("click", () => {
        window.location.href = "History.html";
    });
}
const documentationBtn = document.getElementById("document");

if (documentationBtn) {
    documentationBtn.addEventListener("click", () => {
        window.location.href = "Documentation.html";
    });
}

// Load recent uploads when the page opens

async function loadRecentUploads() {
    const recentUploads = document.getElementById("recentUploads");
    if (!recentUploads) {
        return;
    }
    try {
        const historyUrl = window.getApiUrl ? window.getApiUrl('/upload-history') : '/upload-history';
        const response = await fetch(historyUrl);
        if (!response.ok) {
            throw new Error("Failed to load upload history");
        }
        const data = await response.json();
        console.log("UPLOAD HISTORY:", data);
        // Clear existing rows
        recentUploads.innerHTML = "";
        // Only show the 5 most recent uploads
        const recentFiles = data.uploads.slice(0, 5);
        recentFiles.forEach(upload => {
            const row = document.createElement("div");
            row.className =
                "upload-row grid grid-cols-[2fr_1fr_1.5fr_1fr_0.5fr] items-center px-5 py-3 border-b border-slate-200 dark:border-slate-800";

            row.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">

                    <i data-lucide="file-text"
                       class="w-4 h-4 text-blue-400 shrink-0"></i>

                    <span class="text-slate-800 dark:text-white/80 text-xs truncate">
                        ${upload.filename}
                    </span>
                </div>

                <span class="text-slate-600 dark:text-slate-400 text-xs">
                    ${upload.file_type}
                </span>

                <span class="text-slate-600 dark:text-slate-400 text-xs">
                    ${upload.upload_time}
                </span>

                <span class="px-2 py-1 w-fit rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                    ${upload.status}
                </span>

                <span class="text-slate-800 dark:text-white/80 text-xs">
                    ${upload.findings_count}
                </span>
            `;
            recentUploads.appendChild(row);
        });
        lucide.createIcons();
    } catch (error) {
        console.error("HISTORY LOAD ERROR:", error);
    }
}
// Load history when page opens
loadRecentUploads();


