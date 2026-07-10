const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: 3000 });

wss.on("connection", (ws) => {
  console.log("Extension connected!");

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    if (message.toString() === "heartBeat") {
      ws.send("heartbeat_ack");
    }
  });
});
console.log("WebSocket server is running on ws://localhost:3000");
