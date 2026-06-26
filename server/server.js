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
        if (socket.rooms.has(packet.room)) {
          console.log(socket.id + " chat msg: " + packet.message);
        }
        console.log("CHAT_MSG");
        console.log(packet);
        socket.to(packet.room).emit("watch_party_event", packet);
        break;
      case "JOIN":
        if (socket.rooms.has(packet.room)) return;
        console.log(packet.name + " joined room: " + packet.room);
        socket.join(packet.room);
        break;
      // case "CREATE-JOIN":
      //   if (socket.rooms.has(packet.room)) return;
      //   console.log(socket.id + " join room: " + packet.room);
      //   socket.join(packet.room);
      //   break;
      case "LEAVE":
        const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
        if (rooms.length === 0) return;

        for (const room of rooms) {
          socket.leave(room);
          console.log(socket.id + " leave room: " + room);
        }
        break;
    }
    //Broadcast the updated state to everyone else

    // joined_room = Array.from(socket.rooms).filter((r) => r !== socket.id);
    // console.log("user has joined this room: " + joined_room);
    // socket.to(joined_room[0]).emit("watch_party_event", packet);

    //console.log("joined room: " + joined_room[0]);
    socket.broadcast.emit("watch_party_event", packet);
    //socket.emit("watch_party_event", packet);

    socket.on("join-room", (room) => {
      if (socket.rooms.has(room)) return;
      socket.join(room);
      console.log(`Peer joined room: ${room}`);
    });

    socket.on("leave-room", (room) => {
      if (!socket.rooms.has(room)) return;
      console.log(`Peer left room: ${room}`);
      socket.leave(room);
    });
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
