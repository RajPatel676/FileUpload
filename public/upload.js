async function uploadFiles() {
  const fileInput = document.getElementById("fileInput");
  const successMessage = document.getElementById("successMessage");
  const errorMessage = document.getElementById("errorMessage");

  const files = fileInput.files;
  if (files.length === 0) return;

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming token is stored in localStorage
      },
    });

    if (response.ok) {
      successMessage.style.display = "block";
      errorMessage.style.display = "none";
      fileInput.value = "";
      setTimeout(() => {
        successMessage.style.display = "none";
      }, 3000);
    } else {
      throw new Error("Upload failed");
    }
  } catch (error) {
    errorMessage.style.display = "block";
    successMessage.style.display = "none";
    setTimeout(() => {
      errorMessage.style.display = "none";
    }, 3000);
  }

}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in to access this page.");
    window.location.href = "/login.html";
  }
});


document.getElementById("logoutBtn").addEventListener("click", () => {
  // Clear user token from localStorage or cookies
  localStorage.removeItem("token"); // Assuming you store the token here
  localStorage.removeItem("user"); // Assuming you store the token here
  document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Redirect to login page or a logged-out screen
  window.location.href = "/login.html";
});