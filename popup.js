const btn = document.querySelector("#button");

btn.addEventListener("click", async () => {
  const name = document.querySelector("#name").value;
  // create message
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "NAME", text: name });
  }
});

const refresh = document.querySelector("#refresh");
refresh.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "REFRESH" });
  }
});
