async function loadFiles() {
  try {
    const response = await fetch("/api/files");
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
        <div class="file-info">
          <span>${escapeHtml(file.filename)}</span>
          <span>(${formatFileSize(file.size)})</span>
          <span class="file-date">${new Date(
            file.uploadDate
          ).toLocaleDateString()}</span>
        </div>
        <div class="file-actions">
          <button onclick="downloadFile('${file._id}', '${escapeHtml(
        file.filename
      )}')" 
                  class="download-btn">Download</button>
          <button onclick="deleteFile('${file._id}')" 
                  class="delete-btn">Delete</button>
        </div>
      `;

      fileList.appendChild(fileItem);
    });
  } catch (error) {
    console.error("Error loading files:", error);
    showError("Failed to load files. Please try again later.");
  }
}

async function deleteFile(fileId) {
  if (!confirm("Are you sure you want to delete this file?")) return;

  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: "DELETE",
      headers: {
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
    const response = await fetch(`/api/files/${fileId}/download`);

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

// Add notification functions
function showError(message) {
  const notification = document.createElement("div");
  notification.className = "notification error";
  notification.textContent = message;
  showNotification(notification);
}

function showSuccess(message) {
  const notification = document.createElement("div");
  notification.className = "notification success";
  notification.textContent = message;
  showNotification(notification);
}

function showNotification(notification) {
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

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
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
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

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Initialize
document.addEventListener("DOMContentLoaded", loadFiles);
