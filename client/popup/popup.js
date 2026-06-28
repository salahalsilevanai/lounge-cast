// this function creates a random room id and sends it to the content script
const room_field = document.querySelector("#room");
const name_field = document.querySelector("#name");

document.querySelector("#create").addEventListener("click", async () => {
  let room = room_field.value.trim();

  if (room === "") {
    room = generate_room_id();
  }
  room_field.value = room;

  chrome.storage.local.set({ room: room });

  // send the room id to the content script
  let name = name_field.value.trim();
  if (name === "") {
    name = generate_username();
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "JOIN",
      room: room,
      name: name,
    });
  }
});

// this function sends a join request to the content script with the room id and name
const join = document.querySelector("#join-btn");
join.addEventListener("click", async () => {
  const room = document.querySelector("#room").value.trim();
  if (room === "") {
    return;
  }

  chrome.storage.local.set({ room: room });
  let name = document.querySelector("#name").value.trim();
  if (room === "") {
    name = generate_username();
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "JOIN",
      name: name.trim(),
      room: room.trim(),
    });
  }
});

document.querySelector("#leave").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "LEAVE" });
  }
});

document.querySelector("#username-btn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "CHANGE-NAME",
      name: document.querySelector("#name").value,
    });
  }
});

let username;
async function refreshUsername() {
  const result = await chrome.storage.local.get({
    username: generate_username(),
  });
  return result.username;
}
async function refreshRoom() {
  const result = await chrome.storage.local.get({
    room: "",
  });
  return result.room;
}

document.addEventListener("DOMContentLoaded", async () => {
  await refreshUsername().then((fetchedUsername) => {
    document.querySelector("#name").value = fetchedUsername;
  });

  await refreshRoom().then((fetchedRoom) => {
    document.querySelector("#room").value = fetchedRoom;
  });
});

// this function generates a random room id
function generate_room_id(len = 8) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let result = "";
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generate_username() {
  let result = "user_";
  for (let i = 0; i < 6; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}
