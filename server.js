const server = require("http").createServer();
const io = require("socket.io")(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket"],
});

// Source of truth for the watch party
let roomState = {
  isPlaying: false,
  currentTime: 0,
  lastUpdated: Date.now(),
};

io.on("connection", (socket) => {
  console.log(`Peer joined: ${socket.id}`);

  // Send the current room state to the newly connected user instantly
  socket.emit("watch_party_event", {
    type: "ROOM_INITIAL_SYNC",
    state: getCurrentState(),
  });

  socket.on("watch_party_event", (packet) => {
    switch (packet.type) {
      case "VIDEO_PLAY":
        roomState.isPlaying = true;
        roomState.currentTime = packet.time;
        roomState.lastUpdated = Date.now();
        console.log("PLAY");
        console.log(roomState);
        break;
      case "VIDEO_PAUSE":
        roomState.isPlaying = false;
        roomState.currentTime = packet.time;
        roomState.lastUpdated = Date.now();
        console.log("PAUSE");
        console.log(roomState);
        break;
      case "VIDEO_SEEK":
        roomState.currentTime = packet.time;
        roomState.lastUpdated = Date.now();
        console.log("SEEK");
        console.log(roomState);
        break;
      case "CHAT_MSG":
        console.log(packet.text);
        console.log(roomState);
        break;
    }
    //Broadcast the updated state to everyone else
    socket.broadcast.emit("watch_party_event", packet);
    //socket.emit("watch_party_event", packet);
  });
});

// Helper to calculate exact playback time factoring in network duration elapsed
function getCurrentState() {
  if (!roomState.isPlaying) return roomState;
  const elapsed = (Date.now() - roomState.lastUpdated) / 1000;
  return {
    isPlaying: true,
    currentTime: roomState.currentTime + elapsed,
  };
}

server.listen(3000, "0.0.0.0", () => console.log("Watch Party Core online"));
