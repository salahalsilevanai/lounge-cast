let currentVideoId = null;
let videoElement = null;
let isSyncing = false;
let username = null;
let room = null;

join_with_saved();

let URL = window.location.href;
let TMPURL = URL;

// this function generates a random username
function generate_username() {
  let result = "user_";
  for (let i = 0; i < 6; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

async function getUsername() {
  username = await chrome.storage.local
    .get({ username: generate_username() })
    .then((result) => {
      return result.username;
    });
}
getUsername();

// ---- find the video element ----
function check_video() {
  //const ytPlayer = document.getElementById("movie_player");
  const currentVideo = document.querySelector("video");

  if (!currentVideo) {
    videoElement = null;
    return;
  }

  if (!currentVideo.dataset.partyId) {
    console.log("New video found!");

    currentVideoId = "vid_" + Math.random().toString(36).substr(2, 9);
    currentVideo.dataset.partyId = currentVideoId;
    videoElement = currentVideo;

    setupVideoSyncListeners(currentVideo, currentVideoId);
  }
}

// every 1 second, check for the video element
check_video();
setInterval(check_video, 1000);

setInterval(() => {
  URL = window.location.href;
  if (TMPURL !== URL) {
    TMPURL = URL;
    display_message("User started next episode", username, "outbound");
    sendUrlUpstream(URL);
    check_video();
  }
}, 1000);

function sendUrlUpstream(URL) {
  chrome.runtime.sendMessage({
    type: "VIDEO_URL_CHANGE",
    url: URL,
    name: username,
    room: room,
  });
}

// ---- move over the body element ----
const body = document.querySelector("body");
//body.style.width = "calc(100vw - 320px)";

// ---- create the main container ----
const div = document.createElement("div");
div.classList.add("main-container");
body.appendChild(div);
div.classList.add("hidden");

// ---- create the chat container ----
const chat = document.createElement("div");
chat.classList.add("chat-container");
div.appendChild(chat);

// ---- create the header ----
const h1 = document.createElement("h1");
h1.innerText = "Lounge Cast Chat";
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

// ---- send the message when the send button is clicked ----
send.addEventListener("click", () => {
  const message = input.value;
  if (message) {
    display_message(message, username, "outbound");
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
// ---- display the message (dynamic) --اد--
// Ensure this variable matches what you compare against!

// ---- display the message (dynamic) ----
function display_message(message_text, sender, type) {
  // 1. Create elements
  const messageContainer = document.createElement("div");
  const messageUser = document.createElement("p");
  const textElement = document.createElement("p");

  messageContainer.classList.add("message");
  textElement.classList.add("message-text");
  messageUser.classList.add("message-username");

  // 2. Assign content
  textElement.innerText = message_text;
  messageUser.innerText = sender;

  // 3. Determine message styling layout based on sender
  if (type === "outbound") {
    // Sent by current user
    messageContainer.classList.add("sender-message");
    messageUser.classList.add("sender");
  } else {
    // Sent by a peer/guest
    messageContainer.classList.add("receiver-message");
    messageUser.classList.add("receiver");
  }

  // 4. Clean up structure: group tracking id on container element
  //if (chat.lastElementChild.firstChild.innerHTML !== sender) {
  messageContainer.appendChild(messageUser);
  //} // Only show username if it's a different sender

  messageContainer.appendChild(textElement);

  chat.appendChild(messageContainer);
  // 6. Smooth scroll to the bottom
  chat.scrollTop = chat.scrollHeight;
}

// --- 4. GLOBAL PAGE HOTKEYS (Only fire if not typing inside chat input) ---
document.addEventListener("keydown", function (event) {
  if (!videoElement || document.activeElement === input) return;

  if (event.key === "p") videoElement.pause();
  if (event.key === "s") videoElement.play();
  if (event.key === "r") videoElement.currentTime = 0;
  if (event.key === "l") {
    videoElement.currentTime += 10;
  }
  if (event.key === "j") {
    videoElement.currentTime -= 10;
  }
});

// -------------------------------------- check it later
// --- 1. LOCAL EVENT LISTENERS (Sent outward to peers) ---
function setupVideoSyncListeners(targetVideo, assignedId) {
  if (!targetVideo) return;

  targetVideo.addEventListener("play", () => {
    if (assignedId != currentVideoId) return;
    if (isSyncing || !room) return; // Block outgoing socket message if triggered by a peer action

    chrome.runtime.sendMessage({
      type: "VIDEO_PLAY",
      time: targetVideo.currentTime,
      name: username,
      room: room,
    });

    display_message(
      "Playing at " + format_time(targetVideo.currentTime),
      username,
      "outbound",
    );
  });

  targetVideo.addEventListener("pause", () => {
    if (assignedId != currentVideoId) return;
    if (isSyncing || !room) return;
    chrome.runtime.sendMessage({
      type: "VIDEO_PAUSE",
      time: targetVideo.currentTime,
      name: username,
      room: room,
    });
    display_message(
      "Paused at " + format_time(targetVideo.currentTime),
      username,
      "outbound",
    );
  });

  targetVideo.addEventListener("seeking", () => {
    if (assignedId != currentVideoId) return;
    if (isSyncing || !room) return;
    chrome.runtime.sendMessage({
      type: "VIDEO_SEEK",
      time: targetVideo.currentTime,
      name: username,
      room: room,
    });
    display_message(
      "Seeking to " + format_time(targetVideo.currentTime),
      username,
      "outbound",
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
      if (!room) return;

      videoElement.currentTime = packet.time;
      display_message("Played at " + format_time(packet.time), packet.name);
      //}
      videoElement.play().catch(() => {});
      break;

    case "VIDEO_PAUSE":
      if (!room) return;
      videoElement.currentTime = packet.time;
      videoElement.pause();
      display_message("Paused at " + format_time(packet.time), packet.name);
      break;

    case "VIDEO_SEEK":
      if (!room) return;
      videoElement.currentTime = packet.time;
      display_message("Seeked to " + format_time(packet.time), packet.name);
      break;

    case "VIDEO_URL_CHANGE":
      if (!room) return;
      window.location.href = packet.url;
      join_with_saved();

      display_message("Navigated to " + packet.url, packet.name);
      break;
    case "CHAT_MSG":
      display_message(packet.text, packet.name, "inbound");
      break;
  }

  // Release lock safely once DOM/media rendering engines settle down
  setTimeout(() => {
    isSyncing = false;
  }, 100);
});
async function refreshUsername() {
  const result = await chrome.storage.local.get({
    username: generate_username(),
  });
  return result.username;
}

async function join_with_saved() {
  await refreshUsername().then((fetchedUsername) => {
    username = fetchedUsername;
  });

  await chrome.storage.local.get("room").then((data) => {
    if (data.room === undefined || data.room === null || data.room === "") {
      return;
    } else if (data.room) {
      room = data.room;
      check_room();
      chrome.runtime.sendMessage({
        type: "JOIN",
        name: username,
        room: room,
      });
    }
  });
}
function send_message(message) {
  chrome.runtime.sendMessage({
    type: "CHAT_MSG",
    text: message,
    name: username,
    room: room,
  });
}

chrome.runtime.onMessage.addListener((packet) => {
  if (packet.type === "JOIN") {
    display_message(
      packet.name + " joined room: " + packet.room,
      username,
      "outbound",
    );
    room = packet.room;
    // save username and room to localstorage
    chrome.storage.local.set({ username: packet.name, room: packet.room });
    check_room();
    chrome.runtime.sendMessage({
      type: "JOIN",
      name: packet.name,
      room: packet.room,
    });
  }

  if (packet.type === "LEAVE") {
    display_message("You left " + packet.room, username, "outbound");

    chrome.runtime.sendMessage({
      type: "LEAVE",
      room: packet.room,
    });
    removeRoom();
    check_room();
  }
});

async function removeRoom() {
  room = null;
  await chrome.storage.local.remove("room");
}

chrome.runtime.onMessage.addListener(async (packet) => {
  if (packet.type === "CHANGE-NAME") {
    const tmpusr = username;
    await chrome.storage.local.set({ username: packet.name });
    username = packet.name;
    display_message(
      "You changed your name to: " + packet.name,
      username,
      "outbound",
    );

    send_message(tmpusr + " changed their name to: " + username);
  }
});

// div.style.transition = "transform 300ms ease, opacity 300ms ease";
// body.style.transition = "width 300ms ease";

function showChat() {
  div.classList.remove("hidden");
  div.classList.add("visible");
  body.style.width = "calc(100vw - 320px)";
}

function hideChat() {
  div.classList.remove("visible");
  div.classList.add("hidden");
  body.style.width = "100vw";
}

function toggle_chat() {
  if (div.classList.contains("hidden")) {
    showChat();
  } else {
    hideChat();
  }
}

const toggleButton = document.createElement("button");
toggleButton.innerText = "Chat";
toggleButton.addEventListener("click", toggle_chat);
body.appendChild(toggleButton);
hideChat();
toggleButton.style.display = "none";
toggleButton.classList.add("toggleButton");

async function check_room() {
  const { room } = await chrome.storage.local.get("room");

  if (!room) {
    toggleButton.style.display = "none";
    hideChat();
    return;
  }

  toggleButton.style.display = "block";
  showChat();
}

check_room();

function format_time(time) {
  if (!time) return "00:00";
  // if time is more than one hour, show hours
  let result = "";
  if (time > 3600) {
    result =
      String(Math.floor(time / 3600)).padStart(2, "0") +
      ":" +
      String(Math.round((time % 3600) / 60)).padStart(2, "0") +
      ":" +
      String(Math.round(time % 60)).padStart(2, "0");
  } else {
    result =
      String(Math.round(time / 60)).padStart(2, "0") +
      ":" +
      String(Math.round(time % 60)).padStart(2, "0");
  }
  return result;
}
