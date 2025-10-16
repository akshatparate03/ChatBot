const messagesContainer = document.getElementById("messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const loginModal = document.getElementById("login-modal");
const loginForm = document.getElementById("login-form");
const authBtn = document.getElementById("auth-btn");
const userSection = document.getElementById("user-section");
const userAvatar = document.getElementById("user-avatar");
const userName = document.getElementById("user-name");
const newChatBtn = document.getElementById("new-chat-btn");

let isFirstMessage = true;

// Create animated stars
function createStars() {
  const starsContainer = document.getElementById("stars-container");
  const numberOfStars = 500;

  for (let i = 0; i < numberOfStars; i++) {
    const star = document.createElement("div");
    star.className = "star";

    const size = Math.random() * 2 + 1;
    star.style.width = size + "px";
    star.style.height = size + "px";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.animationDelay = Math.random() * 3 + "s";
    star.style.animationDuration = Math.random() * 2 + 2 + "s";

    starsContainer.appendChild(star);
  }
}

// Show error messages
function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.innerText = message;
  errorDiv.style.display = "block";
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 3000);
}

// === Save message to localStorage ===
function saveMessageToHistory(text, sender) {
  let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
  history.push({ text, sender, timestamp: Date.now() });
  localStorage.setItem("chatHistory", JSON.stringify(history));
}

// === Append a new message with optional typing animation (for bot) ===
function appendMessage(text, sender, typing = false) {
  if (isFirstMessage) {
    messagesContainer.innerHTML = "";
    isFirstMessage = false;
  }

  const msgWrapper = document.createElement("div");
  msgWrapper.classList.add("message", sender);

  const avatar = document.createElement("img");
  avatar.classList.add("message-avatar");
  avatar.src = sender === "user" ? "assets/User.png" : "assets/Bot.png";
  avatar.alt = sender === "user" ? "User" : "Bot";

  const content = document.createElement("div");
  content.classList.add("message-content");

  msgWrapper.appendChild(avatar);
  msgWrapper.appendChild(content);
  messagesContainer.appendChild(msgWrapper);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Typing animation for bot
  if (sender === "bot" && typing) {
    let index = 0;
    const speed = 20; // ms per character
    const interval = setInterval(() => {
      content.innerText = text.substring(0, index++);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      if (index > text.length) clearInterval(interval);
    }, speed);
  } else {
    content.innerText = text;
  }

  return msgWrapper;
}

// === Append typing indicator (for bot) ===
function appendTyping() {
  const msgWrapper = document.createElement("div");
  msgWrapper.classList.add("message", "bot");

  const avatar = document.createElement("img");
  avatar.classList.add("message-avatar");
  avatar.src = "assets/Bot.png";
  avatar.alt = "Bot";

  const content = document.createElement("div");
  content.classList.add("message-content");
  content.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;

  msgWrapper.appendChild(avatar);
  msgWrapper.appendChild(content);
  messagesContainer.appendChild(msgWrapper);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return msgWrapper;
}

// === Send message to backend and display response with typing animation ===
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  saveMessageToHistory(text, "user");
  userInput.value = "";

  const typingIndicator = appendTyping();

  try {
    const history = JSON.parse(localStorage.getItem("chatHistory")) || [];

    // Backend ko send karne ke liye last 10 messages ka context
    const context = history.slice(-10);

    const response = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, context }),
    });

    const data = await response.json();
    typingIndicator.remove();

    if (!data.reply) {
      appendMessage("⚠️ No reply from server.", "bot");
      saveMessageToHistory("⚠️ No reply from server.", "bot");
      return;
    }

    appendMessage(data.reply, "bot", true);
    saveMessageToHistory(data.reply, "bot");
  } catch (err) {
    typingIndicator.remove();
    appendMessage("❌ Error connecting to server.", "bot");
    saveMessageToHistory("❌ Error connecting to server.", "bot");
    console.error(err);
  }
}

// === Load chat history on page load ===
window.onload = function () {
  createStars(); // background stars
  document.body.classList.add("dark-theme");

  const history = JSON.parse(localStorage.getItem("chatHistory")) || [];
  history.forEach((msg) => {
    appendMessage(msg.text, msg.sender);
  });
};

// === Event listeners for sending messages ===
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// === New Chat button functionality ===
newChatBtn.addEventListener("click", () => {
  // Clear chat history from localStorage
  localStorage.removeItem("chatHistory");

  // Reset to welcome message
  isFirstMessage = true;
  messagesContainer.innerHTML = `
    <div class="welcome-message">
      <h2>👋 Welcome!</h2>
      <p>Ask Anything, Get Perfect Solutions...</p>
    </div>
  `;

  // Clear input field
  userInput.value = "";

  // Optional: Show a brief notification
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = "✨ New chat started!";
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
});
