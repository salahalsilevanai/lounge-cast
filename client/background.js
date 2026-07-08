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
socket.on("connect", async function () {
  console.log("Connected to Socket.IO server!");
  updateLive(true);
  await rebuildTabRooms();
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

// debugged the following section using claude.ai
const tabRooms = new Map();

// After the background service worker gets killed and restarts (or after
// any reconnect), tabRooms is empty and the server has forgotten our old
// socket.id entirely -- but the content scripts don't know any of that
// happened, since they live in the tab and were never torn down. This
// asks every open tab what room (if any) it thinks it's still in, then
// re-sends JOIN for each one so both sides agree again.
async function rebuildTabRooms() {
  tabRooms.clear();
  const tabs = await chrome.tabs.query({});

  await Promise.all(
    tabs.map(
      (tab) =>
        new Promise((resolve) => {
          if (!tab.id) return resolve();

          chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" }, (response) => {
            // chrome.runtime.lastError fires when there's no content
            // script on this tab (e.g. a chrome:// page) -- nothing to
            // recover there, so just move on.
            if (chrome.runtime.lastError || !response || !response.room) {
              return resolve();
            }

            tabRooms.set(tab.id, response.room);
            socket.emit("watch_party_event", {
              type: "JOIN",
              name: response.username,
              room: response.room,
              url: tab.url,
            });
            resolve();
          });
        }),
    ),
  );

  console.log(
    `Rebuilt tabRooms after (re)connect: ${tabRooms.size} tab(s) rejoined`,
  );
}

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

socket.on("disconnect", () => {
  tabRooms.clear();
});

// end of debugged section

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
