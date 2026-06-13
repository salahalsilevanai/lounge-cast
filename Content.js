let videoElement = null;
let isIncomingSyncAction = false; // Prevents infinite reflection loops

let isSyncing = false;

function check_video() {
  videoElement = document.querySelector("video");
  if (!videoElement) {
    setTimeout(check_video, 500);
  } else {
    console.log("Video element found!");
    setupVideoSyncListeners();
  }
}
check_video();

// --- 3. CHAT & DOM UI SETUP ---
const body = document.querySelector("body");
body.style.width = "calc(100vw - 320px)";

const div = document.createElement("div");
// Fixed: Swapped focus to tracking event capturing to ensure inputs take keystrokes cleanly

div.addEventListener(
  "keydown" || "keyup" || "keypress",
  (e) => {
    if (e.key !== "Enter") {
      e.stopPropagation();
    }
  },
  true,
);

div.style.zIndex = "1000";
div.style.backgroundColor = "rgba(30, 30, 30, 0.95)"; // Made it darker so chat text pops nicely
div.style.height = "100vh";
div.style.width = "320px";
div.style.position = "fixed";
div.style.top = "0";
div.style.right = "0";
body.appendChild(div);

const chat = document.createElement("div");
chat.style.height = "calc(100vh - 100px)";
chat.style.width = "100%";
chat.style.overflowY = "scroll";
chat.style.padding = "10px";
chat.style.boxSizing = "border-box";

// Add these lines to make it a flex container:
chat.style.display = "flex";
chat.style.flexDirection = "column";
chat.style.gap = "10px"; // Adds space between messages automatically
div.appendChild(chat);

const h1 = document.createElement("h1");
h1.innerText = "Watch Party Chat";
h1.style.color = "#FAFAFA";
h1.style.textAlign = "center";
h1.style.fontSize = "20px";
chat.appendChild(h1);

const input = document.createElement("input");
input.type = "text";
input.style.width = "calc(100% - 20px)";
input.style.height = "40px";
input.style.fontSize = "14px";
input.style.padding = "10px";
input.style.boxSizing = "border-box";
input.style.margin = "0 10px";
input.style.borderRadius = "15px";
input.style.border = "none";
input.placeholder = "Type your message here...";
input.style.marginBottom = "10px";
input.style.outline = "none";
div.appendChild(input);

const send = document.createElement("button");
send.innerText = "Send";
send.style.width = "calc(100% - 20px)";
send.style.height = "40px";
send.style.fontSize = "14px";
send.style.padding = "10px";
send.style.boxSizing = "border-box";
send.style.margin = "0 10px";
send.style.borderRadius = "15px";
send.style.border = "none";
send.style.backgroundColor = "#075E54";
send.style.color = "#FAFAFA";
send.style.cursor = "pointer";
div.appendChild(send);

send.addEventListener("click", () => {
  const message = input.value;
  if (message) {
    display_message(message, "user");
    send_message(message);
    input.value = "";
  }
});
input.addEventListener(
  "keydown" || "keypress" || "keyup",
  (e) => {
    if (e.key === "Enter") send.click();
  },
  true,
);

function display_message(message_text, sender = "user") {
  const message = document.createElement("div");

  const user = document.createElement("p");
  const text = document.createElement("p");
  text.innerText = message_text;
  if (sender === "user") {
    user.style.fontSize = "12px";
    user.style.fontWeight = "bold";
    user.style.alignSelf = "flex-end";
    user.innerHTML = "<p>you</p>";
    message.appendChild(user);
    message.appendChild(text);
  } else {
    user.style.fontSize = "12px";
    user.style.color = "black";
    user.style.fontWeight = "bold";
    user.style.alignSelf = "flex-start";
    user.innerHTML = "<p>Guest</p>";
    message.appendChild(user);
    message.appendChild(text);
  }

  message.style.padding = "10px 14px";
  message.style.fontSize = "14px";
  message.style.borderRadius = "15px";
  message.style.width = "fit-content";
  message.style.maxWidth = "80%";
  message.style.display = "flex";
  message.style.flexDirection = "column";
  message.style.gap = "0px";

  if (sender === "user") {
    message.style.alignSelf = "flex-end";
    message.style.backgroundColor = "#075E54";
    message.style.color = "#FAFAFA";
  } else {
    message.style.alignSelf = "flex-start";
    message.style.backgroundColor = "#FAFAFA";
    message.style.color = "#000000";
  }

  text.style.wordWrap = "break-word";

  chat.appendChild(message);

  // This will now work perfectly because flex elements have real heights!
  chat.scrollTop = chat.scrollHeight;
}

