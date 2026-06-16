import { io } from "./socket.io.esm.min.js";

// Force the client to ONLY use WebSockets, bypassing the faulty XHR polling phase
// const socket = io("http://127.0.0.1:3000", {
//   autoConnect: false,
//   transports: ["websocket"], // <-- ADD THIS LINE
// });

const socket = io("https://osntogetherextention.alsilevanai.com/", {
  autoConnect: true,
  transports: ["websocket"],
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

let activePartyTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.tab?.id) {
    activePartyTabId = sender.tab.id;
  }
  if (socket.connected) {
    socket.emit("watch_party_event", message);
  }
});

socket.on("watch_party_event", (packet) => {
  if (activePartyTabId) {
    chrome.tabs.sendMessage(activePartyTabId, packet);
  }
});

// chrome.runtime.onMessage.addListener((packet) => {
//   if (packet.type === "JOIN") {
//     socket.emit("join-room", packet.room);
//     socket.emit("watch_party_event", { type: "JOIN", room: packet.room });
//   } else if (packet.type === "LEAVE") {
//     socket.emit("leave-room", packet.room);
//   }
// });
