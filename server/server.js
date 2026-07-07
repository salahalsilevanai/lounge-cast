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

// debugged and written using claude.ai
// Remove a room's state once no sockets remain in it.
function cleanupRoomIfEmpty(room) {
  const roomSockets = io.sockets.adapter.rooms.get(room);
  const remaining = roomSockets ? roomSockets.size : 0;
  if (remaining === 0 && roomState[room]) {
    delete roomState[room];
    console.log(`Room ${room} is empty, state cleared`);
  }
}

// debugged and improved using claude.ai
io.on("connection", (socket) => {
  console.log(`Peer joined: ${socket.id}`);
  socket.data.joinedRooms = new Set();

  // Fires on tab close, crash, network loss, or explicit disconnect —
  // unlike the "LEAVE" packet, this covers every way a peer can vanish.
  socket.on("disconnect", (reason) => {
    console.log(`Peer disconnected: ${socket.id} (${reason})`);

    for (const room of socket.data.joinedRooms) {
      socket.to(room).emit("watch_party_event", {
        type: "PEER_LEFT",
        name: socket.data.name,
        room,
      });
      cleanupRoomIfEmpty(room);
    }
  });

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
        const alreadyInRoom = socket.rooms.has(room);
        if (!alreadyInRoom) {
          socket.join(room);
          socket.data.joinedRooms.add(room);
          socket.data.name = packet.name;
          console.log(packet.name + " joined room: " + room);

          if (packet.url && roomState[room].url == null) {
            roomState[room].url = packet.url;
          }

          socket.to(room).emit("watch_party_event", {
            type: "PEER_JOINED",
            name: packet.name,
            room,
          });
        }

        socket.emit("watch_party_event", {
          type: "ROOM_INITIAL_SYNC",
          room,
          state: getCurrentState(room),
          url: roomState[room].url,
        });
        return;
      case "LEAVE":
        // Leave all rooms socket is currently in except
        // for (const room of socket.rooms) {
        //   if (room !== socket.id) {
        //     socket.leave(room);
        //   }
        // }

        if (!socket.rooms.has(room)) return;
        socket.leave(room);
        socket.data.joinedRooms.delete(room);
        console.log(`${socket.id} left room: ${room}`);

        socket.to(room).emit("watch_party_event", {
          type: "PEER_LEFT",
          name: packet.name,
          room,
        });
        cleanupRoomIfEmpty(room); // debugged and written using claude.ai
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
        console.log(roomState[room]);
        console.log(socket.id + " chat msg: " + packet.text);
        console.log("CHAT_MSG");
        console.log(packet);
        //socket.to(room).emit("watch_party_event", packet);
        break;
    }
    // testing purposes only, to see if the state is being updated correctly
    // Broadcast the updated state to everyone else
    // joined_room = Array.from(socket.rooms).filter((r) => r !== socket.id);
    // console.log("user has joined this room: " + joined_room);

    socket.to(room).emit("watch_party_event", packet);

    // testing purposes
    //console.log("joined room: " + joined_room[0]);
    //socket.broadcast.emit("watch_party_event", packet);
    //socket.emit("watch_party_event", packet);
  });
});

server.listen(3000, "0.0.0.0", () => console.log("Watch Party Core online"));
