let videoElement = null;
let isIncomingSyncAction = false; // Prevents infinite reflection loops

let isSyncing = false;

// ---- find the video element ----
function check_video() {
  videoElement = document.querySelector("video");
  if (!videoElement) {
    setTimeout(check_video, 500);
  } else {
    console.log("Video element found!");
    // ----------------------------- recheck this function
    setupVideoSyncListeners();
  }
}
check_video();

// ---- move over the body element ----
const body = document.querySelector("body");
body.style.width = "calc(100vw - 320px)";

// ---- create the main container ----
const div = document.createElement("div");
div.classList.add("main-container");
body.appendChild(div);

// ---- create the chat container ----
const chat = document.createElement("div");
chat.classList.add("chat-container");
div.appendChild(chat);

// ---- create the header ----
const h1 = document.createElement("h1");
h1.innerText = "Watch Party Chat";
h1.classList.add("header");
chat.appendChild(h1);

// ---- create the input field ----
const input = document.createElement("input");
input.type = "text";
input.placeholder = "Type your message here...";
input.classList.add("input");
div.appendChild(input);

// ---- create the send button ----
const send = document.createElement("button");
send.innerText = "Send";
send.classList.add("send");
div.appendChild(send);

// ---- make the Enter key funtional in the input field ----
div.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Enter") {
      e.stopPropagation();
    }
  },
  true,
);

// --------------------- check later

let username = "Anonymous";

// ---- send the message when the send button is clicked ----
send.addEventListener("click", () => {
  const message = input.value;
  if (message) {
    display_message(message, username);
    send_message(message);
    input.value = "";
  }
});

// ---- send the message when the Enter key is pressed ----
input.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Enter") {
      send.click();
    }
  },
  true,
);

// ----------------------------------- re write the message function

// ---- display the message (dynamic) ----
function display_message(message_text, sender) {
  const message_user = document.createElement("p");
  const message = document.createElement("div");
  const message_text = document.createElement("p");

  message.classList.add("message");

  text.innerText = message_text;
  text.classList.add("message-text");

  if (sender === username) {
    user.classList.add("message-username", "sender");
    message.classList.add("sender-message");
    user.innerHTML = username;

    // if last element in chat is user message, don't append username
    if (chat.children[chat.children.length - 1].id === username) {
      message.appendChild(text);
      message.id = username;
    } else {
      message.appendChild(user);
      message.appendChild(text);
      message.id = username;
    }
  } else {
    user.classList.add("message-username", "receiver");
    user.innerHTML = guest;
    message.classList.add("receiver-message");

    if (chat.children[chat.children.length - 1].id === guest) {
      message.appendChild(text);
      message.id = guest;
    } else {
      message.appendChild(user);
      message.appendChild(text);
      message.id = guest;
    }
  }

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
  if (event.key === "l") videoElement.currentTime += 10;
  if (event.key === "j") videoElement.currentTime -= 10;
});

// -------------------------------------- check it later
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
      username,
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
      username,
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
      username,
    );
  });
}

// -------------------------------------- check it later
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
      display_message(packet.text, packet.name);
      break;
  }

  // Release lock safely once DOM/media rendering engines settle down
  setTimeout(() => {
    isSyncing = false;
  }, 100);
});

function send_message(message) {
  chrome.runtime.sendMessage({
    type: "CHAT_MSG",
    text: message,
  });
}

// chrome.runtime.onMessage.addListener((packet) => {
//   if (packet.type === "CREATE-ROOM") {
//     display_message("Room ID: " + packet.room, "user", true);
//     chrome.runtime.sendMessage({
//       type: "CREATE-JOIN",
//       name: packet.name,
//       room: packet.room,
//     });
//   }
// });

chrome.runtime.onMessage.addListener((packet) => {
  if (packet.type === "JOIN") {
    display_message(packet.name + " joined room: " + packet.room, username);
    chrome.runtime.sendMessage({
      type: "JOIN",
      name: packet.name,
      room: packet.room,
    });
  }

  if (packet.type === "LEAVE") {
    display_message("You left " + packet.room, username);
    chrome.runtime.sendMessage({
      type: "LEAVE",
    });
  }
});
