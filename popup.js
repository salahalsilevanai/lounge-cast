// this function creates a random room id and sends it to the content script
document.querySelector("#create").addEventListener("click", async () => {
  const room = generate_room_id();
  const room_id = document.querySelector("#room");
  room_id.value = room;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "CREATE ROOM", room: room });
  }
});

// this function generates a random room id
function generate_room_id() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// this function sends a join request to the content script with the room id and name
const join = document.querySelector("#button");
join.addEventListener("click", async () => {
  const room = document.querySelector("#room").value;
  if (room.trim() === "") {
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "JOIN",
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
