// this function creates a random room id and sends it to the content script
const room_field = document.querySelector("#room");
const name_field = document.querySelector("#name");
const leave = document.querySelector(".leave");
const join = document.querySelector("#join-btn");
const create = document.querySelector("#create");
const change_name = document.querySelector("#username-btn");

// async function refreshButtons() {
//   let room = await refreshRoom();
//   if (!room || room == null) {
//     leave.style.display = "none";
//     create.style.display = "block";
//     join.style.display = "block";
//   } else {
//     leave.style.display = "block";
//     create.style.display = "none";
//     join.style.display = "none";
//   }
// }
// refreshButtons();

create.addEventListener("click", async () => {
  let room = room_field.value.trim();

  if (room === "") {
    room = generate_room_id();
  }
  room_field.value = room;

  //leave.style.display = "block";
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
  //await refreshButtons();
});

// this function sends a join request to the content script with the room id and name
join.addEventListener("click", async () => {
  const room = document.querySelector("#room").value.trim();
  if (room === "") {
    return;
  }
  //chrome.storage.local.set({ room: room });

  let name = document.querySelector("#name").value.trim();
  if (name === "") {
    name = generate_username();
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "JOIN",
      name: name.trim(),
      room: room.trim(),
      url: window.location.href,
    });
  }
  //await refreshButtons();
});

leave.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  //leave.style.display = "none";
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "LEAVE",
      room: room_field.value.trim(),
    });
  }
  //await chrome.storage.local.remove("room");
  //await refreshButtons();
});

change_name.addEventListener("click", async () => {
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

async function getIsLive() {
  const result = await chrome.storage.local.get({
    isLive: false,
  });
  return result.isLive;
}

const dot = document.querySelector(".dot");

getIsLive().then((fetchedIsLive) => {
  if (fetchedIsLive) {
    document.querySelector("#status").innerHTML = "LIVE";
    dot.style.animation = "livePulse 1.5s infinite ease-in-out";
  } else {
    document.querySelector("#status").innerHTML = "Off";
    dot.style.animation = "none";
  }
});

setInterval(() => {
  getIsLive().then((fetchedIsLive) => {
    if (fetchedIsLive) {
      document.querySelector("#status").innerHTML = "LIVE";
      dot.style.animation = "livePulse 1.5s infinite ease-in-out";
    } else {
      document.querySelector("#status").innerHTML = "Off";
      dot.style.animation = "none";
    }
  });
}, 1000);

document.querySelector("a").addEventListener("click", async () => {
  let username = generate_username();
  // save username to local storage
  document.querySelector("#name").value = username;
  await change_name.click();
  document.querySelector("#join-btn").click();
});

document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" }, (response) => {
    if (chrome.runtime.lastError || !response) return; // no content script on this tab
    document.querySelector("#name").value =
      response.username || generate_username();
    document.querySelector("#room").value = response.room || "";
  });
});
