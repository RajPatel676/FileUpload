async function loadFiles() {
  try {
    const response = await fetch("/api/files", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming token is stored in localStorage
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const files = await response.json();

    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";

    if (files.length === 0) {
      fileList.innerHTML = '<div class="no-files">No files uploaded yet</div>';
      return;
    }

    files.forEach((file) => {
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";

      fileItem.innerHTML = `
        <div class="file-info"  style=" background-color: white;
    padding: 16px;
    margin: 10px 0;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    display: inline-block;
    flex-direction: column;
    align-items: center;">
          <span>${escapeHtml(file.filename)}</span>
          <span>(${formatFileSize(file.size)})</span>
          <span class="file-date">${new Date(
        file.uploadDate
      ).toLocaleDateString()}</span>
        </div>
        <div class="file-actions"  style=" background-color: white;
    padding: 15px;
    margin:0;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    display: inline-block;
    align-items: center;
    flex-direction: column;">
          <button onclick="downloadFile('${file._id}', '${escapeHtml(
        file.filename
      )}')" 
                  class="download-btn" style="background-color: #4CAF50;padding: 6px 12px;
    margin-left: 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    display:"inline-block"
    margin-bottom:10px ;">Download</button>
          <button onclick="deleteFile('${file._id}')" 
                  class="delete-btn" style="background-color: #DB073D;padding: 6px 12px;
    margin-left: 8px;
    border-radius: 4px;
    border: none;
    display:"inline-block"
    cursor: pointer;">Delete</button>
        </div>
      `;

      fileList.appendChild(fileItem);
    });
  } catch (error) {
    console.error("Error loading files:", error);
    showError("Failed to load files. Please try again later.");
  }
}

// Show delete confiramaion message
// function showConfirmationDialog(message) {
//   return new Promise((resolve) => {
//     const modal = document.getElementById("confirmModal");
//     const confirmationMessage = document.getElementById("confirmationMessage");
//     confirmationMessage.textContent = message;
//     modal.style.display = "flex";

//     const confirmYes = document.getElementById("confirmYes");
//     const confirmNo = document.getElementById("confirmNo");

//     confirmYes.onclick = () => {
//       modal.style.display = "none";
//       resolve(true); // User confirmed
//     };

//     confirmNo.onclick = () => {
//       modal.style.display = "none";
//       resolve(false); // User canceled
//     };
//   });
// }

async function deleteFile(fileId) {
  if (!confirm("Are you sure you want to delete this file?")) return;
  // const confirm = await showConfirmationDialog("Are you sure you want to delete this file?");
  // if (!confirm) return;

  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete file");
    }

    await loadFiles(); // Reload the file list
    showSuccess("File deleted successfully");
  } catch (error) {
    console.error("Error deleting file:", error);
    showError("Failed to delete file. Please try again.");
  }
}

async function downloadFile(fileId, filename) {
  try {
    const response = await fetch(`/api/files/${fileId}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming token is stored in localStorage
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  } catch (error) {
    console.error("Error downloading file:", error);
    showError("Failed to download file. Please try again.");
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// async function loadFiles() {
//   const token = localStorage.getItem("token");
//   const response = await fetch("/api/files", {
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   if (response.status === 401) {
//     alert("Session expired. Please log in again.");
//     window.location.href = "/login2.html";
//     return;
//   }
//   // Add styles to document
// const styleSheet = document.createElement("style");
// styleSheet.textContent = styles;
// document.head.appendChild(styleSheet);
//   // Process file list...
// }
// Initialize
document.addEventListener("DOMContentLoaded", loadFiles);


// Add these CSS styles to your existing CSS file
const styles = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 4px;
    color: white;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  }

  .error {
    background-color: #ff4444;
  }

  .success {
    background-color: #4CAF50;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .file-item {
    background-color: white;
    padding: 16px;
    margin: 10px 0;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
  }

  .file-date {
    color: #666;
    font-size: 0.9em;
    margin-left: 12px;
  }

  .download-btn, .delete-btn {
    padding: 6px 12px;
    margin-left: 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
     animation: dode 1s ease-out;
  }
     @keyframes dode {
      0% {
        transform: translateY(-30px);
        opacity: 0;
      }

      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }

  .download-btn {
    background-color: #4CAF50;
    color: white;
  }

  .delete-btn {
    background-color: #ff4444;
    color: white;
  }
`;

