import { io } from "./imports/socket.io.esm.min.js";

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
  updateLive(true);
});

socket.on("message", function (data) {
  console.log("Received data:", data);
});

socket.on("disconnect", function (reason) {
  console.log("Disconnected:", reason);
  updateLive(false);
});

socket.on("connect_error", function (error) {
  console.error("Connection Error:", error);
  updateLive(false);
});

function updateLive(isLive) {
  let text = isLive ? "LIVE" : "Offline";
  chrome.storage.local.set({ isLive: isLive });
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

const tabRooms = new Map();

chrome.runtime.onMessage.addListener((message, sender) => {
  const tabId = sender.tab?.id;

  if (tabId) {
    if (message.type === "JOIN" && message.room) {
      tabRooms.set(tabId, message.room);
    } else if (message.type === "LEAVE") {
      tabRooms.delete(tabId);
    }
  }

  if (socket.connected) {
    socket.emit("watch_party_event", message);
  }
});

socket.on("watch_party_event", (packet) => {
  if (!packet.room) return;

  for (const [tabId, room] of tabRooms) {
    if (room === packet.room) {
      chrome.tabs.sendMessage(tabId, packet).catch(() => {
        tabRooms.delete(tabId);
      });
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabRooms.delete(tabId);
});

const heartbeats = new Map();

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "HEARTBEAT") {
    heartbeats.set(sender.tab.id, Date.now());
  }
});

// setInterval(async () => {
//   const now = Date.now();

//   for (const [tabId, lastSeen] of heartbeats) {
//     if (now - lastSeen > 30000) {
//       heartbeats.delete(tabId);
//     }
//   }

//   // If no tabs are still sending heartbeats,
//   // clear the saved room.
//   if (heartbeats.size === 0) {
//     await chrome.storage.local.remove("room");
//   }
// }, 5000);