// --- 4. GLOBAL PAGE HOTKEYS (Only fire if not typing inside chat input) ---
document.addEventListener("keydown", function (event) {
  if (!videoElement || document.activeElement === input) return;

  if (event.key === "p") videoElement.pause();
  if (event.key === "s") videoElement.play();
  if (event.key === "r") videoElement.currentTime = 0;
});

// --- 1. LOCAL EVENT LISTENERS (Sent outward to peers) ---
function setupVideoSyncListeners() {
  if (!videoElement) return;

  videoElement.addEventListener("play", () => {
    if (isSyncing) return; // Block outgoing socket message if triggered by a peer action
    chrome.runtime.sendMessage({
      type: "VIDEO_PLAY",
      time: videoElement.currentTime,
    });
    display_message(
      "Playing at " +
        Math.round(videoElement.currentTime / 60) +
        ":" +
        Math.round(videoElement.currentTime % 60),
      "user",
    );
  });

  videoElement.addEventListener("pause", () => {
    if (isSyncing) return;
    chrome.runtime.sendMessage({
      type: "VIDEO_PAUSE",
      time: videoElement.currentTime,
    });
    display_message(
      "Paused at " +
        Math.round(videoElement.currentTime / 60) +
        ":" +
        Math.round(videoElement.currentTime % 60),
      "user",
    );
  });

  videoElement.addEventListener("seeking", () => {
    if (isSyncing) return;
    chrome.runtime.sendMessage({
      type: "VIDEO_SEEK",
      time: videoElement.currentTime,
    });
    display_message(
      "Seeking to " +
        Math.round(videoElement.currentTime / 60) +
        ":" +
        Math.round(videoElement.currentTime % 60),
      "user",
    );
  });
}

// --- 2. INBOUND SYNC ACTIONS (Received from server) ---
chrome.runtime.onMessage.addListener((packet) => {
  if (!videoElement) return;

  // Turn on block lock so our local listeners don't echo back to the socket server
  isSyncing = true;

  switch (packet.type) {
    case "ROOM_INITIAL_SYNC":
      videoElement.currentTime = packet.state.currentTime;
      if (packet.state.isPlaying) {
        videoElement
          .play()
          .catch(() =>
            console.log("Interact with the page to allow audio auto-play"),
          );
      } else {
        videoElement.pause();
      }
      break;

    case "VIDEO_PLAY":
      // If client is more than 1.5s out of sync, snap them to the exact peer time
      //if (Math.abs(videoElement.currentTime - packet.time) > 1.5) {
      videoElement.currentTime = packet.time;
      display_message(
        "Played at " +
          Math.round(packet.time / 60) +
          ":" +
          Math.round(packet.time % 60),
        "other",
      );
      //}
      videoElement.play().catch(() => {});
      break;

    case "VIDEO_PAUSE":
      videoElement.currentTime = packet.time;
      videoElement.pause();
      display_message(
        "Paused at " +
          Math.round(packet.time / 60) +
          ":" +
          Math.round(packet.time % 60),
        "other",
      );
      break;

    case "VIDEO_SEEK":
      videoElement.currentTime = packet.time;
      display_message(
        "Seeked to " +
          Math.round(packet.time / 60) +
          ":" +
          Math.round(packet.time % 60),
        "other",
      );
      break;

    case "CHAT_MSG":
      display_message(packet.text, "other");
      break;
  }

  // Release lock safely once DOM/media rendering engines settle down
  setTimeout(() => {
    isSyncing = false;
  }, 100);
});

chrome.runtime.onMessage.addListener((packet) => {
  if (packet.type === "NAME") {
    display_message(packet.text + " joined the room", "user", true);
    send_message(packet.text + " joined the room");
  }
});

chrome.runtime.onMessage.addListener((packet) => {
  if (packet.type === "REFRESH") {
    location.reload();
  }
});

function send_message(message) {
  chrome.runtime.sendMessage({
    type: "CHAT_MSG",
    text: message,
  });
}
