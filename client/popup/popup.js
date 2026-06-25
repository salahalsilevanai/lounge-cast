// this function creates a random room id and sends it to the content script
const room_field = document.querySelector("#room");

document.querySelector("#create").addEventListener("click", async () => {
  if (room_field.value.trim() === "") {
    room = generate_room_id();
  } else {
    room = document.querySelector("#room").value;
  }
  room_field.value = room;

  // send the room id to the content script
  name = document.querySelector("#name").value;
  if (name.trim() === "") {
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

// this function sends a join request to the content script with the room id and name
const join = document.querySelector("#join-btn");
join.addEventListener("click", async () => {
  const room = document.querySelector("#room").value;
  if (room.trim() === "") {
    return;
  }
  const name = document.querySelector("#name").value;
  if (room.trim() === "") {
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

const leave = document.querySelector("#leave");
leave.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "LEAVE" });
  }
});

// this function generates a random username
function generate_username() {
  let result = "user_";
  for (let i = 0; i < 6; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

const name_btn = document
  .querySelector("#username-btn")
  .addEventListener("click", async () => {
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
