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
