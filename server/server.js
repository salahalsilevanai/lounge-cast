const server = require("http").createServer();
const io = require("socket.io")(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket"],
});

// Source of truth tracked per ROOM ID
let roomState = {};

function getCurrentState(room) {
  const state = roomState[room];
  if (!state)
    return { isPlaying: false, currentTime: 0, lastUpdated: Date.now() };
  if (!state.isPlaying) return state;

  const elapsed = (Date.now() - state.lastUpdated) / 1000;
  return {
    isPlaying: true,
    currentTime: state.currentTime + elapsed,
  };
}

io.on("connection", (socket) => {
  console.log(`Peer joined: ${socket.id}`);

  socket.on("watch_party_event", (packet) => {
    const room = packet.room;
    if (!room) return console.log("No room speicified in packet");

    // If the room doesn't exist, create it
    if (!roomState[room]) {
      roomState[room] = {
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now(),
        url: null,
      };
    }

    switch (packet.type) {
      case "JOIN":
        if (socket.rooms.has(room)) return;
        socket.join(room);
        console.log(packet.name + " joined room: " + room);

        socket.emit("watch_party_event", {
          type: "ROOM_INITIAL_SYNC",
          state: getCurrentState(room),
        });
        socket.to(room).emit("watch_party_event", packet);
        return;
      case "LEAVE":
        if (!socket.rooms.has(room)) return;
        socket.leave(room);
        console.log(`${socket.id} left room: ${room}`);

        socket.to(room).emit("watch_party_event", packet);
        return;
      case "VIDEO_PLAY":
        roomState[room].isPlaying = true;
        roomState[room].currentTime = packet.time;
        roomState[room].lastUpdated = Date.now();
        console.log("PLAY");
        console.log(roomState);
        break;
      case "VIDEO_PAUSE":
        roomState[room].isPlaying = false;
        roomState[room].currentTime = packet.time;
        roomState[room].lastUpdated = Date.now();
        console.log("PAUSE");
        console.log(roomState);
        break;
      case "VIDEO_SEEK":
        roomState[room].currentTime = packet.time;
        roomState[room].lastUpdated = Date.now();
        console.log("SEEK");
        console.log(roomState);
        break;
      case "VIDEO_URL_CHANGE":
        if (!socket.rooms.has(room)) return;
        roomState[room].url = packet.url;
        console.log("VIDEO_URL_CHANGE");
        console.log(roomState);
        break;
      case "CHAT_MSG":
        console.log(socket.room);
        console.log(socket.id + " chat msg: " + packet.message);
        console.log("CHAT_MSG");
        console.log(packet);
        //socket.to(room).emit("watch_party_event", packet);
        break;
    }
    //Broadcast the updated state to everyone else

    // joined_room = Array.from(socket.rooms).filter((r) => r !== socket.id);
    // console.log("user has joined this room: " + joined_room);
    socket.to(room).emit("watch_party_event", packet);

    //console.log("joined room: " + joined_room[0]);
    //socket.broadcast.emit("watch_party_event", packet);
    //socket.emit("watch_party_event", packet);
  });
});

server.listen(3000, "0.0.0.0", () => console.log("Watch Party Core online"));
