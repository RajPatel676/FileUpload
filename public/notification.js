// Add notification functions
function showError(message) {
  const notification = document.createElement("div");
  const messageContainer = document.getElementById("messageContainer");
  messageContainer.innerHTML = `<p style="color: red; margin-top: 10px;">${message}</p>`;
  notification.className = "notification error";
  notification.textContent = message;
  showNotification(notification);
}

function showSuccess(message) {
  const notification = document.createElement("div");
  notification.className = "notification success";

  const messageContainer = document.getElementById("messageContainer");
  messageContainer.innerHTML = `<p style="color: red; margin-top: 10px;">${message}</p>`;

  notification.textContent = messageContainer;
  showNotification(notification);
}

function showNotification(notification) {
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

const notificationstyles = `
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
`;
