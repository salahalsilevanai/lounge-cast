import { io } from "./socket.io.esm.min.js";

// Force the client to ONLY use WebSockets, bypassing the faulty XHR polling phase
const socket = io("http://127.0.0.1:3000", {
  autoConnect: false,
  transports: ["websocket"], // <-- ADD THIS LINE
});

// The rest of your event listeners stay exactly the same:
socket.on("connect", function () {
  console.log("Connected to Socket.IO server!");
  updateBadge(true);
});

socket.on("message", function (data) {
  console.log("Received data:", data);
});

socket.on("disconnect", function (reason) {
  console.log("Disconnected:", reason);
  updateBadge(false);
});

socket.on("connect_error", function (error) {
  console.error("Connection Error:", error);
  updateBadge(false);
});

function updateBadge(isConnected) {
  if (isConnected) {
    chrome.action.setBadgeBackgroundColor({ color: "#00ff00" });
    chrome.action.setBadgeText({ text: "ON" });
  } else {
    chrome.action.setBadgeBackgroundColor({ color: "#ff0000" });
    chrome.action.setBadgeText({ text: "OFF" });
  }
}

chrome.action.onClicked.addListener(function () {
  if (!socket.connected) {
    console.log("Connecting...");
    socket.connect();
  } else {
    console.log("Disconnecting...");
    socket.disconnect();
  }
});

// 1. Listen for events coming from the server -> Send them to the active webpage
socket.on("watch_party_event", (packet) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, packet);
    }
  });
});

// 2. Listen for events coming from the webpage -> Broadcast them to the server
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (socket.connected) {
    socket.emit("watch_party_event", message);
  }
});

// Inside background.js
let partyTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Store the ID of the tab that is hosting the watch party
  if (sender.tab && sender.tab.id) {
    partyTabId = sender.tab.id;
  }

  if (socket && socket.connected) {
    socket.emit("watch_party_event", message);
  }
});

socket.on("watch_party_event", (packet) => {
  // Directly target the stored tab ID instead of guessing with chrome.tabs.query
  if (partyTabId) {
    chrome.tabs.sendMessage(partyTabId, packet);
  }
});
